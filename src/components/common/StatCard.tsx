import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  color?: "emerald" | "blue" | "amber" | "violet" | "rose" | "indigo";
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = "up",
  color = "emerald",
  onClick
}: StatCardProps) {
  const colorStyles = {
    emerald: {
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accent: "text-emerald-600",
      pill: "bg-emerald-100 text-emerald-800"
    },
    blue: {
      bg: "bg-blue-50 text-blue-600 border-blue-100",
      accent: "text-blue-600",
      pill: "bg-blue-100 text-blue-800"
    },
    amber: {
      bg: "bg-amber-50 text-amber-600 border-amber-100",
      accent: "text-amber-600",
      pill: "bg-amber-100 text-amber-800"
    },
    violet: {
      bg: "bg-purple-50 text-purple-600 border-purple-100",
      accent: "text-purple-600",
      pill: "bg-purple-100 text-purple-800"
    },
    rose: {
      bg: "bg-rose-50 text-rose-600 border-rose-100",
      accent: "text-rose-600",
      pill: "bg-rose-100 text-rose-800"
    },
    indigo: {
      bg: "bg-indigo-50 text-indigo-600 border-indigo-100",
      accent: "text-indigo-600",
      pill: "bg-indigo-100 text-indigo-800"
    }
  };

  const style = colorStyles[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs transition-all ${
        onClick ? "cursor-pointer hover:shadow-md hover:border-slate-300" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${style.bg} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${
              trendDirection === "up"
                ? "bg-emerald-50 text-emerald-700"
                : trendDirection === "down"
                ? "bg-rose-50 text-rose-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {trendDirection === "up" && <TrendingUp className="w-3 h-3 mr-0.5" />}
            {trendDirection === "down" && <TrendingDown className="w-3 h-3 mr-0.5" />}
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}

