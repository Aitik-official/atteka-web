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
      <WcvRibbonHeader title="Tracking" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Docket Tracking"
          description="Track CN by Docket / Invoice / DN No"
          href="/dashboard/tracking/documents/cn-tracking"
          icon={Search}
        />
        <WcvActionCard
          title="New CN Tracking"
          description="View & Track — date range, document type, docket results"
          href="/dashboard/tracking/documents/new-cn-tracking"
          icon={FileText}
        />
        <WcvActionCard
          title="Track CN Expense"
          description="Opens vendor invoice payment view"
          href="/dashboard/finance/vouchers/view-vendor-invoice-payment"
          icon={DollarSign}
        />
        <WcvActionCard
          title="Track Documents [CN/TC/THC/PDC]"
          description="Track by date / type or system / manual document no"
          href="/dashboard/tracking/documents/track-documents"
          icon={Layers}
        />

        <WcvActionCard
          title="View Pod Scan"
          description="Scan POD report"
          href="/dashboard/reports/operations/scan-pod"
          icon={Camera}
        />
        <WcvActionCard
          title="Bill Genrated Details"
          description="Bills generated report"
          href="/dashboard/reports/finance/bills-generated"
          icon={Receipt}
        />
      </div>
    </div>
  );
}
