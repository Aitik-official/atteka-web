"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { RefreshCw } from "lucide-react";

export default function ExceptionalBRSHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Bank Reconciliation Statment" />

      {/* 1 Action Card matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Update BRS"
          description="Update BRS"
          href="/dashboard/finance/bank-statement"
          icon={RefreshCw}
        />
      </div>
    </div>
  );
}

