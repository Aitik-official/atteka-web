"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { FileCheck, Truck, Printer } from "lucide-react";

export default function ViewPrintDocumentHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="View Print Document" />

      {/* Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="View/Print Pickup PDC"
          description="View/Print Pickup PDC"
          href="/dashboard/operations/view-print/pickup-pdc"
          icon={Truck}
        />
        <WcvActionCard
          title="View/Print Delivery PDC"
          description="View/Print Delivery PDC"
          href="/dashboard/operations/view-print/delivery-pdc"
          icon={FileCheck}
        />
      </div>
    </div>
  );
}

