"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Edit3, Printer } from "lucide-react";

export default function CnOperationsHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header */}
      <WcvRibbonHeader title="CN Operations [HP]" />

      {/* Action Cards Grid matching Image 4 from ateka.webcorevision.com */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <WcvActionCard
          title="Edit CN"
          description="Edit CN"
          href="/dashboard/operations/dockets"
          icon={Edit3}
        />
        <WcvActionCard
          title="View/Print CN"
          description="View/Print CN"
          href="/dashboard/operations/dockets"
          icon={Printer}
        />
      </div>
    </div>
  );
}

