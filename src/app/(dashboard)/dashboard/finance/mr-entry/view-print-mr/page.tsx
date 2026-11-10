"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Columns3,
  Copy,
  Eye,
  FileSpreadsheet,
  LayoutGrid,
  Printer,
  Search,
  Table2
} from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type MrRow = {
  srNo: number;
  mrNo: string;
  mrDate: string;
  mrDateIso: string;
  customerName: string;
  mrLocation: string;
  mrAmount: number;
  deduction: number;
  netAmount: number;
  billNumber: string;
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
  return Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const COLS = [
  { key: "srNo", label: "Sr No" },
  { key: "mrNo", label: "MR No." },
  { key: "mrDate", label: "MR Date" },
  { key: "customerName", label: "Customer Name" },
  { key: "mrLocation", label: "MR Location" },
  { key: "mrAmount", label: "MR Amount" },
  { key: "deduction", label: "Deduction" },
  { key: "netAmount", label: "Net Amount" },
  { key: "view", label: "View" }
] as const;

type ColKey = (typeof COLS)[number]["key"];

export default function ViewPrintMrPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(6)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [mrNumber, setMrNumber] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [rows, setRows] = useState<MrRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState("");
  const [cardView, setCardView] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>({
    srNo: true,
    mrNo: true,
    mrDate: true,
    customerName: true,
    mrLocation: true,
    mrAmount: true,
    deduction: true,
    netAmount: true,
    view: true
  });
  const [colFilters, setColFilters] = useState<Record<string, string>>({
    srNo: "",
    mrNo: "",
    mrDate: "",
    customerName: "",
    mrLocation: "",
    mrAmount: "0",
    deduction: "0",
    netAmount: "0",
    view: ""
  });

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadMrs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        mrNumber: mrNumber.trim(),
        billNumber: billNumber.trim()
      });
      const res = await fetch(`/api/finance/view-print-mr?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load MRs");
        return;
      }
      const list: MrRow[] = data.data || [];
      setRows(list);
      setPage(1);
      setTableSearch("");
      setStep("report");
      if (!list.length) toast.warning("No data available in table");
    } catch {
      toast.error("Failed to load MRs");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = rows;
    const q = tableSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.mrNo.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.mrLocation.toLowerCase().includes(q) ||
          r.billNumber.toLowerCase().includes(q) ||
          r.mrDate.toLowerCase().includes(q)
      );
    }

    const f = colFilters;
    if (f.srNo.trim()) {
      list = list.filter((r) => String(r.srNo).includes(f.srNo.trim()));
    }
    if (f.mrNo.trim()) {
      list = list.filter((r) => r.mrNo.toLowerCase().includes(f.mrNo.trim().toLowerCase()));
    }
    if (f.mrDate.trim()) {
      list = list.filter((r) => r.mrDate.toLowerCase().includes(f.mrDate.trim().toLowerCase()));
    }
    if (f.customerName.trim()) {
      list = list.filter((r) =>
        r.customerName.toLowerCase().includes(f.customerName.trim().toLowerCase())
      );
    }
    if (f.mrLocation.trim()) {
      list = list.filter((r) =>
        r.mrLocation.toLowerCase().includes(f.mrLocation.trim().toLowerCase())
      );
    }
    if (f.mrAmount.trim() && f.mrAmount.trim() !== "0") {
      list = list.filter((r) => String(r.mrAmount).includes(f.mrAmount.trim()));
    }
    if (f.deduction.trim() && f.deduction.trim() !== "0") {
      list = list.filter((r) => String(r.deduction).includes(f.deduction.trim()));
    }
    if (f.netAmount.trim() && f.netAmount.trim() !== "0") {
      list = list.filter((r) => String(r.netAmount).includes(f.netAmount.trim()));
    }
    return list;
  }, [rows, tableSearch, colFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const fromEntry = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toEntry = Math.min(page * pageSize, filtered.length);

  const col = (key: ColKey) => visibleCols[key] !== false;

  const setFilter = (key: string, value: string) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const exportExcel = () => {
    const headers = [
      "Sr No",
      "MR No.",
      "MR Date",
      "Customer Name",
      "MR Location",
      "MR Amount",
      "Deduction",
      "Net Amount",
      "Bill Number"
    ];
    const body = filtered.map((r, idx) => [
      idx + 1,
      r.mrNo,
      r.mrDate,
      r.customerName,
      r.mrLocation,
      r.mrAmount.toFixed(2),
      r.deduction.toFixed(2),
      r.netAmount.toFixed(2),
      r.billNumber
    ]);
    const csv = [headers, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ViewPrintMR_${toInputDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel export downloaded");
  };

  const copyTable = async () => {
    const text = filtered
      .map(
        (r, idx) =>
          `${idx + 1}\t${r.mrNo}\t${r.mrDate}\t${r.customerName}\t${r.mrLocation}\t${r.mrAmount}\t${r.deduction}\t${r.netAmount}`
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied MR rows to clipboard");
    } catch {
      toast.error("Unable to copy to clipboard");
    }
  };

  const viewMr = (r: MrRow) => {
    toast.success(`View / Print ${r.mrNo} (demo)`);
  };

  return (
    <div className="space-y-4 pb-16 max-w-7xl mx-auto">
      {step === "filter" && (
        <div className="min-h-[55vh] flex items-start justify-center pt-10 px-4">
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">MR Date</label>
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
              <span className="pt-8 text-xs font-bold text-slate-800 shrink-0">OR</span>
            </div>

            <input
              value={mrNumber}
              onChange={(e) => setMrNumber(e.target.value.toUpperCase())}
              placeholder="MR Number"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400 bg-white"
            />

            <input
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value.toUpperCase())}
              placeholder="Bill Number"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400 bg-white"
            />

            <div className="pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={loadMrs}
                title="Show table"
                className="w-11 h-11 rounded-md bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center shadow-sm disabled:opacity-50"
              >
                <Table2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div data-print-root className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#1e88e5] text-white px-4 py-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide">View / Print MR</h2>
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 inline-flex items-center justify-center"
              title="Back to filters"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
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
                  <div className="absolute z-20 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-xs max-h-64 overflow-y-auto">
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
              <button
                type="button"
                onClick={() => setCardView((v) => !v)}
                className={`px-3 py-1.5 text-xs font-semibold border rounded-lg inline-flex items-center gap-1.5 ${
                  cardView
                    ? "border-blue-300 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> CARD VIEW
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

          {!cardView ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1100px]">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {COLS.map(
                      (c) =>
                        col(c.key) && (
                          <th key={c.key} className="py-2 px-3 whitespace-nowrap">
                            {c.label}
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
                    {col("mrNo") && (
                      <th className="px-2 pb-2">
                        <input
                          value={colFilters.mrNo}
                          onChange={(e) => setFilter("mrNo", e.target.value)}
                          placeholder="Search MR No."
                          className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                        />
                      </th>
                    )}
                    {col("mrDate") && (
                      <th className="px-2 pb-2">
                        <input
                          value={colFilters.mrDate}
                          onChange={(e) => setFilter("mrDate", e.target.value)}
                          placeholder="Search MR Date"
                          className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                        />
                      </th>
                    )}
                    {col("customerName") && (
                      <th className="px-2 pb-2">
                        <input
                          value={colFilters.customerName}
                          onChange={(e) => setFilter("customerName", e.target.value)}
                          placeholder="Search Customer Name"
                          className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                        />
                      </th>
                    )}
                    {col("mrLocation") && (
                      <th className="px-2 pb-2">
                        <input
                          value={colFilters.mrLocation}
                          onChange={(e) => setFilter("mrLocation", e.target.value)}
                          placeholder="Search MR Location"
                          className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                        />
                      </th>
                    )}
                    {col("mrAmount") && (
                      <th className="px-2 pb-2">
                        <input
                          value={colFilters.mrAmount}
                          onChange={(e) => setFilter("mrAmount", e.target.value)}
                          className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                        />
                      </th>
                    )}
                    {col("deduction") && (
                      <th className="px-2 pb-2">
                        <input
                          value={colFilters.deduction}
                          onChange={(e) => setFilter("deduction", e.target.value)}
                          className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                        />
                      </th>
                    )}
                    {col("netAmount") && (
                      <th className="px-2 pb-2">
                        <input
                          value={colFilters.netAmount}
                          onChange={(e) => setFilter("netAmount", e.target.value)}
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
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    paged.map((r, idx) => (
                      <tr key={r.mrNo} className="hover:bg-slate-50/80">
                        {col("srNo") && (
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                        )}
                        {col("mrNo") && (
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {r.mrNo}
                          </td>
                        )}
                        {col("mrDate") && (
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{r.mrDate}</td>
                        )}
                        {col("customerName") && (
                          <td
                            className="py-2.5 px-3 text-slate-800 max-w-[220px] truncate"
                            title={r.customerName}
                          >
                            {r.customerName}
                          </td>
                        )}
                        {col("mrLocation") && (
                          <td className="py-2.5 px-3 font-mono">{r.mrLocation}</td>
                        )}
                        {col("mrAmount") && (
                          <td className="py-2.5 px-3 font-mono text-right">{fmtAmt(r.mrAmount)}</td>
                        )}
                        {col("deduction") && (
                          <td className="py-2.5 px-3 font-mono text-right">{fmtAmt(r.deduction)}</td>
                        )}
                        {col("netAmount") && (
                          <td className="py-2.5 px-3 font-mono font-semibold text-right text-emerald-700">
                            {fmtAmt(r.netAmount)}
                          </td>
                        )}
                        {col("view") && (
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => viewMr(r)}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paged.length === 0 ? (
                <p className="col-span-full text-center text-slate-400 text-xs py-8">
                  No data available in table
                </p>
              ) : (
                paged.map((r) => (
                  <div
                    key={r.mrNo}
                    className="border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 bg-slate-50/50"
                  >
                    <div className="font-mono font-bold text-blue-700">{r.mrNo}</div>
                    <div className="text-slate-700 font-medium">{r.customerName}</div>
                    <div className="text-slate-500">
                      {r.mrDate} · {r.mrLocation}
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Net</span>
                      <span className="font-mono font-bold text-emerald-700">{fmtAmt(r.netAmount)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => viewMr(r)}
                      className="mt-1 text-blue-600 font-semibold inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

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
