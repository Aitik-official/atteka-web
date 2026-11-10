"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2, Calendar, ChevronDown, FileSpreadsheet, Pencil, Printer, RefreshCw, Search, Table2 } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type Row = Record<string, string | number>;

const COLUMNS: { key: string; label: string; align?: "right" }[] = [
  { key: "cnNumber", label: "CN Number" },
  { key: "cnDateLabel", label: "CN Date" },
  { key: "bookingBranch", label: "Booking Branch" },
  { key: "eddLabel", label: "EDD" },
  { key: "bookingAgingDays", label: "Booking Aging Days", align: "right" },
  { key: "delyAgingDays", label: "Dely Aging Days", align: "right" },
  { key: "consignor", label: "Consignor" },
  { key: "consignorAddress", label: "Conignor Address" },
  { key: "consignee", label: "Consignee" },
  { key: "consigneeAddress", label: "Consignee Address" },
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "billingParty", label: "Billing Party" },
  { key: "billingBr", label: "Billing Br." },
  { key: "pkgs", label: "Pkgs.", align: "right" },
  { key: "actWt", label: "Act. Wt.", align: "right" },
  { key: "chrgWt", label: "Chrg. Wt.", align: "right" },
  { key: "contents", label: "Contents" },
  { key: "invoiceNo", label: "Invoice No" },
  { key: "payMode", label: "Pay Mode" },
  { key: "declaredValue", label: "Declared Value", align: "right" },
  { key: "poNumber", label: "PO Number" },
  { key: "shipmentNo", label: "Shipment No" },
  { key: "dnNumber", label: "DN Number" },
  { key: "docketRemark", label: "Docket Remark" },
  { key: "billNumber", label: "Bill Number" },
  { key: "billDateLabel", label: "Bill Date" },
  { key: "billedAmount", label: "Billed Amount", align: "right" },
  { key: "thcNumber", label: "THC Number" },
  { key: "thcDateLabel", label: "THC Date" },
  { key: "thcFreight", label: "THC Freight", align: "right" },
  { key: "balancePayment", label: "Balance Payment", align: "right" },
  { key: "payModeThc", label: "Pay Mode" },
  { key: "tcNumber", label: "TC Number" },
  { key: "vendorName", label: "Vendor Name" },
  { key: "vehNumber", label: "Veh. Number" },
  { key: "vehType", label: "Veh. Type" },
  { key: "vdrNo", label: "VDR No" },
  { key: "dlyDateLabel", label: "Dly. Date" },
  { key: "dlyPcs", label: "Dly. Pcs.", align: "right" },
  { key: "pdcNumber", label: "PDC Number" },
  { key: "podRemark", label: "POD Remark" },
  { key: "podYn", label: "POD Y/N" },
  { key: "entryDate", label: "Entry Date" },
  { key: "entryTime", label: "Entry Time" },
  { key: "salesPerson", label: "Sales Person" }
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

export default function UnbilledCnRegisterPage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [transportMode, setTransportMode] = useState("");
  const [vertical, setVertical] = useState("");
  const [bookingBranch, setBookingBranch] = useState("");
  const [billingParty, setBillingParty] = useState("--Show All--");
  const [billingBranch, setBillingBranch] = useState("--Show All--");
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
        transportMode: transportMode || "Show All",
        vertical: vertical || "Show All",
        bookingBranch: bookingBranch || "Show All",
        billingParty,
        billingBranch
      });
      const res = await fetch(`/api/reports/unbilled-cn-register?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load unbilled CN register");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setFindText("");
      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (alsoExport) exportCsv(data.data || []);
    } catch {
      toast.error("Failed to load unbilled CN register");
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
    a.download = `Unbilled_CN_Register_${fromDate}_${toDate}.csv`;
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
              onClick={() => toast.info("Open Table for unbilled register details")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Edit filters"
              onClick={() => toast.info("Adjust filters below, then open Table")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Docket Date
              </label>
              <div className="h-11 px-3 border border-slate-300 rounded-md text-sm flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate flex-1">{dateLabel}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
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
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className={`w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white ${
                  transportMode ? "text-slate-800" : "text-slate-400"
                }`}
              >
                <option value="">Transport Mode</option>
                <option value="Show All">Show All</option>
                <option value="ROAD">ROAD</option>
                <option value="FTL">FTL</option>
                <option value="PTL">PTL</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
              </select>
            </div>

            <div>
              <select
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className={`w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white ${
                  vertical ? "text-slate-800" : "text-slate-400"
                }`}
              >
                <option value="">Verticles or Division</option>
                <option value="Show All">Show All</option>
                <option value="FTL">FTL</option>
                <option value="PTL">PTL</option>
                <option value="WAREHOUSE">WAREHOUSE</option>
                <option value="EXPRESS">EXPRESS</option>
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Booking Branch
              </label>
              <input
                value={bookingBranch}
                onChange={(e) => setBookingBranch(e.target.value)}
                list="unbilled-branch-list"
                placeholder="Type branch code or leave blank for all"
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm"
              />
              <datalist id="unbilled-branch-list">
                {branches.map((b) => (
                  <option key={b} value={b} />
                ))}
                <option value="ALC1" />
              </datalist>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Billing Party
              </label>
              <select
                value={billingParty}
                onChange={(e) => setBillingParty(e.target.value)}
                size={4}
                className="w-full min-h-[96px] px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option>--Show All--</option>
                {parties.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Billing Branch
              </label>
              <select
                value={billingBranch}
                onChange={(e) => setBillingBranch(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option>--Show All--</option>
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
        <div data-print-root className="bg-white border border-slate-300 shadow-sm">
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
              onClick={() => printScoped()}
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
              <div className="text-sm font-bold text-red-600">
                Un-Billed O/S Financially Completed and Un-Completed
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">
                Booking Date From {formatLong(fromDate)} To {formatLong(toDate)}
              </div>
            </div>

            <table className="w-full border-collapse text-[11px] min-w-[3400px]">
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
                        {c.key === "cnNumber" ? (
                          <Link
                            href={`/dashboard/operations/dockets?search=${encodeURIComponent(String(r.cnNumber))}`}
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
                      No unbilled consignments found for selected filters.
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
