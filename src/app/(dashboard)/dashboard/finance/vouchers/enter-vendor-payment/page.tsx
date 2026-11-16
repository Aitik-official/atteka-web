"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "@/lib/toastBus";

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

export default function EnterVendorPaymentPage() {
  const [step, setStep] = useState<"select" | "payment">("select");
  const [vendor, setVendor] = useState("");
  const [vendors, setVendors] = useState<VendorOpt[]>(FALLBACK_VENDORS);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [paymentDate, setPaymentDate] = useState(toInputDate(new Date()));
  const [amount, setAmount] = useState(1000);
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [againstInvoice, setAgainstInvoice] = useState("");
  const [narration, setNarration] = useState("");
  const [openInvoices, setOpenInvoices] = useState<
    { voucherNumber: string; invoiceNo: string; amount: number }[]
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/finance/enter-vendor-payment?vendors=1")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !Array.isArray(d.data) || !d.data.length) return;
        setVendors(
          d.data.map((v: any) => ({
            code: String(v.code || ""),
            name: String(v.name || ""),
            label: String(v.label || `${v.code} - ${v.name}`)
          }))
        );
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

  const handleSelectSubmit = async () => {
    if (!vendor.trim()) {
      toast.error("Select vendor");
      return;
    }
    try {
      const res = await fetch(
        `/api/finance/enter-vendor-payment?vendor=${encodeURIComponent(vendor)}`
      );
      const data = await res.json();
      setOpenInvoices(
        (data.data || []).map((r: any) => ({
          voucherNumber: r.voucherNumber,
          invoiceNo: r.invoiceNo || r.docRefNo || "",
          amount: Number(r.totalAccountedAmount || r.amount || 0)
        }))
      );
    } catch {
      setOpenInvoices([]);
    }
    setStep("payment");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/finance/enter-vendor-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor,
          paymentDate,
          amount,
          paymentMode,
          againstInvoice: againstInvoice || undefined,
          narration
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save vendor payment");
        return;
      }
      toast.success(data.message || "Vendor payment saved");
      setStep("select");
      setAgainstInvoice("");
      setNarration("");
      setAmount(1000);
    } catch {
      toast.error("Failed to save vendor payment");
    } finally {
      setSaving(false);
    }
  };

  const pickVendor = (v: VendorOpt) => {
    setVendor(v.label);
    setLookupOpen(false);
    setLookupQuery("");
  };

  const fieldCls =
    "h-8 px-2 border border-slate-300 rounded-sm text-[12px] bg-white focus:outline-none focus:border-[#0171d3]";

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      <h1 className="text-lg font-bold text-[#0171d3]">Vendor Invoice Payment</h1>
      <div className="border-b border-slate-200" />

      {step === "select" ? (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-2xl">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Vendor Invoice Details
          </div>

          <div className="px-4 py-6">
            <div className="flex items-center justify-center gap-3 text-[12px]">
              <span className="font-semibold text-slate-800">Vendor</span>
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                list="vendor-payment-vendors"
                className="h-8 w-48 px-2 border border-blue-300 rounded-sm text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                autoFocus
              />
              <datalist id="vendor-payment-vendors">
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
                ....
              </button>
            </div>
          </div>

          <div className="flex justify-center py-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => void handleSelectSubmit()}
              className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50"
            >
              Submit
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Payment Entry — {vendor}
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Payment Date</span>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={fieldCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Mode</span>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className={fieldCls}
              >
                {["NEFT", "RTGS", "Cheque", "Cash", "UPI"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Amount</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className={fieldCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Against Invoice</span>
              <input
                value={againstInvoice}
                onChange={(e) => setAgainstInvoice(e.target.value.toUpperCase())}
                list="open-vendor-invoices"
                className={fieldCls}
                placeholder="Optional"
              />
              <datalist id="open-vendor-invoices">
                {openInvoices.map((inv) => (
                  <option
                    key={inv.voucherNumber}
                    value={inv.invoiceNo || inv.voucherNumber}
                  >{`${inv.invoiceNo || inv.voucherNumber} · ${inv.amount}`}</option>
                ))}
              </datalist>
            </label>
            <label className="sm:col-span-2 flex flex-col gap-1">
              <span className="font-semibold">Narration</span>
              <input
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className={fieldCls}
              />
            </label>
          </div>
          {openInvoices.length > 0 && (
            <div className="px-4 pb-2 text-[11px] text-slate-500">
              {openInvoices.length} open invoice(s) for this vendor in replica store.
            </div>
          )}
          <div className="flex justify-center gap-3 py-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="min-w-[110px] h-9 px-6 rounded-full border border-slate-300 text-slate-700 bg-white text-[12px] font-semibold hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Payment"}
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
                    onClick={() => pickVendor(v)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50"
                  >
                    <span className="font-mono font-semibold text-blue-700">{v.code}</span>
                    <span className="text-slate-700 ml-2">{v.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
