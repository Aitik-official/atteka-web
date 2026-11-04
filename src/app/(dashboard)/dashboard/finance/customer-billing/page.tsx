"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Receipt, FileText, Download, CheckCircle, Printer, FileSpreadsheet } from "lucide-react";

export default function CustomerBillingHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Customer Billing" />

      {/* 6 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Docket Financial Completion"
          description="Docket Financial Completion"
          href="/dashboard/finance/billing"
          icon={CheckCircle}
        />
        <WcvActionCard
          title="Transport Bill"
          description="Bill Generation"
          href="/dashboard/finance/billing"
          icon={Receipt}
        />
        <WcvActionCard
          title="Other Bill"
          description="Other Bill"
          href="/dashboard/finance/billing"
          icon={FileText}
        />
        <WcvActionCard
          title="View Print Bill"
          description="View Print Bill"
          href="/dashboard/finance/billing"
          icon={Printer}
        />
        <WcvActionCard
          title="Customer Invoice"
          description="Customer Invoice"
          href="/dashboard/finance/billing"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="Download Multiple PODs"
          description="Download Multiple PODs"
          href="/dashboard/operations/dockets"
          icon={Download}
        />
      </div>
    </div>
  );
}

