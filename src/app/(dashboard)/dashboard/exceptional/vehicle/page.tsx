"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  Building,
  XCircle,
  FileX,
  AlertTriangle,
  X
} from "lucide-react";

export default function CompanyVehicleExceptionalHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Company Vehicle Exceptional" />

      {/* 5 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <div onClick={() => setActiveModal("Change Payment Branch")}>
          <WcvActionCard
            title="Change Payment Branch"
            description="Change Payment Branch"
            href="#"
            icon={Building}
          />
        </div>
        <div onClick={() => setActiveModal("Cancel Vehicle Advance Payment")}>
          <WcvActionCard
            title="Cancel Vehicle Advance Payment"
            description="Cancel Vehicle Advance Payment"
            href="#"
            icon={XCircle}
          />
        </div>
        <div onClick={() => setActiveModal("Cancel Trip Settlement")}>
          <WcvActionCard
            title="Cancel Trip Settlement"
            description="Cancel Trip Settlement"
            href="#"
            icon={XCircle}
          />
        </div>
        <div onClick={() => setActiveModal("Cancel GRN (Goods Receipt Note)")}>
          <WcvActionCard
            title="Cancel GRN"
            description="Cancel GRN"
            href="#"
            icon={FileX}
          />
        </div>

        {/* Row 2 */}
        <div onClick={() => setActiveModal("Cancel GIN (Goods Issue Note)")}>
          <WcvActionCard
            title="Cancel GIN"
            description="Cancel GIN"
            href="#"
            icon={FileX}
          />
        </div>
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Vehicle Exceptional Override</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Action selected: <strong>{activeModal}</strong>
            </p>
            <p className="text-xs text-slate-500 mb-4 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Company vehicle and corridor trip settlement modifications are restricted to fleet operations management. Changes will be audited in the central vehicle ledger.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  window.location.href = "/dashboard/masters/vehicles";
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Open Vehicle Fleet Master ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
