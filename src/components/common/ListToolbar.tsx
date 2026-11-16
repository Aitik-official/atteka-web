"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Columns3,
  Copy,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Printer,
  Search
} from "lucide-react";

export type ListToolbarColumn = { key: string; label: string };

type ListToolbarProps = {
  title?: string;
  onBack?: () => void;
  columns?: ListToolbarColumn[];
  visibleCols?: Record<string, boolean>;
  onToggleColumn?: (key: string) => void;
  onCopy?: () => void;
  onExcel?: () => void;
  onPdf?: () => void;
  onPrint?: () => void;
  cardView?: boolean;
  onToggleCardView?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  extras?: React.ReactNode;
  right?: React.ReactNode;
};

const btnCls =
  "px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg inline-flex items-center gap-1.5 hover:bg-slate-50 disabled:opacity-40";

/** Standard list/report toolbar: Back context, columns, export, print, search. */
export function ListToolbar({
  title,
  onBack,
  columns,
  visibleCols,
  onToggleColumn,
  onCopy,
  onExcel,
  onPdf,
  onPrint,
  cardView,
  onToggleCardView,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  extras,
  right
}: ListToolbarProps) {
  const [showColumns, setShowColumns] = useState(false);

  return (
    <div className="px-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-7 h-7 rounded-full border border-slate-200 hover:bg-slate-50 inline-flex items-center justify-center"
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
          </button>
        ) : null}
        {title ? (
          <span className="px-3 py-1.5 text-xs font-semibold border border-blue-300 bg-blue-50 text-blue-800 rounded-lg">
            {title}
          </span>
        ) : null}

        {columns && visibleCols && onToggleColumn ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumns((v) => !v)}
              className={btnCls}
            >
              <Columns3 className="w-3.5 h-3.5" /> Column visibility
            </button>
            {showColumns ? (
              <div className="absolute z-20 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-xs max-h-64 overflow-y-auto">
                {columns.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!visibleCols[c.key]}
                      onChange={() => onToggleColumn(c.key)}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {onCopy ? (
          <button type="button" onClick={onCopy} className={btnCls}>
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        ) : null}
        {onExcel ? (
          <button
            type="button"
            onClick={onExcel}
            className="px-3 py-1.5 text-xs font-semibold border border-emerald-200 text-emerald-800 bg-emerald-50 rounded-lg inline-flex items-center gap-1.5 hover:bg-emerald-100"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
        ) : null}
        {onPdf ? (
          <button type="button" onClick={onPdf} className={btnCls}>
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
        ) : null}
        {onPrint ? (
          <button type="button" onClick={onPrint} className={btnCls}>
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        ) : null}
        {onToggleCardView ? (
          <button
            type="button"
            onClick={onToggleCardView}
            className={`px-3 py-1.5 text-xs font-semibold border rounded-lg inline-flex items-center gap-1.5 ${
              cardView ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> CARD VIEW
          </button>
        ) : null}
        {extras}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange ? (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              value={search || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 w-44 sm:w-56 pl-8 pr-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#0171d3]"
            />
          </div>
        ) : null}
        {right}
      </div>
    </div>
  );
}
