"use client";

import React from "react";
import { Receipt, Printer, FileSpreadsheet, PlusCircle } from "lucide-react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";

export default function MREntryPage() {
  return (
    <div className="space-y-4 pb-10">
      <WcvRibbonHeader title="MR Entry" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Generate Bill MR With Rebate"
          description="Generate Bill MR With Rebate"
          href="/dashboard/finance/mr-entry/generate-bill-mr-rebate"
          icon={Receipt}
        />
        <WcvActionCard
          title="Generate Bill MR."
          description="Generate Bill MR."
          href="/dashboard/finance/mr-entry/generate-bill-mr"
          icon={Receipt}
        />
        <WcvActionCard
          title="Generate Paid/Topay MR."
          description="Generate Paid/Topay MR."
          href="/dashboard/finance/mr-entry/paid-topay-mr"
          icon={Receipt}
        />
        <WcvActionCard
          title="View Print MR"
          description="View Print MR"
          href="/dashboard/finance/mr-entry/view-print-mr"
          icon={Printer}
        />
        <WcvActionCard
          title="Credit Note"
          description="Credit Note"
          href="/dashboard/finance/mr-entry/credit-note"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="View Print Credit Note"
          description="View Print Credit Note"
          href="/dashboard/finance/mr-entry/view-print-credit-note"
          icon={Printer}
        />
        <WcvActionCard
          title="Credit Note New"
          description="Credit Note New"
          href="/dashboard/finance/mr-entry/credit-note-new"
          icon={PlusCircle}
        />
      </div>
    </div>
  );
}
