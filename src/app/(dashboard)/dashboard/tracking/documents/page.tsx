"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  Search,
  FileText,
  DollarSign,
  Layers,
  Camera,
  Receipt
} from "lucide-react";

export default function TrackingDocumentsHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Tracking" />

      {/* 6 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <WcvActionCard
          title="Docket Tracking"
          description="Docket Tracking"
          href="/dashboard/operations/tracking"
          icon={Search}
        />
        <WcvActionCard
          title="New CN Tracking"
          description="New Docket Tracking"
          href="/dashboard/operations/tracking"
          icon={FileText}
        />
        <WcvActionCard
          title="Track CN Expense"
          description="Track CN Expense"
          href="/dashboard/finance/vendor-billing"
          icon={DollarSign}
        />
        <WcvActionCard
          title="Track Documents [CN/TC/THC/PDC]"
          description="Track Documents [CN/TC/THC/PDC]"
          href="/dashboard/operations/tracking"
          icon={Layers}
        />

        {/* Row 2 */}
        <WcvActionCard
          title="View Pod Scan"
          description="View Pod Scan"
          href="/dashboard/operations/dockets"
          icon={Camera}
        />
        <WcvActionCard
          title="Bill Genrated Details"
          description="Bill Genrated Details"
          href="/dashboard/finance/billing"
          icon={Receipt}
        />
      </div>
    </div>
  );
}

