"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { FilePlus, Edit3, Printer } from "lucide-react";

export default function FreightBookingHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header */}
      <WcvRibbonHeader title="Freight Booking" />

      {/* Action Cards Grid matching Image 5 from ateka.webcorevision.com */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <WcvActionCard
          title="New CN"
          description="New CN"
          href="/dashboard/operations/new-cn"
          icon={FilePlus}
        />
        <WcvActionCard
          title="Edit CN"
          description="Edit CN"
          href="/dashboard/operations/dockets"
          icon={Edit3}
        />
        <WcvActionCard
          title="View/Print E-Docket"
          description="View/Print E-Docket"
          href="/dashboard/operations/dockets"
          icon={Printer}
        />
      </div>
    </div>
  );
}
