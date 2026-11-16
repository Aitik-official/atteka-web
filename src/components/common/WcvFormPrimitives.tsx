"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import type { MasterOption } from "@/lib/masterOptions";

export const wcvPillBtn =
  "h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5";

export const wcvInputCls =
  "h-9 px-3 border border-[#7eb6e8] rounded-md text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#0171d3] focus:ring-2 focus:ring-[#0171d3]/15 disabled:bg-slate-50 transition-[border-color,box-shadow]";

export const wcvInputErrorCls =
  "border-rose-400 focus:border-rose-500 focus:ring-rose-200/60";

export function WcvFieldLabel({
  children,
  required,
  htmlFor
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-semibold text-slate-800 inline-flex items-center gap-1">
      {children}
      {required ? <span className="text-rose-500" title="Required">*</span> : null}
    </label>
  );
}

export function WcvFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] text-rose-600 leading-snug">{message}</p>;
}

export function WcvSubmitButton({
  children,
  disabled,
  loading,
  onClick,
  type = "button",
  className = ""
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`min-w-[160px] h-10 px-6 rounded-lg bg-[#0171d3] hover:bg-[#015fae] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${className}`}
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          Saving…
        </>
      ) : (
        children
      )}
    </button>
  );
}

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
  labelClassName = "text-slate-800",
  required,
  error
}: {
  label: string;
  children: React.ReactNode;
  labelWidth?: string;
  labelClassName?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-wrap items-start gap-2 sm:gap-3">
      <span className={`text-[13px] font-semibold ${labelClassName} ${labelWidth} shrink-0 pt-2 inline-flex items-center gap-1`}>
        {label}
        {required ? <span className="text-rose-500" title="Required">*</span> : null}
      </span>
      <div className="flex-1 min-w-[180px]">
        <div className="flex flex-wrap items-center gap-2">{children}</div>
        <WcvFieldError message={error} />
      </div>
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
  className = "",
  error,
  required,
  id
}: {
  value: string;
  onChange: (value: string) => void;
  options: MasterOption[];
  placeholder?: string;
  includeEmpty?: boolean;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  required?: boolean;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      required={required}
      aria-invalid={error || undefined}
      onChange={(e) => onChange(e.target.value)}
      className={`${wcvInputCls} min-w-[200px] ${error ? wcvInputErrorCls : ""} ${className}`}
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
  onEnter,
  error,
  required,
  id,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  upperCase?: boolean;
  className?: string;
  onEnter?: () => void;
  error?: boolean;
  required?: boolean;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      aria-invalid={error || undefined}
      onChange={(e) => onChange(upperCase ? e.target.value.toUpperCase() : e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
      className={`${wcvInputCls} ${error ? wcvInputErrorCls : ""} ${className}`}
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
