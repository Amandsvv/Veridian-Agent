"use client";

import { ShieldCheck, RotateCcw, Activity } from "lucide-react";

interface HeaderProps {
  apiStatus: "connected" | "disconnected" | "checking";
  apiUrl: string;
  onResetSession: () => void;
  ticketCount: number;
}

export function Header({ apiStatus, apiUrl, onResetSession, ticketCount }: HeaderProps) {
  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-300 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Veridian Corp
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              IT Support Agent
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <span
            className={`w-2 h-2 rounded-full ${
              apiStatus === "connected"
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : apiStatus === "disconnected"
                ? "bg-rose-500"
                : "bg-amber-400 animate-pulse"
            }`}
          />
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 hidden sm:inline">
            {apiStatus === "connected" ? "Backend Connected" : apiStatus === "disconnected" ? "Backend Offline" : "Connecting..."}
          </span>
        </div>

        <button
          onClick={onResetSession}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors"
          title="Start a new conversation session"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Session</span>
        </button>
      </div>
    </header>
  );
}
