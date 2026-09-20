from datetime import datetime
from typing import Literal, Optional, List, Any
from pydantic import BaseModel, Field


class TicketDraft(BaseModel):
    category: str = Field(description="Category of the ticket (e.g. Hardware, Access, Software, Network, Security, General)")
    summary: str = Field(description="Brief summary of the issue or request")
    status: str = Field(description="Status of the ticket (e.g. Resolved, Pending IT action, Pending manager approval, Pending Finance, Pending Security review, Escalated - awaiting human review, Awaiting employee response)")


class AgentDecision(BaseModel):
    reply: str = Field(description="Message shown to the employee. Concise (1-4 sentences), professional, plain language, IT-helpdesk tone. No markdown.")
    action: Literal["resolve", "ask_followup", "escalate"] = Field(description="The action taken by the agent")
    sources: List[str] = Field(default_factory=list, description="List of source IDs cited (e.g. KB-01, TK-1050, ASSET-POLICY)")
    ticket: Optional[TicketDraft] = Field(default=None, description="Draft ticket details. Only non-null when action is 'resolve' or 'escalate'")
    escalation_reason: Optional[str] = Field(default=None, description="Reason for escalation if action is 'escalate'")


class Ticket(TicketDraft):
    id: str = Field(description="Ticket ID (e.g. TK-1052)")
    employee: str = Field(description="Name or identifier of the requesting employee")
    sources: List[str] = Field(default_factory=list, description="List of grounded source IDs")
    request_text: str = Field(description="Original request text from employee")
    is_seed: bool = Field(default=False, description="Whether this ticket is from historical seed precedent")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")


class AuditEntry(BaseModel):
    id: Optional[int] = Field(default=None, description="Log entry ID")
    time: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the decision")
    request: str = Field(description="Employee request text")
    action: str = Field(description="Action taken (resolve, ask_followup, escalate)")
    sources: List[str] = Field(default_factory=list, description="Source IDs cited")
    ticket_id: Optional[str] = Field(default=None, description="ID of created ticket if applicable")
    escalation_reason: Optional[str] = Field(default=None, description="Escalation reason if applicable")


class ChatRequest(BaseModel):
    conversation_id: str = Field(description="Unique session or conversation identifier")
    message: str = Field(description="User message text")
    employee: Optional[str] = Field(default="Employee", description="Optional employee name")


class ChatResponse(AgentDecision):
    ticket_id: Optional[str] = Field(default=None, description="Created ticket ID if action is resolve or escalate")
