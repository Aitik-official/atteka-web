"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  FileText,
  Clock,
  DollarSign,
  Receipt,
  CreditCard,
  FileSpreadsheet
} from "lucide-react";

export default function PurchaseReportsHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Purchase Report" />

      {/* 6 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <WcvActionCard
          title="Vendor Outstanding Report"
          description="Vendor Outstanding Report"
          href="/dashboard/finance/vendor-billing"
          icon={DollarSign}
        />
        <WcvActionCard
          title="Vendor Unbilled Report"
          description="Vendor Unbilled Report"
          href="/dashboard/finance/vendor-billing"
          icon={Clock}
        />
        <WcvActionCard
          title="Other Vendor O/s Report"
          description="Other Vendor O/s Report"
          href="/dashboard/finance/vendor-billing"
          icon={FileText}
        />
        <WcvActionCard
          title="Vendor Invoice Details"
          description="Vendor Invoice Details"
          href="/dashboard/finance/bank-payment"
          icon={Receipt}
        />

        {/* Row 2 */}
        <WcvActionCard
          title="PDC Advance Payment"
          description="PDC Advance Payment"
          href="/dashboard/finance/vendor-billing"
          icon={CreditCard}
        />
        <WcvActionCard
          title="PDC Wise Vendor O/S Report"
          description="PDC O/S Report"
          href="/dashboard/finance/vendor-billing"
          icon={FileSpreadsheet}
        />
      </div>
    </div>
  );
}

