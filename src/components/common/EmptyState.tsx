"use client";

import React from "react";
import Link from "next/link";
import { FileSearch, Inbox, LucideIcon } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  hint?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
};

/** Shared empty state for tables, hubs, and filter results. */
export function EmptyState({
  title = "No records found",
  description,
  hint,
  icon: Icon = Inbox,
  actionLabel,
  actionHref,
  onAction,
  className = "",
  compact = false
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8 px-4" : "py-12 px-6"
      } ${className}`}
    >
      <div
        className={`rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center ${
          compact ? "w-10 h-10 mb-3" : "w-12 h-12 mb-4"
        }`}
      >
        <Icon className={compact ? "w-5 h-5" : "w-6 h-6"} />
      </div>
      <p className={`font-semibold text-slate-800 ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-xs text-slate-500 max-w-md leading-relaxed">{description}</p>
      ) : null}
      {hint ? <p className="mt-1 text-[11px] text-slate-400 max-w-sm">{hint}</p> : null}
      {(actionLabel && actionHref) || (actionLabel && onAction) ? (
        <div className="mt-4">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center h-9 px-4 rounded-full border border-[#0171d3] text-[#0171d3] text-xs font-semibold hover:bg-[#e8f1fb]"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center h-9 px-4 rounded-full border border-[#0171d3] text-[#0171d3] text-xs font-semibold hover:bg-[#e8f1fb]"
            >
              {actionLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Drop-in table body row for empty list results. */
export function TableEmptyRow({
  colSpan,
  title = "No data available",
  description = "Try a wider date range, clear filters, or create a new entry.",
  actionLabel,
  actionHref,
  onAction
}: {
  colSpan: number;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="border border-slate-200 bg-white">
        <EmptyState
          compact
          icon={FileSearch}
          title={title}
          description={description}
          actionLabel={actionLabel}
          actionHref={actionHref}
          onAction={onAction}
        />
      </td>
    </tr>
  );
}
