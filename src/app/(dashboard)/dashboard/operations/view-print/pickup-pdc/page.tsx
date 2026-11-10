"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Columns3,
  Copy,
  FileSpreadsheet,
  Printer,
  Truck
} from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printPickupPdcDocument, printResultsTable } from "@/lib/pdcPrintFormats";

type ListRow = {
  id: string;
  pdcNo: string;
  manualPdcNo: string;
  vehicleNo: string;
  pdcDate: string;
  pdcDateLabel: string;
  pdcBranch: string;
};

type Line = {
  srNo: number;
  docketNo: string;
  consignorName: string;
  pkgsLoad: number;
  pkgsTotal: number;
  weightLoad: number;
  weightTotal: number;
  picked: boolean;
  stampSign: boolean;
};

type Detail = {
  id: string;
  pdcNo: string;
  manualPdcNo: string;
  vehicleNo: string;
  pdcDateLabel: string;
  pdcBranch: string;
  mode: string;
  driverLicenseNo: string;
  preparedBy: string;
  preparedAt: string;
  preparedOn: string;
  vendor: string;
  fromLocation: string;
  toLocation: string;
  distance: number;
  driverName: string;
  remark: string;
  lines: Line[];
};

const COLS = [
  { key: "srNo", label: "Sr.No", search: "Search Sr.No" },
  { key: "pdcNo", label: "PDC No.", search: "Search PDC No." },
  { key: "manualPdcNo", label: "Manual PDC No.", search: "Search Manual PDC No." },
  { key: "vehicleNo", label: "Vehicle No.", search: "Search Vehicle No." },
  { key: "pdcDateLabel", label: "PDC Date", search: "Search PDC Date" },
  { key: "pdcBranch", label: "PDC Branch", search: "Search PDC Branch" },
  { key: "viewPrint", label: "View/Print", search: "Search View/Print" }
] as const;

type ColKey = (typeof COLS)[number]["key"];

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

function yn(v: boolean) {
  return v ? "Yes" : "No";
}

function cellText(r: ListRow, key: ColKey, srNo: number) {
  switch (key) {
    case "srNo":
      return String(srNo);
    case "pdcNo":
      return r.pdcNo;
    case "manualPdcNo":
      return r.manualPdcNo;
    case "vehicleNo":
      return r.vehicleNo;
    case "pdcDateLabel":
      return r.pdcDateLabel;
    case "pdcBranch":
      return r.pdcBranch;
    case "viewPrint":
      return "Print";
    default:
      return "";
  }
}

