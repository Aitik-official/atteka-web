"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Receipt, Landmark, BookOpen, CheckCircle2, X } from "lucide-react";

export default function ChequeManagementHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Cheque Management" />

      {/* 3 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <WcvActionCard
          title="On a/c Cheque Receipt"
          description="On a/c Cheque Receipt"
          href="/dashboard/finance/mr-entry"
          icon={Receipt}
        />
        <WcvActionCard
          title="On A/C Cheque Deposit"
          description="On A/C Cheque Deposit"
          href="/dashboard/finance/bank-statement"
          icon={Landmark}
        />
        <WcvActionCard
          title="Assign Cheque Book"
          description="Assign Cheque Book"
          href="/dashboard/finance/bank-statement"
          icon={BookOpen}
        />
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
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
            <p className="text-xs text-slate-600 mb-4">
              Cheque management sequence initialized for <strong>{activeModal}</strong>.
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
                  window.location.href = "/dashboard/finance/bank-statement";
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Go to Bank Statement ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

