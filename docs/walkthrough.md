# Veridian IT Support Agent — End-to-End Walkthrough

A step-by-step guide that takes you from a fresh clone to a fully operational IT support session.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Configure](#2-clone--configure)
3. [Start the System](#3-start-the-system)
4. [Tour the UI](#4-tour-the-ui)
5. [Submit a Request (Chat Flow)](#5-submit-a-request-chat-flow)
6. [Understanding Agent Responses](#6-understanding-agent-responses)
7. [Reading the Ticket Queue](#7-reading-the-ticket-queue)
8. [Reading the Audit Trail](#8-reading-the-audit-trail)
9. [Using the REST API Directly](#9-using-the-rest-api-directly)
10. [Swapping the LLM Model](#10-swapping-the-llm-model)
11. [Running the Test Suite](#11-running-the-test-suite)
12. [Stopping & Cleaning Up](#12-stopping--cleaning-up)

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Docker Desktop | 4.x+ | Must be running before `docker compose up` |
| Docker Compose | v2 (`docker compose`) | Bundled with Docker Desktop |
| Groq API key | — | Free tier at https://console.groq.com |
| Git | any | To clone the repo |

> **No Python or Node.js install required** — everything runs inside Docker containers.

---

## 2. Clone & Configure

```bash
# Clone the repository
git clone <your-repo-url> veridian-agent
cd veridian-agent

# Copy the environment template
cp .env.example .env
```

Open `.env` and fill in your key:

```env
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_MODEL=openai/gpt-oss-120b
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> Get a free Groq key at https://console.groq.com/keys — no credit card needed.

---

## 3. Start the System

```bash
docker compose up --build
```

Docker builds both containers on first run (~2-3 min). Subsequent starts skip the build:

```bash
docker compose up
```

**Watch for these ready signals in the logs:**

```
it_support_api   | INFO:     Application startup complete.
it_support_web   | Ready on http://localhost:3000
```

| Service | URL |
|---------|-----|
| Web UI | http://localhost:3000 |
| API root | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

---

## 4. Tour the UI

Open **http://localhost:3000**. The layout is three columns:

```
+------------------+---------------------------+---------------------+
|  Sample Requests |       Chat Thread         |  Ticket Queue /     |
|  (Left Rail)     |       (Center)            |  Audit Trail        |
|                  |                           |  (Right Panel)      |
|  15 pre-loaded   |  Your conversation with   |  Tab 1: tickets     |
|  employee        |  the IT agent appears     |  Tab 2: audit log   |
|  scenarios       |  here                     |                     |
+------------------+---------------------------+---------------------+
```

### Left Rail — Sample Requests
- 15 pre-loaded scenarios (REQ-01 through REQ-15).
- Each card shows the employee name and request text.
- Click any card to instantly send it into the chat.

### Center — Chat Thread
- Type a request and press Enter or click Send.
- Each reply shows:
  - The agent's written response
  - An action badge: `resolve` / `ask_followup` / `escalate`
  - Source badges (e.g. `KB-03`, `TK-1050`)
  - A compact ticket card if one was created

### Right Panel — Ticket Queue & Audit Trail
- **Ticket Queue**: new tickets (TK-1052+) at top, then 10 historical precedent tickets (TK-1042–1051).
- **Audit Trail**: every decision logged, newest first.

---

## 5. Submit a Request (Chat Flow)

### Option A — Click a Sample Card

Click **REQ-08** ("I got a phishing email..."). The agent will:
1. Classify it as a security incident
2. Return `escalate` with sources `KB-09`, `TK-1048`
3. Create a ticket: `Escalated to Security, under investigation`

### Option B — Type Your Own

```
I've been locked out of my account after too many wrong password attempts.
```

Expected: `resolve` · source `KB-01` · status `Resolved`

### Option C — Multi-Turn Conversation

Start vague:
```
Something isn't working with my computer.
```
Agent returns `ask_followup` (no ticket). Follow up:
```
The screen keeps flickering on my 2-year-old laptop.
```
Now: `resolve` · source `KB-03` · status `Pending IT action`

---

## 6. Understanding Agent Responses

Every response is a validated `AgentDecision` object:

```json
{
  "reply":             "Your account has been locked after...",
  "action":            "resolve",
  "sources":           ["KB-01"],
  "ticket": {
    "category":        "Access Management",
    "summary":         "Account locked — manual unlock required",
    "status":          "Resolved"
  },
  "escalation_reason": null
}
```

### Action Meanings

| Badge | Meaning | Ticket? |
|-------|---------|---------|
| resolve | Policy found, fully handled by IT | Created |
| ask_followup | Needs one more detail before deciding | None |
| escalate | High-risk or policy conflict — needs a human | Created |

### Source ID Prefixes

| Prefix | Data source |
|--------|-------------|
| KB-01 … KB-10 | Knowledge base articles |
| ASSET-POLICY | Hardware asset lifecycle policy |
| TK-1042 … TK-1051 | Historical precedent tickets |

---

## 7. Reading the Ticket Queue

Switch to the **Ticket Queue** tab.

**Agent-created tickets (TK-1052+):**
- Auto-created on every `resolve` or `escalate`
- Show employee, category, summary, status, and cited sources

**Historical / seed tickets (TK-1042–1051):**
- Labelled "pre-existing context"
- Loaded from `api/data/ticket_seed.json` at startup
- Used by the agent as precedent — not created by it

---

## 8. Reading the Audit Trail

Every chat turn is logged, including `ask_followup` turns. Switch to the **Audit Trail** tab.

| Field | What it tells you |
|-------|--------------------|
| Timestamp | When the decision was made |
| Request | The raw employee message |
| Action | resolve / ask_followup / escalate |
| Sources | KB/ticket IDs cited |
| Ticket ID | Created ticket, or — |
| Escalation Reason | Plain-English reason if escalated |

> Audit data persists in SQLite (`api/data/app.db`) across container restarts.

---

## 9. Using the REST API Directly

Use curl, Postman, or the Swagger UI at http://localhost:8000/docs.

### Send a Chat Message

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "test-session-1",
    "employee": "Alice",
    "message": "My laptop is completely dead, I have had it for 3.5 years."
  }'
```

**Response:**
```json
{
  "reply": "This situation involves a policy conflict...",
  "action": "escalate",
  "sources": ["KB-03", "ASSET-POLICY"],
  "ticket": {
    "category": "Hardware",
    "summary": "Dead laptop — replacement policy conflict",
    "status": "Escalated - awaiting human review"
  },
  "escalation_reason": "KB-03 sets 3-year threshold but ASSET-POLICY requires Finance sign-off at 4 years.",
  "ticket_id": "TK-1052"
}
```

### Fetch All Tickets

```bash
curl http://localhost:8000/tickets
```

### Fetch the Audit Log

```bash
curl http://localhost:8000/audit
```

### Health Check

```bash
curl http://localhost:8000/health
# {"status": "healthy", "service": "it-support-api"}
```

---

## 10. Swapping the LLM Model

No code changes needed — just update `.env` and restart:

```env
GROQ_MODEL=llama-3.3-70b-versatile
```

```bash
docker compose restart api
```

**Recommended Groq models:**

| Model | Speed | Notes |
|-------|-------|-------|
| openai/gpt-oss-120b | Medium | High accuracy |
| llama-3.3-70b-versatile | Fast | Good balance |
| llama-3.1-8b-instant | Very fast | Lower accuracy |

> Temperature is hardcoded to `0` in `agent.py` — intentional for deterministic compliance decisions.

---

## 11. Running the Test Suite

Make sure `docker compose up` is running first.

```bash
# Run inside the container
docker compose exec api pytest -v tests/
```

Or from your host with Python:

```bash
cd api
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
pytest -v tests/
```

---

## 12. Stopping & Cleaning Up

### Stop containers (keep data)

```bash
docker compose down
```

### Wipe all runtime data (SQLite DB reset)

```bash
docker compose down -v
# Then manually delete: api/data/app.db
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| api/app/agent.py | LangChain decision engine + Groq integration |
| api/app/main.py | FastAPI endpoints (/chat, /tickets, /audit, /health) |
| api/app/rules.py | Decision rules verbatim from policy |
| api/app/schemas.py | Pydantic output schemas (AgentDecision, TicketDraft) |
| api/data/kb.json | 11 knowledge base articles |
| api/data/ticket_seed.json | 10 historical precedent tickets |
| docs/verification.md | 15-request compliance benchmark report |
| docs/decision_rules.md | Grounding rules specification |
| .env.example | Environment configuration template |
| docker-compose.yml | Single-command orchestration |

---

*Veridian Corp IT Support Agent v1.0.0*
