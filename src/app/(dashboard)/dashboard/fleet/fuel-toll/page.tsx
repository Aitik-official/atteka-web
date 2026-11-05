"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Fuel, CheckCircle2, X, Download, Filter, Truck } from "lucide-react";

export default function FuelTollHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const bpclTransactions = [
    { cardNo: "7081-xxxx-4912", vehicleNo: "MH-04-GP-1928", pumpLocation: "BPCL COCO Vashi, Navi Mumbai", date: "04-11-2026 09:30 AM", liters: 120, rate: 89.45, totalAmount: 10734 },
    { cardNo: "7081-xxxx-5021", vehicleNo: "MH-04-AB-3841", pumpLocation: "BPCL Ghoti, Igatpuri Highway", date: "03-11-2026 06:15 PM", liters: 150, rate: 89.20, totalAmount: 13380 },
    { cardNo: "7081-xxxx-4912", vehicleNo: "MH-04-GP-1928", pumpLocation: "BPCL Agra Bypass Express", date: "02-11-2026 01:45 PM", liters: 95, rate: 88.90, totalAmount: 8445.5 }
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Fuel and Toll Management" />

      {/* 1 Action Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="BPCL Sale Transaction Report"
          description="View diesel swipe statements from BPCL SmartFleet"
          onClick={() => setActiveModal("BPCL Sale Transaction Report")}
          icon={Fuel}
        />
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">BPCL SmartFleet Fuel Transactions</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Corporate diesel card swipes directly integrated with company line-haul vehicles:
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Vehicle No</th>
                    <th className="p-2.5">Retail Outlet (Pump)</th>
                    <th className="p-2.5">Volume (L)</th>
                    <th className="p-2.5">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bpclTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-mono text-slate-500">{tx.date}</td>
                      <td className="p-2.5 font-mono font-bold text-blue-600">{tx.vehicleNo}</td>
                      <td className="p-2.5 text-slate-700">{tx.pumpLocation}</td>
                      <td className="p-2.5 font-mono text-slate-700">{tx.liters} L</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-700">₹{tx.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => {
                  setActiveModal(null);
                  window.location.href = "/dashboard/masters/vehicles";
                }}
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" /> Check Attached Fleet
              </button>
              <button
                onClick={() => setActiveModal(null)}
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
