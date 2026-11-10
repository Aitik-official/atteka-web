"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  FileSpreadsheet,
  LineChart,
  Pencil,
  Search,
  Table2,
  X
} from "lucide-react";
import { toast } from "@/lib/toastBus";

type ReportRow = {
  id: string;
  srNo: number;
  paymentDate: string;
  paymentDateLabel: string;
  voucherNo: string;
  vendorCode: string;
  vendorName: string;
  vendorLabel: string;
  documentNo: string;
  paymentType: string;
  amount: number;
  bankName: string;
  acNoIfsc: string;
  paymentMode: string;
  utrRef: string;
  status: "Success" | "Pending" | "Failed" | "Reversed";
  entryBy: string;
  narration: string;
};

type VendorOpt = { code: string; name: string; label: string };

type Summary = {
  totalAmount: number;
  totalCount: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  from: string;
  to: string;
};

type ViewMode = "grid" | "excel" | "chart" | "edit";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatRangeLabel(from: string, to: string) {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };
  return `${fmt(from)} - ${fmt(to)}`;
}

function inr(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function statusCls(status: ReportRow["status"]) {
  if (status === "Success") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (status === "Pending") return "text-amber-700 bg-amber-50 border-amber-200";
  if (status === "Failed") return "text-red-700 bg-red-50 border-red-200";
  return "text-slate-700 bg-slate-100 border-slate-200";
}

export default function OnlinePaymentReportPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vendor, setVendor] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [vendors, setVendors] = useState<VendorOpt[]>([]);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/bank/online-payment-report?vendors=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVendors(d.data || []);
      })
      .catch(() => {});
  }, []);

  const filteredVendors = useMemo(() => {
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.code.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q)
    );
  }, [vendors, lookupQuery]);

  const loadReport = async (mode: ViewMode = "grid") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        vendor,
        voucherNo
      });
      const res = await fetch(`/api/bank/online-payment-report?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Online Payment Report");
        return;
      }
      setRows(data.data || []);
      setSummary(data.summary || null);
      setViewMode(mode);
      setStep("report");

      if (mode === "excel") {
        exportCsv(data.data || []);
        toast.success("Excel (CSV) download started (demo)");
      } else if (mode === "chart") {
        toast.info("Chart view ready");
      } else if (mode === "edit") {
        toast.info("Edit filters from Back, then re-run report");
      }
    } catch {
      toast.error("Failed to load Online Payment Report");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = (data: ReportRow[]) => {
    const headers = [
      "Sr.No",
      "Payment Date",
      "Voucher No",
      "Vendor",
      "Document No",
      "Payment Type",
      "Amount",
      "Bank Name",
      "A/C No-IFSC",
      "Payment Mode",
      "UTR / Ref",
      "Status",
      "Entry By",
      "Narration"
    ];
    const lines = data.map((r) =>
      [
        r.srNo,
        r.paymentDateLabel,
        r.voucherNo,
        r.vendorLabel,
        r.documentNo,
        r.paymentType,
        r.amount,
        r.bankName,
        r.acNoIfsc,
        r.paymentMode,
        r.utrRef,
        r.status,
        r.entryBy,
        `"${(r.narration || "").replace(/"/g, '""')}"`
      ].join(",")
    );
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `online-payment-report-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartBars = useMemo(() => {
    if (!summary) return [];
    const entries = Object.entries(summary.byStatus || {});
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([label, value]) => ({
      label,
      value,
      pct: Math.round((value / max) * 100)
    }));
  }, [summary]);

  const typeBars = useMemo(() => {
    if (!summary) return [];
    const entries = Object.entries(summary.byType || {});
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([label, value]) => ({
      label,
      value,
      pct: Math.round((value / max) * 100)
    }));
  }, [summary]);

  const actionBtn =
    "h-11 w-11 rounded-md bg-[#0171d3] hover:bg-[#015fae] text-white inline-flex items-center justify-center disabled:opacity-50 shadow-sm";

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden max-w-xl mx-auto">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              title="Excel"
              onClick={() => void loadReport("excel")}
              className={actionBtn}
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={loading}
              title="Grid"
              onClick={() => void loadReport("grid")}
              className={actionBtn}
            >
              <Table2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={loading}
              title="Chart"
              onClick={() => void loadReport("chart")}
              className={actionBtn}
            >
              <LineChart className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={loading}
              title="Edit / Clear"
              onClick={() => {
                setVendor("");
                setVoucherNo("");
                setFromDate(toInputDate(daysAgo(29)));
                setToDate(toInputDate(new Date()));
                toast.info("Filters reset");
              }}
              className={actionBtn}
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Payment Date</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker((v) => !v)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-sm bg-white text-left text-[13px] text-slate-700 inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="flex-1 truncate">{formatRangeLabel(fromDate, toDate)}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
                {showDatePicker && (
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
                      onClick={() => setShowDatePicker(false)}
                      className="h-8 px-3 self-end rounded-full border border-[#0171d3] text-[#0171d3] text-xs font-semibold"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Vendor"
                className="flex-1 h-11 px-4 border border-[#7eb6e8] rounded-full text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
              />
              <button
                type="button"
                onClick={() => setLookupOpen(true)}
                className="h-10 w-10 rounded-full border border-[#7eb6e8] text-[#0171d3] text-sm font-bold hover:bg-[#e8f1fb]"
                title="Lookup Vendor"
              >
                ...
              </button>
            </div>

            <input
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value.toUpperCase())}
              placeholder="Voucher No"
              className="w-full h-11 px-4 border border-[#7eb6e8] rounded-full text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
            />

            {loading && <p className="text-[11px] text-slate-500 text-center">Loading report...</p>}
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("filter")}
                className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#d7e8f8]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <h1 className="text-base font-bold text-[#0171d3]">Online Payment Report</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Excel"
                onClick={() => {
                  exportCsv(rows);
                  setViewMode("excel");
                  toast.success("Excel (CSV) download started (demo)");
                }}
                className={actionBtn}
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Grid"
                onClick={() => setViewMode("grid")}
                className={`${actionBtn} ${viewMode === "grid" ? "ring-2 ring-offset-1 ring-[#0171d3]" : ""}`}
              >
                <Table2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Chart"
                onClick={() => setViewMode("chart")}
                className={`${actionBtn} ${viewMode === "chart" ? "ring-2 ring-offset-1 ring-[#0171d3]" : ""}`}
              >
                <LineChart className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
              Online Payment Report
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-3 py-2 text-[12px] border-b border-slate-200 bg-[#e8f1fb]">
              <div>
                <span className="font-semibold text-slate-700">Payment Date : </span>
                <span>
                  {summary?.from} — {summary?.to}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Vendor : </span>
                <span>{vendor || "All"}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Voucher No : </span>
                <span>{voucherNo || "All"}</span>
              </div>
            </div>

            {(viewMode === "grid" || viewMode === "excel" || viewMode === "edit") && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px] min-w-[1200px]">
                  <thead>
                    <tr className="bg-[#0171d3] text-white">
                      {[
                        "Sr.No",
                        "Payment Date",
                        "Voucher No",
                        "Vendor",
                        "Document No",
                        "Payment Type",
                        "Amount",
                        "Bank Name",
                        "A/C No-IFSC",
                        "Payment Mode",
                        "UTR / Ref",
                        "Status",
                        "Entry By",
                        "Narration"
                      ].map((h) => (
                        <th
                          key={h}
                          className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                            h === "Amount" ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="odd:bg-white even:bg-slate-50/70">
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{r.srNo}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          {r.paymentDateLabel}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-semibold">
                          {r.voucherNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.vendorLabel}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.documentNo}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.paymentType}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold">
                          {inr(r.amount)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.bankName}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono text-[10px]">
                          {r.acNoIfsc}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.paymentMode}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono text-[10px]">
                          {r.utrRef}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${statusCls(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.entryBy}</td>
                        <td className="border border-slate-200 px-2 py-1.5 max-w-[220px]">{r.narration}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={14} className="border border-slate-200 px-3 py-10 text-center text-slate-500">
                          No online payments for selected filters.
                        </td>
                      </tr>
                    )}
                    {rows.length > 0 && (
                      <tr className="bg-[#5b9bd5] text-white font-semibold">
                        <td className="border border-slate-200 px-2 py-1.5" colSpan={6}>
                          Total ({summary?.totalCount || rows.length})
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right">
                          {inr(summary?.totalAmount || 0)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5" colSpan={7} />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === "chart" && (
              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-sm p-3">
                  <h3 className="text-xs font-bold text-slate-800 mb-3">Amount by Status</h3>
                  <div className="space-y-2">
                    {chartBars.map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="font-semibold text-slate-700">{b.label}</span>
                          <span>{inr(b.value)}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0171d3]" style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    {chartBars.length === 0 && (
                      <p className="text-[11px] text-slate-500">No data for chart.</p>
                    )}
                  </div>
                </div>
                <div className="border border-slate-200 rounded-sm p-3">
                  <h3 className="text-xs font-bold text-slate-800 mb-3">Amount by Payment Type</h3>
                  <div className="space-y-2">
                    {typeBars.map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="font-semibold text-slate-700">{b.label}</span>
                          <span>{inr(b.value)}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    {typeBars.length === 0 && (
                      <p className="text-[11px] text-slate-500">No data for chart.</p>
                    )}
                  </div>
                </div>
                <div className="lg:col-span-2 text-[12px] text-slate-600 border-t border-slate-100 pt-3">
                  Total payments: <span className="font-semibold">{summary?.totalCount || 0}</span> · Amount:{" "}
                  <span className="font-semibold text-[#0171d3]">{inr(summary?.totalAmount || 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {lookupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Select Vendor</h2>
              <button
                type="button"
                onClick={() => setLookupOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Search vendor"
                  className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-xs"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto text-xs">
              <button
                type="button"
                onClick={() => {
                  setVendor("");
                  setLookupOpen(false);
                  setLookupQuery("");
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50 text-slate-500"
              >
                All Vendors
              </button>
              {filteredVendors.map((v) => (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => {
                    setVendor(v.label);
                    setLookupOpen(false);
                    setLookupQuery("");
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50"
                >
                  <span className="font-mono font-semibold text-blue-700">{v.code}</span>
                  <span className="text-slate-700 ml-2">{v.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
