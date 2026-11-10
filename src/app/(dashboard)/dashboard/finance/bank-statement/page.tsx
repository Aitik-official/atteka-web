"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Columns3,
  Copy,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Printer,
  Table2,
  Upload
} from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type StatementRow = {
  id: string;
  srNo: number;
  date: string;
  dateLabel: string;
  narration: string;
  chqRefNo: string;
  valueDt: string;
  valueDtLabel: string;
  withdrawalAmt: number;
  depositAmt: number;
  closingBalance: number;
  voucherNo: string;
  docNo: string;
  debit: number;
  credit: number;
  bank: string;
};

const COLS = [
  { key: "date", label: "Date", search: "Search Date" },
  { key: "narration", label: "Narration", search: "Search Narration" },
  { key: "chqRefNo", label: "Chq./Ref.No.", search: "Search Chq./Ref.No." },
  { key: "valueDt", label: "Value Dt", search: "Search Value Dt" },
  { key: "withdrawalAmt", label: "Withdrawal Amt.", search: "Search Withdrawal Amt." },
  { key: "depositAmt", label: "Deposit Amt.", search: "Search Deposit Amt." },
  { key: "closingBalance", label: "Closing Balance", search: "Search Closing Balance" },
  { key: "voucherNo", label: "Voucher No", search: "Search Voucher No" },
  { key: "docNo", label: "Doc No", search: "Search Doc No" },
  { key: "debit", label: "Debit", search: "Search Debit" },
  { key: "credit", label: "Credit", search: "Search Credit" }
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

function fmtAmt(n: number) {
  if (!n) return "";
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtBal(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function cellText(r: StatementRow, key: ColKey) {
  switch (key) {
    case "date":
      return r.dateLabel;
    case "narration":
      return r.narration;
    case "chqRefNo":
      return r.chqRefNo;
    case "valueDt":
      return r.valueDtLabel;
    case "withdrawalAmt":
      return fmtAmt(r.withdrawalAmt);
    case "depositAmt":
      return fmtAmt(r.depositAmt);
    case "closingBalance":
      return fmtBal(r.closingBalance);
    case "voucherNo":
      return r.voucherNo;
    case "docNo":
      return r.docNo;
    case "debit":
      return fmtAmt(r.debit);
    case "credit":
      return fmtAmt(r.credit);
    default:
      return "";
  }
}

export default function ViewBankStatementPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(6)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [bank, setBank] = useState("");
  const [banks, setBanks] = useState<string[]>([]);
  const [voucherNumber, setVoucherNumber] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [rows, setRows] = useState<StatementRow[]>([]);
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

  useEffect(() => {
    fetch("/api/bank/statement?banks=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBanks((d.data || []).map((x: { label: string }) => x.label));
      })
      .catch(() => {});
  }, []);

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadRows = async () => {
    if (!bank) {
      toast.error("Please select Bank");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        bank,
        voucherNo: voucherNumber.trim(),
        docNo: documentNumber.trim()
      });
      const res = await fetch(`/api/bank/statement?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load bank statement");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setStep("report");
    } catch {
      toast.error("Failed to load bank statement");
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

  const exportExcel = () => {
    const headers = visibleColList.map((c) => c.label).join(",");
    const lines = filtered.map((r) =>
      visibleColList
        .map((c) => {
          const v = cellText(r, c.key).replace(/"/g, '""');
          return `"${v}"`;
        })
        .join(",")
    );
    const blob = new Blob([[headers, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bank-statement-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel (CSV) download started (demo)");
  };

  const importStatement = async () => {
    try {
      const res = await fetch("/api/bank/statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: "imported-bank-statement.xlsx" })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Import failed");
        return;
      }
      toast.info(data.message || "Import queued (demo)");
    } catch {
      toast.error("Import failed");
    }
  };

  const moneyKeys: ColKey[] = ["withdrawalAmt", "depositAmt", "closingBalance", "debit", "credit"];

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden max-w-xl mx-auto">
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Voucher Date</label>
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

            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full h-11 px-4 border border-slate-300 rounded-full text-[13px] text-[#0171d3] bg-white focus:outline-none focus:border-[#0171d3]"
            >
              <option value="">Select Bank .</option>
              {banks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <input
              value={voucherNumber}
              onChange={(e) => setVoucherNumber(e.target.value.toUpperCase())}
              placeholder="Voucher Number"
              className="w-full h-11 px-4 border border-[#7eb6e8] rounded-full text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
            />

            <input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
              placeholder="Document Number"
              className="w-full h-11 px-4 border border-[#7eb6e8] rounded-full text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
            />

            <div className="flex justify-center pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadRows()}
                className="h-11 w-11 rounded-md bg-[#0171d3] hover:bg-[#015fae] text-white inline-flex items-center justify-center disabled:opacity-50 shadow-sm"
                title="View Statement"
              >
                <Table2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div data-print-root className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#1e88e5] text-white px-4 py-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h2 className="text-sm font-semibold tracking-wide">Bank Statement</h2>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 text-xs font-semibold border border-blue-300 bg-blue-50 text-blue-800 rounded-lg">
                Bank Statement
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColumnsMenu((v) => !v)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg inline-flex items-center gap-1.5"
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
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button
                type="button"
                onClick={exportExcel}
                className="px-3 py-1.5 text-xs font-semibold border border-emerald-200 text-emerald-800 bg-emerald-50 rounded-lg inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                type="button"
                onClick={() => {
                  printScoped();
                  toast.info("PDF / Print dialog opened (demo)");
                }}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                type="button"
                onClick={() => printScoped()}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                type="button"
                onClick={() => setCardView((v) => !v)}
                className={`px-3 py-1.5 text-xs font-semibold border rounded-lg inline-flex items-center gap-1.5 ${
                  cardView ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> CARD VIEW
              </button>
            </div>

            <button
              type="button"
              onClick={() => void importStatement()}
              className="h-9 px-4 rounded-full border border-[#0171d3] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#e8f1fb]"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Bank Statement
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

          {!cardView ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700">
                    {visibleColList.map((c) => (
                      <th
                        key={c.key}
                        className={`border border-slate-200 px-2 py-1.5 font-semibold whitespace-nowrap align-top ${
                          moneyKeys.includes(c.key) ? "text-right" : "text-left"
                        }`}
                      >
                        <div className="mb-1">{c.label}</div>
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
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-[#eef5fc]">
                      {visibleColList.map((c) => (
                        <td
                          key={c.key}
                          className={`border border-slate-200 px-2 py-1.5 whitespace-nowrap ${
                            moneyKeys.includes(c.key) ? "text-right font-semibold" : ""
                          } ${c.key === "narration" ? "whitespace-normal max-w-[260px]" : ""}`}
                        >
                          {cellText(r, c.key) || (moneyKeys.includes(c.key) ? "" : "—")}
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
              {pageRows.map((r) => (
                <div key={r.id} className="border border-slate-200 rounded-md p-3 text-[11px] space-y-1 bg-white shadow-sm">
                  <div className="font-semibold text-slate-800">{r.dateLabel}</div>
                  <div className="text-slate-600">{r.narration}</div>
                  <div className="flex justify-between gap-2 pt-1">
                    <span>W/D: {fmtAmt(r.withdrawalAmt) || "0.00"}</span>
                    <span>Dep: {fmtAmt(r.depositAmt) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Bal: {fmtBal(r.closingBalance)}</span>
                    <span className="font-mono text-[10px]">{r.voucherNo || "—"}</span>
                  </div>
                </div>
              ))}
              {pageRows.length === 0 && (
                <p className="text-slate-500 col-span-full text-center py-8 text-xs">No data available in table</p>
              )}
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Showing {fromEntry} to {toEntry} of {filtered.length} entries
            </span>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-md border border-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2">
                {pageSafe} / {totalPages}
              </span>
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
        </div>
      )}
    </div>
  );
}
