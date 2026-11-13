"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  Landmark,
  BookOpen,
  Users,
  FileText,
  TrendingDown,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  CreditCard,
  FileCheck2,
  DollarSign,
  ShieldCheck,
  Edit3
} from "lucide-react";

export default function AccountsReportsHubPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <WcvRibbonHeader title="Accounts" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Cash and Bank Transaction Statement"
          description="Cash and Bank Transaction Statement"
          href="/dashboard/finance/cash-bank-statement/view-print-cbs"
          icon={Landmark}
        />
        <WcvActionCard
          title="General Ledger"
          description="Listing of transactions under various Account Heads"
          href="/dashboard/reports/accounts/general-ledger"
          icon={BookOpen}
        />
        <WcvActionCard
          title="Subsidiary Ledger"
          description="Listing of transactions under various Vendor / Customer"
          href="/dashboard/reports/accounts/subsidiary-ledger"
          icon={Users}
        />
        <WcvActionCard
          title="Customer Ledger"
          description="Customer Ledger"
          href="/dashboard/reports/accounts/customer-ledger"
          icon={FileText}
        />

        <WcvActionCard
          title="Branch P&L Report"
          description="Branch Profit and Loss Report"
          href="/dashboard/reports/accounts/branch-profit-loss"
          icon={TrendingDown}
        />
        <WcvActionCard
          title="Negative Cash Balance Statement"
          description="Cash & Bank statement view"
          href="/dashboard/reports/accounts/cash-bank-statement"
          icon={AlertTriangle}
        />
        <WcvActionCard
          title="Debit Advice Report"
          description="Print Debit Advice"
          href="/dashboard/finance/print-dot-matrix/print-debit-advice"
          icon={Receipt}
        />
        <WcvActionCard
          title="TDS Report"
          description="Needs tax / TDS register — not GST e-invoice"
          unavailable
          unavailableReason="No TDS register screen yet (GST credentials not required for this link fix)"
          icon={FileSpreadsheet}
        />

        <WcvActionCard
          title="Issued Cheques"
          description="Cheque book / issue entry"
          href="/dashboard/finance/cheque-management/assign-cheque-book"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Received Cheques"
          description="On-account cheque receipt"
          href="/dashboard/finance/cheque-management/on-account-cheque-receipt"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Cash & Bank Report"
          description="Cash & Bank Statement hub"
          href="/dashboard/finance/cash-bank-statement"
          icon={DollarSign}
        />
        <WcvActionCard
          title="Voucher Approvals"
          description="View / print vouchers"
          href="/dashboard/finance/vouchers/view-print-vouchers"
          icon={FileCheck2}
        />

        <WcvActionCard
          title="Voucher Approval All"
          description="View / cancel vouchers"
          href="/dashboard/finance/vouchers/view-cancel-vouchers"
          icon={FileCheck2}
        />
        <WcvActionCard
          title="GST Report"
          description="Live GST / NIC not configured"
          unavailable
          unavailableReason="Blocked without GST credentials — not routed to e-invoice"
          icon={ShieldCheck}
        />
        <WcvActionCard
          title="GST OutPut Register"
          description="Live GST / NIC not configured"
          unavailable
          unavailableReason="Blocked without GST credentials — not routed to e-invoice"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="GSTR1 Report"
          description="Live GST / NIC not configured"
          unavailable
          unavailableReason="Blocked without GST credentials — not routed to e-invoice"
          icon={Receipt}
        />

        <WcvActionCard
          title="Bill Edit Register"
          description="View / print customer bills"
          href="/dashboard/finance/customer-billing/view-print-bills"
          icon={Edit3}
        />
      </div>
    </div>
  );
}
