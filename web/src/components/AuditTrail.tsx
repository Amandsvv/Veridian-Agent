"use client";

import { AuditItem } from "@/types";
import { ShieldCheck, Clock, Bookmark, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";

interface AuditTrailProps {
  logs: AuditItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AuditTrail({ logs, isLoading, onRefresh }: AuditTrailProps) {
  const getActionPill = (action: string) => {
    switch (action) {
      case "resolve":
        return (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300/60 dark:border-emerald-800">
            RESOLVE
          </span>
        );
      case "ask_followup":
        return (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300/60 dark:border-amber-800">
            ASK_FOLLOWUP
          </span>
        );
      case "escalate":
        return (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-semibold border border-rose-300/60 dark:border-rose-800">
            ESCALATE
          </span>
        );
      default:
        return <span className="font-mono text-[10px]">{action}</span>;
    }
  };

  const formatTimestamp = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Decision Audit Trail
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-mono"
        >
          {isLoading ? "Syncing..." : "Sync"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-xs">
            No audit records yet. Submit a request to generate decision logs.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs space-y-2"
            >
              {/* Header: Action & Timestamp */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getActionPill(log.action)}
                  {log.ticket_id && (
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">
                      {log.ticket_id}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(log.time)}
                </span>
              </div>

              {/* Request */}
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-0.5">
                  Request
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 italic line-clamp-2">
                  &ldquo;{log.request}&rdquo;
                </p>
              </div>

              {/* Sources */}
              {log.sources && log.sources.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  <Bookmark className="w-3 h-3 text-zinc-400" />
                  <span className="text-[10px] text-zinc-400 font-mono">Grounded Sources:</span>
                  {log.sources.map((src) => (
                    <span
                      key={src}
                      className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              )}

              {/* Escalation Reason */}
              {log.escalation_reason && (
                <div className="p-2 rounded bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300">
                  <span className="font-semibold font-mono block mb-0.5">Escalation Reason:</span>
                  {log.escalation_reason}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
