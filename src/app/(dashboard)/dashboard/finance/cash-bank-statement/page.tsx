"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  FileText,
  Landmark,
  FileSpreadsheet,
  RefreshCw,
  CreditCard,
  Server
} from "lucide-react";

export default function CashBankStatementHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Finance" />

      {/* 6 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="View / Print Cash & Bank Statement"
          description="View / Print Cash & Bank Statement"
          href="/dashboard/finance/bank-statement"
          icon={FileText}
        />
        <WcvActionCard
          title="IndusInd Bank Online Payment Process"
          description="IndusInd Bank Online Payment Process"
          href="/dashboard/finance/bank-payment"
          icon={Landmark}
        />
        <WcvActionCard
          title="Online Payment Report"
          description="Online Payment Report"
          href="/dashboard/finance/bank-payment"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="Online Payment Re-Process"
          description="Online Payment Re-Process"
          href="/dashboard/finance/bank-payment"
          icon={RefreshCw}
        />
        <WcvActionCard
          title="View Bank Statement"
          description="View Bank Statement"
          href="/dashboard/finance/bank-statement"
          icon={CreditCard}
        />
        <WcvActionCard
          title="API Bank Statement"
          description="API Bank Statement"
          href="/dashboard/finance/bank-statement"
          icon={Server}
        />
      </div>
    </div>
  );
}

