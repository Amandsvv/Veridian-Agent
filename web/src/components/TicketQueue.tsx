"use client";

import { useState } from "react";
import { TicketItem } from "@/types";
import { Ticket as TicketIcon, Clock, User, Bookmark, CheckCircle2, AlertCircle, History, Sparkles } from "lucide-react";

interface TicketQueueProps {
  createdTickets: TicketItem[];
  historicalTickets: TicketItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function TicketQueue({
  createdTickets,
  historicalTickets,
  isLoading,
  onRefresh,
}: TicketQueueProps) {
  const [filter, setFilter] = useState<"all" | "created" | "historical">("all");

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("resolved") || s.includes("issued") || s.includes("closed")) {
      return "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-800";
    }
    if (s.includes("rejected")) {
      return "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300/70 dark:border-rose-800";
    }
    if (s.includes("escalated") || s.includes("investigation")) {
      return "bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300/70 dark:border-purple-800";
    }
    return "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300/70 dark:border-amber-800";
  };

  const displayedTickets =
    filter === "created"
      ? createdTickets
      : filter === "historical"
      ? historicalTickets
      : [...createdTickets, ...historicalTickets];

  return (
    <div className="h-full flex flex-col">
      {/* Filter Tabs */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
              filter === "all"
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
            }`}
          >
            All ({createdTickets.length + historicalTickets.length})
          </button>
          <button
            onClick={() => setFilter("created")}
            className={`text-xs px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
              filter === "created"
                ? "bg-emerald-800 text-white dark:bg-emerald-700"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Live ({createdTickets.length})
          </button>
          <button
            onClick={() => setFilter("historical")}
            className={`text-xs px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
              filter === "historical"
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
            }`}
          >
            <History className="w-3 h-3" />
            Precedent ({historicalTickets.length})
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-mono"
          title="Refresh tickets"
        >
          {isLoading ? "Syncing..." : "Sync"}
        </button>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {displayedTickets.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-xs">
            No tickets in this view yet.
          </div>
        ) : (
          displayedTickets.map((t) => (
            <div
              key={t.id}
              className={`p-3 rounded-lg border text-xs bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all ${
                !t.is_seed
                  ? "border-emerald-300/80 dark:border-emerald-800/80 ring-1 ring-emerald-500/10"
                  : "border-zinc-200 dark:border-zinc-800/90 opacity-85"
              }`}
            >
              {/* Top Row: Ticket ID & Status */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {t.id}
                  </span>
                  {!t.is_seed ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300/60 dark:border-emerald-800">
                      LIVE CREATED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                      PRECEDENT {t.closed ? "[CLOSED]" : "[ACTIVE]"}
                    </span>
                  )}
                </div>

                <span
                  className={`font-mono text-[10px] px-2 py-0.5 rounded border font-medium ${getStatusColor(
                    t.status
                  )}`}
                >
                  {t.status}
                </span>
              </div>

              {/* Summary */}
              <p className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                {t.summary}
              </p>

              {/* Meta Row: Employee, Sources, Time */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/80 pt-2 gap-1">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-zinc-400" />
                  <span>{t.employee}</span>
                </div>

                {t.sources && t.sources.length > 0 && (
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <Bookmark className="w-3 h-3 text-zinc-400" />
                    {t.sources.map((s) => (
                      <span key={s} className="px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
