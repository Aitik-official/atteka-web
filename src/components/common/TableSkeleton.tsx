"use client";

import React from "react";

/** Lightweight loading placeholder for list/report tables. */
export function TableSkeleton({
  rows = 6,
  cols = 5,
  className = ""
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={`w-full overflow-hidden ${className}`} aria-busy="true" aria-label="Loading">
      <div className="space-y-2 p-3">
        <div className="h-8 rounded-md bg-slate-100 animate-pulse" />
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((__, c) => (
              <div
                key={c}
                className="h-7 rounded bg-slate-100/90 animate-pulse"
                style={{ animationDelay: `${(r * cols + c) * 40}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageLoadingBanner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-xs font-semibold text-slate-500">
      <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-[#0171d3] animate-spin" />
      {label}
    </div>
  );
}
