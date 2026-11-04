import React from "react";

export type StatusVariant =
  | "BOOKED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "DELIVERED"
  | "BILLED"
  | "PAID"
  | "PENDING"
  | "OVERDUE"
  | "CANCELLED"
  | "SUCCESS"
  | "FAILED"
  | "ACTIVE";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const norm = (status || "").toUpperCase().replace(/[\s-]/g, "_");

  const styleMap: Record<string, string> = {
    BOOKED: "bg-blue-50 text-blue-700 border-blue-200",
    IN_TRANSIT: "bg-amber-50 text-amber-700 border-amber-200",
    ARRIVED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    BILLED: "bg-purple-50 text-purple-700 border-purple-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    OVERDUE: "bg-rose-50 text-rose-700 border-rose-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
    SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED: "bg-rose-50 text-rose-700 border-rose-200",
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200"
  };

  const style =
    styleMap[norm] ||
    "bg-slate-100 text-slate-700 border-slate-200";

  const sizeClass =
    size === "sm" ? "px-1.5 py-0.2 text-[10px]" : "px-2.5 py-0.5 text-[11px]";

  const formatText = (text: string) => {
    return text.replace(/_/g, " ");
  };

  return (
    <span
      className={`inline-flex items-center font-bold font-mono tracking-wider rounded-md border ${style} ${sizeClass}`}
    >
      {formatText(status)}
    </span>
  );
}

