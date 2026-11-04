"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  FileText,
  CreditCard,
  Receipt,
  DollarSign,
  ArrowLeftRight,
  BookOpen,
  Printer,
  FileCheck,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileMinus,
  FileX,
  ShieldCheck,
  CheckCircle2,
  X
} from "lucide-react";

export default function VouchersHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleAction = (title: string, defaultHref?: string) => {
    if (defaultHref && defaultHref !== "#") {
      window.location.href = defaultHref;
    } else {
      setActiveModal(title);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Vouchers" />

      {/* 16 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <WcvActionCard
          title="Enter Vendor Invoice"
          description="Enter Vendor Invoice"
          href="/dashboard/finance/bank-payment"
          icon={FileText}
        />
        <WcvActionCard
          title="Enter Vendor Payment"
          description="Enter Vendor Payment"
          href="/dashboard/finance/bank-payment"
          icon={CreditCard}
        />
        <WcvActionCard
          title="Debit Voucher"
          description="Payment voucher with GST % & TDS"
          href="/dashboard/finance/bank-payment"
          icon={Receipt}
        />
        <WcvActionCard
          title="Credit Voucher"
          description="Credit Voucher"
          href="/dashboard/finance/bank-payment"
          icon={DollarSign}
        />

        {/* Row 2 */}
        <WcvActionCard
          title="Contra Entry"
          description="Contra Entry"
          href="/dashboard/finance/bank-payment"
          icon={ArrowLeftRight}
        />
        <WcvActionCard
          title="Journal Entry"
          description="Journal Entry"
          href="/dashboard/finance/bank-payment"
          icon={BookOpen}
        />
        <WcvActionCard
          title="View Print Vouchers"
          description="View Print Vouchers"
          href="/dashboard/finance/bank-payment"
          icon={Printer}
        />
        <WcvActionCard
          title="View Journal Vouchers"
          description="View Journal Vouchers"
          href="/dashboard/finance/bank-payment"
          icon={FileCheck}
        />

        {/* Row 3 */}
        <WcvActionCard
          title="Cancel Vendor Invoice"
          description="Cancel Vendor Invoice"
          href="/dashboard/finance/bank-payment"
          icon={XCircle}
        />
        <WcvActionCard
          title="Cancel Vendor Payment"
          description="Cancel Vendor Payment"
          href="/dashboard/finance/bank-payment"
          icon={AlertTriangle}
        />
        <WcvActionCard
          title="View/Print Invoice Vendor"
          description="View/Print Vendor Invoice"
          href="/dashboard/finance/billing"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="View/Print Invoice Payment"
          description="View/Print Vendor Invoice Payment"
          href="/dashboard/finance/bank-payment"
          icon={Receipt}
        />

        {/* Row 4 */}
        <WcvActionCard
          title="Debit Note"
          description="Debit Note"
          href="/dashboard/finance/billing"
          icon={FileMinus}
        />
        <WcvActionCard
          title="View Print Vouchers New"
          description="View Print Vouchers New"
          href="/dashboard/finance/bank-payment"
          icon={Printer}
        />
        <WcvActionCard
          title="View Cancel Vouchers"
          description="View Cancel Vouchers"
          href="/dashboard/finance/bank-payment"
          icon={FileX}
        />
        <WcvActionCard
          title="GSTR2B Invoice Booking"
          description="GSTR2B Invoice Booking"
          href="/dashboard/finance/e-invoice"
          icon={ShieldCheck}
        />
      </div>

      {/* Interactive Fallback Action Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">{activeModal}</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Voucher module session initialized for <strong>{activeModal}</strong>. Select your branch account to begin posting journal entries.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  window.location.href = "/dashboard/finance/bank-payment";
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Open Voucher Ledger ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
