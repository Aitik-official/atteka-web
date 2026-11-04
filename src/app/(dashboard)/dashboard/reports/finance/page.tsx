"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  FileText,
  DollarSign,
  Clock,
  FileSpreadsheet,
  Receipt,
  Users,
  Building,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Layers
} from "lucide-react";

export default function FinanceReportsHubPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Finance" />

      {/* 20 Action Cards matching exact screenshots (Image 3 + Image 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <WcvActionCard
          title="CN Register With Freight Details"
          description="Consignment Register With Freight Details"
          href="/dashboard/finance/billing"
          icon={FileText}
        />
        <WcvActionCard
          title="Un-Billed CN Registred"
          description="Both Financially Completed and Financially Un-Completed"
          href="/dashboard/finance/billing"
          icon={Clock}
        />
        <WcvActionCard
          title="Un-Billed CNs Branch wise ageing"
          description="Un-Billed Dockets Branch wise ageing"
          href="/dashboard/finance/billing"
          icon={Building}
        />
        <WcvActionCard
          title="Bills Generated Report [Docket wise]"
          description="Bills Generated Report [Docket wise]"
          href="/dashboard/finance/billing"
          icon={FileSpreadsheet}
        />

        {/* Row 2 */}
        <WcvActionCard
          title="Voucher Wise Invoice Report"
          description="Voucher Wise Invoice Report"
          href="/dashboard/finance/vouchers"
          icon={Receipt}
        />
        <WcvActionCard
          title="Bills Generated Report"
          description="Bills Generated Report"
          href="/dashboard/finance/billing"
          icon={DollarSign}
        />
        <WcvActionCard
          title="Party Wise Bill Summary"
          description="Party Wise Bill Summary"
          href="/dashboard/finance/billing"
          icon={Users}
        />
        <WcvActionCard
          title="Bill Register With Collection Details"
          description="Bill Register With Collection Details"
          href="/dashboard/finance/mr-entry"
          icon={CheckCircle}
        />

        {/* Row 3 */}
        <WcvActionCard
          title="Submitted O/S Detail"
          description="Submitted O/S Detail"
          href="/dashboard/finance/billing"
          icon={FileText}
        />
        <WcvActionCard
          title="Submitted O/S Detail [Without On Account]"
          description="Submitted O/S Detail [Without On Account]"
          href="/dashboard/finance/billing"
          icon={FileText}
        />
        <WcvActionCard
          title="Submitted O/S [Docket wise]"
          description="Financially unclosed Bills [Docket wise]"
          href="/dashboard/finance/billing"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="Submitted O/S Branch wise ageing"
          description="Submitted O/S Branch wise ageing"
          href="/dashboard/finance/billing"
          icon={Building}
        />

        {/* Row 4 */}
        <WcvActionCard
          title="Submitted O/S PDD Report"
          description="Submitted O/S PDD Report"
          href="/dashboard/finance/billing"
          icon={FileText}
        />
        <WcvActionCard
          title="Docket Wise Octroi Details"
          description="Docket Wise Octroi Details"
          href="/dashboard/operations/dockets"
          icon={Receipt}
        />
        <WcvActionCard
          title="MR wise Collection Report"
          description="MR wise Collection Report"
          href="/dashboard/finance/mr-entry"
          icon={Receipt}
        />
        <WcvActionCard
          title="BILL wise Collection Report"
          description="BILL wise Collection Reportnull"
          href="/dashboard/finance/billing"
          icon={Receipt}
        />

        {/* Row 5 */}
        <WcvActionCard
          title="THC/PDC Financial updation Pending"
          description="THC/PDC Financial updation Pending"
          href="/dashboard/operations/tripsheets"
          icon={Layers}
        />
        <WcvActionCard
          title="Unadjusted Cheque Report"
          description="Unadjusted Cheque Report"
          href="/dashboard/finance/cheque-management"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Customer Un-Billed CN Registred"
          description="Both Financially Completed and Financially Un-Completed"
          href="/dashboard/finance/billing"
          icon={AlertCircle}
        />
        <WcvActionCard
          title="Bill Wise O/S Detail"
          description="Bill Wise O/S Detail"
          href="/dashboard/finance/billing"
          icon={FileSpreadsheet}
        />
      </div>
    </div>
  );
}

