"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, ActionType } from "@/types";
import {
  Send,
  User,
  Bot,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Bookmark,
  Ticket as TicketIcon,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ChatThreadProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  currentEmployee: string;
}

export function ChatThread({
  messages,
  onSendMessage,
  isLoading,
  currentEmployee,
}: ChatThreadProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const renderActionBadge = (action?: ActionType) => {
    if (!action) return null;
    switch (action) {
      case "resolve":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Resolve
          </span>
        );
      case "ask_followup":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
            <HelpCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Ask Follow-up
          </span>
        );
      case "escalate":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Escalate
          </span>
        );
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white dark:bg-[#111312] overflow-hidden">
      {/* Header Info */}
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Live Support Thread
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
          <span>Active Employee:</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {currentEmployee}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-4 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Veridian IT Decision Engine
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Select any sample request from the left rail or type your message below. Every response is strictly grounded in the knowledge base and precedent tickets.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                10 KB Policies
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                Asset Policy Q2 2026
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                Precedent TK-1042..TK-1051
              </span>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Message author badge */}
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {msg.role === "user" ? (
                  <>
                    <span className="text-[11px] font-medium text-zinc-500">
                      {currentEmployee}
                    </span>
                    <User className="w-3 h-3 text-zinc-400" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
                      Veridian IT Agent
                    </span>
                  </>
                )}
                <span className="text-[10px] text-zinc-400 font-mono">
                  {msg.timestamp}
                </span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-xl p-3.5 shadow-sm text-sm ${
                  msg.role === "user"
                    ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded-tr-none"
                    : "bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none"
                }`}
              >
                {/* Agent Reply Text */}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* Agent metadata / structured tags */}
                {msg.role === "assistant" && (
                  <div className="mt-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/80 flex flex-col gap-2.5">
                    {/* Action & Citations Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {renderActionBadge(msg.action)}

                      {/* Cited Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Bookmark className="w-3 h-3 text-zinc-400" />
                          {msg.sources.map((src) => (
                            <span
                              key={src}
                              className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/60 dark:border-zinc-700"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Escalation Reason Callout */}
                    {msg.escalation_reason && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 text-xs text-rose-900 dark:text-rose-200">
                        <span className="font-semibold font-mono text-[11px] block mb-0.5 text-rose-700 dark:text-rose-400">
                          Escalation Reason:
                        </span>
                        {msg.escalation_reason}
                      </div>
                    )}

                    {/* Inline Structured Ticket Card */}
                    {(msg.ticket || msg.ticket_id) && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            <TicketIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200">
                              {msg.ticket_id || "Ticket Logged"}
                            </span>
                            <span className="text-zinc-500 mx-1.5">•</span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                              {msg.ticket?.category || "IT Support"}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300/70 dark:border-emerald-800 font-semibold">
                          {msg.ticket?.status || "Logged"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2">
            <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-1 animate-pulse" />
            <div className="p-3 rounded-xl rounded-tl-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Grounding against knowledge base & decision rules...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-[#fbfbf9] dark:bg-[#141615] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe your IT issue or question..."
          disabled={isLoading}
          className="flex-1 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 dark:focus:border-emerald-500 transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-lg bg-emerald-900 text-emerald-100 hover:bg-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-900 transition-colors shadow-sm"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
