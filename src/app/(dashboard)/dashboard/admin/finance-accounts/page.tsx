"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Receipt } from "lucide-react";

export default function FinanceAccountsAdminHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Finance & Accounts" />

      {/* 1 Action Card matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="GST Sac Code Master"
          description="GST Sac Code Master"
          href="/dashboard/finance/e-invoice"
          icon={Receipt}
        />
      </div>
    </div>
  );
}

