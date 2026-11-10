"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Columns3,
  Copy,
  FileSpreadsheet,
  LayoutGrid,
  Plus,
  Printer
} from "lucide-react";
import { toast } from "@/lib/toastBus";

type Row = {
  id: string;
  tripSheetNo: string;
  docketNo: string;
  docketDateLabel: string;
  customerName: string;
  fromLocation: string;
  toLocation: string;
  vehicleNo: string;
  freightAmt: number;
  advanceAmt: number;
  balanceAmt: number;
};

const COLS = [
  { key: "sno", label: "Sno.", search: "Search Sno." },
  { key: "docketNo", label: "Docket No", search: "Search Docket No" },
  { key: "docketDateLabel", label: "Docket Date", search: "Search Docket Date" },
  { key: "customerName", label: "Customer Name", search: "Search Customer Name" },
  { key: "fromLocation", label: "From Location", search: "Search From Location" },
  { key: "toLocation", label: "To Location", search: "Search To Location" },
  { key: "vehicleNo", label: "Veh no", search: "Search Veh no" },
  { key: "freightAmt", label: "Freight Amt", search: "Search Freight Amt" },
  { key: "advanceAmt", label: "Advance Amt", search: "Search Advance Amt" },
  { key: "balanceAmt", label: "Balance Amt", search: "Search Balance Amt" },
  { key: "view", label: "View Loading Slip", search: "Search View" }
] as const;

type ColKey = (typeof COLS)[number]["key"];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function cellText(r: Row, key: ColKey, sno: number) {
  switch (key) {
    case "sno":
      return String(sno);
    case "docketNo":
      return r.docketNo;
    case "docketDateLabel":
      return r.docketDateLabel;
    case "customerName":
      return r.customerName;
    case "fromLocation":
      return r.fromLocation;
    case "toLocation":
      return r.toLocation;
    case "vehicleNo":
      return r.vehicleNo;
    case "freightAmt":
      return String(r.freightAmt);
    case "advanceAmt":
      return String(r.advanceAmt);
    case "balanceAmt":
      return String(r.balanceAmt);
    case "view":
      return "View";
    default:
      return "";
  }
}

export default function PrepareLoadingSlipHubPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [fromDate, setFromDate] = useState(toInputDate(new Date()));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [docketNo, setDocketNo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState("");
  const [cardView, setCardView] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>(
    Object.fromEntries(COLS.map((c) => [c.key, true])) as Record<ColKey, boolean>
  );
  const [colFilters, setColFilters] = useState<Record<ColKey, string>>(
    Object.fromEntries(COLS.map((c) => [c.key, ""])) as Record<ColKey, string>
  );

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        docketNo: docketNo.trim()
      });
      const res = await fetch(`/api/operations/prepare-loading-slip?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load loading sheets");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setStep("report");
    } catch {
      toast.error("Failed to load loading sheets");
    } finally {
      setLoading(false);
    }
  };

  const indexed = useMemo(() => rows.map((r, i) => ({ row: r, sno: i + 1 })), [rows]);

  const filtered = useMemo(() => {
    const global = tableSearch.trim().toLowerCase();
    return indexed.filter(({ row, sno }) => {
      if (global) {
        const blob = COLS.map((c) => cellText(row, c.key, sno)).join(" ").toLowerCase();
        if (!blob.includes(global)) return false;
      }
      for (const c of COLS) {
        const q = (colFilters[c.key] || "").trim().toLowerCase();
        if (!q) continue;
        if (!cellText(row, c.key, sno).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [indexed, tableSearch, colFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const fromEntry = filtered.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1;
  const toEntry = Math.min(pageSafe * pageSize, filtered.length);
  const visibleColList = COLS.filter((c) => visibleCols[c.key]);

  const copyTable = async () => {
    const headers = visibleColList.map((c) => c.label).join("\t");
    const lines = filtered.map(({ row, sno }) =>
      visibleColList.map((c) => cellText(row, c.key, sno)).join("\t")
    );
    try {
      await navigator.clipboard.writeText([headers, ...lines].join("\n"));
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const exportExcel = () => {
    const headers = visibleColList.map((c) => c.label).join(",");
    const lines = filtered.map(({ row, sno }) =>
      visibleColList.map((c) => `"${cellText(row, c.key, sno).replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[headers, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `view-print-loading-sheet-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel download started (demo)");
  };

  const btn =
    "px-3 py-1.5 text-xs font-semibold border border-[#7eb6e8] text-[#0171d3] rounded-lg inline-flex items-center gap-1.5 hover:bg-[#e8f1fb]";

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden max-w-xl mx-auto">
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                Select Docket Date
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDates((v) => !v)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-sm bg-white text-left text-[13px] text-slate-700 inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="flex-1 truncate">{dateRangeLabel}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
                {showDates && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 shadow-lg rounded-sm p-3 flex flex-wrap gap-3">
                    <label className="text-[11px] text-slate-600 flex-1 min-w-[140px]">
                      From
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="mt-1 w-full h-8 px-2 border border-slate-300 rounded-sm text-[12px]"
                      />
                    </label>
                    <label className="text-[11px] text-slate-600 flex-1 min-w-[140px]">
                      To
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="mt-1 w-full h-8 px-2 border border-slate-300 rounded-sm text-[12px]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDates(false)}
                      className="h-8 px-3 self-end rounded-full border border-[#0171d3] text-[#0171d3] text-xs font-semibold"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <span className="text-slate-800 font-bold text-sm">OR</span>
            </div>

            <input
              value={docketNo}
              onChange={(e) => setDocketNo(e.target.value.toUpperCase())}
              placeholder="Docket No"
              className="w-full h-11 px-4 border border-[#7eb6e8] rounded-md text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
            />

            <div className="flex justify-center pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadReport()}
                className="h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-[#0171d3] text-white flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-7 w-7 rounded-full bg-white text-[#0171d3] inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h2 className="text-sm font-bold flex-1">View Print Loading Sheet</h2>
            <Link
              href="/dashboard/operations/tripsheets/prepare/new"
              className="h-8 px-3 rounded-md bg-white text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Loading Sheet
            </Link>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <div className="relative">
              <button type="button" onClick={() => setShowColumnsMenu((v) => !v)} className={btn}>
                <Columns3 className="w-3.5 h-3.5" /> Column visibility
              </button>
              {showColumnsMenu && (
                <div className="absolute z-20 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-xs max-h-64 overflow-y-auto">
                  {COLS.map((c) => (
                    <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols[c.key]}
                        onChange={() =>
                          setVisibleCols((prev) => ({ ...prev, [c.key]: !prev[c.key] }))
                        }
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => void copyTable()} className={btn}>
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button type="button" onClick={exportExcel} className={btn}>
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              type="button"
              onClick={() => setCardView((v) => !v)}
              className={`${btn} ${cardView ? "bg-blue-50" : ""}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> CARD VIEW
            </button>
          </div>

          <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <label className="inline-flex items-center gap-2 text-slate-600">
              Show
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 border border-slate-200 rounded-md"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              entries
            </label>
            <label className="inline-flex items-center gap-2 text-slate-600">
              Search:
              <input
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setPage(1);
                }}
                className="h-8 px-2 border border-slate-200 rounded-md min-w-[180px]"
              />
            </label>
          </div>

          <div className="px-4 py-1 text-[11px] text-slate-500">
            Showing {fromEntry} to {toEntry} of {filtered.length} entries
          </div>

          {!cardView ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700">
                    {visibleColList.map((c) => (
                      <th
                        key={c.key}
                        className="border border-slate-200 px-2 py-1.5 font-semibold text-left align-top whitespace-nowrap"
                      >
                        <div className="mb-1">{c.label}</div>
                        <input
                          value={colFilters[c.key]}
                          onChange={(e) => {
                            setColFilters((prev) => ({ ...prev, [c.key]: e.target.value }));
                            setPage(1);
                          }}
                          placeholder={c.search}
                          className="w-full h-7 px-1.5 border border-slate-200 rounded-sm text-[10px]"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ row, sno }) => (
                    <tr key={row.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-[#eef5fc]">
                      {visibleColList.map((c) => (
                        <td key={c.key} className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          {c.key === "view" ? (
                            <button
                              type="button"
                              title="View / Print"
                              onClick={() =>
                                toast.success(`Loading slip ${row.tripSheetNo || row.docketNo} (demo)`)
                              }
                              className="h-7 w-7 inline-flex items-center justify-center rounded text-[#0171d3] hover:bg-[#e8f1fb]"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          ) : c.key === "docketNo" ? (
                            <span className="text-[#0171d3] font-semibold">{row.docketNo}</span>
                          ) : (
                            cellText(row, c.key, sno)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={Math.max(visibleColList.length, 1)}
                        className="border border-slate-200 px-3 py-10 text-center text-slate-500"
                      >
                        No data available in table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {pageRows.map(({ row }) => (
                <div key={row.id} className="border border-slate-200 rounded-md p-3 text-[11px] space-y-1">
                  <div className="font-semibold text-[#0171d3]">{row.docketNo}</div>
                  <div>{row.customerName}</div>
                  <div>
                    {row.fromLocation} → {row.toLocation}
                  </div>
                  <div className="text-slate-500">
                    {row.vehicleNo} · Frt {row.freightAmt}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2 text-xs">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-md border border-slate-200 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              className="h-8 min-w-8 px-2 rounded-md border border-[#0171d3] bg-[#0171d3] text-white"
            >
              {pageSafe}
            </button>
            <button
              type="button"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3 rounded-md border border-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
