"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Copy, FileSpreadsheet, Filter, Search, X } from "lucide-react";
import { toast } from "@/lib/toastBus";

type Row = {
  docketNo: string;
  docketDateLabel: string;
  customerName: string;
  bkgBranch: string;
  add: string;
  dlyDate: string;
  podLoad: string;
  podUrl?: string;
};

const POD_STATUS_OPTIONS = [
  "---Select---",
  "Show All",
  "POD Not Uploaded",
  "POD Uploaded",
  "POD Loaded But ADD Blank"
];

const COLUMNS: { key: keyof Row; label: string }[] = [
  { key: "docketNo", label: "DOCKET NO" },
  { key: "docketDateLabel", label: "DOCKET DATE" },
  { key: "customerName", label: "CUSTOMER NAME" },
  { key: "bkgBranch", label: "BKG BRANCH" },
  { key: "add", label: "ADD" },
  { key: "dlyDate", label: "DLY DATE" },
  { key: "podLoad", label: "POD LOAD" }
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatRangeLabel(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return `${from} - ${to}`;
  return `${fmt(a)} - ${fmt(b)}`;
}

export default function ScanPodReportPage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(5)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [branch, setBranch] = useState("Show All");
  const [party, setParty] = useState("Show All Active Customer");
  const [podStatus, setPodStatus] = useState("---Select---");
  const [branches, setBranches] = useState<string[]>([]);
  const [parties, setParties] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof Row>("docketNo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    Promise.all([fetch("/api/branches"), fetch("/api/customers")])
      .then(async ([bRes, cRes]) => {
        const b = await bRes.json();
        const c = await cRes.json();
        if (b.success) {
          setBranches(
            (b.data || [])
              .map((x: any) => String(x.branchCode || x.code || "").trim().toUpperCase())
              .filter(Boolean)
          );
        }
        if (c.success) {
          setParties(
            (c.data || [])
              .map((x: any) => String(x.customerName || x.name || "").trim())
              .filter(Boolean)
          );
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter((r) =>
        COLUMNS.map((c) => String(r[c.key] || "")).join(" ").toLowerCase().includes(q)
      );
    }
    const sorted = [...list].sort((a, b) => {
      const av = String(a[sortKey] || "");
      const bv = String(b[sortKey] || "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const loadReport = async () => {
    if (podStatus === "---Select---") {
      toast.error("Select POD Status");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        branch,
        party,
        podStatus
      });
      const res = await fetch(`/api/reports/scan-pod?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Scan Pod Report");
        return;
      }
      setRows(
        (data.data || []).map((r: any) => ({
          docketNo: r.docketNo || "",
          docketDateLabel: r.docketDateLabel || "",
          customerName: r.customerName || "",
          bkgBranch: r.bkgBranch || "",
          add: r.add || "N",
          dlyDate: r.dlyDate || "N-A",
          podLoad: r.podLoad || "N",
          podUrl: r.podUrl || ""
        }))
      );
      setPage(1);
      setSearch("");
      setHasGenerated(true);
      setFilterOpen(false);
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
    } catch {
      toast.error("Failed to load Scan Pod Report");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error("No data to export");
      return;
    }
    const headers = COLUMNS.map((c) => c.label);
    const lines = filtered.map((r) =>
      COLUMNS.map((c) => `"${String(r[c.key] || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Scan_Pod_Report_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  const copyTable = async () => {
    if (!filtered.length) {
      toast.error("No data to copy");
      return;
    }
    const headers = COLUMNS.map((c) => c.label).join("\t");
    const lines = filtered.map((r) => COLUMNS.map((c) => String(r[c.key] || "")).join("\t"));
    const text = [headers, ...lines].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const toggleSort = (key: keyof Row) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 relative">

      {!hasGenerated && !filterOpen && (
        <div className="text-center py-16 text-slate-500 text-sm">
          Open filters to generate the Scan Pod Report.
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-[#5b2d8e] text-white text-sm"
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>
      )}

      {hasGenerated && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="Back to filters"
                onClick={() => setFilterOpen(true)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-base font-semibold text-slate-800">Scan Pod Report</h1>
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#5b2d8e] text-white text-sm hover:bg-[#4a2474]"
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100 text-sm">
            <label className="inline-flex items-center gap-2 text-slate-600">
              Show
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 border border-slate-300 rounded bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
            <button
              type="button"
              onClick={copyTable}
              className="h-8 px-3 border border-slate-300 rounded bg-white hover:bg-slate-50 inline-flex items-center gap-1.5 text-slate-700"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="h-8 px-3 border border-slate-300 rounded bg-white hover:bg-slate-50 inline-flex items-center gap-1.5 text-slate-700"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <div className="ml-auto relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search records..."
                className="h-8 w-56 pl-8 pr-3 border border-slate-300 rounded text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      className="border-b border-slate-200 px-3 py-2.5 text-left font-semibold whitespace-nowrap cursor-pointer select-none"
                      onClick={() => toggleSort(c.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        <span className="text-[10px] text-slate-400">
                          {sortKey === c.key ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((r, idx) => (
                  <tr key={`${r.docketNo}-${idx}`} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/40">
                    <td className="border-b border-slate-100 px-3 py-2 whitespace-nowrap">
                      <Link
                        href={`/dashboard/operations/dockets?search=${encodeURIComponent(r.docketNo)}`}
                        className="font-mono font-semibold text-[#0171d3] hover:underline"
                      >
                        {r.docketNo}
                      </Link>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 whitespace-nowrap">{r.docketDateLabel}</td>
                    <td className="border-b border-slate-100 px-3 py-2">{r.customerName}</td>
                    <td className="border-b border-slate-100 px-3 py-2 whitespace-nowrap">{r.bkgBranch}</td>
                    <td className="border-b border-slate-100 px-3 py-2">{r.add}</td>
                    <td className="border-b border-slate-100 px-3 py-2 whitespace-nowrap">{r.dlyDate}</td>
                    <td className="border-b border-slate-100 px-3 py-2">
                      {r.podUrl ? (
                        <a
                          href={r.podUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-emerald-700 hover:underline"
                        >
                          {r.podLoad}
                        </a>
                      ) : (
                        r.podLoad
                      )}
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-slate-500">
                      No records found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200 text-xs text-slate-600">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 border border-slate-300 rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {page} / {totalPages} · {filtered.length} records
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 border border-slate-300 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {filterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#0171d3]" />
                <h2 className="text-sm font-semibold text-slate-800">Scan Pod Report</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (hasGenerated) setFilterOpen(false);
                  else window.history.back();
                }}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-1.5">
                  POD DATE
                </label>
                <div className="h-11 px-3 border border-slate-300 rounded-lg text-sm flex items-center gap-2 text-slate-700 bg-white">
                  <span className="truncate flex-1">{formatRangeLabel(fromDate, toDate)}</span>
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 px-2 border border-slate-300 rounded-md text-xs"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 px-2 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-1.5">
                  BRANCH
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option>Show All</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="ALC1">ALC1</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-1.5">
                  PARTY
                </label>
                <select
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option>Show All Active Customer</option>
                  <option>Show All</option>
                  {parties.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-1.5">
                  POD STATUS
                </label>
                <select
                  value={podStatus}
                  onChange={(e) => setPodStatus(e.target.value)}
                  className={`w-full h-11 px-3 border border-slate-300 rounded-lg text-sm bg-white ${
                    podStatus === "---Select---" ? "text-slate-400" : "text-slate-800"
                  }`}
                >
                  {POD_STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o} className="text-slate-800">
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-200">
              <button
                type="button"
                disabled={loading}
                onClick={loadReport}
                className="w-full h-12 rounded-lg bg-[#1e3a5f] hover:bg-[#162c48] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? "Generating..." : "Generate Report"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
