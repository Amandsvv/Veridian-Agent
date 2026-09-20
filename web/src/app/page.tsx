"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { SampleRail } from "@/components/SampleRail";
import { ChatThread } from "@/components/ChatThread";
import { TicketQueue } from "@/components/TicketQueue";
import { AuditTrail } from "@/components/AuditTrail";
import { ChatMessage, TicketItem, AuditItem, SampleRequest } from "@/types";
import { Ticket as TicketIcon, ShieldCheck, ListFilter, AlertCircle, RefreshCw } from "lucide-react";

export default function Home() {
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [createdTickets, setCreatedTickets] = useState<TicketItem[]>([]);
  const [historicalTickets, setHistoricalTickets] = useState<TicketItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [activeTab, setActiveTab] = useState<"tickets" | "audit">("tickets");

  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(false);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);

  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [currentEmployee, setCurrentEmployee] = useState<string>("Aditi Sharma");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Generate or reset conversation ID
  const resetSession = useCallback(() => {
    const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
    setConversationId(newId);
    setMessages([]);
    setErrorMessage(null);
  }, []);

  // Initialize session on mount
  useEffect(() => {
    resetSession();
  }, [resetSession]);

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch(`${apiUrl}/tickets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCreatedTickets(data.created_tickets || []);
      setHistoricalTickets(data.historical_tickets || []);
      setApiStatus("connected");
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setApiStatus("disconnected");
    } finally {
      setIsLoadingTickets(false);
    }
  }, [apiUrl]);

  // Fetch Audit Logs
  const fetchAudit = useCallback(async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`${apiUrl}/audit`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAuditLogs(data || []);
      setApiStatus("connected");
    } catch (err) {
      console.error("Failed to fetch audit log:", err);
      setApiStatus("disconnected");
    } finally {
      setIsLoadingAudit(false);
    }
  }, [apiUrl]);

  // Check health & fetch initial queues on load
  useEffect(() => {
    fetch(`${apiUrl}/health`)
      .then((res) => {
        if (res.ok) {
          setApiStatus("connected");
          fetchTickets();
          fetchAudit();
        } else {
          setApiStatus("disconnected");
        }
      })
      .catch(() => {
        setApiStatus("disconnected");
      });
  }, [apiUrl, fetchTickets, fetchAudit]);

  // Handle Sending a Message
  const handleSendMessage = async (text: string, employeeName?: string) => {
    const emp = employeeName || currentEmployee || "Employee";
    if (employeeName) {
      setCurrentEmployee(employeeName);
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoadingChat(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: text,
          employee: emp,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `HTTP ${res.status} Error` }));
        throw new Error(errorData.detail || "Error from support agent API");
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        action: data.action,
        sources: data.sources || [],
        ticket: data.ticket,
        ticket_id: data.ticket_id,
        escalation_reason: data.escalation_reason,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setApiStatus("connected");

      // Auto refresh ticket queue and audit trail on new turn
      fetchTickets();
      fetchAudit();
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMessage(
        err.message?.includes("Failed to fetch")
          ? "Backend API is unreachable. Please verify FastAPI is running on port 8000."
          : err.message || "Failed to get decision from agent."
      );
      setApiStatus("disconnected");
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Handle selecting a sample request from the left rail
  const handleSelectSample = (sample: SampleRequest) => {
    setCurrentEmployee(sample.employee);
    handleSendMessage(sample.text, sample.employee);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#fbfbf9] dark:bg-[#111312] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Header
        apiStatus={apiStatus}
        apiUrl={apiUrl}
        onResetSession={resetSession}
        ticketCount={createdTickets.length + historicalTickets.length}
      />

      {/* Disconnected / Error Banner */}
      {apiStatus === "disconnected" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              Backend at <code className="font-mono">{apiUrl}</code> is unreachable. Run <code className="font-mono">docker compose up</code> or <code className="font-mono">uvicorn main:app --port 8000</code>.
            </span>
          </div>
          <button
            onClick={() => {
              fetchTickets();
              fetchAudit();
            }}
            className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/50 hover:bg-amber-200"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Error Message Toast in UI */}
      {errorMessage && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-mono px-2 py-0.5 rounded hover:bg-rose-200/40"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Column 1: Left Rail (Sample Requests) */}
        <div className="hidden lg:block lg:w-80 h-full">
          <SampleRail
            onSelectSample={handleSelectSample}
            isLoading={isLoadingChat}
          />
        </div>

        {/* Column 2: Center (Chat Thread) */}
        <div className="flex-1 h-full min-w-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800">
          <ChatThread
            messages={messages}
            onSendMessage={(msg) => handleSendMessage(msg)}
            isLoading={isLoadingChat}
            currentEmployee={currentEmployee}
          />
        </div>

        {/* Column 3: Right Panel (Ticket Queue + Audit Trail Tabs) */}
        <div className="w-full lg:w-96 h-80 lg:h-full bg-[#f9f9f6] dark:bg-[#141615] flex flex-col shrink-0">
          {/* Tabs Header */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 px-3 pt-2 flex items-center gap-2 bg-zinc-100/60 dark:bg-zinc-900/60">
            <button
              onClick={() => setActiveTab("tickets")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === "tickets"
                  ? "border-emerald-700 dark:border-emerald-400 text-emerald-900 dark:text-emerald-200 bg-white/70 dark:bg-zinc-800/70 rounded-t-md"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <TicketIcon className="w-3.5 h-3.5" />
              <span>Ticket Queue</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {createdTickets.length + historicalTickets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === "audit"
                  ? "border-emerald-700 dark:border-emerald-400 text-emerald-900 dark:text-emerald-200 bg-white/70 dark:bg-zinc-800/70 rounded-t-md"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {auditLogs.length}
              </span>
            </button>
          </div>

          {/* Active Tab Body */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "tickets" ? (
              <TicketQueue
                createdTickets={createdTickets}
                historicalTickets={historicalTickets}
                isLoading={isLoadingTickets}
                onRefresh={fetchTickets}
              />
            ) : (
              <AuditTrail
                logs={auditLogs}
                isLoading={isLoadingAudit}
                onRefresh={fetchAudit}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
