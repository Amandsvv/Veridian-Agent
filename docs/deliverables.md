# Deliverables Pack Summary

This repository contains the full deliverable pack for the Veridian Corp Internal IT Support Agent.

## Repository Contents

- `/web`: Next.js 14 App Router frontend with real-time Chat, Sample Request picker rail, Ticket Queue, and Audit Trail tabs.
- `/api`: FastAPI backend with LangChain + Groq (`llama-3.3-70b-versatile`) decision engine, SQLite persistence, and REST endpoints (`/chat`, `/tickets`, `/audit`, `/health`).
- `/api/data`: Static JSON knowledge base (`kb.json`), historical ticket seed (`ticket_seed.json`), and sample requests (`sample_requests.json`).
- `/docs`: Architecture specifications, decision rules, and evaluation benchmarks.
- `docker-compose.yml`: Single-command local orchestration.

## Execution Guide

See the root [README.md](file:///d:/Project/AgenticAI/Internal_Service_Agent/README.md) for startup instructions.
