import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles, LucideIcon } from "lucide-react";

interface WcvActionCardProps {
  title: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  /** When true, card is visible but not navigable (wrong-module sink removed). */
  unavailable?: boolean;
  unavailableReason?: string;
  badge?: string;
}

export function WcvActionCard({
  title,
  description,
  href,
  onClick,
  icon: Icon,
  unavailable = false,
  unavailableReason = "Screen not linked yet — kept on this hub only",
  badge
}: WcvActionCardProps) {
  const statusBadge = unavailable
    ? "Not linked"
    : badge || "Open";

  const CardContent = (
    <div
      onClick={unavailable ? undefined : onClick}
      className={`group relative bg-white rounded-xl border transition-all duration-200 p-5 flex flex-col justify-between min-h-[140px] overflow-hidden ${
        unavailable
          ? "border-slate-200 opacity-75 cursor-not-allowed"
          : "border-slate-200 hover:border-blue-500/80 hover:shadow-md cursor-pointer"
      }`}
    >
      {!unavailable && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 shadow-2xs ${
              unavailable
                ? "bg-slate-100 text-slate-400"
                : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
            }`}
          >
            {Icon ? <Icon className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <span
            className={`text-[11px] font-medium flex items-center gap-0.5 transition-colors ${
              unavailable ? "text-amber-600" : "text-slate-400 group-hover:text-blue-500"
            }`}
          >
            {statusBadge}
            {!unavailable && (
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            )}
          </span>
        </div>

        <h3
          className={`font-semibold text-sm transition-colors ${
            unavailable ? "text-slate-600" : "text-slate-900 group-hover:text-blue-600"
          }`}
        >
          {title}
        </h3>
        {description && description !== title && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{description}</p>
        )}
        {unavailable && (
          <p className="text-[11px] text-amber-700 mt-2 leading-relaxed">{unavailableReason}</p>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px]">
          {unavailable ? "Navigation locked" : "Module"}
        </span>
        {!unavailable && (
          <span className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:text-blue-700">
            Open
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </div>
    </div>
  );

  if (!unavailable && href && href !== "#") {
    return (
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl">
        {CardContent}
      </Link>
    );
  }

  return (
    <div
      onClick={unavailable ? undefined : onClick}
      role={!unavailable && onClick ? "button" : undefined}
      tabIndex={!unavailable && onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!unavailable && onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className="block text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
    >
      {CardContent}
    </div>
  );
}

export function WcvRibbonHeader({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 mb-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
          AL
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle || "Atteka Logistics ERP • Enterprise Configuration Hub"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold">
          Active Module
        </span>
      </div>
    </div>
  );
}
