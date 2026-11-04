"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  FileText,
  Printer,
  Receipt,
  FileCheck,
  FileSpreadsheet,
  Truck
} from "lucide-react";

export default function PrintDotMatrixHubPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Print Document [Dot-Matrix ]" />

      {/* 6 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="PDC Freight Memo"
          description="PDC Freight Memo"
          href="/dashboard/operations/tripsheets"
          icon={Truck}
        />
        <WcvActionCard
          title="PDC Advance Voucher"
          description="PDC Advance Voucher"
          href="/dashboard/finance/bank-payment"
          icon={Receipt}
        />
        <WcvActionCard
          title="Print Voucher"
          description="Print Voucher"
          href="/dashboard/finance/bank-payment"
          icon={Printer}
        />
        <WcvActionCard
          title="Print Debit Advice"
          description="Print Debit Advice"
          href="/dashboard/finance/bank-payment"
          icon={FileText}
        />
        <WcvActionCard
          title="Print Journal Voucher"
          description="Print Journal Voucher"
          href="/dashboard/finance/bank-payment"
          icon={FileCheck}
        />
        <WcvActionCard
          title="Docket Print"
          description="Docket Print"
          href="/dashboard/operations/dockets"
          icon={FileSpreadsheet}
        />
      </div>
    </div>
  );
}
