"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  Building2,
  FileText,
  Landmark,
  Printer,
  Receipt,
  ScrollText,
  Wallet
} from "lucide-react";

export default function FinanceHubPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <WcvRibbonHeader title="Finance" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Customer Billing"
          description="Transport bills & view / print"
          href="/dashboard/finance/customer-billing"
          icon={FileText}
        />
        <WcvActionCard
          title="Vendor Billing"
          description="Vendor billing"
          href="/dashboard/finance/vendor-billing"
          icon={ScrollText}
        />
        <WcvActionCard
          title="MR Entry"
          description="Generate & view Money Receipts"
          href="/dashboard/finance/mr-entry"
          icon={Receipt}
        />
        <WcvActionCard
          title="Vouchers"
          description="Financial vouchers"
          href="/dashboard/finance/vouchers"
          icon={Wallet}
        />
        <WcvActionCard
          title="Cash & Bank Statement"
          description="CBS & bank statements"
          href="/dashboard/finance/cash-bank-statement"
          icon={Landmark}
        />
        <WcvActionCard
          title="Cheque Management"
          description="Issued & received cheques"
          href="/dashboard/finance/cheque-management"
          icon={Building2}
        />
        <WcvActionCard
          title="E-Invoice (IRN)"
          description="Generate e-invoice"
          href="/dashboard/finance/e-invoice"
          icon={FileText}
        />
        <WcvActionCard
          title="Print Document [Dot-Matrix]"
          description="Dot-matrix print"
          href="/dashboard/finance/print-dot-matrix"
          icon={Printer}
        />
      </div>
    </div>
  );
}
