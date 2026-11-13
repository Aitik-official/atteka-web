"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Clock, AlertCircle } from "lucide-react";

export default function ERPTrackingReportsHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="ERP Tracking" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="PDC Advance Payment Pending"
          description="PDC freight advance payment"
          href="/dashboard/finance/vendor-billing/pdc-freight-advance-single"
          icon={Clock}
        />
        <WcvActionCard
          title="PDC Balance Payment Pending"
          description="PDC balance payment"
          href="/dashboard/finance/vendor-billing/pdc-balance-payment-single"
          icon={AlertCircle}
        />
      </div>
    </div>
  );
}
