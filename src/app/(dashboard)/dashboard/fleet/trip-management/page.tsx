"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { CreditCard, CheckSquare, Printer, Receipt, FileCheck2 } from "lucide-react";

export default function TripManagementHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Company Vehicle Payment" subtitle="Trip Management · Fleet advances & settlements" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Company Advance Payment Entry"
          description="Select document date / vehicle and issue company vehicle advance"
          href="/dashboard/fleet/trip-management/company-advance-payment"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Trip Settlement"
          description="Select document date / vehicle and finalize trip settlement"
          href="/dashboard/fleet/trip-management/trip-settlement"
          icon={CheckSquare}
        />
        <WcvActionCard
          title="View Print Trip Settlement"
          description="Select document date / no. and print trip settlement statement"
          href="/dashboard/fleet/trip-management/view-print-trip-settlement"
          icon={Printer}
        />
        <WcvActionCard
          title="View Print Vehicle Advance Payment"
          description="Select document date / no. and print vehicle advance receipt"
          href="/dashboard/fleet/trip-management/view-print-vehicle-advance"
          icon={Receipt}
        />
        <WcvActionCard
          title="Voucher Payment"
          description="Company vehicle expense voucher with GST / TDS payment"
          href="/dashboard/fleet/trip-management/voucher-payment"
          icon={FileCheck2}
        />
      </div>
    </div>
  );
}
