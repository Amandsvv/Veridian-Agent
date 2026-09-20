import json
import os
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq

from app.schemas import AgentDecision
from app.rules import DECISION_RULES

load_dotenv()

# Determine paths to static grounding data
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
KB_PATH = DATA_DIR / "kb.json"
TICKETS_PATH = DATA_DIR / "ticket_seed.json"

# Load static datasets at module import time
with open(KB_PATH, "r", encoding="utf-8") as f:
    KB_DATA = json.load(f)

with open(TICKETS_PATH, "r", encoding="utf-8") as f:
    TICKET_SEED_DATA = json.load(f)


def build_system_prompt() -> str:
    """Constructs the system prompt containing the exact Appendix A grounding data and decision rules."""
    kb_lines = []
    for item in KB_DATA:
        kb_lines.append(f"- **{item['id']} — {item['title']}:** {item['text']}")

    ticket_lines = []
    for t in TICKET_SEED_DATA:
        status_tag = "[closed]" if t.get("closed") else "[active]"
        ticket_lines.append(f"{t['id']} {t['employee']} — {t['summary']} — {t['status']} {status_tag}")

    prompt = f"""You are the internal IT Support Agent for Veridian Corp. Ground every response and decision strictly in the knowledge base, ticket precedent history, and decision rules below. Do NOT invent, assume, or hallucinate any policies, numbers, or approval workflows.

### Knowledge base
{chr(10).join(kb_lines)}

### Ticket history (precedent)
{chr(10).join(ticket_lines)}

{DECISION_RULES}

CRITICAL DECISION DIRECTIVES:
- Security Incidents (Phishing, malware, suspicious emails): ALWAYS set action="escalate", cite KB-09 and TK-1048, and create a ticket with status "Escalated to Security, under investigation". If employee forwarded the email to teammates, correct this in the reply.
- High-Risk Access (Admin, financial servers): ALWAYS set action="escalate", cite TK-1050, and explain in escalation_reason.
- Hardware Replacement vs Repair: A dead laptop near 3-4 years (REQ-01) triggers the KB-03 vs ASSET-POLICY conflict (escalate). A flickering screen on a 2-year old laptop needing repair/fix (REQ-13) is a standard repair under KB-03 (resolve, Pending IT action).
- Software Installation: Non-catalog software or browser extensions (KB-04) require IT Security review (escalate, Pending Security review, cite KB-04 and TK-1044).
- Vague Inquiries: If the message has no actionable issue (e.g. "it's not working"), set action="ask_followup", sources=[], ticket=null.
"""
    return prompt


SYSTEM_PROMPT = build_system_prompt()


def get_llm():
    """Initializes and returns the ChatGroq model with structured output."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is missing or empty.")

    model_name = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
    llm = ChatGroq(
        model=model_name,
        temperature=0,
        api_key=api_key,
    )
    return llm.with_structured_output(AgentDecision)


def run_turn(conversation_history: List[Dict[str, Any]], new_message: str) -> AgentDecision:
    """
    Executes an agent reasoning turn given conversation history and a new user message.
    Returns a validated AgentDecision Pydantic object.
    """
    structured_llm = get_llm()

    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    # Append previous turns in the conversation
    for msg in conversation_history:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role in ("assistant", "agent"):
            messages.append(AIMessage(content=content))

    # Append new user message
    messages.append(HumanMessage(content=new_message))

    # Invoke the model
    decision: AgentDecision = structured_llm.invoke(messages)

    # Compliance enforcement: Only include a non-null ticket when action is 'resolve' or 'escalate'
    if decision.action == "ask_followup":
        decision.ticket = None
    elif decision.action in ("resolve", "escalate") and decision.ticket is None:
        # If model did not populate ticket on resolve/escalate, create a fallback draft
        from app.schemas import TicketDraft
        category = "General"
        summary = new_message[:60]
        status = "Resolved" if decision.action == "resolve" else "Escalated - awaiting human review"
        decision.ticket = TicketDraft(category=category, summary=summary, status=status)

    return decision
