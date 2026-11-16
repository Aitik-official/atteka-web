"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "@/lib/toastBus";

type DateMode = "range" | "today" | "last7";
type SearchMode = "criteria" | "invoice";

type VendorOpt = {
  code: string;
  name: string;
  label: string;
};

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

export default function CancelVendorInvoicePage() {
  const today = useMemo(() => toInputDate(new Date()), []);
  const [searchMode, setSearchMode] = useState<SearchMode>("criteria");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [vendor, setVendor] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [vendors, setVendors] = useState<VendorOpt[]>(FALLBACK_VENDORS);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [step, setStep] = useState<"criteria" | "results" | "confirm">("criteria");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async () => {
    if (searchMode === "invoice" && !invoiceNumber.trim()) {
      toast.error("Enter Invoice Number");
      return;
    }
    setSaving(true);
    try {
      if (searchMode === "invoice") {
        const res = await fetch(
          `/api/finance/cancel-vendor-invoice?invoiceNo=${encodeURIComponent(invoiceNumber.trim())}`
        );
        const data = await res.json();
        const row = data.data;
        if (!row) {
          toast.error("Invoice not found");
          return;
        }
        setResults([row]);
      } else {
        const res = await fetch("/api/finance/cancel-vendor-invoice");
        const data = await res.json();
        let rows = (data.data || []).filter(
          (r: any) => String(r.status || "").toLowerCase() !== "cancelled"
        );
        if (vendor.trim()) {
          const q = vendor.trim().toLowerCase();
          rows = rows.filter(
            (r: any) =>
              String(r.payTo || "").toLowerCase().includes(q) ||
              String(r.party || "").toLowerCase().includes(q)
          );
        }
        rows = rows.filter((r: any) => {
          const iso = String(r.voucherDateIso || "").slice(0, 10);
          return (!fromDate || iso >= fromDate) && (!toDate || iso <= toDate);
        });
        setResults(rows);
      }
      setStep("results");
    } catch {
      toast.error("Search failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!selected?.voucherNumber && !selected?.invoiceNo) return;
    setSaving(true);
    try {
      const res = await fetch("/api/finance/cancel-vendor-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucherNumber: selected.voucherNumber,
          invoiceNo: selected.invoiceNo,
          reason: reason.trim() || "Vendor invoice cancelled"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cancel failed");
        return;
      }
      toast.success(data.message || "Invoice cancelled");
      setStep("criteria");
      setSelected(null);
      setResults([]);
      setReason("");
    } catch {
      toast.error("Cancel failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      {step === "criteria" && (
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
          Select Vendor Invoice Payment Criteria
        </div>

        <div className="px-4 py-4 space-y-4 text-[12px]">
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-start">
            <div className="font-semibold text-slate-800 pt-1">Invoice Date</div>
            <div className="space-y-2.5">
              <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="invoiceDate"
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
                  className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[145px] disabled:bg-slate-100"
                />
                <span>To :</span>
                <input
                  type="date"
                  value={toDate}
                  disabled={searchMode !== "criteria" || dateMode !== "range"}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[145px] disabled:bg-slate-100"
                />
              </label>

              <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="invoiceDate"
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
                  name="invoiceDate"
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

          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-center border-t border-slate-200 pt-4">
            <div className="font-semibold text-slate-800">Vendor</div>
            <div className="flex items-center gap-2">
              <input
                value={vendor}
                onChange={(e) => {
                  setVendor(e.target.value);
                  setSearchMode("criteria");
                }}
                list="cancel-vi-vendors"
                className="h-8 w-48 px-2 border border-slate-300 rounded-sm text-[12px] bg-white"
              />
              <datalist id="cancel-vi-vendors">
                {vendors.map((v) => (
                  <option key={v.code} value={v.label} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => setLookupOpen(true)}
                className="h-8 w-8 rounded-full bg-[#5dade2] text-white text-[11px] font-bold hover:bg-[#3498db]"
                title="Lookup vendor"
              >
                ...
              </button>
            </div>
          </div>

          <div className="text-center font-bold text-red-600 py-0.5">OR</div>

          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-center">
            <div className="font-semibold text-slate-800">Invoice Number :</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="invoiceDate"
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
                className="h-8 flex-1 max-w-md px-2 border border-slate-300 rounded-sm text-[12px] font-mono uppercase"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-center py-4 border-t border-slate-200">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
          >
            {saving ? "..." : "Submit"}
          </button>
        </div>
      </div>
      )}

      {step === "results" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 flex items-center justify-between">
            <span>Select Invoice to Cancel</span>
            <button
              type="button"
              onClick={() => setStep("criteria")}
              className="text-[11px] font-semibold underline"
            >
              Back
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[#0d47a1]">
                  {["Voucher", "Invoice", "Date", "Vendor", "Amount", ""].map((h) => (
                    <th key={h} className="border border-slate-200 px-2 py-1.5 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  results.map((r) => (
                    <tr key={r.voucherNumber || r.invoiceNo} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 px-2 py-1.5 font-mono text-blue-700">
                        {r.voucherNumber}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 font-mono">
                        {r.invoiceNo || r.docRefNo || "—"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5">{r.voucherDate}</td>
                      <td className="border border-slate-200 px-2 py-1.5">{r.payTo}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                        {Number(r.totalAccountedAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2
                        })}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(r);
                            setStep("confirm");
                          }}
                          className="text-rose-600 font-semibold"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === "confirm" && selected && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Confirm Cancel
          </div>
          <div className="p-4 text-[12px] space-y-2">
            <p>
              <span className="font-semibold">Voucher:</span>{" "}
              <span className="font-mono text-blue-700">{selected.voucherNumber}</span>
            </p>
            <p>
              <span className="font-semibold">Invoice:</span>{" "}
              {selected.invoiceNo || selected.docRefNo || "—"}
            </p>
            <p>
              <span className="font-semibold">Vendor:</span> {selected.payTo}
            </p>
            <label className="flex flex-col gap-1 pt-1">
              <span className="font-semibold">Reason</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-8 px-2 border border-slate-300 rounded-sm"
              />
            </label>
          </div>
          <div className="py-4 flex justify-center gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep("results")}
              className="min-w-[110px] h-9 px-6 rounded-full border border-slate-300 text-[12px] font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleCancel()}
              className="min-w-[110px] h-9 px-6 rounded-full border border-rose-500 text-rose-600 text-[12px] font-semibold hover:bg-rose-50 disabled:opacity-50"
            >
              {saving ? "Cancelling..." : "Confirm Cancel"}
            </button>
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
                  placeholder="Search vendor code or name"
                  className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-xs"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto text-xs">
              {filteredVendors.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No vendors found</p>
              ) : (
                filteredVendors.map((v) => (
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
                ))
              )}
            </div>
            <div className="px-4 py-2 bg-slate-50 text-[10px] text-slate-500">
              Lookup only — does not cancel or update invoices.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
