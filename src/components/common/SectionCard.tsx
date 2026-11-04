import React from "react";
import { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  headerAction,
  children,
  footer,
  className = "",
  headerClassName = ""
}: SectionCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className={`px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${headerClassName}`}
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">{title}</h3>
              {badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {headerAction && (
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {headerAction}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 sm:p-4">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="px-3.5 sm:px-4 py-2.5 bg-slate-50 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
}

