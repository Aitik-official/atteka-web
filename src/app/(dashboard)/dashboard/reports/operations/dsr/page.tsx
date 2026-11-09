"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, FileSpreadsheet, Printer, RefreshCw, Search, Table2 } from "lucide-react";
import { toast } from "@/lib/toastBus";

type Row = {
  cnNumber: string;
  cnDateLabel: string;
  bookingBranch: string;
  billingParty: string;
  consignor: string;
  consignee: string;
  from: string;
  to: string;
  pkgs: number;
  actWt: number;
  chrgWt: number;
  status: string;
  statusBucket: string;
  eddLabel: string;
  dlyDateLabel: string;
  thcPdcNo: string;
  vehicleNo: string;
  vendorName: string;
  freight: number;
  podLoad: string;
  billNo: string;
  mode: string;
};

type Summary = {
  totalCns: number;
  booked: number;
  inTransit: number;
  delivered: number;
  billed: number;
  cancelled: number;
  podPending: number;
  podUploaded: number;
  totalPkgs: number;
  totalFreight: number;
};

const EMPTY_SUMMARY: Summary = {
  totalCns: 0,
  booked: 0,
  inTransit: 0,
  delivered: 0,
  billed: 0,
  cancelled: 0,
  podPending: 0,
  podUploaded: 0,
  totalPkgs: 0,
  totalFreight: 0
};

const COLUMNS: { key: keyof Row; label: string; align?: "right" }[] = [
  { key: "cnNumber", label: "CN Number" },
  { key: "cnDateLabel", label: "CN Date" },
  { key: "bookingBranch", label: "Bkg Branch" },
  { key: "billingParty", label: "Billing Party" },
  { key: "consignor", label: "Consignor" },
  { key: "consignee", label: "Consignee" },
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "pkgs", label: "Pkgs", align: "right" },
  { key: "actWt", label: "Act. Wt.", align: "right" },
  { key: "chrgWt", label: "Chrg. Wt.", align: "right" },
  { key: "status", label: "Status" },
  { key: "eddLabel", label: "EDD" },
  { key: "dlyDateLabel", label: "Dely. Date" },
  { key: "thcPdcNo", label: "THC/PDC No" },
  { key: "vehicleNo", label: "Vehicle No" },
  { key: "vendorName", label: "Vendor" },
  { key: "freight", label: "Freight", align: "right" },
  { key: "podLoad", label: "POD" },
  { key: "billNo", label: "Bill No" },
  { key: "mode", label: "Mode" }
];

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

function cellValue(row: Row, key: keyof Row) {
  const v = row[key];
  if (v == null || v === "") return "";
  return String(v);
}

