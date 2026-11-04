"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Clock, AlertCircle } from "lucide-react";

export default function ERPTrackingReportsHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="ERP Tracking" />

      {/* 2 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="PDC Advance Payment Pending"
          description="PDC Advance Payment Pending"
          href="/dashboard/finance/vendor-billing"
          icon={Clock}
        />
        <WcvActionCard
          title="PDC Balance Payment Pending"
          description="PDC Balance Payment Pending"
          href="/dashboard/finance/vendor-billing"
          icon={AlertCircle}
        />
      </div>
    </div>
  );
}
