"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronDown,
  Columns3,
  Copy,
  FileSpreadsheet,
  Printer
} from "lucide-react";
import { toast } from "@/lib/toastBus";

type Row = {
  id: string;
  srNo: number;
  pdcNumber: string;
  pdcDate: string;
  pdcDateLabel: string;
  pdcBranch: string;
  vendorName: string;
  vendorLabel: string;
  vehicleNo: string;
  totalHire: number;
  advanceAmount: number;
  balanceAmount: number;
  status: string;
};

const COLS = [
  { key: "pdcNumber", label: "PDC Number", search: "Search PDC Number" },
  { key: "pdcDate", label: "PDC Date", search: "Search PDC Date" },
  { key: "pdcBranch", label: "PDC Branch", search: "Search PDC Branch" },
  { key: "vendor", label: "Vendor", search: "Search Vendor" },
  { key: "vehicleNo", label: "Vehicle NO", search: "Search Vehicle NO" }
] as const;

type ColKey = (typeof COLS)[number]["key"];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function cellText(r: Row, key: ColKey) {
  switch (key) {
    case "pdcNumber":
      return r.pdcNumber;
    case "pdcDate":
      return r.pdcDateLabel;
    case "pdcBranch":
      return r.pdcBranch;
    case "vendor":
      return r.vendorLabel || r.vendorName;
    case "vehicleNo":
      return r.vehicleNo;
    default:
      return "";
  }
}

export default function PdcBalancePaymentSinglePage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [systemPdcNo, setSystemPdcNo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState("");
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
        pdcNo: systemPdcNo.trim()
      });
      const res = await fetch(`/api/finance/pdc-balance-payment-single?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load PDC balance records");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setStep("report");
    } catch {
      toast.error("Failed to load PDC balance records");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const global = tableSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (global) {
        const blob = COLS.map((c) => cellText(r, c.key)).join(" ").toLowerCase();
        if (!blob.includes(global)) return false;
      }
      for (const c of COLS) {
        const q = (colFilters[c.key] || "").trim().toLowerCase();
        if (!q) continue;
        if (!cellText(r, c.key).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, tableSearch, colFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const fromEntry = filtered.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1;
  const toEntry = Math.min(pageSafe * pageSize, filtered.length);
  const visibleColList = COLS.filter((c) => visibleCols[c.key]);

  const copyTable = async () => {
    const headers = visibleColList.map((c) => c.label).join("\t");
    const lines = filtered.map((r) => visibleColList.map((c) => cellText(r, c.key)).join("\t"));
    try {
      await navigator.clipboard.writeText([headers, ...lines].join("\n"));
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const exportCsv = (kind: "csv" | "excel") => {
    const headers = visibleColList.map((c) => c.label).join(",");
    const lines = filtered.map((r) =>
      visibleColList
        .map((c) => `"${cellText(r, c.key).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[headers, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pdc-balance-payment-single-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${kind === "excel" ? "Excel" : "CSV"} download started (demo)`);
  };

  const openPayment = (r: Row) => {
    toast.info(`Open balance payment for ${r.pdcNumber} · Balance ₹${Number(r.balanceAmount || 0).toLocaleString("en-IN")} (demo)`);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden max-w-xl mx-auto">
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                Select Document Date
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
              value={systemPdcNo}
              onChange={(e) => setSystemPdcNo(e.target.value.toUpperCase())}
              placeholder="System PDCNO"
              className="w-full h-11 px-4 border border-[#7eb6e8] rounded-full text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
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
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#d7e8f8]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnsMenu((v) => !v)}
                className="px-3 py-1.5 text-xs font-semibold border border-[#7eb6e8] text-[#0171d3] rounded-lg inline-flex items-center gap-1.5"
              >
                <Columns3 className="w-3.5 h-3.5" /> Column visibility
              </button>
              {showColumnsMenu && (
                <div className="absolute z-20 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-xs max-h-64 overflow-y-auto">
                  {COLS.map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleCols[c.key]}
                        onChange={() =>
                          setVisibleCols((prev) => ({ ...prev, [c.key]: !prev[c.key] }))
                        }
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => void copyTable()}
              className="px-3 py-1.5 text-xs font-semibold border border-[#7eb6e8] text-[#0171d3] rounded-lg inline-flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button
              type="button"
              onClick={() => exportCsv("csv")}
              className="px-3 py-1.5 text-xs font-semibold border border-[#7eb6e8] text-[#0171d3] rounded-lg"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportCsv("excel")}
              className="px-3 py-1.5 text-xs font-semibold border border-[#7eb6e8] text-[#0171d3] rounded-lg inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold border border-[#7eb6e8] text-[#0171d3] rounded-lg inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px] min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  {visibleColList.map((c) => (
                    <th
                      key={c.key}
                      className="border border-slate-200 px-2 py-1.5 font-semibold whitespace-nowrap text-left align-top"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span>{c.label}</span>
                        {c.key === "vehicleNo" ? (
                          <span className="inline-flex h-5 w-5 rounded bg-[#0171d3] text-white items-center justify-center">
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        ) : null}
                      </div>
                      <input
                        value={colFilters[c.key]}
                        onChange={(e) => {
                          setColFilters((prev) => ({ ...prev, [c.key]: e.target.value }));
                          setPage(1);
                        }}
                        placeholder={c.search}
                        className="w-full h-7 px-1.5 border border-slate-200 rounded-sm text-[10px] font-normal text-slate-700"
                      />
                    </th>
                  ))}
                  <th className="border border-slate-200 px-2 py-1.5 font-semibold text-center w-16">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-[#eef5fc]">
                    {visibleColList.map((c) => (
                      <td key={c.key} className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {cellText(r, c.key)}
                      </td>
                    ))}
                    <td className="border border-slate-200 px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => openPayment(r)}
                        className="h-7 w-7 rounded bg-[#0171d3] text-white inline-flex items-center justify-center hover:bg-[#015fae]"
                        title="Pay Balance"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={Math.max(visibleColList.length, 1) + 1}
                      className="border border-slate-200 px-3 py-10 text-center text-slate-500"
                    >
                      No data available in table
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
