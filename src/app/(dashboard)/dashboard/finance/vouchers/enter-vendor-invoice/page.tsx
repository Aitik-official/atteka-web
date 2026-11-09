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

export default function EnterVendorInvoicePage() {
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("GRN");
  const [vendor, setVendor] = useState("");
  const [vendors, setVendors] = useState<VendorOpt[]>(FALLBACK_VENDORS);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");

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

  const handleSubmit = () => {
    // Step 2 intentionally not built — avoids creating vendor invoice entries.
    toast.info(
      `Selection saved locally only (${invoiceType}${vendor ? ` · ${vendor}` : ""}). Next entry step not enabled.`
    );
  };

  const pickVendor = (v: VendorOpt) => {
    setVendor(v.label);
    setLookupOpen(false);
    setLookupQuery("");
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10">
      <h1 className="text-lg font-bold text-[#0171d3]">Vendor Invoice Entry</h1>

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
            onClick={handleSubmit}
            className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50"
          >
            Submit
          </button>
        </div>
      </div>

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
            <div className="px-4 py-2 bg-slate-50 text-[10px] text-slate-500">
              Lookup only — does not create or update vendor masters.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
