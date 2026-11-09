"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Search, X } from "lucide-react";
import { toast } from "@/lib/toastBus";

type PaymentRow = {
  srNo: number;
  voucherNo: string;
  voucherDate: string;
  location: string;
  vendor: string;
  paymentType: string;
  amount: number;
  tds: number;
  netAmount: number;
  invoiceNo: string;
};

type VendorOpt = { code: string; name: string; label: string };
type DateMode = "range" | "today" | "last7";
type SearchMode = "criteria" | "invoice" | "voucher";

const FALLBACK_VENDORS: VendorOpt[] = [
  { code: "VND0001", name: "ATLAS SPARES TRADING", label: "VND0001 - ATLAS SPARES TRADING" },
  { code: "VND0002", name: "METRO TYRE SUPPLIES", label: "VND0002 - METRO TYRE SUPPLIES" },
  { code: "VND0003", name: "COASTAL FUEL AGENCY", label: "VND0003 - COASTAL FUEL AGENCY" },
  { code: "VND0004", name: "GATEWAY WORKSHOP SERVICES", label: "VND0004 - GATEWAY WORKSHOP SERVICES" }
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function todayLongLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function fmtAmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

export default function ViewVendorInvoicePaymentPage() {
  const today = useMemo(() => toInputDate(new Date()), []);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [searchMode, setSearchMode] = useState<SearchMode>("criteria");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [vendor, setVendor] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [voucherNumber, setVoucherNumber] = useState("");
  const [vendors, setVendors] = useState<VendorOpt[]>(FALLBACK_VENDORS);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/vendors")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !Array.isArray(d.data) || !d.data.length) return;
        setVendors(
          d.data.slice(0, 80).map((v: any) => {
            const code = String(v.vendorCode || v.code || v._id || "").trim();
            const name = String(v.name || v.vendorName || "Vendor").trim();
            return {
              code: code || name.slice(0, 8).toUpperCase(),
              name,
              label: code ? `${code} - ${name}` : name
            };
          })
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchMode !== "criteria") return;
    if (dateMode === "today") {
      setFromDate(today);
      setToDate(today);
    } else if (dateMode === "last7") {
      setFromDate(toInputDate(daysAgo(6)));
      setToDate(today);
    }
  }, [dateMode, searchMode, today]);

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

  const resolveDates = () => {
    if (dateMode === "today") return { from: today, to: today };
    if (dateMode === "last7") return { from: toInputDate(daysAgo(6)), to: today };
    return { from: fromDate, to: toDate };
  };

  const loadRows = async () => {
    if (searchMode === "invoice" && !invoiceNumber.trim()) {
      toast.error("Enter Invoice Number");
      return;
    }
    if (searchMode === "voucher" && !voucherNumber.trim()) {
      toast.error("Enter Voucher Number");
      return;
    }
    setLoading(true);
    try {
      const { from, to } = resolveDates();
      const mode = searchMode === "criteria" ? "date" : searchMode;
      const params = new URLSearchParams({
        mode,
        from,
        to,
        vendor: searchMode === "criteria" ? vendor.trim() : "",
        invoiceNumber: searchMode === "invoice" ? invoiceNumber.trim() : "",
        voucherNumber: searchMode === "voucher" ? voucherNumber.trim() : ""
      });
      const res = await fetch(`/api/finance/view-vendor-invoice-payment?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load payments");
        return;
      }
      setRows(data.data || []);
      setStep("report");
      if (!(data.data || []).length) toast.warning("No payments found");
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {step === "filter" && (
        <div>
          <div className="mb-4">
            <h1 className="text-lg font-bold text-[#0171d3]">View Vendor Invoice Payment</h1>
            <div className="mt-1 border-b border-[#0171d3]" />
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
              Select Vendor Invoice Payment Criteria
            </div>

            <div className="px-4 py-4 space-y-4 text-[12px]">
              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-start">
                <div className="font-semibold text-slate-800 pt-1">Payment Date</div>
                <div className="space-y-2.5">
                  <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payDate"
                      checked={searchMode === "criteria" && dateMode === "range"}
                      onChange={() => {
                        setSearchMode("criteria");
                        setDateMode("range");
                      }}
                      className="accent-[#0171d3]"
                    />
                    <span>From :</span>
                    <input
                      type="date"
                      value={fromDate}
                      disabled={searchMode !== "criteria" || dateMode !== "range"}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="h-8 px-2 border border-blue-200 rounded-sm w-[145px] disabled:bg-slate-100"
                    />
                    <span>To :</span>
                    <input
                      type="date"
                      value={toDate}
                      disabled={searchMode !== "criteria" || dateMode !== "range"}
                      onChange={(e) => setToDate(e.target.value)}
                      className="h-8 px-2 border border-blue-200 rounded-sm w-[145px] disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payDate"
                      checked={searchMode === "criteria" && dateMode === "today"}
                      onChange={() => {
                        setSearchMode("criteria");
                        setDateMode("today");
                      }}
                      className="accent-[#0171d3]"
                    />
                    <span>Todays - {todayLongLabel()}</span>
                  </label>
                  <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payDate"
                      checked={searchMode === "criteria" && dateMode === "last7"}
                      onChange={() => {
                        setSearchMode("criteria");
                        setDateMode("last7");
                      }}
                      className="accent-[#0171d3]"
                    />
                    <span>Last 7 Days</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center border-t border-slate-200 pt-4">
                <div className="font-semibold text-slate-800">Vendor Name</div>
                <div className="flex items-center gap-2">
                  <input
                    value={vendor}
                    onChange={(e) => {
                      setVendor(e.target.value);
                      setSearchMode("criteria");
                    }}
                    list="view-vip-vendors"
                    className="h-8 w-56 px-2 border border-blue-200 rounded-sm"
                  />
                  <datalist id="view-vip-vendors">
                    {vendors.map((v) => (
                      <option key={v.code} value={v.label} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={() => setLookupOpen(true)}
                    className="h-8 w-8 rounded-full bg-[#5dade2] text-white text-[11px] font-bold"
                  >
                    ...
                  </button>
                </div>
              </div>

              <div className="text-center font-bold text-red-600 py-0.5 border-t border-slate-100 pt-3">
                OR
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center">
                <div className="font-semibold text-slate-800">Invoice Number :</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payDate"
                    checked={searchMode === "invoice"}
                    onChange={() => setSearchMode("invoice")}
                    className="accent-[#0171d3]"
                  />
                  <input
                    value={invoiceNumber}
                    onChange={(e) => {
                      setInvoiceNumber(e.target.value.toUpperCase());
                      setSearchMode("invoice");
                    }}
                    onFocus={() => setSearchMode("invoice")}
                    className="h-8 flex-1 max-w-md px-2 border border-blue-200 rounded-sm font-mono uppercase"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 items-center">
                <div className="font-semibold text-slate-800">Voucher Number</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payDate"
                    checked={searchMode === "voucher"}
                    onChange={() => setSearchMode("voucher")}
                    className="accent-[#0171d3]"
                  />
                  <input
                    value={voucherNumber}
                    onChange={(e) => {
                      setVoucherNumber(e.target.value.toUpperCase());
                      setSearchMode("voucher");
                    }}
                    onFocus={() => setSearchMode("voucher")}
                    className="h-8 w-48 px-2 border border-blue-200 rounded-sm font-mono uppercase"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-center py-4 border-t border-slate-200">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadRows()}
                className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-8 w-8 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-[#0171d3]">View Vendor Invoice Payment</h1>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1100px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    {[
                      "Sr No",
                      "Voucher No.",
                      "Voucher Date",
                      "Location",
                      "Vendor",
                      "Payment Type",
                      "Amount",
                      "TDS",
                      "Net Amount",
                      "View"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-2 font-semibold whitespace-nowrap ${
                          ["Amount", "TDS", "Net Amount"].includes(h) ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="border border-slate-200 px-3 py-8 text-center text-slate-500"
                      >
                        No payments to display.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr
                        key={r.voucherNo}
                        className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/40"
                      >
                        <td className="border border-slate-200 px-2 py-1.5 font-mono">{r.srNo}</td>
                        <td className="border border-slate-200 px-2 py-1.5 font-mono font-semibold text-blue-700 whitespace-nowrap">
                          {r.voucherNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          {r.voucherDate}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 font-mono">{r.location}</td>
                        <td
                          className="border border-slate-200 px-2 py-1.5 max-w-[220px] truncate"
                          title={r.vendor}
                        >
                          {r.vendor}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5">{r.paymentType}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                          {fmtAmt(r.amount)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                          {fmtAmt(r.tds)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono font-semibold text-emerald-700">
                          {fmtAmt(r.netAmount)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => toast.success(`View ${r.voucherNo} (demo)`)}
                            className="inline-flex items-center gap-1 text-blue-600 font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {lookupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
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
              {filteredVendors.map((v) => (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => {
                    setVendor(v.label);
                    setSearchMode("criteria");
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
