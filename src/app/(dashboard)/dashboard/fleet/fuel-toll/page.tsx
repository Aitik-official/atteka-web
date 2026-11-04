"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Fuel, CheckCircle2, X } from "lucide-react";

export default function FuelTollHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Fuel and Toll Management" />

      {/* 1 Action Card matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => setActiveModal("BPCL Sale Transaction Report")}>
          <WcvActionCard
            title="BPCL Sale Transaction Report"
            description="BPCL Sale Transaction Report"
            href="#"
            icon={Fuel}
          />
        </div>
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">BPCL Fleet Card Reconciliation</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Bharat Petroleum Corporation (BPCL) SmartFleet card transactions statement. Diesel swipe logs for registered company vehicles are integrated directly into trip expenditure.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  window.location.href = "/dashboard/masters/vehicles";
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                View Vehicle Fleet ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

