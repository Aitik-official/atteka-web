"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Edit3, Printer, Search, PlusCircle, ArrowRight, FileText, CheckCircle2 } from "lucide-react";

export default function CnOperationsHubPage() {
  const router = useRouter();
  const [docketInput, setDocketInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleDirectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNo = docketInput.trim();
    if (!cleanNo) return;
    setIsSearching(true);
    // Navigate straight into dockets with action=edit and target docket parameter
    router.push(`/dashboard/operations/dockets?action=edit&docket=${encodeURIComponent(cleanNo)}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Modern Atteka ERP Header */}
      <WcvRibbonHeader
        title="CN Operations & Consignment Management"
        subtitle="Operations • Module C019 • Consignment Note editing, search, and document printing"
      />

      {/* Quick CN Edit Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-2">
          <Edit3 className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Direct CN / Consignment Editor</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Enter any Consignment Note (CN) or Docket Number below to instantly open its full editable sheet (billing party, consignor/consignee, packages, freight & GST).
        </p>

        <form onSubmit={handleDirectEdit} className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={docketInput}
              onChange={(e) => setDocketInput(e.target.value)}
              placeholder="e.g. CN-1002, DKT-2026-001..."
              className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={!docketInput.trim() || isSearching}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <span>{isSearching ? "Opening..." : "Edit This CN"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Quick Operation Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <WcvActionCard
          title="Edit Consignment (CN)"
          description="Browse the consignment registry in active edit mode to modify rates, billing party, packages, and routes."
          href="/dashboard/operations/dockets?action=edit"
          icon={Edit3}
        />
        <WcvActionCard
          title="View & Print CN"
          description="Access the complete docket archive to generate laser A4 barcodes, thermal slips, or dot-matrix dockets."
          href="/dashboard/operations/dockets"
          icon={Printer}
        />
        <WcvActionCard
          title="Book New Consignment"
          description="Create a fresh CN with GST auto-calculation, rate matrix lookup, and multi-piece package weight tags."
          href="/dashboard/operations/new-cn"
          icon={PlusCircle}
        />
      </div>
    </div>
  );
}
