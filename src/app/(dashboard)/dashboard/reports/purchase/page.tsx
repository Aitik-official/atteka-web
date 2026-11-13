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
      <WcvRibbonHeader title="Purchase Report" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Vendor Outstanding Report"
          description="Vendor bill finalization / outstanding"
          href="/dashboard/finance/vendor-billing/vendor-bill-finalization"
          icon={DollarSign}
        />
        <WcvActionCard
          title="Vendor Unbilled Report"
          description="Tripsheet balance payment pending"
          href="/dashboard/finance/vendor-billing/tripsheet-balance-payment"
          icon={Clock}
        />
        <WcvActionCard
          title="Other Vendor O/s Report"
          description="Enter / view vendor invoices"
          href="/dashboard/finance/vouchers/view-vendor-invoice"
          icon={FileText}
        />
        <WcvActionCard
          title="Vendor Invoice Details"
          description="View vendor invoice"
          href="/dashboard/finance/vouchers/view-vendor-invoice"
          icon={Receipt}
        />

        <WcvActionCard
          title="PDC Advance Payment"
          description="PDC freight advance (single)"
          href="/dashboard/finance/vendor-billing/pdc-freight-advance-single"
          icon={CreditCard}
        />
        <WcvActionCard
          title="PDC Wise Vendor O/S Report"
          description="PDC balance payment (single)"
          href="/dashboard/finance/vendor-billing/pdc-balance-payment-single"
          icon={FileSpreadsheet}
        />
      </div>
    </div>
  );
}
