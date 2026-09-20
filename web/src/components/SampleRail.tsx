"use client";

import { useState } from "react";
import { SAMPLE_REQUESTS } from "@/data/samples";
import { SampleRequest } from "@/types";
import { Send, User, Sparkles, Filter } from "lucide-react";

interface SampleRailProps {
  onSelectSample: (sample: SampleRequest) => void;
  isLoading: boolean;
}

export function SampleRail({ onSelectSample, isLoading }: SampleRailProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Hardware", "Access", "Software", "Security", "Network", "General"];

  const filteredSamples =
    selectedCategory === "All"
      ? SAMPLE_REQUESTS
      : SAMPLE_REQUESTS.filter((s) => s.category === selectedCategory);

  return (
    <aside className="w-full lg:w-80 h-full border-r border-zinc-200 dark:border-zinc-800 bg-[#f9f9f6] dark:bg-[#141615] flex flex-col shrink-0">
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide uppercase">
            Sample Requests
          </h2>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          {SAMPLE_REQUESTS.length} cases
        </span>
      </div>

      {/* Category filters */}
      <div className="px-3 py-2 border-b border-zinc-200/70 dark:border-zinc-800/70 flex gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-[11px] px-2 py-0.5 rounded font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-emerald-900 text-emerald-100 dark:bg-emerald-800 dark:text-emerald-50"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Requests list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredSamples.map((sample) => (
          <div
            key={sample.id}
            onClick={() => !isLoading && onSelectSample(sample)}
            className={`group text-left p-3 rounded-lg border transition-all cursor-pointer bg-white dark:bg-zinc-900/90 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
              isLoading
                ? "opacity-60 cursor-not-allowed border-zinc-200 dark:border-zinc-800"
                : "border-zinc-200/90 dark:border-zinc-800 hover:border-emerald-700/50 dark:hover:border-emerald-500/50 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200/60 dark:border-emerald-900">
                  {sample.id}
                </span>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1">
                  <User className="w-3 h-3 text-zinc-400" />
                  {sample.employee}
                </span>
              </div>
              <Send className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-opacity" />
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              &ldquo;{sample.text}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
