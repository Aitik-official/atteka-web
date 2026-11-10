"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Columns3,
  Copy,
  FileSpreadsheet,
  LayoutGrid,
  Printer,
  Table2
} from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type ListRow = {
  id: string;
  tripSheetNo: string;
  manualTripSheetNo: string;
  deliveryLocation: string;
  tripSheetDateLabel: string;
};

type LineEdit = {
  id: string;
  docketNo: string;
  payBasis: string;
  edd: string;
  consignorName: string;
  consigneeAddress: string;
  bookingBranch: string;
  pkgs: number;
  weight: number;
  deliveryStatus: string;
  pkgsDelivered: number;
  deliveryDate: string;
  deliveryTime: string;
  department: string;
  deliverToPerson: string;
  reason: string;
  remark: string;
  signatureSeal: boolean;
  reassignedBranch: string;
  actionNote: string;
};

type Detail = {
  id: string;
  tripSheetNo: string;
  pdcDateLabel: string;
  pdcBranch: string;
  pdcType: string;
  manualPdcNo: string;
  pdcEntryDateLabel: string;
  deliveryBy: string;
  entryBy: string;
  vendor: string;
  vendorType: string;
  vehicleNo: string;
  vehicleType: string;
  driverName: string;
  financialCompletionAt: string;
  startKm: number;
  endKm: number;
  lines: LineEdit[];
};

const LIST_COLS = [
  { key: "tripSheetNo", label: "TripSheet No.", search: "Search TripSheet No." },
  { key: "manualTripSheetNo", label: "Manual TripSheet No.", search: "Search Manual TripSheet No." },
  { key: "deliveryLocation", label: "Delivery Location", search: "Search Delivery Location" },
  { key: "tripSheetDateLabel", label: "TripSheet Date", search: "Search TripSheet Date" }
] as const;

type ListColKey = (typeof LIST_COLS)[number]["key"];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toInputDate(d);
}

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function cellList(r: ListRow, key: ListColKey) {
  return String(r[key] || "");
}

