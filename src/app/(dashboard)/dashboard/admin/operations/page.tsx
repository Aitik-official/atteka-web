"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Layers, DollarSign, Truck, Hash } from "lucide-react";
import Link from "next/link";
import { FtlTypeMasterPanel } from "@/components/admin/FtlTypeMasterPanel";
import { RouteCostMasterPanel } from "@/components/admin/RouteCostMasterPanel";
import { VehicleMasterPanel } from "@/components/admin/VehicleMasterPanel";

export default function OperationsAdminHubPage() {
  const [activeModule, setActiveModule] = useState<"hub" | "ftl" | "routeCost" | "vehicle">("hub");

  if (activeModule === "ftl") {
    return <FtlTypeMasterPanel onBack={() => setActiveModule("hub")} />;
  }

  if (activeModule === "routeCost") {
    return <RouteCostMasterPanel onBack={() => setActiveModule("hub")} />;
  }

  if (activeModule === "vehicle") {
    return <VehicleMasterPanel onBack={() => setActiveModule("hub")} />;
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Operations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="FTL Type"
          description="Full Truck Load vehicle body classifications"
          onClick={() => setActiveModule("ftl")}
          icon={Layers}
        />
        <WcvActionCard
          title="Route Cost Master"
          description="Standard corridor tariffs & diesel allowances"
          onClick={() => setActiveModule("routeCost")}
          icon={DollarSign}
        />
        <WcvActionCard
          title="Vehicle Master"
          description="Fleet registration and compliance documents"
          onClick={() => setActiveModule("vehicle")}
          icon={Truck}
        />
        <WcvActionCard
          title="Docket Number Master"
          description="CN / docket stationery series & available stock pool"
          href="/dashboard/masters/docket-numbers"
          icon={Hash}
        />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800">
        New CN booking no longer auto-assigns a docket. Save CN details first, then link an available number from{" "}
        <Link href="/dashboard/masters/docket-numbers" className="font-bold underline">
          Docket Number Master
        </Link>
        .
      </div>
    </div>
  );
}
