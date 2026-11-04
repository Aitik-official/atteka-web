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
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Accounts" />

      {/* 12 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <WcvActionCard
          title="Cash and Bank Transaction Statement"
          description="Cash and Bank Transaction Statement"
          href="/dashboard/finance/cash-bank-statement"
          icon={Landmark}
        />
        <WcvActionCard
          title="General Ledger"
          description="Listing of transactions under various Account Heads"
          href="/dashboard/finance/vouchers"
          icon={BookOpen}
        />
        <WcvActionCard
          title="Subsidiary Ledger"
          description="Listing of transactions under various Vendor / Customer"
          href="/dashboard/finance/billing"
          icon={Users}
        />
        <WcvActionCard
          title="Customer Ledger"
          description="Customer Ledger"
          href="/dashboard/finance/mr-entry"
          icon={FileText}
        />

        {/* Row 2 */}
        <WcvActionCard
          title="Branch P&L Report"
          description="Branch Profit and Loss Report"
          href="/dashboard/reports"
          icon={TrendingDown}
        />
        <WcvActionCard
          title="Negative Cash Balance Statement"
          description="Negative Cash Balance Statement"
          href="/dashboard/finance/cash-bank-statement"
          icon={AlertTriangle}
        />
        <WcvActionCard
          title="Debit Advice Report"
          description="Debit Advice Report"
          href="/dashboard/finance/print-dot-matrix"
          icon={Receipt}
        />
        <WcvActionCard
          title="TDS Report"
          description="TDS Report"
          href="/dashboard/finance/e-invoice"
          icon={FileSpreadsheet}
        />

        {/* Row 3 */}
        <WcvActionCard
          title="Issued Cheques"
          description="Listing of all Cheques issued in a given time period"
          href="/dashboard/finance/cheque-management"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Received Cheques"
          description="Listing of all Cheques received in a given time period"
          href="/dashboard/finance/cheque-management"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Cash & Bank Report"
          description="Cash & Bank Report"
          href="/dashboard/finance/cash-bank-statement"
          icon={DollarSign}
        />
        <WcvActionCard
          title="Voucher Approvals"
          description="Voucher Approvals"
          href="/dashboard/finance/vouchers"
          icon={FileCheck2}
        />

        {/* Row 4 (matching Image 1 scrolled view) */}
        <WcvActionCard
          title="Voucher Approval All"
          description="Voucher Approval All"
          href="/dashboard/finance/vouchers"
          icon={FileCheck2}
        />
        <WcvActionCard
          title="GST Report"
          description="GST Report"
          href="/dashboard/finance/e-invoice"
          icon={ShieldCheck}
        />
        <WcvActionCard
          title="GST OutPut Register"
          description="GST OutPut Register"
          href="/dashboard/finance/e-invoice"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="GSTR1 Report"
          description="GSTR1 Report"
          href="/dashboard/finance/e-invoice"
          icon={Receipt}
        />

        {/* Row 5 */}
        <WcvActionCard
          title="Bill Edit Register"
          description="Bill Edit Register"
          href="/dashboard/finance/billing"
          icon={Edit3}
        />
      </div>
    </div>
  );
}

