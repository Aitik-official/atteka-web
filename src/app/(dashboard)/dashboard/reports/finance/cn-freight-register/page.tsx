"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2, Calendar, FileSpreadsheet, Printer, RefreshCw, Search, Send, Table2 } from "lucide-react";
import { toast } from "@/lib/toastBus";

type Row = Record<string, string | number>;

const COLUMNS: { key: string; label: string; align?: "right" }[] = [
  { key: "docketNumber", label: "Docket Number" },
  { key: "docketDateLabel", label: "Docket Date" },
  { key: "eddLabel", label: "EDD" },
  { key: "ewayBill", label: "EWAYBILL" },
  { key: "ewayExpDtLabel", label: "eway exp Dt" },
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "actWt", label: "Act. Wt.", align: "right" },
  { key: "chrgWt", label: "Chrg. Wt.", align: "right" },
  { key: "invoiceNo", label: "Invoice No" },
  { key: "vehNumber", label: "Veh. Number" },
  { key: "vehType", label: "Veh. Type" },
  { key: "dlyDateLabel", label: "Dly. Date" },
  { key: "consignor", label: "Consignor" },
  { key: "consignee", label: "Consignee" },
  { key: "billingParty", label: "Billing Party" },
  { key: "billNumber", label: "Bill Number" },
  { key: "billSrno", label: "Bill Srno." },
  { key: "billDateLabel", label: "Bill Date" },
  { key: "rateType", label: "Rate Type" },
  { key: "customerFreightAmt", label: "Customer Freight Amt", align: "right" },
  { key: "statChrg", label: "Stat Chrg", align: "right" },
  { key: "detention", label: "Detention", align: "right" },
  { key: "collChrg", label: "Coll Chrg", align: "right" },
  { key: "otherChrg", label: "Other Chrg", align: "right" },
  { key: "loadChrg", label: "Load Chrg", align: "right" },
  { key: "unloadChrg", label: "UnLoad Chrg", align: "right" },
  { key: "escortChrg", label: "Escort Chrg", align: "right" },
  { key: "doorDelChrg", label: "Door del chrg", align: "right" },
  { key: "gstAmt", label: "GST Amt", align: "right" },
  { key: "odaChrg", label: "ODA Chrg", align: "right" },
  { key: "total", label: "Total", align: "right" },
  { key: "remark", label: "Remark" },
  { key: "tripSheetNo", label: "TripSheet No" },
  { key: "tripSheetDateLabel", label: "TripSheet Date" },
  { key: "vendorCode", label: "Vendor Code" },
  { key: "vendorName", label: "Vendor Name" },
  { key: "vendorFreightAmt", label: "Vendor Freight Amt", align: "right" },
  { key: "advanceAmt", label: "Advance Amt", align: "right" },
  { key: "balanceAmt", label: "Balance Amt", align: "right" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "podStatus", label: "Pod Status" }
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

function cellValue(row: Row, key: string) {
  const v = row[key];
  if (v == null || v === "") return "";
  return String(v);
}

export default function CnFreightRegisterPage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [transportMode, setTransportMode] = useState("Show All");
  const [bookingBranch, setBookingBranch] = useState("--Show All--");
  const [billingParty, setBillingParty] = useState("--Show All--");
  const [billingBranch, setBillingBranch] = useState("Show All");
  const [branches, setBranches] = useState<string[]>([]);
  const [parties, setParties] = useState<string[]>([]);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState("100%");
  const [findText, setFindText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 40;

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
        transportMode,
        bookingBranch,
        billingParty,
        billingBranch
      });
      const res = await fetch(`/api/reports/cn-freight-register?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load sales register");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setFindText("");
      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (alsoExport) exportCsv(data.data || []);
    } catch {
      toast.error("Failed to load sales register");
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
    a.download = `Sales_Register_CN_Freight_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

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
            <button
              type="button"
              title="Chart"
              onClick={() => toast.info("Open Table for freight register details")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Send"
              onClick={() => toast.info("Report link ready to share (simulated)")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
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
              <label className="block text-[11px] font-semibold text-[#0171d3] mb-1">Transport Mode</label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option>Show All</option>
                <option>ROAD</option>
                <option>FTL</option>
                <option>PTL</option>
                <option>Rail</option>
                <option>Air</option>
              </select>
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
              <label className="block text-[11px] font-semibold text-[#0171d3] mb-1">Billing Branch</label>
              <select
                value={billingBranch}
                onChange={(e) => setBillingBranch(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option>Show All</option>
                {branches.map((b) => (
                  <option key={`bill-${b}`} value={b}>
                    {b}
                  </option>
                ))}
                <option value="ALC1">ALC1</option>
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
              <button type="button" className="h-7 px-2 border border-slate-300 rounded bg-white">
                Next
              </button>
            </div>
          </div>

          <div style={{ zoom: zoomScale }} className="p-4 overflow-x-auto">
            <div className="text-center mb-3">
              <div className="text-sm font-bold text-red-600">Sales Register Report</div>
              <div className="text-xs text-red-600 mt-0.5">
                Docket Date From {formatLong(fromDate)} To {formatLong(toDate)}
              </div>
            </div>

            <table className="w-full border-collapse text-[11px] min-w-[3200px]">
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
                  <tr key={`${r.docketNumber}-${idx}`} className="odd:bg-white even:bg-slate-50">
                    {COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${
                          c.align === "right" ? "text-right" : ""
                        } ${c.key === "docketNumber" ? "font-mono font-semibold text-[#0171d3]" : ""}`}
                      >
                        {c.key === "docketNumber" ? (
                          <Link
                            href={`/dashboard/operations/dockets?search=${encodeURIComponent(String(r.docketNumber))}`}
                            className="hover:underline"
                          >
                            {cellValue(r, c.key)}
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
