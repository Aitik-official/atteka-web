"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { CalendarCheck, FileSpreadsheet, CheckCircle2, X, Plus, Save } from "lucide-react";

export default function VisitDetailsHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [visits, setVisits] = useState([
    { customer: "Reliance Retail Ltd", date: "04-11-2026", purpose: "Annual contract renewal & rate revision", outcome: "Agreed to 5% tariff revision", nextFollowUp: "15-11-2026" },
    { customer: "Tata Motors Spare Parts", date: "02-11-2026", purpose: "Bhiwandi to Pune daily shuttle", outcome: "Sent quote for 2x 32FT MXL daily", nextFollowUp: "08-11-2026" }
  ]);

  const [quoteForm, setQuoteForm] = useState({
    customer: "Tata Motors Spare Parts",
    corridor: "Bhiwandi ➔ Pune",
    vehicleType: "32 FT Multi-Axle",
    ratePerTrip: 22000,
    validUntil: "30-11-2026"
  });

  const handleSave = (type: string) => {
    setSuccessMsg(`${type} saved successfully.`);
    setTimeout(() => {
      setSuccessMsg(null);
      setActiveModal(null);
    }, 1200);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Vist Details" />

      {/* 2 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Update Visit Details"
          description="Log client meetings & commercial discussions"
          onClick={() => setActiveModal("Update Visit Details")}
          icon={CalendarCheck}
        />
        <WcvActionCard
          title="Quotation"
          description="Generate client tariff quotation sheets"
          onClick={() => setActiveModal("Customer Freight Quotation")}
          icon={FileSpreadsheet}
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

            {successMsg && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                ✓ {successMsg}
              </div>
            )}

            {activeModal === "Update Visit Details" && (
              <div className="space-y-3 text-xs">
                <div className="space-y-2 mb-3">
                  {visits.map((v, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{v.customer}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{v.date}</span>
                      </div>
                      <p className="text-slate-600">Discussion: {v.purpose}</p>
                      <p className="text-emerald-700 font-medium">Outcome: {v.outcome}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleSave("Client Visit Record")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Visit Note
                  </button>
                </div>
              </div>
            )}

            {activeModal === "Customer Freight Quotation" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={quoteForm.customer}
                    onChange={(e) => setQuoteForm({ ...quoteForm, customer: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Transit Corridor</label>
                    <input
                      type="text"
                      value={quoteForm.corridor}
                      onChange={(e) => setQuoteForm({ ...quoteForm, corridor: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Vehicle Classification</label>
                    <input
                      type="text"
                      value={quoteForm.vehicleType}
                      onChange={(e) => setQuoteForm({ ...quoteForm, vehicleType: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Proposed Freight Rate (₹)</label>
                    <input
                      type="number"
                      value={quoteForm.ratePerTrip}
                      onChange={(e) => setQuoteForm({ ...quoteForm, ratePerTrip: Number(e.target.value) })}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Validity Date</label>
                    <input
                      type="text"
                      value={quoteForm.validUntil}
                      onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleSave("Freight Quotation Sheet")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Generate & Save Quotation
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
