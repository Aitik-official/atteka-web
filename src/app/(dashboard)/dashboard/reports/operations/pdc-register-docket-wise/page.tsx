"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart2, Calendar, ChevronDown, FileSpreadsheet, MoreHorizontal, Pencil, Printer, RefreshCw, Search, Table2, X } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type Row = {
  pdcNumber: string;
  manualPdc: string;
  pdcDateLabel?: string;
  pdcTime: string;
  pdcType: string;
  mode: string;
  wayBill: string;
  delyLocation: string;
  vehicleNo: string;
  vendorCode: string;
  vendorName: string;
  docket: string;
  docketDateLabel?: string;
  orgncd: string;
  actWt: number;
  chrgWt: number;
  pkgs: number;
  pkgsDly: number;
};

const COLUMNS: { key: keyof Row; label: string; align?: "left" | "right" }[] = [
  { key: "pdcNumber", label: "PDC Number" },
  { key: "manualPdc", label: "Manual PDC" },
  { key: "pdcDateLabel", label: "PDC Date" },
  { key: "pdcTime", label: "PDC Time" },
  { key: "pdcType", label: "PDC Type" },
  { key: "mode", label: "Mode" },
  { key: "wayBill", label: "Way Bill" },
  { key: "delyLocation", label: "Dely Location" },
  { key: "vehicleNo", label: "Vehicle No" },
  { key: "vendorCode", label: "Vendor  Code" },
  { key: "vendorName", label: "Vendor Name" },
  { key: "docket", label: "Docket" },
  { key: "docketDateLabel", label: "Docket Date" },
  { key: "orgncd", label: "orgncd" },
  { key: "actWt", label: "Act. Wt.", align: "right" },
  { key: "chrgWt", label: "Chrg. Wt.", align: "right" },
  { key: "pkgs", label: "Pkgs", align: "right" },
  { key: "pkgsDly", label: "Pkgs Dly", align: "right" }
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

export default function PdcRegisterDocketWisePage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [transportMode, setTransportMode] = useState("");
  const [tripBranch, setTripBranch] = useState("Show All");
  const [vendor, setVendor] = useState("");
  const [pdcType, setPdcType] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [vendors, setVendors] = useState<{ code: string; name: string }[]>([]);
  const [vendorPickerOpen, setVendorPickerOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState("100%");
  const [findText, setFindText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    Promise.all([fetch("/api/branches"), fetch("/api/vendors")])
      .then(async ([bRes, vRes]) => {
        const b = await bRes.json();
        const v = await vRes.json();
        if (b.success) {
          setBranches(
            (b.data || [])
              .map((x: any) => String(x.branchCode || x.code || "").trim().toUpperCase())
              .filter(Boolean)
          );
        }
        if (v.success) {
          setVendors(
            (v.data || [])
              .map((x: any) => ({
                code: String(x.vendorCode || x.code || "").trim().toUpperCase(),
                name: String(x.vendorName || x.name || "").trim()
              }))
              .filter((x: { code: string }) => x.code)
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

  const filteredVendors = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q));
  }, [vendors, vendorSearch]);

  const loadReport = async (alsoExport = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        transportMode: transportMode || "Show All",
        tripBranch,
        vendor: vendor || "Show All",
        pdcType: pdcType || "Show All"
      });
      const res = await fetch(`/api/reports/pdc-register-docket-wise?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load PDC register (docket wise)");
        return;
      }
      const list: Row[] = (data.data || []).map((r: any) => ({
        pdcNumber: r.pdcNumber || "",
        manualPdc: r.manualPdc || "",
        pdcDateLabel: r.pdcDateLabel || "",
        pdcTime: r.pdcTime || "00:00",
        pdcType: r.pdcType || "",
        mode: r.mode || "",
        wayBill: r.wayBill || "",
        delyLocation: r.delyLocation || "",
        vehicleNo: r.vehicleNo || "",
        vendorCode: r.vendorCode || "",
        vendorName: r.vendorName || "",
        docket: r.docket || "",
        docketDateLabel: r.docketDateLabel || "",
        orgncd: r.orgncd || "",
        actWt: Number(r.actWt || 0),
        chrgWt: Number(r.chrgWt || 0),
        pkgs: Number(r.pkgs || 0),
        pkgsDly: Number(r.pkgsDly || 0)
      }));
      setRows(list);
      setPage(1);
      setFindText("");
      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (alsoExport) exportCsv(list);
    } catch {
      toast.error("Failed to load PDC register (docket wise)");
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
    a.download = `PDC_Register_Docket_Wise_${fromDate}_${toDate}.csv`;
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
              onClick={() => toast.info("Chart view is available from Booking Summary")}
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
            <div>
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
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Trip Branch
              </label>
              <select
                value={tripBranch}
                onChange={(e) => setTripBranch(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white"
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

            <div className="relative">
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Vendor"
                className="w-full h-11 pl-3 pr-12 border border-slate-300 rounded-md text-sm placeholder:text-[#0171d3]"
              />
              <button
                type="button"
                title="Lookup vendor"
                onClick={() => {
                  setVendorSearch("");
                  setVendorPickerOpen(true);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div>
              <select
                value={pdcType}
                onChange={(e) => setPdcType(e.target.value)}
                className={`w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white ${
                  pdcType ? "text-slate-800" : "text-slate-400"
                }`}
              >
                <option value="">PDC Type</option>
                <option value="Show All">Show All</option>
                <option value="Delivery">Delivery</option>
                <option value="Pickup">Pickup</option>
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
              <div className="text-sm font-bold text-red-600">PDC Register [Docket wise]</div>
              <div className="text-xs text-red-600 mt-0.5">
                PDC Date From {formatLong(fromDate)} To {formatLong(toDate)}
              </div>
            </div>

            <table className="w-full border-collapse text-[11px] min-w-[1600px]">
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
                  <tr key={`${r.pdcNumber}-${r.docket}-${idx}`} className="odd:bg-white even:bg-slate-50">
                    {COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${
                          c.align === "right" ? "text-right" : ""
                        } ${
                          c.key === "pdcNumber" || c.key === "docket"
                            ? "font-mono font-semibold text-[#0171d3]"
                            : ""
                        }`}
                      >
                        {cellValue(r, c.key)}
                      </td>
                    ))}
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No PDC / docket rows found for selected filters.
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

      {vendorPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-[#0171d3] text-white">
              <span className="text-sm font-semibold">Select Vendor</span>
              <button type="button" onClick={() => setVendorPickerOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-slate-100">
              <input
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search vendor code / name"
                className="w-full h-9 px-3 border border-slate-300 rounded text-sm"
                autoFocus
              />
            </div>
            <div className="max-h-72 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setVendor("");
                  setVendorPickerOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-100"
              >
                -- Show All --
              </button>
              {filteredVendors.map((v) => (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => {
                    setVendor(`${v.code} - ${v.name}`);
                    setVendorPickerOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-100"
                >
                  <span className="font-mono font-semibold text-[#0171d3]">{v.code}</span>
                  <span className="text-slate-600"> — {v.name}</span>
                </button>
              ))}
              {filteredVendors.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">No vendors found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
