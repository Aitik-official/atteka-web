"use client";

import React from "react";
import { SectionHub } from "@/components/common/SectionHub";
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
    <SectionHub
      title="Finance"
      subtitle="Billing, receipts, vouchers & bank"
      description="Start with customer billing or jump straight into vouchers — every screen shares the same list and form patterns."
      primaryAction={{
        label: "New Debit Voucher",
        href: "/dashboard/finance/vouchers/debit-voucher"
      }}
      cards={[
        {
          title: "Customer Billing",
          description: "Transport bills & view / print",
          href: "/dashboard/finance/customer-billing",
          icon: FileText
        },
        {
          title: "Vendor Billing",
          description: "Advances, balance & finalization",
          href: "/dashboard/finance/vendor-billing",
          icon: ScrollText
        },
        {
          title: "MR Entry",
          description: "Generate & view Money Receipts",
          href: "/dashboard/finance/mr-entry",
          icon: Receipt
        },
        {
          title: "Vouchers",
          description: "Debit, credit, journal & vendor invoices",
          href: "/dashboard/finance/vouchers",
          icon: Wallet
        },
        {
          title: "Cash & Bank Statement",
          description: "CBS & bank statements",
          href: "/dashboard/finance/cash-bank-statement",
          icon: Landmark
        },
        {
          title: "Cheque Management",
          description: "Issued & received cheques",
          href: "/dashboard/finance/cheque-management",
          icon: Building2
        },
        {
          title: "E-Invoice (IRN)",
          description: "Generate & cancel IRN",
          href: "/dashboard/finance/e-invoice",
          icon: FileText
        },
        {
          title: "Print Document [Dot-Matrix]",
          description: "Dot-matrix print jobs",
          href: "/dashboard/finance/print-dot-matrix",
          icon: Printer
        }
      ]}
    />
  );
}
