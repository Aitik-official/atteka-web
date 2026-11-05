"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { FileBadge, CreditCard, CheckCircle2, X, Search, ShieldCheck } from "lucide-react";

export default function APIsAdminHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    if (!queryInput.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (activeModal === "Driving Licence API") {
        setResult({
          valid: true,
          dlNumber: queryInput.toUpperCase(),
          holderName: "RAJESH KUMAR YADAV",
          status: "ACTIVE / VALID",
          vehicleClasses: "LMV, TRANS, HMV",
          issueDate: "14-04-2016",
          validUntil: "13-04-2031",
          rto: "MH02 - MUMBAI WEST"
        });
      } else {
        setResult({
          valid: true,
          panNumber: queryInput.toUpperCase(),
          entityName: "ATTEKA LOGISTICS PRIVATE LIMITED",
          status: "OPERATIVE & VERIFIED",
          category: "COMPANY",
          aadhaarLinked: "NOT APPLICABLE",
          lastUpdated: "01-11-2026"
        });
      }
    }, 600);
  };

  const closeModal = () => {
    setActiveModal(null);
    setQueryInput("");
    setResult(null);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="APIs" />

      {/* 2 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Driving Licence API"
          description="Verify Driver Licence via MoRTH Sarathi"
          onClick={() => {
            setActiveModal("Driving Licence API");
            setQueryInput("MH0220160049281");
          }}
          icon={FileBadge}
        />
        <WcvActionCard
          title="Pan Card API"
          description="Verify Vendor PAN with NSDL / Income Tax"
          onClick={() => {
            setActiveModal("Pan Card API");
            setQueryInput("AABCA1234F");
          }}
          icon={CreditCard}
        />
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
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
              Government verification portal integration. Enter document identifier to verify live compliance status:
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={activeModal === "Driving Licence API" ? "Enter DL Number (e.g. MH022016...)" : "Enter 10-char PAN (e.g. ABCDE1234F)"}
                className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
              />
              <button
                onClick={handleVerify}
                disabled={loading}
                className="px-3.5 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? "Checking..." : "Verify"}
              </button>
            </div>

            {result && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {result.status}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">ULIP Sandbox</span>
                </div>
                {result.dlNumber ? (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">DL Number:</span><span className="font-mono font-bold text-slate-800">{result.dlNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Name:</span><span className="font-semibold text-slate-800">{result.holderName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Classes:</span><span className="font-mono text-slate-700">{result.vehicleClasses}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Valid Until:</span><span className="font-mono text-slate-700">{result.validUntil}</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">PAN Number:</span><span className="font-mono font-bold text-slate-800">{result.panNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Registered Name:</span><span className="font-semibold text-slate-800">{result.entityName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Category:</span><span className="font-mono text-slate-700">{result.category}</span></div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 text-xs mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
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
