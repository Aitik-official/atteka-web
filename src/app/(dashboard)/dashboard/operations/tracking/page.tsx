"use client";

import React, { useState } from "react";
import { Search, MapPin, Truck, CheckCircle2, Clock, FileText, Eye, AlertCircle, Calendar } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function TrackingPage() {
  const [query, setQuery] = useState("");
  const [docType, setDocType] = useState("CN");
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim().toUpperCase();
    if (!cleanQuery) return;

    setSearching(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/consignments/${encodeURIComponent(cleanQuery)}`);
      const data = await res.json();

      if (!res.ok || !data.data) {
        setError(`No tracking record found for document: ${cleanQuery}`);
      } else {
        setResult(data.data);
      }
    } catch {
      setError("Network error while searching document tracking.");
    } finally {
      setSearching(false);
    }
  };

  const steps = [
    { key: "BOOKED", label: "Consignment Booked", desc: "Origin branch receipt" },
    { key: "IN_TRANSIT", label: "In-Transit", desc: "Dispatched via corridor vehicle" },
    { key: "ARRIVED", label: "Arrived at Destination", desc: "Destination hub unload" },
    { key: "DELIVERED", label: "Delivered to Consignee", desc: "POD verified & signed" },
    { key: "BILLED", label: "Financial Completion", desc: "Billed to customer" }
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const order = ["BOOKED", "IN_TRANSIT", "ARRIVED", "DELIVERED", "BILLED"];
    const curIdx = order.indexOf(currentStatus);
    const stepIdx = order.indexOf(stepKey);
    if (curIdx >= stepIdx) return "COMPLETED";
    return "PENDING";
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Reusable PageHeader */}
      <PageHeader
        moduleCode="C111"
        title="Live Multi-Document Tracking"
        subtitle="Operations • Reports/TrackDocument.aspx • Real-time status pipeline across all corridors"
/>

      {/* Query Bar */}
      <SectionCard title="Search & Trace Query" icon={Search} badge="LOOKUP">
        <form onSubmit={handleTrack} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-slate-600 mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full h-10 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-medium"
              >
                <option value="CN">CN / Docket Number</option>
                <option value="THC">THC Number</option>
                <option value="PDC">PDC Number</option>
                <option value="BILL">Transport Bill No</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Enter Document Reference</label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  placeholder="e.g. ALC126001 or paste docket code"
                  className="w-full h-10 pl-9 pr-3 text-xs border border-slate-200 bg-slate-50 focus:bg-white rounded-lg uppercase font-semibold text-blue-800 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="sm:self-end">
              <button
                type="submit"
                disabled={searching}
                className="w-full sm:w-auto h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                {searching ? "Searching..." : "Track Document"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </SectionCard>

      {/* Tracking Result View */}
      {result && (
        <div className="space-y-4 animate-in fade-in">
          {/* Status Pipeline Progress Bar */}
          <SectionCard
            title={`Docket: ${result.docketNo}`}
            badge={result.status}
            icon={Truck}
            headerAction={<StatusBadge status={result.status} />}
          >
            {/* Responsive Pipeline Steps (Vertical on mobile, horizontal grid on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {steps.map((st) => {
                const status = getStepStatus(st.key, result.status);
                const isDone = status === "COMPLETED";

                return (
                  <div
                    key={st.key}
                    className={`p-3 rounded-xl border text-xs transition-all flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 ${
                      isDone
                        ? "bg-blue-50 border-blue-200 text-blue-900 shadow-2xs"
                        : "bg-slate-50/60 border-slate-200 text-slate-400 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <span className="font-bold block text-slate-800">{st.label}</span>
                        <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">{st.desc}</p>
                      </div>
                    </div>
                    <span className="sm:hidden text-[10px] font-mono font-bold text-slate-500">
                      {isDone ? "Done" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Details Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SectionCard title="Route & Carrier" icon={MapPin} badge="TRANSIT">
              <div className="space-y-1.5 text-xs">
                <p><span className="text-slate-500 font-medium">Origin:</span> <span className="font-bold text-slate-800">{result.fromLocation}</span></p>
                <p><span className="text-slate-500 font-medium">Destination:</span> <span className="font-bold text-slate-800">{result.toLocation}</span></p>
                <p><span className="text-slate-500 font-medium">Booking Branch:</span> <span className="text-slate-700">{result.bookingBranch}</span></p>
                <p><span className="text-slate-500 font-medium">Vehicle No:</span> <span className="font-mono font-bold text-blue-700">{result.vehicleNo || "N/A"}</span></p>
                <p><span className="text-slate-500 font-medium">Driver Contact:</span> <span className="text-slate-700">{result.driverPhone || "N/A"}</span></p>
              </div>
            </SectionCard>

            <SectionCard title="Parties & Cargo" icon={FileText} badge="GOODS">
              <div className="space-y-1.5 text-xs">
                <p><span className="text-slate-500 font-medium">Billing Party:</span> <span className="font-bold text-slate-800">{result.billingParty}</span></p>
                <p><span className="text-slate-500 font-medium">Consignor:</span> <span className="text-slate-700">{result.consignor?.name}</span></p>
                <p><span className="text-slate-500 font-medium">Consignee:</span> <span className="text-slate-700">{result.consignee?.name}</span></p>
                <p><span className="text-slate-500 font-medium">Goods:</span> <span className="text-slate-700">{result.packageDetails?.productDescription}</span></p>
                <p><span className="text-slate-500 font-medium">Charged Weight:</span> <span className="font-bold text-slate-800">{result.packageDetails?.chargedWeight} kg</span> ({result.packageDetails?.packagesCount} pkgs)</p>
              </div>
            </SectionCard>

            <SectionCard title="Financials & POD" icon={CheckCircle2} badge="POD">
              <div className="space-y-1.5 text-xs">
                <p><span className="text-slate-500 font-medium">Freight Total:</span> <span className="font-mono font-bold text-emerald-700 text-sm">₹{result.financials?.grandTotal?.toLocaleString()}</span></p>
                <p><span className="text-slate-500 font-medium">Payment Basis:</span> <span className="font-semibold text-slate-700">{result.paymentBasis}</span></p>
                <p><span className="text-slate-500 font-medium">E-Way Bill:</span> <span className="font-mono text-slate-600">{result.ewayBillNo || "N/A"}</span></p>

                {result.podUrl ? (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <a
                      href={result.podUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Scanned POD Document
                    </a>
                  </div>
                ) : (
                  <p className="text-amber-600 text-[11px] mt-2 font-medium">
                    • Proof of Delivery (POD) not yet uploaded
                  </p>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
