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
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Company Vechicle Reports" />

      {/* 11 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <WcvActionCard
          title="Pending for Trip Settlement"
          description="Pending for Trip Settlement"
          href="/dashboard/fleet/trip-management"
          icon={Clock}
        />
        <WcvActionCard
          title="Pending for Trip Advance"
          description="Pending for Trip Advance"
          href="/dashboard/fleet/trip-management"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Trip Register"
          description="Trip Register"
          href="/dashboard/operations/tripsheets"
          icon={FileText}
        />
        <WcvActionCard
          title="Trip wise Income Vs. Expense"
          description="Trip wise Income Vs. Expense"
          href="/dashboard/reports"
          icon={DollarSign}
        />

        {/* Row 2 */}
        <WcvActionCard
          title="Vehicle Wise Income Vs. Expense"
          description="Vehicle Wise Income Vs. Expense"
          href="/dashboard/reports"
          icon={TrendingUp}
        />
        <WcvActionCard
          title="Stock Report"
          description="Stock Report"
          href="/dashboard/masters/vehicles"
          icon={Package}
        />
        <WcvActionCard
          title="GIN Register"
          description="GIN Register"
          href="/dashboard/masters/vehicles"
          icon={Layers}
        />
        <WcvActionCard
          title="New Tyre Register Report"
          description="New Tyre Register Report"
          href="/dashboard/masters/vehicles"
          icon={CircleDot}
        />

        {/* Row 3 */}
        <WcvActionCard
          title="Old Tyre Register Report"
          description="Old Tyre Register Report"
          href="/dashboard/masters/vehicles"
          icon={RotateCcw}
        />
        <WcvActionCard
          title="Claim Tyre Register Report"
          description="Claim Tyre Register Report"
          href="/dashboard/masters/vehicles"
          icon={AlertOctagon}
        />
        <WcvActionCard
          title="Remould Tyre Report"
          description="Remould Tyre Report"
          href="/dashboard/masters/vehicles"
          icon={Wrench}
        />
      </div>
    </div>
  );
}
