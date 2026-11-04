"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  Scale,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  BarChart3
} from "lucide-react";

export default function FinalAccountsReportsHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Final Accounts" />

      {/* 5 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <WcvActionCard
          title="Trial Balance"
          description="Trial Balance Report"
          href="/dashboard/finance/bank-statement"
          icon={Scale}
        />
        <WcvActionCard
          title="Profit & Loss Statement"
          description="Profit & Loss statement for various locations and company"
          href="/dashboard/finance/bank-statement"
          icon={TrendingUp}
        />
        <WcvActionCard
          title="Balance Sheet"
          description="Balance Sheet of Company"
          href="/dashboard/finance/bank-statement"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="New Balance Sheet"
          description="Balance Sheet of Company"
          href="/dashboard/finance/bank-statement"
          icon={PieChart}
        />

        {/* Row 2 */}
        <WcvActionCard
          title="New Trial Balance"
          description="New Trial Balance Report"
          href="/dashboard/finance/bank-statement"
          icon={BarChart3}
        />
      </div>
    </div>
  );
}

