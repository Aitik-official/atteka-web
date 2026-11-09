"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Download, Filter, MapPin, RefreshCw, FileBarChart2 } from "lucide-react";
import { toast } from "@/lib/toastBus";

type TrackRow = {
  docketNo: string;
  bookingDate?: string | Date;
  ewayBillNo?: string;
  ewayBillExpiry?: string | Date | null;
  fromLocation?: string;
  toLocation?: string;
  vehicleNo?: string;
  vehicleType?: string;
  status?: string;
  statusLabel?: string;
  billingParty?: string;
  consignorName?: string;
  consigneeName?: string;
  thcPdcNo?: string;
  billNo?: string;
  billAmount?: number;
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

function formatShort(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatSlash(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB");
}

export default function NewCnTrackingPage() {
  const [docType, setDocType] = useState("CN");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(6)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [docketNo, setDocketNo] = useState("");
  const [step, setStep] = useState<"filter" | "results">("filter");
  const [rows, setRows] = useState<TrackRow[]>([]);
  const [summary, setSummary] = useState({ total: 0, booked: 0, inTransit: 0, delivered: 0 });
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [tableSearch, setTableSearch] = useState("");

  const dateLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const filtered = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.docketNo,
        r.ewayBillNo,
        r.fromLocation,
        r.toLocation,
        r.vehicleNo,
        r.vehicleType,
        r.statusLabel,
        r.billingParty,
        r.consignorName,
        r.consigneeName,
        r.thcPdcNo,
        r.billNo
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, tableSearch]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const runTracking = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("docType", docType);
      params.set("from", fromDate);
      params.set("to", toDate);
      if (docketNo.trim()) params.set("docketNo", docketNo.trim());
      const res = await fetch(`/api/tracking/cn?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Tracking failed");
        return;
      }
      setRows(data.data || []);
      setSummary(data.summary || { total: 0, booked: 0, inTransit: 0, delivered: 0 });
      setPage(1);
      setStep("results");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
    } catch {
      toast.error("Failed to load tracking results");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error("No rows to export");
      return;
    }
    const headers = [
      "Docket No",
      "Docket Date",
      "EwayBill No",
      "EwayBill Date",
      "Movement",
      "Vehicle No",
      "Veh. Type",
      "Status",
      "Billing Party",
      "Consignor",
      "Consignee",
      "THC/PDC No",
      "Bill No",
      "Bill Amount"
    ];
    const lines = filtered.map((r) =>
      [
        r.docketNo,
        formatShort(r.bookingDate),
        r.ewayBillNo || "-",
        formatShort(r.ewayBillExpiry),
        `${r.fromLocation || ""} ${r.toLocation || ""}`.trim(),
        r.vehicleNo,
        r.vehicleType,
        r.statusLabel || r.status,
        r.billingParty,
        r.consignorName,
        r.consigneeName,
        r.thcPdcNo,
        r.billNo,
        r.billAmount
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `New_CN_Tracking_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {step === "filter" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-w-4xl mx-auto">
          <div className="bg-[#0171d3] text-white px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-white/80 inline-flex items-center justify-center text-[9px]">
              ●
            </span>
            View &amp; Track
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="h-10 px-3 border border-slate-300 rounded-md text-sm bg-white text-slate-700"
              >
                <option value="CN">Document Type — CN</option>
                <option value="THC">Document Type — THC</option>
                <option value="PDC">Document Type — PDC</option>
                <option value="TC">Document Type — TC</option>
                <option value="ALL">Document Type — All</option>
              </select>

              <div className="relative">
                <div className="h-10 px-3 border border-slate-300 rounded-md text-sm flex items-center gap-2 text-slate-700 bg-white">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{dateLabel}</span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-8 px-2 border border-slate-200 rounded text-[11px]"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-8 px-2 border border-slate-200 rounded text-[11px]"
                  />
                </div>
              </div>

              <input
                value={docketNo}
                onChange={(e) => setDocketNo(e.target.value.toUpperCase())}
                placeholder="Docket No"
                className="h-10 px-3 border border-slate-300 rounded-md text-sm uppercase font-mono"
              />
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={runTracking}
                className="min-w-[140px] h-9 px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] font-semibold text-sm hover:bg-[#e8f1fb] shadow-sm disabled:opacity-60"
              >
                {loading ? "Loading..." : "New Tracking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-9 px-3 rounded-md bg-[#0171d3] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              Date Range : {formatSlash(fromDate)} To {formatSlash(toDate)}
            </button>
            <button
              type="button"
              onClick={runTracking}
              className="h-9 w-9 rounded-md bg-[#0171d3] text-white inline-flex items-center justify-center shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="h-9 w-9 rounded-md bg-[#0171d3] text-white inline-flex items-center justify-center shadow-sm"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 text-white shadow-sm bg-gradient-to-br from-sky-500 to-blue-700">
              <div className="text-xs font-medium opacity-90">Total Results</div>
              <div className="text-3xl font-bold mt-1">{summary.total}</div>
            </div>
            <div className="rounded-xl p-4 text-white shadow-sm bg-gradient-to-br from-cyan-400 to-emerald-500">
              <div className="text-xs font-medium opacity-90">Booked</div>
              <div className="text-3xl font-bold mt-1">{summary.booked}</div>
            </div>
            <div className="rounded-xl p-4 text-white shadow-sm bg-gradient-to-br from-orange-400 to-rose-500">
              <div className="text-xs font-medium opacity-90">In Transit</div>
              <div className="text-3xl font-bold mt-1">{summary.inTransit}</div>
            </div>
            <div className="rounded-xl p-4 text-white shadow-sm bg-gradient-to-br from-violet-500 to-purple-700">
              <div className="text-xs font-medium opacity-90">Delivered</div>
              <div className="text-3xl font-bold mt-1">{summary.delivered}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 text-xs">
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
                  className="h-8 px-2 border border-slate-300 rounded w-48"
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700">
                    {[
                      "Docket No & Dt.",
                      "EwayBill No & Dt.",
                      "Movement",
                      "Vehicle No",
                      "Veh. Type",
                      "Status",
                      "Billing Party",
                      "Consignor",
                      "Consignee",
                      "THC NO / PDC NO",
                      "Bill No",
                      "Bill Amount"
                    ].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold border-b border-slate-200 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr key={r.docketNo} className="border-b border-slate-100 hover:bg-slate-50/80 align-top">
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/dashboard/operations/dockets?search=${encodeURIComponent(r.docketNo)}`}
                          className="font-mono font-bold text-[#0171d3] hover:underline"
                        >
                          {r.docketNo}
                        </Link>
                        <div className="text-slate-500 mt-0.5">{formatShort(r.bookingDate)}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-mono">{r.ewayBillNo || "-"}</div>
                        <div className="text-slate-500 mt-0.5">{formatShort(r.ewayBillExpiry)}</div>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">
                        {r.fromLocation || "-"} {r.toLocation || ""}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-mono font-bold">{r.vehicleNo || "-"}</div>
                        {r.vehicleNo ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.vehicleNo)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex mt-1 h-6 w-6 items-center justify-center rounded bg-[#0171d3] text-white"
                            title="Map"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </a>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5">{r.vehicleType || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-700 max-w-[180px]">{r.statusLabel || r.status}</td>
                      <td className="px-3 py-2.5 max-w-[180px]">{r.billingParty || "-"}</td>
                      <td className="px-3 py-2.5 max-w-[160px]">{r.consignorName || "-"}</td>
                      <td className="px-3 py-2.5 max-w-[160px]">{r.consigneeName || "-"}</td>
                      <td className="px-3 py-2.5">
                        {r.thcPdcNo ? (
                          <span className="inline-flex px-2 py-0.5 rounded bg-[#0171d3] text-white font-mono text-[10px]">
                            {r.thcPdcNo}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.billNo ? (
                          <Link
                            href="/dashboard/finance/customer-billing/view-print-bills"
                            className="inline-flex h-6 w-6 items-center justify-center rounded bg-sky-100 text-[#0171d3]"
                            title={r.billNo}
                          >
                            <FileBarChart2 className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-400">
                            <FileBarChart2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold">
                        {Number(r.billAmount || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-3 py-10 text-center text-slate-500">
                        No consignments found for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 text-xs text-slate-600">
              <div>
                Showing {(page - 1) * pageSize + (filtered.length ? 1 : 0)} to{" "}
                {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 border border-slate-300 rounded disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-2">
                  {page} / {totalPages}
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
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="text-xs text-[#0171d3] font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <Filter className="w-3.5 h-3.5" /> Change filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
