import React from "react";
import { ArrowLeftRight } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/TableSkeleton";

interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  title?: string;
  totalCount?: number;
  actions?: React.ReactNode;
  showSwipeHint?: boolean;
  className?: string;
  loading?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  skeletonRows?: number;
  skeletonCols?: number;
}

export function ResponsiveTableWrapper({
  children,
  title,
  totalCount,
  actions,
  showSwipeHint = true,
  className = "",
  loading = false,
  empty = false,
  emptyTitle = "No records found",
  emptyDescription = "Try a wider date range or clear filters.",
  emptyActionLabel,
  emptyActionHref,
  skeletonRows = 6,
  skeletonCols = 5
}: ResponsiveTableWrapperProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden ${className}`}>
      {(title || actions || totalCount !== undefined) && (
        <div className="px-3.5 sm:px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {title && <h3 className="font-bold text-xs sm:text-sm text-slate-800">{title}</h3>}
            {totalCount !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-mono font-bold">
                {totalCount} {totalCount === 1 ? "Record" : "Records"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {actions}
          </div>
        </div>
      )}

      {showSwipeHint && !loading && !empty && (
        <div className="sm:hidden px-3 py-1 bg-amber-50/80 border-b border-amber-100/70 flex items-center justify-center gap-1.5 text-[10px] text-amber-800 font-medium">
          <ArrowLeftRight className="w-3 h-3 text-amber-600 animate-pulse" />
          <span>Swipe sideways to view full columns</span>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={skeletonRows} cols={skeletonCols} />
      ) : empty ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          actionHref={emptyActionHref}
        />
      ) : (
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {children}
        </div>
      )}
    </div>
  );
}
