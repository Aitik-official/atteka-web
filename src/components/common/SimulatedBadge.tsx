import React from "react";
import { AlertCircle } from "lucide-react";

export function SimulatedBadge({ text = "SIMULATION ADAPTER" }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
      <AlertCircle className="w-3 h-3 text-amber-600" />
      {text}
    </span>
  );
}

