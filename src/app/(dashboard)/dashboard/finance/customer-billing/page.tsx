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
          href="/dashboard/finance/customer-billing/completion-financial"
          icon={CheckCircle}
        />
        <WcvActionCard
          title="Transport Bill"
          description="Bill Generation"
          href="/dashboard/finance/customer-billing/transport-bill"
          icon={Receipt}
        />
        <WcvActionCard
          title="Other Bill"
          description="Other Bill"
          href="/dashboard/finance/customer-billing/other-bill"
          icon={FileText}
        />
        <WcvActionCard
          title="View Print Bill"
          description="View Print Bill"
          href="/dashboard/finance/customer-billing/view-print-bills"
          icon={Printer}
        />
        <WcvActionCard
          title="Customer Invoice"
          description="Customer Invoice"
          href="/dashboard/finance/customer-billing/customer-invoice"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="Download Multiple PODs"
          description="Download Multiple PODs"
          href="/dashboard/finance/customer-billing/download-multiple-pods"
          icon={Download}
        />
      </div>
    </div>
  );
}

