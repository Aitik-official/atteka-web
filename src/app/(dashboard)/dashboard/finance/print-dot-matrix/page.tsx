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
      <WcvRibbonHeader title="Print Document [Dot-Matrix ]" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="PDC Freight Memo"
          description="PDC Freight Memo"
          href="/dashboard/finance/print-dot-matrix/pdc-freight-memo"
          icon={Truck}
        />
        <WcvActionCard
          title="PDC Advance Voucher"
          description="Print vouchers (advance / payment)"
          href="/dashboard/finance/print-dot-matrix/print-vouchers"
          icon={Receipt}
        />
        <WcvActionCard
          title="Print Voucher"
          description="Print Voucher"
          href="/dashboard/finance/print-dot-matrix/print-vouchers"
          icon={Printer}
        />
        <WcvActionCard
          title="Print Debit Advice"
          description="Print Debit Advice"
          href="/dashboard/finance/print-dot-matrix/print-debit-advice"
          icon={FileText}
        />
        <WcvActionCard
          title="Print Journal Voucher"
          description="View journal vouchers"
          href="/dashboard/finance/vouchers/view-journal-vouchers"
          icon={FileCheck}
        />
        <WcvActionCard
          title="Docket Print"
          description="Docket Print"
          href="/dashboard/finance/print-dot-matrix/docket-print"
          icon={FileSpreadsheet}
        />
      </div>
    </div>
  );
}
