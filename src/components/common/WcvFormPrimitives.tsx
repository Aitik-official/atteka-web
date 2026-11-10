"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import type { MasterOption } from "@/lib/masterOptions";

export const wcvPillBtn =
  "h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50 inline-flex items-center justify-center gap-1.5";

export const wcvInputCls =
  "h-9 px-3 border border-[#7eb6e8] rounded-md text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#0171d3] disabled:bg-slate-50";

export function WcvBackLink({ href = "/dashboard/exceptional/operation" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back
    </Link>
  );
}

/** Standard blue-header white card used across exceptional / filter forms. */
export function WcvFormCard({
  title,
  children,
  centeredTitle = true,
  actions,
  className = "max-w-xl mx-auto"
}: {
  title: string;
  children: React.ReactNode;
  centeredTitle?: boolean;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-slate-300 shadow-sm overflow-hidden ${className}`}>
      <div
        className={`bg-[#0171d3] px-4 py-2.5 flex items-center gap-2 ${
          centeredTitle ? "justify-center text-center" : "justify-between"
        }`}
      >
        <h1 className="text-white text-sm font-bold tracking-wide leading-snug flex-1">
          {title}
        </h1>
        {actions}
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-4">{children}</div>
    </div>
  );
}

export function WcvFieldRow({
  label,
  children,
  labelWidth = "w-[150px]",
  labelClassName = "text-slate-800"
}: {
  label: string;
  children: React.ReactNode;
  labelWidth?: string;
  labelClassName?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <span className={`text-[13px] font-semibold ${labelClassName} ${labelWidth} shrink-0`}>
        {label}
      </span>
      <div className="flex-1 min-w-[180px] flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function WcvSelect({
  value,
  onChange,
  options,
  placeholder = "---Select---",
  includeEmpty = false,
  disabled,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  options: MasterOption[];
  placeholder?: string;
  includeEmpty?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`${wcvInputCls} min-w-[200px] ${className}`}
    >
      {includeEmpty && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={`${o.value}-${o.label}`} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function WcvTextInput({
  value,
  onChange,
  placeholder,
  upperCase = true,
  className = "",
  onEnter
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  upperCase?: boolean;
  className?: string;
  onEnter?: () => void;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(upperCase ? e.target.value.toUpperCase() : e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
      className={`${wcvInputCls} ${className}`}
    />
  );
}

export function WcvLookupInput({
  value,
  onChange,
  onLookup,
  hint,
  className = "w-[140px]"
}: {
  value: string;
  onChange: (value: string) => void;
  onLookup: () => void;
  hint?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <WcvTextInput value={value} onChange={onChange} className={className} onEnter={onLookup} />
      <button
        type="button"
        onClick={onLookup}
        title="Lookup"
        className="w-8 h-8 rounded-full border border-[#7eb6e8] text-[#0171d3] inline-flex items-center justify-center hover:bg-[#e8f1fb]"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {hint ? <span className="text-[12px] text-slate-600">{hint}</span> : null}
    </div>
  );
}

export function WcvDemoHint({ label, values }: { label: string; values: string[] }) {
  return (
    <p className="text-[11px] text-slate-500 text-center leading-relaxed">
      {label}:{" "}
      {values.map((v, i) => (
        <React.Fragment key={v}>
          {i > 0 ? " · " : null}
          <span className="font-mono text-[#0171d3]">{v}</span>
        </React.Fragment>
      ))}
    </p>
  );
}

export function WcvResultTable({
  headers,
  cells
}: {
  headers: string[];
  cells: React.ReactNode[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] min-w-[720px]">
        <thead>
          <tr className="bg-[#0171d3] text-white">
            {headers.map((h) => (
              <th
                key={h}
                className="border border-slate-300 px-3 py-2 text-left font-semibold whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {cells.map((c, i) => (
              <td key={i} className="border border-slate-300 px-3 py-2">
                {c}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
