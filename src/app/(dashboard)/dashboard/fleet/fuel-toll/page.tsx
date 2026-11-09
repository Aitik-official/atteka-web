"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Fuel } from "lucide-react";

export default function FuelTollHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Fuel and Toll Management" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="BPCL Sale Transaction"
          description="Filter by date / vehicle and view Fuel Summary Report"
          href="/dashboard/fleet/fuel-toll/bpcl-sale-transaction"
          icon={Fuel}
        />
      </div>
    </div>
  );
}
