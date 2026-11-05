"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  CreditCard,
  CheckSquare,
  Printer,
  Receipt,
  FileCheck2,
  CheckCircle2,
  X,
  Save,
  Truck
} from "lucide-react";

export default function TripManagementHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [settlementForm, setSettlementForm] = useState({
    tripsheetNo: "TS-2026-0042",
    vehicleNo: "MH-04-GP-1928",
    driverName: "Ram Singh",
    grossFreight: 45000,
    advancePaid: 25000,
    dieselExpense: 12000,
    tollExpense: 3200,
    unloadingLabor: 1500,
    netPayable: 3300
  });

  const handleSettle = () => {
    setSuccessMsg(`Tripsheet ${settlementForm.tripsheetNo} settled. Net balance ₹${settlementForm.netPayable.toLocaleString()} approved.`);
    setTimeout(() => {
      setSuccessMsg(null);
      setActiveModal(null);
    }, 1500);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Trip Management" />

      {/* 5 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Vehicle Advance Payment"
          description="Issue driver advance for fuel and enroute expenses"
          href="/dashboard/finance/bank-payment"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Trip Settlement"
          description="Finalize trip expense vouchers and driver net balance"
          onClick={() => setActiveModal("Trip Settlement")}
          icon={CheckSquare}
        />
        <WcvActionCard
          title="View Print Trip Settlement"
          description="Generate formal tripsheet settlement statement"
          onClick={() => setActiveModal("View Print Trip Settlement")}
          icon={Printer}
        />
        <WcvActionCard
          title="View Print Vehicle Advance Payment"
          description="Print driver cash/bank advance disbursement receipt"
          href="/dashboard/finance/bank-payment"
          icon={Receipt}
        />
        <WcvActionCard
          title="Voucher Payment"
          description="All vendor payments, debit & credit vouchers"
          href="/dashboard/finance/vouchers"
          icon={FileCheck2}
        />
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tripsheet Number</label>
                    <input
                      type="text"
                      value={settlementForm.tripsheetNo}
                      onChange={(e) => setSettlementForm({ ...settlementForm, tripsheetNo: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Assigned Vehicle</label>
                    <input
                      type="text"
                      value={settlementForm.vehicleNo}
                      onChange={(e) => setSettlementForm({ ...settlementForm, vehicleNo: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-slate-600"><span>Agreed Gross Freight:</span><span className="font-mono font-bold text-slate-800">₹{settlementForm.grossFreight.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Trip Advance Disbursed:</span><span className="font-mono font-bold text-red-600">- ₹{settlementForm.advancePaid.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Enroute Fuel & Toll:</span><span className="font-mono text-slate-700">₹{(settlementForm.dieselExpense + settlementForm.tollExpense).toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Unloading Labor Charges:</span><span className="font-mono text-slate-700">₹{settlementForm.unloadingLabor.toLocaleString()}</span></div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                    <span>Net Balance Payable:</span>
                    <span className="font-mono text-emerald-700">₹{settlementForm.netPayable.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      window.location.href = "/dashboard/operations/tripsheets";
                    }}
                    className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" /> Open Tripsheet List
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleSettle}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" /> Approve Settlement
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
