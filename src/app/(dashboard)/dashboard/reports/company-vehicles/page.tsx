"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  Clock,
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  CircleDot,
  RotateCcw,
  AlertOctagon,
  Wrench
} from "lucide-react";

export default function CompanyVehicleReportsHubPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <WcvRibbonHeader title="Company Vechicle Reports" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Pending for Trip Settlement"
          description="Trip settlement"
          href="/dashboard/fleet/trip-management/trip-settlement"
          icon={Clock}
        />
        <WcvActionCard
          title="Pending for Trip Advance"
          description="Voucher / trip advance payment"
          href="/dashboard/fleet/trip-management/voucher-payment"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Trip Register"
          description="Tripsheets hub"
          href="/dashboard/operations/tripsheets"
          icon={FileText}
        />
        <WcvActionCard
          title="Trip wise Income Vs. Expense"
          unavailable
          unavailableReason="Dedicated trip P&L report page not built yet"
          icon={DollarSign}
        />

        <WcvActionCard
          title="Vehicle Wise Income Vs. Expense"
          unavailable
          unavailableReason="Dedicated vehicle P&L report page not built yet"
          icon={TrendingUp}
        />
        <WcvActionCard
          title="Stock Report"
          description="Vehicle master stock list"
          href="/dashboard/masters/vehicles"
          icon={Package}
        />
        <WcvActionCard
          title="GIN Register"
          unavailable
          unavailableReason="GIN register screen not built — was wrongly linked to vehicle master"
          icon={Layers}
        />
        <WcvActionCard
          title="New Tyre Register Report"
          unavailable
          unavailableReason="Tyre register screens not built — was wrongly linked to vehicle master"
          icon={CircleDot}
        />

        <WcvActionCard
          title="Old Tyre Register Report"
          unavailable
          unavailableReason="Tyre register screens not built — was wrongly linked to vehicle master"
          icon={RotateCcw}
        />
        <WcvActionCard
          title="Claim Tyre Register Report"
          unavailable
          unavailableReason="Tyre register screens not built — was wrongly linked to vehicle master"
          icon={AlertOctagon}
        />
        <WcvActionCard
          title="Remould Tyre Report"
          unavailable
          unavailableReason="Tyre register screens not built — was wrongly linked to vehicle master"
          icon={Wrench}
        />
      </div>
    </div>
  );
}