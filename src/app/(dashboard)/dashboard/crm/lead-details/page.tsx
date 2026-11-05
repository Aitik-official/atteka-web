"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Mail, CheckCircle2, X, RefreshCw, UserPlus, Phone, Building } from "lucide-react";

export default function LeadDetailsHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const mockLeads = [
    { name: "Sunil Garments", person: "Sunil Mehta", phone: "9820199482", origin: "Mumbai", dest: "Delhi", weight: "4.5 MT", date: "Today" },
    { name: "Apex Chem Trade", person: "Vikram Shah", phone: "9833019283", origin: "Bhiwandi", dest: "Bangalore", weight: "12.0 MT", date: "Yesterday" }
  ];

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
    }, 700);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Lead Details" />

      {/* 1 Action Card matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Outlook"
          description="Sync booking inquiries from Microsoft Outlook"
          onClick={() => setActiveModal("Outlook CRM Leads Integration")}
          icon={Mail}
        />
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Microsoft Outlook Lead Inbox</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Direct inbox scanner for quotation requests and freight queries sent to <span className="font-mono font-semibold text-slate-800">inquiries@atteka.com</span>.
            </p>

            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-700">Recent Customer Freight Enquiries</span>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Scanning Inbox..." : "Sync Now"}
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {mockLeads.map((ld, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-blue-600" /> {ld.name}</span>
                    <span className="text-[10px] text-slate-400">{ld.date}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Contact: {ld.person} ({ld.phone})</span>
                    <span className="font-mono text-emerald-700 font-semibold">{ld.weight}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Route: {ld.origin} ➔ {ld.dest}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => {
                  setActiveModal(null);
                  window.location.href = "/dashboard/masters/customers";
                }}
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Convert to Master Customer
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
