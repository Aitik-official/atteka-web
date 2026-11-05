"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Building, XCircle, FileX, AlertTriangle, CheckCircle2, X, Save } from "lucide-react";

export default function CompanyVehicleExceptionalHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [refNumber, setRefNumber] = useState("TS-2026-0042");
  const [selectedBranch, setSelectedBranch] = useState("ALC2 - Bhiwandi Hub");
  const [cancelReason, setCancelReason] = useState("Vehicle breakdown prior to dispatch");

  const handleSubmit = (actionTitle: string) => {
    setSuccessMsg(`Action "${actionTitle}" executed successfully for reference ${refNumber}.`);
    setTimeout(() => {
      setSuccessMsg(null);
      setActiveModal(null);
    }, 1500);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Company Vehicle Exceptional" />

      {/* 5 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Change Payment Branch"
          description="Reroute driver trip payment liability to another branch"
          onClick={() => {
            setActiveModal("Change Payment Branch");
            setRefNumber("TS-2026-0042");
          }}
          icon={Building}
        />
        <WcvActionCard
          title="Cancel Vehicle Advance Payment"
          description="Reverse driver fuel / trip cash advance voucher"
          onClick={() => {
            setActiveModal("Cancel Vehicle Advance Payment");
            setRefNumber("ADV-PAY-9041");
          }}
          icon={XCircle}
        />
        <WcvActionCard
          title="Cancel Trip Settlement"
          description="Re-open closed tripsheet for cost adjustments"
          onClick={() => {
            setActiveModal("Cancel Trip Settlement");
            setRefNumber("SETTLE-2026-118");
          }}
          icon={XCircle}
        />
        <WcvActionCard
          title="Cancel GRN"
          description="Cancel Goods Receipt Note for vehicle spares/tyres"
          onClick={() => {
            setActiveModal("Cancel GRN");
            setRefNumber("GRN-78401");
          }}
          icon={FileX}
        />
        <WcvActionCard
          title="Cancel GIN"
          description="Cancel Goods Issue Note for workshop items"
          onClick={() => {
            setActiveModal("Cancel GIN");
            setRefNumber("GIN-99214");
          }}
          icon={FileX}
        />
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">{activeModal}</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {successMsg ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMsg}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Reference / Document Number
                  </label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                {activeModal === "Change Payment Branch" ? (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      New Responsible Branch
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full h-8 px-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ALC1 - Mumbai Central">ALC1 - Mumbai Central</option>
                      <option value="ALC2 - Bhiwandi Hub">ALC2 - Bhiwandi Hub</option>
                      <option value="DEL1 - Delhi Regional">DEL1 - Delhi Regional</option>
                      <option value="BLR1 - Bangalore Branch">BLR1 - Bangalore Branch</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Cancellation Audit Reason
                    </label>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-slate-600">
                  <p className="font-semibold text-amber-900 mb-0.5">Authorization Note:</p>
                  This exception override modifies central vehicle financial accounts and will be recorded in the audit trail under user <span className="font-bold">AL002</span>.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmit(activeModal)}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Confirm Execution
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
