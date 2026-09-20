export type ActionType = "resolve" | "ask_followup" | "escalate";

export interface TicketDraft {
  category: string;
  summary: string;
  status: string;
}

export interface TicketItem {
  id: string;
  employee: string;
  category: string;
  summary: string;
  status: string;
  sources: string[];
  request_text?: string;
  is_seed: boolean;
  closed?: boolean;
  created_at?: string | null;
}

export interface AuditItem {
  id: number;
  conversation_id?: string;
  time: string;
  request: string;
  action: ActionType | string;
  sources: string[];
  ticket_id?: string | null;
  escalation_reason?: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: ActionType;
  sources?: string[];
  ticket?: TicketDraft | null;
  ticket_id?: string | null;
  escalation_reason?: string | null;
  timestamp: string;
}

export interface SampleRequest {
  id: string;
  employee: string;
  text: string;
  category?: string;
}
