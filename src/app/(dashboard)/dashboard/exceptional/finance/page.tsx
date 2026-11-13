"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  Edit3,
  Calendar,
  XCircle,
  FileText,
  DollarSign,
  Users,
  Building,
  CreditCard,
  FileSpreadsheet,
  AlertOctagon,
  X,
  FileMinus
} from "lucide-react";

type CardDef = {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  unavailable?: boolean;
  unavailableReason?: string;
};

const CARDS: CardDef[] = [
  {
    title: "Edit PDC Advance Payable Branch",
    icon: Building,
    unavailable: true,
    unavailableReason: "Finance override screen not built — was dumping to billing"
  },
  {
    title: "Edit PDC Balance Payable Branch",
    icon: Building,
    unavailable: true,
    unavailableReason: "Finance override screen not built — was dumping to billing"
  },
  {
    title: "Edit PDC Vendor/Date/Vehicle",
    description: "Exceptional Operation module",
    icon: Edit3,
    href: "/dashboard/exceptional/operation/edit-pdc-vendor-date-vehicle"
  },
  {
    title: "Cancel PDC Advance Entry",
    icon: XCircle,
    unavailable: true,
    unavailableReason: "Cancel advance entry screen not built"
  },
  {
    title: "Cancel Multiple PDC Advance Entry",
    icon: XCircle,
    unavailable: true,
    unavailableReason: "Cancel advance entry screen not built"
  },
  {
    title: "Edit Bill Collection Branch",
    icon: Building,
    unavailable: true,
    unavailableReason: "Bill branch override screen not built"
  },
  {
    title: "Edit Bill Remark and Bill Address",
    icon: Edit3,
    unavailable: true,
    unavailableReason: "Bill remark override screen not built"
  },
  {
    title: "Edit Bill Amount",
    icon: DollarSign,
    unavailable: true,
    unavailableReason: "Bill amount override screen not built"
  },
  {
    title: "Edit Billing Party",
    description: "Exceptional Operation module",
    icon: Users,
    href: "/dashboard/exceptional/operation/edit-billing-party"
  },
  {
    title: "Edit Bill Date",
    icon: Calendar,
    unavailable: true,
    unavailableReason: "Bill date override screen not built"
  },
  {
    title: "Cancel Bill",
    description: "View / print bills (cancel from billing suite later)",
    icon: XCircle,
    href: "/dashboard/finance/customer-billing/view-print-bills"
  },
  {
    title: "Cancel MR",
    description: "View / print MR",
    icon: XCircle,
    href: "/dashboard/finance/mr-entry/view-print-mr"
  },
  {
    title: "Edit MR Bank Account",
    icon: CreditCard,
    unavailable: true,
    unavailableReason: "MR bank override screen not built"
  },
  {
    title: "Edit Manual document Number",
    description: "Exceptional Operation module",
    icon: FileText,
    href: "/dashboard/exceptional/operation/edit-manual-document-number"
  },
  {
    title: "Edit Voucher Date",
    icon: Calendar,
    unavailable: true,
    unavailableReason: "Voucher date override screen not built"
  },
  {
    title: "Edit Cheque No & Date",
    description: "Cheque management hub",
    icon: CreditCard,
    href: "/dashboard/finance/cheque-management"
  },
  {
    title: "Cancel Cheque",
    description: "Cheque management hub",
    icon: XCircle,
    href: "/dashboard/finance/cheque-management"
  },
  {
    title: "Cancel Voucher",
    description: "View / cancel vouchers",
    icon: XCircle,
    href: "/dashboard/finance/vouchers/view-cancel-vouchers"
  },
  {
    title: "Edit Account Head",
    icon: Edit3,
    unavailable: true,
    unavailableReason: "Account head override screen not built"
  },
  {
    title: "Edit Docket",
    description: "Dockets list",
    icon: FileSpreadsheet,
    href: "/dashboard/operations/dockets"
  },
  {
    title: "Edit Narration",
    icon: Edit3,
    unavailable: true,
    unavailableReason: "Narration override screen not built"
  },
  {
    title: "Edit Voucher Amount",
    icon: DollarSign,
    unavailable: true,
    unavailableReason: "Voucher amount override screen not built"
  },
  {
    title: "Edit PDC Non-Financial to Financial",
    icon: Edit3,
    unavailable: true,
    unavailableReason: "PDC financial flag override not built"
  },
  {
    title: "Update Vendor PAN NUMBER",
    description: "Vendor master",
    icon: CreditCard,
    href: "/dashboard/masters/vendors"
  },
  {
    title: "Cancel Vendor Invoice",
    description: "Cancel vendor invoice",
    icon: XCircle,
    href: "/dashboard/finance/vouchers/cancel-vendor-invoice"
  },
  {
    title: "Cancel Vendor Payment",
    description: "Cancel vendor payment",
    icon: XCircle,
    href: "/dashboard/finance/vouchers/cancel-vendor-payment"
  },
  {
    title: "Edit Other Bill Amount",
    description: "Other bill entry",
    icon: DollarSign,
    href: "/dashboard/finance/customer-billing/other-bill"
  },
  {
    title: "Update Vendor TDS Aplicable",
    description: "Vendor master",
    icon: FileMinus,
    href: "/dashboard/masters/vendors"
  },
  {
    title: "Edit Dedicated Bill Amount",
    icon: DollarSign,
    unavailable: true,
    unavailableReason: "Dedicated bill amount override not built"
  }
];

export default function ExceptionalFinanceHubPage() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <WcvRibbonHeader title="Finance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((card) => (
          <WcvActionCard
            key={card.title}
            title={card.title}
            description={card.description || card.title}
            icon={card.icon}
            href={card.href}
            unavailable={card.unavailable}
            unavailableReason={card.unavailableReason}
            onClick={
              card.href
                ? undefined
                : card.unavailable
                  ? () => setNotice(card.title)
                  : undefined
            }
          />
        ))}
      </div>

      {notice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Not linked yet</h3>
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              <strong>{notice}</strong> has no dedicated exceptional screen. It no longer redirects to
              Customer Billing.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  router.push("/dashboard/exceptional/operation");
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Open Exceptional Operation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
