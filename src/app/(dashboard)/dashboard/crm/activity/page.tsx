"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Calendar, CheckCircle2, X, Clock, MapPin, Truck } from "lucide-react";

export default function ActivityHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const activities = [
    { time: "10:30 AM", title: "Corridor Line-Haul Dispatch Check", type: "Operations", desc: "ALC1 Fleet departure for Delhi NCR Hub (Vehicle MH-04-GP-1928)" },
    { time: "02:00 PM", title: "Consignor Payment Review", type: "Finance", desc: "Reconciliation of outstanding bills for Asian Paints Ltd" },
    { time: "04:30 PM", title: "Delivery PDC Audit", type: "Delivery", desc: "Confirmation of scanned POD uploads for Bhiwandi distribution" }
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Activity" />

      {/* 1 Action Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="OutLook Calendar"
          description="View synchronized daily operational schedules"
          onClick={() => setActiveModal("Outlook Calendar Schedule")}
          icon={Calendar}
        />
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Outlook Daily Activity Schedule</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Today&apos;s scheduled logistics milestones, dispatch reminders, and customer follow-ups:
            </p>

            <div className="space-y-2.5 mb-4">
              {activities.map((act, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{act.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {act.time}
                    </span>
                  </div>
                  <p className="text-slate-600">{act.desc}</p>
                  <span className="inline-block text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    {act.type}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => {
                  setActiveModal(null);
                  window.location.href = "/dashboard/operations/tripsheets";
                }}
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" /> View Fleet Tripsheets
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
