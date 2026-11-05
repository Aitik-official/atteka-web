"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  CreditCard,
  FileCheck,
  Users,
  ShieldCheck,
  CheckCircle2,
  X,
  Search,
  Truck
} from "lucide-react";

export default function TrackCustomerVendorHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [panQuery, setPanQuery] = useState("AAACM9128K");
  const [vendorData, setVendorData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearchPan = () => {
    if (!panQuery.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVendorData({
        pan: panQuery.toUpperCase(),
        vendorName: "MAHALAXMI ROADWAYS & LOGISTICS",
        code: "VEN-004",
        type: "Dedicated Fleet Vendor",
        activeVehicles: ["MH-04-GP-1928", "MH-04-AB-3841"],
        completedTrips: 42,
        pendingPayments: "₹ 48,500",
        kycStatus: "VERIFIED & APPROVED"
      });
    }, 500);
  };

  const closeModal = () => {
    setActiveModal(null);
    setVendorData(null);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Track Customer/Vendor" />

      {/* 4 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Validate Vendor PAN"
          description="Check vendor income tax and TDS declaration status"
          onClick={() => {
            setActiveModal("Validate Vendor PAN");
            setPanQuery("AAACM9128K");
          }}
          icon={CreditCard}
        />
        <WcvActionCard
          title="Track Vendor PAN"
          description="Look up vehicle owner history by PAN number"
          onClick={() => {
            setActiveModal("Track Vendor PAN");
            setPanQuery("AAACM9128K");
          }}
          icon={FileCheck}
        />
        <WcvActionCard
          title="Track Customer details"
          description="View full customer profile and consignment logs"
          href="/dashboard/masters/customers"
          icon={Users}
        />
        <WcvActionCard
          title="Customer GST Registration Report"
          description="E-Invoice and state GSTIN master registers"
          href="/dashboard/finance/e-invoice"
          icon={ShieldCheck}
        />
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">{activeModal}</h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Enter 10-character PAN number to audit vendor registration and trip history:
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={panQuery}
                onChange={(e) => setPanQuery(e.target.value)}
                placeholder="ABCDE1234F"
                className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase font-bold"
              />
              <button
                onClick={handleSearchPan}
                disabled={loading}
                className="px-3.5 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? "Searching..." : "Track"}
              </button>
            </div>

            {vendorData && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2 mb-3">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-800">{vendorData.vendorName}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded text-[10px]">
                    {vendorData.kycStatus}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">PAN Card:</span><span className="font-mono font-bold text-blue-600">{vendorData.pan}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Vendor Code:</span><span className="font-mono text-slate-700">{vendorData.code}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Completed Trips:</span><span className="font-semibold text-slate-800">{vendorData.completedTrips}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Pending Payable:</span><span className="font-mono font-bold text-amber-700">{vendorData.pendingPayments}</span></div>
                <div>
                  <span className="text-slate-500 block mb-1">Attached Vehicles:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {vendorData.activeVehicles.map((v: string) => (
                      <span key={v} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-700 font-semibold">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => {
                  closeModal();
                  window.location.href = "/dashboard/masters/vendors";
                }}
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" /> Open Full Vendor Master
              </button>
              <button
                onClick={closeModal}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
