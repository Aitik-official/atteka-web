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
  FileText,
  Printer,
  Search
} from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type CnRow = {
  srNo: number;
  creditNoteNo: string;
  creditNoteDate: string;
  creditNoteDateIso: string;
  creditNoteLocation: string;
  mrNo: string;
  billNo: string;
  amount: number;
};

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
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

const COLS = [
  { key: "srNo", label: "Sr No" },
  { key: "creditNoteNo", label: "Credit Note No." },
  { key: "creditNoteDate", label: "Credit Note Date" },
  { key: "creditNoteLocation", label: "Credit Note Location" },
  { key: "mrNo", label: "MR No" },
  { key: "billNo", label: "Bill No" },
  { key: "amount", label: "Amount" },
  { key: "view", label: "View" }
] as const;

type ColKey = (typeof COLS)[number]["key"];

export default function ViewPrintCreditNotePage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(364)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [creditNoteNo, setCreditNoteNo] = useState("");
  const [mrNo, setMrNo] = useState("");
  const [billNo, setBillNo] = useState("");
  const [rows, setRows] = useState<CnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState("");
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>({
    srNo: true,
    creditNoteNo: true,
    creditNoteDate: true,
    creditNoteLocation: true,
    mrNo: true,
    billNo: true,
    amount: true,
    view: true
  });
  const [colFilters, setColFilters] = useState<Record<string, string>>({
    srNo: "",
    creditNoteNo: "",
    creditNoteDate: "",
    creditNoteLocation: "",
    mrNo: "",
    billNo: "",
    amount: "",
    view: ""
  });
  const [sortKey, setSortKey] = useState<ColKey>("srNo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadRows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        creditNoteNo: creditNoteNo.trim(),
        mrNo: mrNo.trim(),
        billNo: billNo.trim()
      });
      const res = await fetch(`/api/finance/view-print-credit-note?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load credit notes");
        return;
      }
      const list: CnRow[] = data.data || [];
      setRows(list);
      setPage(1);
      setTableSearch("");
      setStep("report");
      if (!list.length) toast.warning("No data available in table");
    } catch {
      toast.error("Failed to load credit notes");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...rows];
    const q = tableSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.creditNoteNo.toLowerCase().includes(q) ||
          r.mrNo.toLowerCase().includes(q) ||
          r.billNo.toLowerCase().includes(q) ||
          r.creditNoteLocation.toLowerCase().includes(q) ||
          r.creditNoteDate.toLowerCase().includes(q) ||
          String(r.amount).includes(q)
      );
    }

    const f = colFilters;
    if (f.srNo.trim()) list = list.filter((r) => String(r.srNo).includes(f.srNo.trim()));
    if (f.creditNoteNo.trim())
      list = list.filter((r) =>
        r.creditNoteNo.toLowerCase().includes(f.creditNoteNo.trim().toLowerCase())
      );
    if (f.creditNoteDate.trim())
      list = list.filter((r) =>
        r.creditNoteDate.toLowerCase().includes(f.creditNoteDate.trim().toLowerCase())
      );
    if (f.creditNoteLocation.trim())
      list = list.filter((r) =>
        r.creditNoteLocation.toLowerCase().includes(f.creditNoteLocation.trim().toLowerCase())
      );
    if (f.mrNo.trim())
      list = list.filter((r) => r.mrNo.toLowerCase().includes(f.mrNo.trim().toLowerCase()));
    if (f.billNo.trim())
      list = list.filter((r) => r.billNo.toLowerCase().includes(f.billNo.trim().toLowerCase()));
    if (f.amount.trim()) list = list.filter((r) => String(r.amount).includes(f.amount.trim()));

    list.sort((a, b) => {
      const av = a[sortKey as keyof CnRow];
      const bv = b[sortKey as keyof CnRow];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av ?? "");
      const bs = String(bv ?? "");
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });

    return list;
  }, [rows, tableSearch, colFilters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const fromEntry = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toEntry = Math.min(page * pageSize, filtered.length);

  const col = (key: ColKey) => visibleCols[key] !== false;

  const setFilter = (key: string, value: string) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const toggleSort = (key: ColKey) => {
    if (key === "view") return;
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const buildCsv = () => {
    const headers = [
      "Sr No",
      "Credit Note No.",
      "Credit Note Date",
      "Credit Note Location",
      "MR No",
      "Bill No",
      "Amount"
    ];
    const body = filtered.map((r, idx) => [
      idx + 1,
      r.creditNoteNo,
      r.creditNoteDate,
      r.creditNoteLocation,
      r.mrNo,
      r.billNo,
      r.amount
    ]);
    return [headers, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    downloadFile(buildCsv(), `ViewPrintCreditNote_${toInputDate(new Date())}.csv`, "text/csv;charset=utf-8;");
    toast.success("CSV downloaded");
  };

  const exportExcel = () => {
    downloadFile(
      buildCsv(),
      `ViewPrintCreditNote_${toInputDate(new Date())}.xls`,
      "application/vnd.ms-excel;charset=utf-8;"
    );
    toast.success("Excel downloaded");
  };

  const copyTable = async () => {
    const text = filtered
      .map(
        (r, idx) =>
          `${idx + 1}\t${r.creditNoteNo}\t${r.creditNoteDate}\t${r.creditNoteLocation}\t${r.mrNo}\t${r.billNo}\t${r.amount}`
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied credit note rows");
    } catch {
      toast.error("Unable to copy to clipboard");
    }
  };

  const printRow = (r: CnRow) => {
    toast.success(`Print ${r.creditNoteNo} (demo)`);
  };

  return (
    <div className="space-y-4 pb-16 max-w-7xl mx-auto">
      {step === "filter" && (
        <div className="min-h-[55vh] flex items-start justify-center pt-10 px-4">
          <div className="w-full max-w-md space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Credit Note Date
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDates((v) => !v)}
                  className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-left bg-white flex items-center gap-2 hover:border-blue-400"
                >
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="flex-1 truncate text-slate-700">{dateRangeLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
                {showDates && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-3 space-y-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">From</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full h-9 px-2 border border-slate-200 rounded-md text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">To</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full h-9 px-2 border border-slate-200 rounded-md text-xs mt-0.5"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDates(false)}
                      className="w-full h-8 bg-blue-600 text-white text-xs font-semibold rounded-md"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center text-xs font-bold text-slate-800 py-0.5">OR</div>

            <input
              value={creditNoteNo}
              onChange={(e) => setCreditNoteNo(e.target.value.toUpperCase())}
              placeholder="Credit Note Number"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400 bg-white"
            />
            <input
              value={mrNo}
              onChange={(e) => setMrNo(e.target.value.toUpperCase())}
              placeholder="MR Number"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400 bg-white"
            />
            <input
              value={billNo}
              onChange={(e) => setBillNo(e.target.value.toUpperCase())}
              placeholder="Bill Number"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400 bg-white"
            />

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={loadRows}
                className="min-w-[120px] h-9 px-6 border border-[#0171d3] text-[#0171d3] bg-white rounded-full text-xs font-semibold hover:bg-blue-50 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Submit"}
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
              title="Back to filters"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h2 className="text-sm font-semibold tracking-wide">View Print Credit Note</h2>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColumnsMenu((v) => !v)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50 inline-flex items-center gap-1.5"
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
                onClick={copyTable}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50 inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50 inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={exportExcel}
                className="px-3 py-1.5 text-xs font-semibold border border-emerald-200 text-emerald-800 rounded-lg bg-emerald-50 hover:bg-emerald-100 inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                type="button"
                onClick={() => printScoped()}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50 inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="text-slate-600">
                Show{" "}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="mx-1 h-8 px-2 border border-slate-200 rounded-md"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>{" "}
                entries
              </label>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search:"
                  className="w-full h-8 pl-8 pr-3 border border-slate-200 rounded-md text-xs"
                />
              </div>
              <Link
                href="/dashboard/finance/mr-entry"
                className="text-blue-600 hover:underline font-semibold"
              >
                MR Entry
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1000px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  {COLS.map(
                    (c) =>
                      col(c.key) && (
                        <th key={c.key} className="py-2 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className="inline-flex items-center gap-1"
                          >
                            {c.label}
                            {c.key !== "view" && (
                              <span className="text-[9px] text-slate-400 leading-none">▲▼</span>
                            )}
                          </button>
                        </th>
                      )
                  )}
                </tr>
                <tr className="bg-white font-normal">
                  {col("srNo") && (
                    <th className="px-2 pb-2">
                      <input
                        value={colFilters.srNo}
                        onChange={(e) => setFilter("srNo", e.target.value)}
                        placeholder="Search Sr No"
                        className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                      />
                    </th>
                  )}
                  {col("creditNoteNo") && (
                    <th className="px-2 pb-2">
                      <input
                        value={colFilters.creditNoteNo}
                        onChange={(e) => setFilter("creditNoteNo", e.target.value)}
                        placeholder="Search Credit Note No."
                        className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                      />
                    </th>
                  )}
                  {col("creditNoteDate") && (
                    <th className="px-2 pb-2">
                      <input
                        value={colFilters.creditNoteDate}
                        onChange={(e) => setFilter("creditNoteDate", e.target.value)}
                        placeholder="Search Credit Note Date"
                        className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                      />
                    </th>
                  )}
                  {col("creditNoteLocation") && (
                    <th className="px-2 pb-2">
                      <input
                        value={colFilters.creditNoteLocation}
                        onChange={(e) => setFilter("creditNoteLocation", e.target.value)}
                        placeholder="Search Credit Note Location"
                        className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                      />
                    </th>
                  )}
                  {col("mrNo") && (
                    <th className="px-2 pb-2">
                      <input
                        value={colFilters.mrNo}
                        onChange={(e) => setFilter("mrNo", e.target.value)}
                        placeholder="Search MR No"
                        className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                      />
                    </th>
                  )}
                  {col("billNo") && (
                    <th className="px-2 pb-2">
                      <input
                        value={colFilters.billNo}
                        onChange={(e) => setFilter("billNo", e.target.value)}
                        placeholder="Search Bill No"
                        className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                      />
                    </th>
                  )}
                  {col("amount") && (
                    <th className="px-2 pb-2">
                      <input
                        value={colFilters.amount}
                        onChange={(e) => setFilter("amount", e.target.value)}
                        placeholder="Search Amount"
                        className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                      />
                    </th>
                  )}
                  {col("view") && (
                    <th className="px-2 pb-2">
                      <input
                        value={colFilters.view}
                        onChange={(e) => setFilter("view", e.target.value)}
                        placeholder="Search View"
                        className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                      />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.creditNoteNo} className="hover:bg-slate-50/80">
                      {col("srNo") && (
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                      )}
                      {col("creditNoteNo") && (
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {r.creditNoteNo}
                        </td>
                      )}
                      {col("creditNoteDate") && (
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {r.creditNoteDate}
                        </td>
                      )}
                      {col("creditNoteLocation") && (
                        <td className="py-2.5 px-3 text-slate-800">{r.creditNoteLocation}</td>
                      )}
                      {col("mrNo") && (
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">{r.mrNo}</td>
                      )}
                      {col("billNo") && (
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">{r.billNo}</td>
                      )}
                      {col("amount") && (
                        <td className="py-2.5 px-3 font-mono text-right">{fmtAmt(r.amount)}</td>
                      )}
                      {col("view") && (
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => printRow(r)}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Print
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Showing {fromEntry} to {toEntry} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50"
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
