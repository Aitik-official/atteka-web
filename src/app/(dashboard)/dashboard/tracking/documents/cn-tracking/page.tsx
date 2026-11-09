"use client";

import React, { useState } from "react";
import { MapPin, Truck, Package, FileText } from "lucide-react";
import { toast } from "@/lib/toastBus";

type TrackRow = {
  docketNo: string;
  bookingDate?: string | Date;
  billingParty?: string;
  fromLocation?: string;
  toLocation?: string;
  vehicleNo?: string;
  status?: string;
  tripSheetNo?: string;
  podUrl?: string;
  ewayBillNo?: string;
  consignor?: { name?: string };
  consignee?: { name?: string };
  invoiceDetails?: { invoiceBeNo?: string };
  documentationDetails?: { shipment?: string; poNo?: string };
  packageDetails?: { packagesCount?: number; chargedWeight?: number };
  financials?: { grandTotal?: number };
};

function formatDate(value?: string | Date) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const fieldCls =
  "h-8 px-2 text-[12px] border border-[#7eb6e8] rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0171d3] uppercase font-mono";

export default function CnTrackingPage() {
  const [docketNo, setDocketNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [dnNo, setDnNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TrackRow[]>([]);
  const [searched, setSearched] = useState(false);

  const appendComma = () => {
    setDocketNo((prev) => {
      const t = prev.trim();
      if (!t) return ",";
      if (t.endsWith(",")) return t;
      return `${t},`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docketNo.trim() && !invoiceNo.trim() && !dnNo.trim()) {
      toast.error("Enter Docket No, Invoice No, or DN No");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (docketNo.trim()) params.set("docketNo", docketNo.trim());
      if (invoiceNo.trim()) params.set("invoiceNo", invoiceNo.trim());
      if (dnNo.trim()) params.set("dnNo", dnNo.trim());
      const res = await fetch(`/api/tracking/cn?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Tracking failed");
        setResults([]);
        return;
      }
      setResults(data.data || []);
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (!(data.data || []).length) toast.info("No CN found for entered criteria");
    } catch {
      toast.error("Failed to track CN");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10">

      <form onSubmit={handleSubmit} className="bg-white border border-slate-300 shadow-sm max-w-2xl mx-auto">
        <div className="border-b border-slate-300 px-3 py-2 text-center text-sm font-bold text-slate-800">
          Enter Docket No to Track
        </div>

        <table className="w-full text-[12px] border-collapse">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="w-[180px] bg-[#f8fafc] text-slate-700 font-semibold px-3 py-2.5 border-r border-slate-200">
                Docket No :
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <input
                    value={docketNo}
                    onChange={(e) => setDocketNo(e.target.value.toUpperCase())}
                    className={`${fieldCls} flex-1`}
                    placeholder="ALC126001,ALC126002"
                  />
                  <button
                    type="button"
                    title="Add comma separator for multiple dockets"
                    onClick={appendComma}
                    className="h-8 w-8 shrink-0 border border-[#7eb6e8] rounded-sm text-[#0171d3] font-bold hover:bg-[#e8f1fb]"
                  >
                    ,
                  </button>
                </div>
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="bg-[#f8fafc] text-slate-700 font-semibold px-3 py-2.5 border-r border-slate-200">
                Enter Invoice No.
              </td>
              <td className="px-3 py-2.5">
                <input
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                  className={`${fieldCls} w-full max-w-md`}
                />
              </td>
            </tr>
            <tr>
              <td className="bg-[#f8fafc] text-slate-700 font-semibold px-3 py-2.5 border-r border-slate-200">
                Enter DN No.
              </td>
              <td className="px-3 py-2.5">
                <input
                  value={dnNo}
                  onChange={(e) => setDnNo(e.target.value.toUpperCase())}
                  className={`${fieldCls} w-full max-w-md`}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-center py-4 border-t border-slate-200 bg-slate-50/50">
          <button
            type="submit"
            disabled={loading}
            className="min-w-[110px] h-9 px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] font-semibold text-sm hover:bg-[#e8f1fb] shadow-sm disabled:opacity-60 lowercase"
          >
            {loading ? "searching..." : "submit"}
          </button>
        </div>
      </form>

      {searched && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            CN Tracking Result{results.length ? ` (${results.length})` : ""}
          </div>
          {results.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No consignment found.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {results.map((cn) => (
                <div key={cn.docketNo} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#0171d3] text-sm">{cn.docketNo}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {cn.status || "-"}
                    </span>
                    {cn.podUrl ? (
                      <a
                        href={cn.podUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-semibold hover:underline"
                      >
                        POD Available
                      </a>
                    ) : (
                      <span className="text-slate-400">POD Pending</span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-slate-500">Billing Party</div>
                      <div className="font-semibold text-slate-800">{cn.billingParty || "-"}</div>
                      <div className="text-slate-500 mt-1">
                        Booking: {formatDate(cn.bookingDate)} · Pkgs{" "}
                        {cn.packageDetails?.packagesCount ?? "-"} · Wt{" "}
                        {cn.packageDetails?.chargedWeight ?? "-"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-slate-500">Route</div>
                      <div className="font-semibold text-slate-800">
                        {cn.fromLocation || "-"} → {cn.toLocation || "-"}
                      </div>
                      <div className="text-slate-500 mt-1">
                        {cn.consignor?.name || "-"} → {cn.consignee?.name || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-slate-500">Vehicle / Trip</div>
                      <div className="font-mono font-semibold">{cn.vehicleNo || "-"}</div>
                      <div className="text-slate-500 mt-1">Tripsheet: {cn.tripSheetNo || "-"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-slate-500">Invoice / DN / E-Way</div>
                      <div>
                        Inv: {cn.invoiceDetails?.invoiceBeNo || "-"} · DN:{" "}
                        {cn.documentationDetails?.shipment || "-"}
                      </div>
                      <div className="text-slate-500 mt-1">E-Way: {cn.ewayBillNo || "-"}</div>
                      <div className="font-mono mt-1">
                        Amount: ₹{Number(cn.financials?.grandTotal || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
