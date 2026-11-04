"use client";

import React, { useState } from "react";
import { Search, MapPin, Truck, CheckCircle2, Clock, FileText, Eye, AlertCircle } from "lucide-react";

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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C111</span>
            <h1 className="text-lg font-bold text-slate-800">Live Multi-Document Tracking</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/OPERATIONS.PAGES/Reports/TrackDocument.aspx • Real-time status pipeline
          </p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <form onSubmit={handleTrack} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-slate-600 mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full h-10 px-3 text-xs border border-slate-300 rounded bg-white font-medium"
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
                  className="w-full h-10 pl-9 pr-3 text-xs border border-slate-300 rounded uppercase font-semibold text-blue-800"
                  required
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="sm:self-end">
              <button
                type="submit"
                disabled={searching}
                className="w-full sm:w-auto h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
              >
                <Search className="w-3.5 h-3.5" />
                {searching ? "Searching..." : "Track Document"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracking Result View */}
      {result && (
        <div className="space-y-4">
          {/* Status Pipeline Progress Bar */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Docket Number</span>
                <h2 className="text-xl font-bold text-blue-700">{result.docketNo}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Current Status</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  {result.status}
                </span>
              </div>
            </div>

            {/* Pipeline Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              {steps.map((st, idx) => {
                const status = getStepStatus(st.key, result.status);
                const isDone = status === "COMPLETED";

                return (
                  <div
                    key={st.key}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      isDone
                        ? "bg-blue-50 border-blue-300 text-blue-900"
                        : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="font-bold">{st.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{st.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-2">
              <h3 className="font-bold text-slate-700 border-b pb-1">Route & Carrier</h3>
              <p><span className="text-slate-500">Origin:</span> {result.fromLocation}</p>
              <p><span className="text-slate-500">Destination:</span> {result.toLocation}</p>
              <p><span className="text-slate-500">Booking Branch:</span> {result.bookingBranch}</p>
              <p><span className="text-slate-500">Vehicle No:</span> {result.vehicleNo || "N/A"}</p>
              <p><span className="text-slate-500">Driver Contact:</span> {result.driverPhone || "N/A"}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-2">
              <h3 className="font-bold text-slate-700 border-b pb-1">Parties & Goods</h3>
              <p><span className="text-slate-500">Billing Party:</span> {result.billingParty}</p>
              <p><span className="text-slate-500">Consignor:</span> {result.consignor?.name}</p>
              <p><span className="text-slate-500">Consignee:</span> {result.consignee?.name}</p>
              <p><span className="text-slate-500">Goods:</span> {result.packageDetails?.productDescription} ({result.packageDetails?.packageType})</p>
              <p><span className="text-slate-500">Weight:</span> {result.packageDetails?.chargedWeight} kg ({result.packageDetails?.packagesCount} pkgs)</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-2">
              <h3 className="font-bold text-slate-700 border-b pb-1">Financial & POD Verification</h3>
              <p><span className="text-slate-500">Freight Total:</span> &#8377;{result.financials?.grandTotal?.toLocaleString()}</p>
              <p><span className="text-slate-500">Payment Basis:</span> {result.paymentBasis}</p>
              <p><span className="text-slate-500">E-Way Bill:</span> {result.ewayBillNo || "N/A"}</p>

              {result.podUrl ? (
                <div className="mt-2 pt-2 border-t">
                  <a
                    href={result.podUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Scanned POD Document
                  </a>
                </div>
              ) : (
                <p className="text-amber-600 text-[11px] mt-2 font-medium">
                  &bull; Proof of Delivery (POD) not yet uploaded
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

