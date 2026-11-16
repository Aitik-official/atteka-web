"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "@/lib/toastBus";

type InvoiceType = "GRN" | "Work Order" | "Direct Invoice" | "GSTR2B Invoice";

type VendorOpt = {
  code: string;
  name: string;
  label: string;
};

const INVOICE_TYPES: InvoiceType[] = ["GRN", "Work Order", "Direct Invoice", "GSTR2B Invoice"];

const FALLBACK_VENDORS: VendorOpt[] = [
  { code: "VND0001", name: "ATLAS SPARES TRADING", label: "VND0001 - ATLAS SPARES TRADING" },
  { code: "VND0002", name: "METRO TYRE SUPPLIES", label: "VND0002 - METRO TYRE SUPPLIES" },
  { code: "VND0003", name: "COASTAL FUEL AGENCY", label: "VND0003 - COASTAL FUEL AGENCY" },
  { code: "VND0004", name: "GATEWAY WORKSHOP SERVICES", label: "VND0004 - GATEWAY WORKSHOP SERVICES" }
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function EnterVendorInvoicePage() {
  const [step, setStep] = useState<"select" | "entry">("select");
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("GRN");
  const [vendor, setVendor] = useState("");
  const [vendors, setVendors] = useState<VendorOpt[]>(FALLBACK_VENDORS);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(toInputDate(new Date()));
  const [amount, setAmount] = useState(1000);
  const [tds, setTds] = useState(0);
  const [narration, setNarration] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/finance/enter-vendor-invoice")
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

  const netPayable = Math.max(0, Number(amount || 0) - Number(tds || 0));

  const handleSelectSubmit = () => {
    if (!vendor.trim()) {
      toast.error("Select vendor");
      return;
    }
    setStep("entry");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/finance/enter-vendor-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceType,
          vendor,
          invoiceNo: invoiceNo.trim() || undefined,
          invoiceDate,
          amount,
          taxableAmount: amount,
          tds,
          netPayable,
          narration
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save vendor invoice");
        return;
      }
      toast.success(data.message || "Vendor invoice saved");
      setStep("select");
      setInvoiceNo("");
      setNarration("");
      setAmount(1000);
      setTds(0);
    } catch {
      toast.error("Failed to save vendor invoice");
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
    <div className="space-y-4 max-w-5xl mx-auto pb-10">
      <h1 className="text-lg font-bold text-[#0171d3]">Vendor Invoice Entry</h1>

      {step === "select" ? (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Vendor Invoice Details
          </div>

          <div className="px-4 py-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-[12px]">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {INVOICE_TYPES.map((type) => (
                  <label key={type} className="inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input
                      type="radio"
                      name="invoiceType"
                      checked={invoiceType === type}
                      onChange={() => setInvoiceType(type)}
                      className="accent-[#0171d3]"
                    />
                    <span className="text-slate-800 font-medium">{type}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-slate-800">Vendor</span>
                <input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  list="vendor-invoice-vendors"
                  className="h-8 w-44 px-2 border border-slate-300 rounded-sm text-[12px] bg-white"
                />
                <datalist id="vendor-invoice-vendors">
                  {vendors.map((v) => (
                    <option key={v.code} value={v.label} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={() => setLookupOpen(true)}
                  className="h-8 w-8 rounded-full bg-[#0171d3] text-white text-[11px] font-bold hover:bg-[#015fae]"
                  title="Lookup vendor"
                >
                  ....
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center py-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSelectSubmit}
              className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50"
            >
              Submit
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Enter Invoice — {invoiceType} · {vendor}
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Invoice No</span>
              <input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                className={fieldCls}
                placeholder="Auto if blank"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Invoice Date</span>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className={fieldCls}
              />
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
              <span className="font-semibold">TDS</span>
              <input
                type="number"
                value={tds}
                onChange={(e) => setTds(Number(e.target.value) || 0)}
                className={fieldCls}
              />
            </label>
            <label className="sm:col-span-2 flex flex-col gap-1">
              <span className="font-semibold">Narration</span>
              <input
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className={fieldCls}
              />
            </label>
            <p className="sm:col-span-2 text-slate-600">
              Net Payable:{" "}
              <span className="font-mono font-semibold">
                {netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
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
              {saving ? "Saving..." : "Save Invoice"}
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
