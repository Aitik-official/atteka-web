"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { CreditCard, Landmark, Truck, CheckCircle2 } from "lucide-react";

export default function VendorBillingHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Operation Expense Vouchers" />

      {/* 7 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="PDC Freight/Advance Payment [Single]"
          description="PDC Freight/Advance Payment [Single]"
          href="/dashboard/finance/vendor-billing/pdc-freight-advance-single"
          icon={CreditCard}
        />
        <WcvActionCard
          title="PDC Freight/Advance Payment [Multiple]"
          description="PDC Freight/Advance Payment [Multiple]"
          href="/dashboard/finance/vendor-billing/pdc-freight-advance-multiple"
          icon={CreditCard}
        />
        <WcvActionCard
          title="PDC Balance Payment [Single]"
          description="PDC Balance Payment [Single]"
          href="/dashboard/finance/vendor-billing/pdc-balance-payment-single"
          icon={Landmark}
        />
        <WcvActionCard
          title="PDC Balance Payment [Multiple]"
          description="PDC Balance Payment [Multiple]"
          href="/dashboard/finance/vendor-billing/pdc-balance-payment-multiple"
          icon={Landmark}
        />
        <WcvActionCard
          title="TripSheet Advance Payment"
          description="TripSheet Advance Payment"
          href="/dashboard/finance/vendor-billing/tripsheet-advance-payment"
          icon={Truck}
        />
        <WcvActionCard
          title="TripSheet Balance Payment"
          description="TripSheet Balance Payment"
          href="/dashboard/finance/vendor-billing/tripsheet-balance-payment"
          icon={Truck}
        />
        <WcvActionCard
          title="Vendor Bill Finalization Process"
          description="Vendor Bill Finalization Process"
          href="/dashboard/finance/vendor-billing/vendor-bill-finalization"
          icon={CheckCircle2}
        />
      </div>
    </div>
  );
}

