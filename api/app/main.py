import json
import os
import re
from datetime import datetime, timezone
from typing import List, Optional
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import init_db, get_db, MessageModel, TicketModel, AuditLogModel, DATA_DIR
from app.schemas import ChatRequest, ChatResponse, TicketDraft, AgentDecision
from app import agent

TICKETS_PATH = DATA_DIR / "ticket_seed.json"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Veridian IT Support Agent API",
    description="Full policy-grounded decision engine and IT service backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_next_ticket_id(db: Session) -> str:
    """Calculates the next ticket ID starting from TK-1052."""
    max_id = 1051
    # Check created tickets in DB
    db_tickets = db.query(TicketModel.id).all()
    for (t_id,) in db_tickets:
        match = re.search(r"TK-(\d+)", t_id)
        if match:
            num = int(match.group(1))
            if num > max_id:
                max_id = num

    # Also check ticket_seed.json
    if TICKETS_PATH.exists():
        try:
            with open(TICKETS_PATH, "r", encoding="utf-8") as f:
                seeds = json.load(f)
                for s in seeds:
                    match = re.search(r"TK-(\d+)", s.get("id", ""))
                    if match:
                        num = int(match.group(1))
                        if num > max_id:
                            max_id = num
        except Exception:
            pass

    return f"TK-{max_id + 1}"


@app.get("/")
def read_root():
    return {
        "message": "Veridian IT Support Agent API is running",
        "status": "online",
        "service": "api",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "it-support-api",
    }


@app.post("/chat", response_model=ChatResponse)
def handle_chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Handles a chat turn:
    1. Loads prior messages for conversation_id
    2. Runs the LangChain decision engine
    3. Persists messages, tickets, and audit logs to SQLite
    4. Returns AgentDecision with ticket ID
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Load prior turns
    prior_messages = (
        db.query(MessageModel)
        .filter(MessageModel.conversation_id == request.conversation_id)
        .order_by(MessageModel.id.asc())
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in prior_messages]

    # 2. Invoke Decision Engine
    try:
        decision: AgentDecision = agent.run_turn(
            conversation_history=history,
            new_message=request.message,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decision engine error: {str(e)}")

    # 3. Save User Message
    user_msg = MessageModel(
        conversation_id=request.conversation_id,
        role="user",
        content=request.message,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user_msg)

    # 4. Save Assistant Message
    assistant_msg = MessageModel(
        conversation_id=request.conversation_id,
        role="assistant",
        content=decision.reply,
        created_at=datetime.now(timezone.utc),
    )
    db.add(assistant_msg)

    # 5. Handle Ticket Creation if resolve or escalate
    created_ticket_id = None
    if decision.action in ("resolve", "escalate") and decision.ticket:
        created_ticket_id = get_next_ticket_id(db)
        ticket_record = TicketModel(
            id=created_ticket_id,
            employee=request.employee or "Employee",
            category=decision.ticket.category,
            summary=decision.ticket.summary,
            status=decision.ticket.status,
            sources=json.dumps(decision.sources),
            request_text=request.message,
            is_seed=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(ticket_record)

    # 6. Record Audit Log Entry
    audit_entry = AuditLogModel(
        conversation_id=request.conversation_id,
        time=datetime.now(timezone.utc),
        request=request.message,
        action=decision.action,
        sources=json.dumps(decision.sources),
        ticket_id=created_ticket_id,
        escalation_reason=decision.escalation_reason,
    )
    db.add(audit_entry)

    db.commit()

    db.commit()

    return ChatResponse(
        reply=decision.reply,
        action=decision.action,
        sources=decision.sources,
        ticket=decision.ticket,
        escalation_reason=decision.escalation_reason,
        ticket_id=created_ticket_id,
    )


@app.get("/tickets")
def get_tickets(db: Session = Depends(get_db)):
    """
    Returns all agent-created tickets from SQLite (newest first)
    plus the 10 seeded historical tickets from ticket_seed.json.
    """
    # 1. Fetch created tickets from SQLite
    db_tickets = (
        db.query(TicketModel)
        .order_by(desc(TicketModel.created_at))
        .all()
    )

    created_tickets = []
    for t in db_tickets:
        try:
            sources = json.loads(t.sources)
        except Exception:
            sources = []
        created_tickets.append({
            "id": t.id,
            "employee": t.employee,
            "category": t.category,
            "summary": t.summary,
            "status": t.status,
            "sources": sources,
            "request_text": t.request_text,
            "is_seed": False,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })

    # 2. Fetch seed tickets from JSON
    seed_tickets = []
    if TICKETS_PATH.exists():
        try:
            with open(TICKETS_PATH, "r", encoding="utf-8") as f:
                raw_seeds = json.load(f)
                for s in raw_seeds:
                    seed_tickets.append({
                        "id": s.get("id"),
                        "employee": s.get("employee"),
                        "category": "Precedent",
                        "summary": s.get("summary"),
                        "status": s.get("status"),
                        "sources": [],
                        "request_text": s.get("summary"),
                        "is_seed": True,
                        "closed": s.get("closed", False),
                        "created_at": None,
                    })
        except Exception:
            pass

    return {
        "created_tickets": created_tickets,
        "historical_tickets": seed_tickets,
        "total_created": len(created_tickets),
        "total_historical": len(seed_tickets),
    }


@app.get("/audit")
def get_audit_log(db: Session = Depends(get_db)):
    """Returns the full audit log, newest first."""
    entries = (
        db.query(AuditLogModel)
        .order_by(desc(AuditLogModel.time))
        .all()
    )

    results = []
    for entry in entries:
        try:
            sources = json.loads(entry.sources)
        except Exception:
            sources = []

        results.append({
            "id": entry.id,
            "conversation_id": entry.conversation_id,
            "time": entry.time.isoformat() if entry.time else None,
            "request": entry.request,
            "action": entry.action,
            "sources": sources,
            "ticket_id": entry.ticket_id,
            "escalation_reason": entry.escalation_reason,
        })

    return results