export default function UpdateDeliveryPdcPage() {
  const [step, setStep] = useState<"filter" | "list" | "edit">("filter");
  const [fromDate, setFromDate] = useState(daysAgo(29));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [pdcNo, setPdcNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ListRow[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState("");
  const [cardView, setCardView] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<ListColKey, boolean>>(
    Object.fromEntries(LIST_COLS.map((c) => [c.key, true])) as Record<ListColKey, boolean>
  );
  const [colFilters, setColFilters] = useState<Record<ListColKey, string>>(
    Object.fromEntries(LIST_COLS.map((c) => [c.key, ""])) as Record<ListColKey, string>
  );

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        pdcNo: pdcNo.trim()
      });
      const res = await fetch(`/api/operations/update-delivery-pdc?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load TripSheets");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setStep("list");
    } catch {
      toast.error("Failed to load TripSheets");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = async (r: ListRow) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/operations/update-delivery-pdc?id=${encodeURIComponent(r.id)}&tripSheetNo=${encodeURIComponent(r.tripSheetNo)}`
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to open TripSheet");
        return;
      }
      const d = data.data;
      setDetail({
        id: d.id,
        tripSheetNo: d.tripSheetNo,
        pdcDateLabel: d.pdcDateLabel,
        pdcBranch: d.pdcBranch,
        pdcType: d.pdcType,
        manualPdcNo: d.manualPdcNo || "",
        pdcEntryDateLabel: d.pdcEntryDateLabel,
        deliveryBy: d.deliveryBy,
        entryBy: d.entryBy,
        vendor: d.vendor,
        vendorType: d.vendorType,
        vehicleNo: d.vehicleNo,
        vehicleType: d.vehicleType || "",
        driverName: d.driverName || "",
        financialCompletionAt: d.financialCompletionAt,
        startKm: Number(d.startKm || 0),
        endKm: Number(d.endKm || 0),
        lines: (d.lines || []).map((l: any) => ({
          id: l.id,
          docketNo: l.docketNo,
          payBasis: l.payBasis,
          edd: l.edd,
          consignorName: l.consignorName,
          consigneeAddress: l.consigneeAddress,
          bookingBranch: l.bookingBranch,
          pkgs: l.pkgs,
          weight: l.weight,
          deliveryStatus: "",
          pkgsDelivered: l.pkgs,
          deliveryDate: toInputDate(new Date()),
          deliveryTime: nowTime(),
          department: "",
          deliverToPerson: "",
          reason: "",
          remark: "",
          signatureSeal: false,
          reassignedBranch: "ALC1",
          actionNote: ""
        }))
      });
      setStep("edit");
    } catch {
      toast.error("Failed to open TripSheet");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const global = tableSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (global) {
        const blob = LIST_COLS.map((c) => cellList(r, c.key)).join(" ").toLowerCase();
        if (!blob.includes(global)) return false;
      }
      for (const c of LIST_COLS) {
        const q = (colFilters[c.key] || "").trim().toLowerCase();
        if (!q) continue;
        if (!cellList(r, c.key).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, tableSearch, colFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const fromEntry = filtered.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1;
  const toEntry = Math.min(pageSafe * pageSize, filtered.length);
  const visibleColList = LIST_COLS.filter((c) => visibleCols[c.key]);

  const copyTable = async () => {
    const headers = visibleColList.map((c) => c.label).join("\t");
    const lines = filtered.map((r) => visibleColList.map((c) => cellList(r, c.key)).join("\t"));
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
      visibleColList.map((c) => `"${cellList(r, c.key).replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[headers, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `update-delivery-pdc-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel (CSV) download started (demo)");
  };

  const patchLine = (id: string, patch: Partial<LineEdit>) => {
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            lines: prev.lines.map((l) => (l.id === id ? { ...l, ...patch } : l))
          }
        : prev
    );
  };

  const closePdc = async () => {
    if (!detail) return;
    const incomplete = detail.lines.some((l) => !l.deliveryStatus);
    if (incomplete) {
      toast.error("Select Delivery Status for all dockets");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/operations/update-delivery-pdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          close: true,
          tripSheetNo: detail.tripSheetNo,
          driverName: detail.driverName,
          endKm: detail.endKm,
          lines: detail.lines
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Close failed");
        return;
      }
      toast.success(data.message || "PDC closed");
      setStep("list");
      setDetail(null);
    } catch {
      toast.error("Close failed");
    } finally {
      setSaving(false);
    }
  };

  const btn =
    "px-3 py-1.5 text-xs font-semibold border border-[#7eb6e8] text-[#0171d3] rounded-lg inline-flex items-center gap-1.5 hover:bg-[#e8f1fb]";
  const label = "text-[11px] font-semibold text-slate-600";
  const ro = "text-[12px] text-slate-800 font-medium";

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden max-w-xl mx-auto">
          <div className="px-6 py-6 space-y-4">
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadList()}
                title="View result table"
                className="h-11 w-11 rounded-md bg-[#0171d3] text-white inline-flex items-center justify-center hover:bg-[#0159a8] disabled:opacity-50"
              >
                <Table2 className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                TripSheet Date
              </label>
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

            <input
              value={pdcNo}
              onChange={(e) => setPdcNo(e.target.value.toUpperCase())}
              placeholder="PDC No"
              className="w-full h-11 px-4 border border-[#7eb6e8] rounded-md text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
            />

            <div className="flex justify-center pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadList()}
                className="h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "list" && (
        <div data-print-root className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-[#0171d3] text-white flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-7 w-7 rounded-full bg-white text-[#0171d3] inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h2 className="text-sm font-bold">Update Delivery PDC</h2>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <div className="relative">
              <button type="button" onClick={() => setShowColumnsMenu((v) => !v)} className={btn}>
                <Columns3 className="w-3.5 h-3.5" /> Column visibility
              </button>
              {showColumnsMenu && (
                <div className="absolute z-20 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-xs">
                  {LIST_COLS.map((c) => (
                    <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols[c.key]}
                        onChange={() =>
                          setVisibleCols((prev) => ({ ...prev, [c.key]: !prev[c.key] }))
                        }
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => void copyTable()} className={btn}>
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button type="button" onClick={exportExcel} className={btn}>
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button type="button" onClick={() => printScoped()} className={btn}>
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              type="button"
              onClick={() => setCardView((v) => !v)}
              className={`${btn} ${cardView ? "bg-blue-50" : ""}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> CARD VIEW
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

          {!cardView ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700">
                    {visibleColList.map((c) => (
                      <th
                        key={c.key}
                        className="border border-slate-200 px-2 py-1.5 font-semibold text-left align-top"
                      >
                        <div className="mb-1">{c.label}</div>
                        <input
                          value={colFilters[c.key]}
                          onChange={(e) => {
                            setColFilters((prev) => ({ ...prev, [c.key]: e.target.value }));
                            setPage(1);
                          }}
                          placeholder={c.search}
                          className="w-full h-7 px-1.5 border border-slate-200 rounded-sm text-[10px]"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-[#eef5fc]">
                      {visibleColList.map((c) => (
                        <td key={c.key} className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          {c.key === "tripSheetNo" ? (
                            <button
                              type="button"
                              className="text-[#0171d3] font-semibold hover:underline"
                              onClick={() => void openEdit(r)}
                            >
                              {r.tripSheetNo}
                            </button>
                          ) : (
                            cellList(r, c.key)
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
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {pageRows.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => void openEdit(r)}
                  className="text-left border border-slate-200 rounded-md p-3 text-[11px] space-y-1 hover:bg-[#eef5fc]"
                >
                  <div className="font-semibold text-[#0171d3]">{r.tripSheetNo}</div>
                  <div>{r.manualTripSheetNo}</div>
                  <div>{r.deliveryLocation}</div>
                  <div className="text-slate-500">{r.tripSheetDateLabel}</div>
                </button>
              ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-1 text-xs">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-md border border-slate-200 disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`h-8 min-w-8 px-2 rounded-md border ${
                  pageSafe === n
                    ? "border-[#0171d3] bg-[#0171d3] text-white"
                    : "border-slate-200"
                }`}
              >
                {n}
              </button>
            ))}
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

      {step === "edit" && detail && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStep("list");
                setDetail(null);
              }}
              className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <h2 className="text-sm font-bold text-slate-800">Update Delivery PDC — {detail.tripSheetNo}</h2>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
            <div>
              <div className={label}>PDC No</div>
              <div className={ro}>{detail.tripSheetNo}</div>
            </div>
            <div>
              <div className={label}>PDC Date</div>
              <div className={ro}>{detail.pdcDateLabel}</div>
            </div>
            <div>
              <div className={label}>PDC Branch</div>
              <div className={ro}>{detail.pdcBranch}</div>
            </div>
            <div>
              <div className={label}>PDC Type</div>
              <div className={ro}>{detail.pdcType}</div>
            </div>
            <div>
              <div className={label}>Manual PDC No</div>
              <input
                value={detail.manualPdcNo}
                onChange={(e) =>
                  setDetail({ ...detail, manualPdcNo: e.target.value.toUpperCase() })
                }
                className="mt-0.5 h-8 w-full px-2 border border-slate-300 rounded-sm text-[12px]"
              />
            </div>
            <div>
              <div className={label}>PDC Entry Date</div>
              <div className={ro}>{detail.pdcEntryDateLabel}</div>
            </div>
            <div>
              <div className={label}>Delivery By</div>
              <div className={ro}>{detail.deliveryBy}</div>
            </div>
            <div>
              <div className={label}>Entry By</div>
              <div className={ro}>{detail.entryBy}</div>
            </div>
            <div>
              <div className={label}>Vendor</div>
              <div className={ro}>{detail.vendor}</div>
            </div>
            <div>
              <div className={label}>Vendor Type</div>
              <div className={ro}>{detail.vendorType}</div>
            </div>
            <div>
              <div className={label}>Vehicle No</div>
              <div className={ro}>{detail.vehicleNo}</div>
            </div>
            <div>
              <div className={label}>Type of vehicle</div>
              <div className={ro}>{detail.vehicleType || "—"}</div>
            </div>
            <div>
              <div className={label}>Driver Name</div>
              <input
                value={detail.driverName}
                onChange={(e) =>
                  setDetail({ ...detail, driverName: e.target.value.toUpperCase() })
                }
                className="mt-0.5 h-8 w-full px-2 border border-slate-300 rounded-sm text-[12px]"
              />
            </div>
            <div>
              <div className={label}>Financial Completion At</div>
              <div className={ro}>{detail.financialCompletionAt}</div>
            </div>
            <div>
              <div className={label}>Start KM</div>
              <div className={ro}>{detail.startKm}</div>
            </div>
            <div>
              <div className={label}>End KM</div>
              <input
                type="number"
                min={0}
                value={detail.endKm}
                onChange={(e) => setDetail({ ...detail, endKm: Number(e.target.value) })}
                className="mt-0.5 h-8 w-28 px-2 border border-slate-300 rounded-sm text-[12px]"
              />
            </div>
          </div>

          <div className="px-4 py-2 border-t border-slate-100 text-[11px] text-slate-500">
            Showing 1 to {detail.lines.length} of {detail.lines.length} entries
          </div>

          <div className="overflow-x-auto px-2 pb-2">
            <table className="min-w-[1600px] w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Docker No. / Paybasis / EDD</th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">
                    Consignor Name / Consignee Address
                  </th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Booking Branch / Pkgs / Weight</th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Delivery Status</th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Pkgs delivered</th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Delivery date & Time</th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Department</th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Deliver to person</th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Reason</th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Remark</th>
                  <th className="px-2 py-2 text-center border border-[#0a5fad]">Signature & company seal</th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Reassigned to Branch</th>
                  <th className="px-2 py-2 text-left border border-[#0a5fad]">Action</th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.map((l) => (
                  <tr key={l.id} className="bg-white align-top">
                    <td className="px-2 py-2 border border-slate-200 whitespace-nowrap">
                      <div className="font-semibold text-[#0171d3]">{l.docketNo}</div>
                      <div>{l.payBasis}</div>
                      <div>{l.edd}</div>
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <div className="font-medium">{l.consignorName}</div>
                      <div className="text-slate-500">{l.consigneeAddress}</div>
                    </td>
                    <td className="px-2 py-2 border border-slate-200 whitespace-nowrap">
                      <div>{l.bookingBranch}</div>
                      <div>
                        {l.pkgs} / {l.weight}
                      </div>
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <select
                        value={l.deliveryStatus}
                        onChange={(e) => patchLine(l.id, { deliveryStatus: e.target.value })}
                        className="h-8 w-full border border-slate-300 rounded-sm px-1"
                      >
                        <option value="">--Select--</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Part Delivered">Part Delivered</option>
                        <option value="UnDelivered">UnDelivered</option>
                        <option value="Reassigned">Reassigned</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={l.pkgsDelivered}
                        onChange={(e) => patchLine(l.id, { pkgsDelivered: Number(e.target.value) })}
                        className="h-8 w-16 border border-slate-300 rounded-sm px-1"
                      />
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <div className="flex flex-col gap-1">
                        <input
                          type="date"
                          value={l.deliveryDate}
                          onChange={(e) => patchLine(l.id, { deliveryDate: e.target.value })}
                          className="h-8 border border-slate-300 rounded-sm px-1"
                        />
                        <input
                          type="time"
                          value={l.deliveryTime}
                          onChange={(e) => patchLine(l.id, { deliveryTime: e.target.value })}
                          className="h-8 border border-slate-300 rounded-sm px-1"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <input
                        value={l.department}
                        onChange={(e) => patchLine(l.id, { department: e.target.value.toUpperCase() })}
                        className="h-8 w-28 border border-slate-300 rounded-sm px-1"
                      />
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <input
                        value={l.deliverToPerson}
                        onChange={(e) =>
                          patchLine(l.id, { deliverToPerson: e.target.value.toUpperCase() })
                        }
                        className="h-8 w-28 border border-slate-300 rounded-sm px-1"
                      />
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <select
                        value={l.reason}
                        onChange={(e) => patchLine(l.id, { reason: e.target.value })}
                        className="h-8 w-full border border-slate-300 rounded-sm px-1"
                      >
                        <option value="">--Select--</option>
                        <option value="Consignee Closed">Consignee Closed</option>
                        <option value="Address Issue">Address Issue</option>
                        <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <input
                        value={l.remark}
                        onChange={(e) => patchLine(l.id, { remark: e.target.value.toUpperCase() })}
                        className="h-8 w-28 border border-slate-300 rounded-sm px-1"
                      />
                    </td>
                    <td className="px-2 py-2 border border-slate-200 text-center">
                      <input
                        type="checkbox"
                        checked={l.signatureSeal}
                        onChange={(e) => patchLine(l.id, { signatureSeal: e.target.checked })}
                      />
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <input
                        value={l.reassignedBranch}
                        onChange={(e) =>
                          patchLine(l.id, { reassignedBranch: e.target.value.toUpperCase() })
                        }
                        className="h-8 w-20 border border-slate-300 rounded-sm px-1"
                      />
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <textarea
                        value={l.actionNote}
                        onChange={(e) => patchLine(l.id, { actionNote: e.target.value })}
                        rows={3}
                        className="w-40 px-1 py-1 border border-slate-300 rounded-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-4 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              disabled={saving}
              onClick={() => void closePdc()}
              className="h-9 min-w-[140px] px-8 rounded-full bg-[#0171d3] text-white text-sm font-semibold hover:bg-[#0159a8] disabled:opacity-50"
            >
              {saving ? "Closing..." : "Close PDC"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
