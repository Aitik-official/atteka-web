import React from "react";
import type { BreadcrumbItem } from "@/lib/breadcrumbs";

export type { BreadcrumbItem };

interface PageHeaderProps {
  moduleCode?: string;
  title: string;
  subtitle?: string;
  /** Deprecated: global DashboardBreadcrumbs covers navigation. Kept for API compat. */
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badgeColor?: "blue" | "emerald" | "amber" | "purple" | "slate";
}

export function PageHeader({
  moduleCode,
  title,
  subtitle,
  breadcrumbs: _breadcrumbs,
  actions,
  badgeColor = "blue"
}: PageHeaderProps) {
  void _breadcrumbs;
  const badgeColors = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    slate: "bg-slate-100 text-slate-800 border-slate-200"
  };

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs mb-4">
      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {moduleCode && (
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${badgeColors[badgeColor]}`}
              >
                {moduleCode}
              </span>
            )}
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

