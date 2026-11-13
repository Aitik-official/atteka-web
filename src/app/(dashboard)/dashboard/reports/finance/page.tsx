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
      <WcvRibbonHeader title="Finance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="CN Register With Freight Details"
          description="Consignment Register With Freight Details"
          href="/dashboard/reports/finance/cn-freight-register"
          icon={FileText}
        />
        <WcvActionCard
          title="Un-Billed CN Registred"
          description="Both Financially Completed and Financially Un-Completed"
          href="/dashboard/reports/finance/unbilled-cn-register"
          icon={Clock}
        />
        <WcvActionCard
          title="Un-Billed CNs Branch wise ageing"
          description="Un-Billed Dockets Branch wise ageing"
          href="/dashboard/reports/finance/unbilled-branch-ageing"
          icon={Building}
        />
        <WcvActionCard
          title="Bills Generated Report [Docket wise]"
          description="Bills Generated Report [Docket wise]"
          href="/dashboard/reports/finance/bills-generated-docket-wise"
          icon={FileSpreadsheet}
        />

        <WcvActionCard
          title="Voucher Wise Invoice Report"
          description="Voucher Wise Invoice Report"
          href="/dashboard/reports/finance/voucher-wise-invoice"
          icon={Receipt}
        />
        <WcvActionCard
          title="Bills Generated Report"
          description="Bills Generated Report"
          href="/dashboard/reports/finance/bills-generated"
          icon={DollarSign}
        />
        <WcvActionCard
          title="Party Wise Bill Summary"
          description="Party Wise Bill Summary"
          href="/dashboard/reports/finance/party-wise-bill-register"
          icon={Users}
        />
        <WcvActionCard
          title="Bill Register With Collection Details"
          description="Bill Register With Collection Details"
          href="/dashboard/reports/finance/bill-register-collection"
          icon={CheckCircle}
        />

        <WcvActionCard
          title="Submitted O/S Detail"
          description="Submitted O/S Detail"
          href="/dashboard/reports/finance/submitted-os-detail"
          icon={FileText}
        />
        <WcvActionCard
          title="Submitted O/S Detail [Without On Account]"
          description="Submitted O/S Detail [Without On Account]"
          href="/dashboard/reports/finance/submitted-os-without-on-account"
          icon={FileText}
        />
        <WcvActionCard
          title="Submitted O/S [Docket wise]"
          description="Financially unclosed Bills [Docket wise]"
          href="/dashboard/reports/finance/submitted-os-docket-wise"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="Submitted O/S Branch wise ageing"
          description="Submitted O/S Branch wise ageing"
          href="/dashboard/reports/finance/submitted-os-branch-ageing"
          icon={Building}
        />

        <WcvActionCard
          title="Submitted O/S Party wise ageing"
          description="Submitted O/S Customer wise ageing"
          href="/dashboard/reports/finance/submitted-os-party-ageing"
          icon={Users}
        />
        <WcvActionCard
          title="Submitted O/S PDD Report"
          description="Uses Submitted O/S Detail until a dedicated PDD report is built"
          href="/dashboard/reports/finance/submitted-os-detail"
          icon={FileText}
        />
        <WcvActionCard
          title="Docket Wise Octroi Details"
          description="Docket Wise Octroi Details"
          href="/dashboard/reports/finance/docket-wise-octroi"
          icon={Receipt}
        />
        <WcvActionCard
          title="MR wise Collection Report"
          description="MR wise Collection Report"
          href="/dashboard/reports/finance/mr-wise-collection"
          icon={Receipt}
        />
        <WcvActionCard
          title="BILL wise Collection Report"
          description="Bill register with collection details"
          href="/dashboard/reports/finance/bill-register-collection"
          icon={Receipt}
        />

        <WcvActionCard
          title="THC/PDC Financial updation Pending"
          description="Opens vendor billing PDC advance / balance suite"
          href="/dashboard/finance/vendor-billing"
          icon={Layers}
        />
        <WcvActionCard
          title="Unadjusted Cheque Report"
          description="Opens cheque management hub"
          href="/dashboard/finance/cheque-management"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Customer Un-Billed CN Registred"
          description="Both Financially Completed and Financially Un-Completed"
          href="/dashboard/reports/finance/unbilled-cn-register"
          icon={AlertCircle}
        />
        <WcvActionCard
          title="Bill Wise O/S Detail"
          description="Submitted O/S Detail"
          href="/dashboard/reports/finance/submitted-os-detail"
          icon={FileSpreadsheet}
        />
      </div>
    </div>
  );
}