export default function ViewPrintPickupPdcPage() {
  const [step, setStep] = useState<"filter" | "list" | "print">("filter");
  const [fromDate, setFromDate] = useState(daysAgo(29));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [systemPdcNo, setSystemPdcNo] = useState("");
  const [manualPdcNo, setManualPdcNo] = useState("");
  const [rows, setRows] = useState<ListRow[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

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
  const [sortKey, setSortKey] = useState<ColKey>("pdcNo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (systemPdcNo.trim() || manualPdcNo.trim()) {
        if (systemPdcNo.trim()) params.set("systemPdcNo", systemPdcNo.trim());
        if (manualPdcNo.trim()) params.set("manualPdcNo", manualPdcNo.trim());
      } else {
        params.set("from", fromDate);
        params.set("to", toDate);
      }
      const res = await fetch(`/api/operations/view-print-pickup-pdc?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Pickup PDCs");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setStep("list");
      if (!(data.data || []).length) toast.info("No Pickup PDCs found for this filter");
    } catch {
      toast.error("Failed to load Pickup PDCs");
    } finally {
      setLoading(false);
    }
  };

  const openPrint = async (row: ListRow) => {
    setPrintLoading(true);
    try {
      const res = await fetch(
        `/api/operations/view-print-pickup-pdc?id=${encodeURIComponent(row.id)}`
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load print format");
        return;
      }
      setDetail(data.data);
      setStep("print");
    } catch {
      toast.error("Failed to load print format");
    } finally {
      setPrintLoading(false);
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
    printResultsTable(
      "View & Print Pickup PDC",
      visibleColList.filter((c) => c.key !== "viewPrint").map((c) => c.label),
      filtered.map(({ row, srNo }) =>
        visibleColList
          .filter((c) => c.key !== "viewPrint")
          .map((c) => cellText(row, c.key, srNo))
      )
    );
  };

  const btn =
    "px-3 py-1.5 text-xs font-semibold border border-[#7eb6e8] text-[#0171d3] rounded-lg inline-flex items-center gap-1.5 hover:bg-[#e8f1fb]";

  const pkgTot = detail
    ? {
        load: detail.lines.reduce((s, l) => s + l.pkgsLoad, 0),
        total: detail.lines.reduce((s, l) => s + l.pkgsTotal, 0)
      }
    : { load: 0, total: 0 };
  const wtTot = detail
    ? {
        load: detail.lines.reduce((s, l) => s + l.weightLoad, 0),
        total: detail.lines.reduce((s, l) => s + l.weightTotal, 0)
      }
    : { load: 0, total: 0 };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden max-w-xl mx-auto">
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">PDC Date</label>
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
              value={systemPdcNo}
              onChange={(e) => setSystemPdcNo(e.target.value.toUpperCase())}
              placeholder="System PDC No. :"
              className="w-full h-11 px-4 border border-[#7eb6e8] rounded-full text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
            />
            <input
              value={manualPdcNo}
              onChange={(e) => setManualPdcNo(e.target.value.toUpperCase())}
              placeholder="Manual PDC No."
              className="w-full h-11 px-4 border border-[#7eb6e8] rounded-full text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
            />

            <div className="flex justify-center pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadList()}
                className="h-9 min-w-[120px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
              >
                {loading ? "Loading..." : "Show PDCs"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "list" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
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
                exportCsv(`view-print-pickup-pdc-${fromDate}-to-${toDate}.csv`);
                toast.success("CSV download started");
              }}
              className={btn}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              type="button"
              onClick={() => {
                exportCsv(`view-print-pickup-pdc-${fromDate}-to-${toDate}.xls`);
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
                        {c.key === "viewPrint" ? (
                          <button
                            type="button"
                            disabled={printLoading}
                            onClick={() => void openPrint(row)}
                            title="View / Print Pickup PDC"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#0171d3] text-white hover:bg-[#0159a8] disabled:opacity-50"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        ) : c.key === "pdcNo" ? (
                          <span className="text-[#0171d3] font-semibold">{row.pdcNo}</span>
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

      {step === "print" && detail && (
        <div className="space-y-3">
          <div className="print:hidden flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDetail(null);
                setStep("list");
              }}
              className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to list
            </button>
            <button
              type="button"
              onClick={() => printPickupPdcDocument(detail, true)}
              className="h-8 px-4 rounded-full bg-[#0171d3] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#0159a8]"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden print:border-0 print:shadow-none">
            {/* Document header */}
            <div className="grid grid-cols-[1fr_auto] gap-4 p-4 border-b border-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#0171d3] text-white flex items-center justify-center shrink-0">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-lg font-black tracking-wide text-slate-900 leading-tight">
                    ATEKA LOGISTICS
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Pickup PDC
                  </div>
                </div>
              </div>
              <table className="text-[11px] border-collapse self-start min-w-[220px]">
                <tbody>
                  {[
                    ["PDC No", detail.pdcNo],
                    ["Manual PDC No", detail.manualPdcNo],
                    ["PDC Date", detail.pdcDateLabel],
                    ["Mode", detail.mode]
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50 whitespace-nowrap">
                        {k}
                      </td>
                      <td className="border border-slate-400 px-2 py-1 font-mono whitespace-nowrap">
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-100 border-b border-slate-300 px-4 py-1.5 text-center text-sm font-bold text-slate-800">
              PDC - Pickup
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 py-2 border-b border-slate-300 text-[11px]">
              <div>
                <span className="font-semibold text-slate-600">PDC Branch: </span>
                <span className="font-medium">{detail.preparedAt || detail.pdcBranch}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Vehicle No.: </span>
                <span className="font-mono font-bold">{detail.vehicleNo}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Driver License No: </span>
                <span>{detail.driverLicenseNo || ""}</span>
              </div>
            </div>

            <div className="bg-[#0171d3] text-white text-center text-xs font-bold py-1.5 tracking-wide">
              Pickup PDC Details
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50">
                    {[
                      "Sr.no",
                      "Docket No.",
                      "Consignor Name",
                      "No. of Packages",
                      "Total Weight",
                      "Picked",
                      "Stamp/Sign"
                    ].map((h) => (
                      <th
                        key={h}
                        className="border border-slate-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.lines.map((l) => (
                    <tr key={`${l.srNo}-${l.docketNo}`}>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">{l.srNo}</td>
                      <td className="border border-slate-300 px-2 py-1.5 font-mono">{l.docketNo}</td>
                      <td className="border border-slate-300 px-2 py-1.5">{l.consignorName}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">
                        {l.pkgsLoad}/{l.pkgsTotal}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {l.weightLoad}/{l.weightTotal.toFixed(1)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">
                        {yn(l.picked)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">
                        {yn(l.stampSign)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="border border-slate-300 px-2 py-1.5" colSpan={3}>
                      Total
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center">
                      {pkgTot.load}/{pkgTot.total}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                      {wtTot.load}/{wtTot.total.toFixed(1)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5" colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 space-y-1.5 text-[11px] border-t border-slate-300">
              <div>
                <span className="font-semibold">Prepared By: </span>
                {detail.preparedBy}
                <span className="mx-2 text-slate-400">|</span>
                <span className="font-semibold">At: </span>
                {detail.preparedAt}
                <span className="mx-2 text-slate-400">|</span>
                <span className="font-semibold">ON: </span>
                {detail.preparedOn}
              </div>
              <div>
                <span className="font-semibold">Vendor: </span>
                {detail.vendor}
              </div>
              <div>
                <span className="font-semibold">From Location: </span>
                {detail.fromLocation}
                <span className="mx-2 text-slate-400">|</span>
                <span className="font-semibold">To Location: </span>
                {detail.toLocation}
                <span className="mx-2 text-slate-400">|</span>
                <span className="font-semibold">Distance: </span>
                {detail.distance.toFixed(2)}
              </div>
              <div>
                <span className="font-semibold">Driver Name: </span>
                {detail.driverName || "-"}
                <span className="mx-2 text-slate-400">|</span>
                <span className="font-semibold">Remark: </span>
                {detail.remark || ""}
              </div>
            </div>

            <div className="mx-4 mb-4 mt-6 border border-slate-400 min-h-[72px] relative">
              <div className="absolute -top-2.5 left-3 bg-white px-1.5 text-[10px] font-semibold text-slate-600">
                Ateka Logistics Sign
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
