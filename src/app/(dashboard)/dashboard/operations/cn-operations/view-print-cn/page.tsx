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
  Printer
} from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type Row = {
  id: string;
  cnNo: string;
  origin: string;
  destination: string;
  totalPackages: number;
  mfNo: string;
  pdcNo: string;
};

const COLS = [
  { key: "srNo", label: "Sr.No", search: "Search Sr.No" },
  { key: "cnNo", label: "CN Number", search: "Search CN Number" },
  { key: "origin", label: "Origin", search: "Search Origin" },
  { key: "destination", label: "Destination", search: "Search Destination" },
  { key: "totalPackages", label: "Total Packages", search: "Search Total Packages" },
  { key: "mfNo", label: "MF No", search: "Search MF No" },
  { key: "pdcNo", label: "PDC No", search: "Search PDC No" },
  { key: "viewCn", label: "View CN", search: "Search View CN" }
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

function cellText(r: Row, key: ColKey, srNo: number) {
  switch (key) {
    case "srNo":
      return String(srNo);
    case "cnNo":
      return r.cnNo;
    case "origin":
      return r.origin;
    case "destination":
      return r.destination;
    case "totalPackages":
      return String(r.totalPackages);
    case "mfNo":
      return r.mfNo;
    case "pdcNo":
      return r.pdcNo;
    case "viewCn":
      return "View";
    default:
      return "";
  }
}

export default function ViewPrintCnPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [fromDate, setFromDate] = useState(toInputDate(new Date()));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [cnNo, setCnNo] = useState("");
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
  const [sortKey, setSortKey] = useState<ColKey>("cnNo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        cnNo: cnNo.trim()
      });
      const res = await fetch(`/api/operations/view-print-cn?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load CNs");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setStep("report");
    } catch {
      toast.error("Failed to load CNs");
    } finally {
      setLoading(false);
    }
  };

  const indexed = useMemo(
    () => rows.map((r, i) => ({ row: r, srNo: i + 1 })),
    [rows]
  );

  const filtered = useMemo(() => {
    const global = tableSearch.trim().toLowerCase();
    let list = indexed.filter(({ row, srNo }) => {
      if (global) {
        const blob = COLS.map((c) => cellText(row, c.key, srNo)).join(" ").toLowerCase();
        if (!blob.includes(global)) return false;
      }
      for (const c of COLS) {
        const q = (colFilters[c.key] || "").trim().toLowerCase();
        if (!q) continue;
        if (!cellText(row, c.key, srNo).toLowerCase().includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      const av = cellText(a.row, sortKey, a.srNo);
      const bv = cellText(b.row, sortKey, b.srNo);
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [indexed, tableSearch, colFilters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const fromEntry = filtered.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1;
  const toEntry = Math.min(pageSafe * pageSize, filtered.length);
  const visibleColList = COLS.filter((c) => visibleCols[c.key]);

  const toggleSort = (key: ColKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const copyTable = async () => {
    const headers = visibleColList.map((c) => c.label).join("\t");
    const lines = filtered.map(({ row, srNo }) =>
      visibleColList.map((c) => cellText(row, c.key, srNo)).join("\t")
    );
    try {
      await navigator.clipboard.writeText([headers, ...lines].join("\n"));
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const exportCsv = (name: string) => {
    const headers = visibleColList.map((c) => c.label).join(",");
    const lines = filtered.map(({ row, srNo }) =>
      visibleColList.map((c) => `"${cellText(row, c.key, srNo).replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[headers, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printTable = () => {
    printScoped();
  };

  const btn =
    "px-3 py-1.5 text-xs font-semibold border border-[#7eb6e8] text-[#0171d3] rounded-lg inline-flex items-center gap-1.5 hover:bg-[#e8f1fb]";

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden max-w-xl mx-auto">
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Docket Date</label>
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
              value={cnNo}
              onChange={(e) => setCnNo(e.target.value.toUpperCase())}
              placeholder="Enter CN No."
              className="w-full h-11 px-4 border border-[#7eb6e8] rounded-md text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
            />

            <div className="flex justify-center pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadReport()}
                className="h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
              >
                {loading ? "Loading..." : "Show CNs"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div data-print-root className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            <div className="relative">
              <button type="button" onClick={() => setShowColumnsMenu((v) => !v)} className={btn}>
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

            <button type="button" onClick={() => void copyTable()} className={btn}>
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button
              type="button"
              onClick={() => {
                exportCsv(`view-print-cn-${fromDate}-to-${toDate}.csv`);
                toast.success("CSV download started");
              }}
              className={btn}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              type="button"
              onClick={() => {
                exportCsv(`view-print-cn-${fromDate}-to-${toDate}.xls`);
                toast.success("Excel download started (demo)");
              }}
              className={btn}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button type="button" onClick={printTable} className={btn}>
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
            <table className="w-full border-collapse text-[11px] min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  {visibleColList.map((c) => (
                    <th
                      key={c.key}
                      className="border border-slate-200 px-2 py-1.5 font-semibold whitespace-nowrap text-left align-top"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="mb-1 inline-flex items-center gap-1 hover:text-[#0171d3]"
                      >
                        {c.label}
                        <span className="text-[9px] text-slate-400">
                          {sortKey === c.key ? (sortDir === "asc" ? "▲" : "▼") : "▲▼"}
                        </span>
                      </button>
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
                {pageRows.map(({ row, srNo }) => (
                  <tr key={row.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-[#eef5fc]">
                    {visibleColList.map((c) => (
                      <td key={c.key} className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {c.key === "viewCn" ? (
                          <Link
                            href={
                              row.id.startsWith("vpc-")
                                ? `/dashboard/operations/dockets?docket=${encodeURIComponent(row.cnNo)}&action=print`
                                : `/dashboard/operations/dockets/${encodeURIComponent(row.id)}/print`
                            }
                            className="text-[#0171d3] font-semibold hover:underline"
                          >
                            View
                          </Link>
                        ) : c.key === "cnNo" ? (
                          <Link
                            href={`/dashboard/operations/dockets?docket=${encodeURIComponent(row.cnNo)}`}
                            className="text-[#0171d3] font-semibold hover:underline"
                          >
                            {row.cnNo}
                          </Link>
                        ) : (
                          cellText(row, c.key, srNo)
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