function statusTone(bucket: string) {
  switch (bucket) {
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700";
    case "BILLED":
      return "bg-blue-50 text-blue-700";
    case "IN_TRANSIT":
      return "bg-amber-50 text-amber-700";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ProposedDsrReportPage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(6)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [bookingBranch, setBookingBranch] = useState("--Show All--");
  const [billingParty, setBillingParty] = useState("--Show All--");
  const [statusFilter, setStatusFilter] = useState("Show All");
  const [branches, setBranches] = useState<string[]>([]);
  const [parties, setParties] = useState<string[]>([]);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState("100%");
  const [findText, setFindText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

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

  const dateLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;
  const filtered = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => COLUMNS.map((c) => cellValue(r, c.key)).join(" ").toLowerCase().includes(q));
  }, [rows, findText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const zoomScale = Number(String(zoom).replace("%", "")) / 100 || 1;

  const loadReport = async (alsoExport = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        bookingBranch,
        billingParty,
        status: statusFilter
      });
      const res = await fetch(`/api/reports/dsr?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load DSR report");
        return;
      }
      const list: Row[] = (data.data || []).map((r: any) => ({
        cnNumber: r.cnNumber || "",
        cnDateLabel: r.cnDateLabel || "",
        bookingBranch: r.bookingBranch || "",
        billingParty: r.billingParty || "",
        consignor: r.consignor || "",
        consignee: r.consignee || "",
        from: r.from || "",
        to: r.to || "",
        pkgs: Number(r.pkgs || 0),
        actWt: Number(r.actWt || 0),
        chrgWt: Number(r.chrgWt || 0),
        status: r.status || "",
        statusBucket: r.statusBucket || "BOOKED",
        eddLabel: r.eddLabel || "",
        dlyDateLabel: r.dlyDateLabel || "",
        thcPdcNo: r.thcPdcNo || "",
        vehicleNo: r.vehicleNo || "",
        vendorName: r.vendorName || "",
        freight: Number(r.freight || 0),
        podLoad: r.podLoad || "N",
        billNo: r.billNo || "",
        mode: r.mode || ""
      }));
      setRows(list);
      setSummary(data.summary || EMPTY_SUMMARY);
      setPage(1);
      setFindText("");
      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (alsoExport) exportCsv(list);
    } catch {
      toast.error("Failed to load DSR report");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = (list: Row[] = filtered) => {
    if (!list.length) {
      toast.error("No data to export");
      return;
    }
    const headers = COLUMNS.map((c) => c.label);
    const lines = list.map((r) =>
      COLUMNS.map((c) => `"${cellValue(r, c.key).replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Proposed_DSR_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  const summaryCards = [
    { label: "Total CNs", value: summary.totalCns },
    { label: "Booked", value: summary.booked },
    { label: "In Transit", value: summary.inTransit },
    { label: "Delivered", value: summary.delivered },
    { label: "Billed", value: summary.billed },
    { label: "POD Pending", value: summary.podPending },
    { label: "Pkgs", value: summary.totalPkgs },
    { label: "Freight", value: Math.round(summary.totalFreight) }
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {step === "filter" && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              title="Excel"
              onClick={() => loadReport(true)}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Table"
              disabled={loading}
              onClick={() => loadReport(false)}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center disabled:opacity-60"
            >
              <Table2 className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="text-center text-sm font-semibold text-slate-700">Proposed DSR Report</div>
            <p className="text-[11px] text-center text-slate-500 -mt-2">
              Daily status rollup from CN, delivery, trip &amp; POD data
            </p>

            <div>
              <div className="h-11 px-3 border border-slate-300 rounded-md text-sm flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate flex-1">{dateLabel}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 px-2 border border-slate-300 rounded text-xs"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 px-2 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0171d3] mb-1">Booking Branch</label>
              <select
                value={bookingBranch}
                onChange={(e) => setBookingBranch(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option>--Show All--</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="ALC1">ALC1</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0171d3] mb-1">Billing Party</label>
              <select
                value={billingParty}
                onChange={(e) => setBillingParty(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option>--Show All--</option>
                {parties.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0171d3] mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option>Show All</option>
                <option>Booked</option>
                <option>In Transit</option>
                <option>Delivered</option>
                <option>Billed</option>
                <option>Undelivered</option>
                <option>POD Pending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-300 text-[11px] print:hidden">
            <span className="text-slate-600">
              {page} of {totalPages}
            </span>
            <button
              type="button"
              title="Refresh"
              onClick={() => loadReport(false)}
              className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Back"
              onClick={() => setStep("filter")}
              className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <select
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
              className="h-7 px-1 border border-slate-300 rounded bg-white"
            >
              <option>75%</option>
              <option>100%</option>
              <option>125%</option>
            </select>
            <button
              type="button"
              onClick={() => exportCsv()}
              className="h-7 px-2 border border-slate-300 rounded bg-white inline-flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-7 px-2 border border-slate-300 rounded bg-white inline-flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                value={findText}
                onChange={(e) => {
                  setFindText(e.target.value);
                  setPage(1);
                }}
                placeholder="Find"
                className="h-7 w-40 px-2 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div style={{ zoom: zoomScale }} className="p-4 overflow-x-auto">
            <div className="text-center mb-3">
              <div className="text-sm font-bold text-red-600">Proposed DSR Report</div>
              <div className="text-xs text-red-600 mt-0.5">
                Date From {formatLong(fromDate)} To {formatLong(toDate)}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4 print:hidden">
              {summaryCards.map((c) => (
                <div key={c.label} className="border border-slate-200 rounded-md px-2 py-2 text-center bg-slate-50">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{c.label}</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{c.value}</div>
                </div>
              ))}
            </div>

            <table className="w-full border-collapse text-[11px] min-w-[1800px]">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((r, idx) => (
                  <tr key={`${r.cnNumber}-${idx}`} className="odd:bg-white even:bg-slate-50">
                    {COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${
                          c.align === "right" ? "text-right" : ""
                        } ${c.key === "cnNumber" ? "font-mono font-semibold text-[#0171d3]" : ""}`}
                      >
                        {c.key === "status" ? (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusTone(r.statusBucket)}`}>
                            {r.status}
                          </span>
                        ) : c.key === "cnNumber" ? (
                          <Link
                            href={`/dashboard/operations/dockets?search=${encodeURIComponent(r.cnNumber)}`}
                            className="hover:underline"
                          >
                            {r.cnNumber}
                          </Link>
                        ) : (
                          cellValue(r, c.key)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No consignments found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center px-3 py-2 border-t border-slate-200 text-xs print:hidden">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 border border-slate-300 rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {page} / {totalPages} · {filtered.length} rows
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
    </div>
  );
}
