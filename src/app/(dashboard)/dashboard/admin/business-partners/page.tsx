"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Users, ShieldCheck, Truck, CheckCircle2, FileCheck } from "lucide-react";

export default function BusinessPartnersAdminHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Business Partners" />

      {/* 5 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <WcvActionCard
          title="Customer Master"
          description="Customer Master"
          href="/dashboard/masters/customers"
          icon={Users}
        />
        <WcvActionCard
          title="Customer GST Registration"
          description="BA Master"
          href="/dashboard/finance/e-invoice"
          icon={ShieldCheck}
        />
        <WcvActionCard
          title="Vendor Master"
          description="Vendor Master"
          href="/dashboard/masters/vendors"
          icon={Truck}
        />
        <WcvActionCard
          title="Vendor Approval"
          description="Vendor Approval"
          href="/dashboard/masters/vendors"
          icon={CheckCircle2}
        />

        {/* Row 2 */}
        <WcvActionCard
          title="Vendor GST Registration"
          description="BA Master"
          href="/dashboard/finance/e-invoice"
          icon={FileCheck}
        />
      </div>
    </div>
  );
}
