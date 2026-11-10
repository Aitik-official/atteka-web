"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, FileSpreadsheet, Table2, RefreshCw, Pencil, Printer, Search, X, Save } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type Txn = {
  _id?: string;
  vehicleNo: string;
  cardNumber?: string;
  roName?: string;
  roLocation?: string;
  roContactNo?: string;
  transactionId: string;
  transactionDate: string | Date;
  transactionStatus?: string;
  productName?: string;
  productQty: number;
  rate: number;
  transactionAmount: number;
  cmsOpeningBal?: number;
  cmsClosingBal?: number;
  walletBalance?: number;
  tripSheetNo?: string;
  tripSheetDate?: string | Date;
  voucherNo?: string;
  voucherDate?: string | Date;
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
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(value?: string | Date) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(value?: string | Date) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function inr(n: number) {
  return Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const emptyForm = {
  vehicleNo: "",
  cardNumber: "",
  roName: "",
  roLocation: "",
  roContactNo: "",
  transactionId: "",
  transactionDate: toInputDate(new Date()),
  transactionStatus: "SUCCESS",
  productName: "HSD / DIESEL",
  productQty: 0,
  rate: 0,
  transactionAmount: 0,
  cmsOpeningBal: 0,
  cmsClosingBal: 0,
  walletBalance: 0,
  tripSheetNo: "",
  tripSheetDate: toInputDate(new Date()),
  voucherNo: "",
  voucherDate: ""
};

export default function BpclSaleTransactionPage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"date" | "vehicle">("date");
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [rows, setRows] = useState<Txn[]>([]);
  const [totals, setTotals] = useState({ productQty: 0, transactionAmount: 0 });
  const [loading, setLoading] = useState(false);
  const [findText, setFindText] = useState("");
  const [zoom, setZoom] = useState("100%");
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const nos = (d.data || [])
          .map((v: any) => String(v.vehicleNumber || "").trim().toUpperCase())
          .filter(Boolean);
        const unique = [...new Set(nos)] as string[];
        setVehicles(unique);
        if (!vehicleNo && unique[0]) setVehicleNo(unique[0]);
      })
      .catch(() => {});
  }, []);

  const dateLabel = useMemo(
    () => `${formatLong(fromDate)} - ${formatLong(toDate)}`,
    [fromDate, toDate]
  );

  const filteredRows = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.vehicleNo,
        r.cardNumber,
        r.roName,
        r.roLocation,
        r.transactionId,
        r.productName,
        r.tripSheetNo,
        r.voucherNo
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, findText]);

  const loadReport = async (mode: "date" | "vehicle" = filterMode, alsoExport = false) => {
    if (mode === "vehicle" && !vehicleNo) {
      toast.error("Select Vehicle Number");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mode === "vehicle") {
        params.set("mode", "vehicle");
        params.set("vehicleNo", vehicleNo);
      } else {
        params.set("from", fromDate);
        params.set("to", toDate);
      }
      const res = await fetch(`/api/fleet/bpcl-transactions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load BPCL transactions");
        return;
      }
      const list: Txn[] = data.data || [];
      setRows(list);
      setTotals(data.totals || { productQty: 0, transactionAmount: 0 });
      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — showing memory fallback");
      if (alsoExport) {
        // export uses latest list immediately (state may not have flushed)
        const headers = [
          "Vehicle No","Card Number","Ro Name","Ro Location","Ro Contact No","Transaction Id",
          "Transaction Date","Transaction Status","Product Name","Product Qty","Rate","Transaction Amount",
          "Cms Opening Bal","Cms Closing Bal","Wallet Balance","Trip Sheet No","Trip Sheet Date","Voucher No","Voucher Date"
        ];
        const lines = list.map((r) =>
          [
            r.vehicleNo, r.cardNumber, r.roName, r.roLocation, r.roContactNo, r.transactionId,
            formatDateTime(r.transactionDate), r.transactionStatus, r.productName, r.productQty, r.rate,
            r.transactionAmount, r.cmsOpeningBal, r.cmsClosingBal, r.walletBalance, r.tripSheetNo,
            formatDate(r.tripSheetDate), r.voucherNo, formatDate(r.voucherDate)
          ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
        );
        const csv = [headers.join(","), ...lines].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BPCL_Fuel_Summary_${fromDate}_${toDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Excel / CSV exported");
      }
    } catch {
      toast.error("Failed to load BPCL transactions");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (filteredRows.length === 0) {
      toast.error("No data to export — generate report first");
      return;
    }
    const headers = [
      "Vehicle No",
      "Card Number",
      "Ro Name",
      "Ro Location",
      "Ro Contact No",
      "Transaction Id",
      "Transaction Date",
      "Transaction Status",
      "Product Name",
      "Product Qty",
      "Rate",
      "Transaction Amount",
      "Cms Opening Bal",
      "Cms Closing Bal",
      "Wallet Balance",
      "Trip Sheet No",
      "Trip Sheet Date",
      "Voucher No",
      "Voucher Date"
    ];
    const lines = filteredRows.map((r) =>
      [
        r.vehicleNo,
        r.cardNumber,
        r.roName,
        r.roLocation,
        r.roContactNo,
        r.transactionId,
        formatDateTime(r.transactionDate),
        r.transactionStatus,
        r.productName,
        r.productQty,
        r.rate,
        r.transactionAmount,
        r.cmsOpeningBal,
        r.cmsClosingBal,
        r.walletBalance,
        r.tripSheetNo,
        formatDate(r.tripSheetDate),
        r.voucherNo,
        formatDate(r.voucherDate)
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BPCL_Fuel_Summary_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  const printReport = () => printScoped();

  const saveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleNo) {
      toast.error("Vehicle No is required");
      return;
    }
    setSaving(true);
    try {
      const qty = Number(form.productQty) || 0;
      const rate = Number(form.rate) || 0;
      const res = await fetch("/api/fleet/bpcl-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          productQty: qty,
          rate,
          transactionAmount: Number(form.transactionAmount) || qty * rate
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save transaction");
        return;
      }
      toast.sticky("BPCL transaction saved", {
        type: "success",
        title: data.isMemoryStore ? "BPCL (Memory)" : "BPCL Sale",
        code: data.data?.transactionId
      });
      setShowEdit(false);
      setForm({ ...emptyForm, vehicleNo: vehicleNo || "" });
      if (step === "report") await loadReport();
    } catch {
      toast.error("Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  const zoomScale = Number(String(zoom).replace("%", "")) / 100 || 1;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 max-w-xl mx-auto">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date</label>
              <button
                type="button"
                onClick={() => setFilterMode("date")}
                className={`w-full flex items-center gap-2 h-11 px-3 border rounded-md text-left text-sm ${
                  filterMode === "date" ? "border-[#0171d3] ring-1 ring-[#0171d3]/40" : "border-slate-300"
                }`}
              >
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate text-slate-800">{dateLabel}</span>
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFilterMode("date");
                    setFromDate(e.target.value);
                  }}
                  className="h-9 px-2 border border-slate-300 rounded text-xs"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setFilterMode("date");
                    setToDate(e.target.value);
                  }}
                  className="h-9 px-2 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="text-center font-bold text-slate-800 tracking-wide">OR</div>

            <div>
              <label className="block text-xs font-semibold text-[#0171d3] mb-1.5">Vehicle Number</label>
              <select
                value={vehicleNo}
                onChange={(e) => {
                  setFilterMode("vehicle");
                  setVehicleNo(e.target.value);
                }}
                onFocus={() => setFilterMode("vehicle")}
                className={`w-full h-11 px-3 border rounded-md text-sm bg-white ${
                  filterMode === "vehicle" ? "border-[#0171d3] ring-1 ring-[#0171d3]/40" : "border-slate-300"
                }`}
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                title="Export Excel"
                onClick={() => loadReport(filterMode, true)}
                className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
              >
                <FileSpreadsheet className="w-5 h-5" />
              </button>
              <button
                type="button"
                title="View Report"
                disabled={loading}
                onClick={() => loadReport(filterMode)}
                className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center disabled:opacity-60"
              >
                <Table2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                title="Refresh"
                onClick={() => loadReport(filterMode)}
                className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                title="Manual Entry"
                onClick={() => {
                  setForm({ ...emptyForm, vehicleNo: vehicleNo || "" });
                  setShowEdit(true);
                }}
                className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
              >
                <Pencil className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div data-print-root className="bg-white border border-slate-300 shadow-sm print:border-0 print:shadow-none">
          {/* Report toolbar */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-300 text-[11px] print:hidden">
            <span className="text-slate-600">1 of 1</span>
            <select
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
              className="h-7 px-1 border border-slate-300 rounded bg-white"
            >
              <option>75%</option>
              <option>100%</option>
              <option>125%</option>
              <option>150%</option>
            </select>
            <div className="flex items-center gap-1 ml-2">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Find"
                className="h-7 w-40 px-2 border border-slate-300 rounded"
              />
              <button type="button" className="h-7 px-2 border border-slate-300 rounded bg-white">
                Next
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={exportExcel}
                className="h-7 px-2 border border-slate-300 rounded bg-white inline-flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                type="button"
                onClick={printReport}
                className="h-7 px-2 border border-slate-300 rounded bg-white inline-flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                type="button"
                onClick={() => loadReport(filterMode)}
                className="h-7 px-2 border border-slate-300 rounded bg-white inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button
                type="button"
                onClick={() => setStep("filter")}
                className="h-7 px-2 border border-slate-300 rounded bg-white"
              >
                Back
              </button>
            </div>
          </div>

          <div style={{ zoom: zoomScale }} className="p-4 overflow-x-auto">
            <div className="text-center mb-3">
              <div className="text-base font-bold text-slate-800">Fuel Summary Report</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Date From {formatLong(fromDate)} To {formatLong(toDate)}
                {filterMode === "vehicle" && vehicleNo ? ` · Vehicle ${vehicleNo}` : ""}
              </div>
            </div>

            <table className="w-full border-collapse text-[11px] min-w-[1400px]">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  {[
                    "Vehicle No",
                    "Card Number",
                    "Ro Name",
                    "Ro Location",
                    "Ro Contact No",
                    "Transaction Id",
                    "Transaction Date",
                    "Transaction Status",
                    "Product Name",
                    "Product Qty",
                    "Rate",
                    "Transaction Amount",
                    "Cms Opening Bal",
                    "Cms Closing Bal",
                    "Wallet Balance",
                    "Trip Sheet No",
                    "Trip Sheet Date",
                    "Voucher No",
                    "Voucher Date"
                  ].map((h) => (
                    <th key={h} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, idx) => (
                  <tr key={r._id || r.transactionId || idx} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-1 font-mono font-semibold">{r.vehicleNo}</td>
                    <td className="border border-slate-200 px-2 py-1 font-mono">{r.cardNumber}</td>
                    <td className="border border-slate-200 px-2 py-1">{r.roName}</td>
                    <td className="border border-slate-200 px-2 py-1">{r.roLocation}</td>
                    <td className="border border-slate-200 px-2 py-1 font-mono">{r.roContactNo}</td>
                    <td className="border border-slate-200 px-2 py-1 font-mono text-[#0171d3]">{r.transactionId}</td>
                    <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{formatDateTime(r.transactionDate)}</td>
                    <td className="border border-slate-200 px-2 py-1">{r.transactionStatus}</td>
                    <td className="border border-slate-200 px-2 py-1">{r.productName}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right font-mono">{inr(r.productQty)}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right font-mono">{inr(r.rate)}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right font-mono font-semibold">
                      {inr(r.transactionAmount)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1 text-right font-mono">{inr(Number(r.cmsOpeningBal))}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right font-mono">{inr(Number(r.cmsClosingBal))}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right font-mono">{inr(Number(r.walletBalance))}</td>
                    <td className="border border-slate-200 px-2 py-1 font-mono">{r.tripSheetNo}</td>
                    <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{formatDate(r.tripSheetDate)}</td>
                    <td className="border border-slate-200 px-2 py-1 font-mono">{r.voucherNo}</td>
                    <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{formatDate(r.voucherDate)}</td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={19} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No BPCL sale transactions found for selected criteria.
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-200 px-2 py-1.5" colSpan={8}></td>
                  <td className="border border-slate-200 px-2 py-1.5">Total :</td>
                  <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">{inr(totals.productQty)}</td>
                  <td className="border border-slate-200 px-2 py-1.5"></td>
                  <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">{inr(totals.transactionAmount)}</td>
                  <td className="border border-slate-200 px-2 py-1.5" colSpan={7}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={saveManual}
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800">Manual BPCL Sale Entry</h3>
              <button type="button" onClick={() => setShowEdit(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {(
                [
                  ["vehicleNo", "Vehicle No"],
                  ["cardNumber", "Card Number"],
                  ["roName", "Ro Name"],
                  ["roLocation", "Ro Location"],
                  ["roContactNo", "Ro Contact No"],
                  ["transactionId", "Transaction Id"],
                  ["transactionDate", "Transaction Date", "date"],
                  ["transactionStatus", "Transaction Status"],
                  ["productName", "Product Name"],
                  ["productQty", "Product Qty", "number"],
                  ["rate", "Rate", "number"],
                  ["transactionAmount", "Transaction Amount", "number"],
                  ["cmsOpeningBal", "Cms Opening Bal", "number"],
                  ["cmsClosingBal", "Cms Closing Bal", "number"],
                  ["walletBalance", "Wallet Balance", "number"],
                  ["tripSheetNo", "Trip Sheet No"],
                  ["tripSheetDate", "Trip Sheet Date", "date"],
                  ["voucherNo", "Voucher No"],
                  ["voucherDate", "Voucher Date", "date"]
                ] as [keyof typeof form, string, string?][]
              ).map(([key, label, type]) => (
                <div key={key}>
                  <label className="block font-semibold text-slate-700 mb-1">{label}</label>
                  <input
                    type={type || "text"}
                    value={form[key] as any}
                    onChange={(e) => {
                      const val = type === "number" ? Number(e.target.value) : e.target.value;
                      setForm((prev) => {
                        const next = { ...prev, [key]: val };
                        if (key === "productQty" || key === "rate") {
                          next.transactionAmount =
                            Number(key === "productQty" ? val : next.productQty) *
                            Number(key === "rate" ? val : next.rate);
                        }
                        return next;
                      });
                    }}
                    className="w-full h-8 px-2 border border-slate-300 rounded"
                    list={key === "vehicleNo" ? "bpcl-vehicles" : undefined}
                  />
                </div>
              ))}
              <datalist id="bpcl-vehicles">
                {vehicles.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 bg-[#0171d3] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save to Database"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
