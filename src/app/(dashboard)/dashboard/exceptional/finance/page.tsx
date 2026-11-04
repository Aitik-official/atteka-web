"use client";

import React, { useState } from "react";
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
  CheckCircle2,
  X,
  FileMinus
} from "lucide-react";

export default function ExceptionalFinanceHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openAction = (name: string) => {
    setActiveModal(name);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Finance" />

      {/* 29 Action Cards matching exact screenshots (Image 3 + Image 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <div onClick={() => openAction("Edit PDC Advance Payable Branch")}>
          <WcvActionCard
            title="Edit PDC Advance Payable Branch"
            description="Edit PDC Advance Payable Branch"
            href="#"
            icon={Building}
          />
        </div>
        <div onClick={() => openAction("Edit PDC Balance Payable Branch")}>
          <WcvActionCard
            title="Edit PDC Balance Payable Branch"
            description="Edit PDC Balance Payable Branch"
            href="#"
            icon={Building}
          />
        </div>
        <div onClick={() => openAction("Edit PDC Vendor/Date/Vehicle")}>
          <WcvActionCard
            title="Edit PDC Vendor/Date/Vehicle"
            description="Edit PDC Vendor/Date/Vehicle"
            href="#"
            icon={Edit3}
          />
        </div>
        <div onClick={() => openAction("Cancel PDC Advance Entry")}>
          <WcvActionCard
            title="Cancel PDC Advance Entry"
            description="Cancel PDC Advance Entry"
            href="#"
            icon={XCircle}
          />
        </div>

        {/* Row 2 */}
        <div onClick={() => openAction("Cancel Multiple PDC Advance Entry")}>
          <WcvActionCard
            title="Cancel Multiple PDC Advance Entry"
            description="Cancel Multiple PDC Advance Entry"
            href="#"
            icon={XCircle}
          />
        </div>
        <div onClick={() => openAction("Edit Bill Collection Branch")}>
          <WcvActionCard
            title="Edit Bill Collection Branch"
            description="Edit Bill Collection Branch"
            href="#"
            icon={Building}
          />
        </div>
        <div onClick={() => openAction("Edit Bill Remark and Bill Address")}>
          <WcvActionCard
            title="Edit Bill Remark and Bill Address"
            description="Edit Bill Remark and Bill Address"
            href="#"
            icon={Edit3}
          />
        </div>
        <div onClick={() => openAction("Edit Bill Amount")}>
          <WcvActionCard
            title="Edit Bill Amount"
            description="Edit Bill Amount"
            href="#"
            icon={DollarSign}
          />
        </div>

        {/* Row 3 */}
        <div onClick={() => openAction("Edit Billing Party")}>
          <WcvActionCard
            title="Edit Billing Party"
            description="Edit Billing Party"
            href="#"
            icon={Users}
          />
        </div>
        <div onClick={() => openAction("Edit Bill Date")}>
          <WcvActionCard
            title="Edit Bill Date"
            description="Edit Bill Date"
            href="#"
            icon={Calendar}
          />
        </div>
        <div onClick={() => openAction("Cancel Bill")}>
          <WcvActionCard
            title="Cancel Bill"
            description="Cancel Bill"
            href="#"
            icon={XCircle}
          />
        </div>
        <div onClick={() => openAction("Cancel MR")}>
          <WcvActionCard
            title="Cancel MR"
            description="Cancel MR"
            href="#"
            icon={XCircle}
          />
        </div>

        {/* Row 4 */}
        <div onClick={() => openAction("Edit MR Bank Account")}>
          <WcvActionCard
            title="Edit MR Bank Account"
            description="Edit MR Bank Account"
            href="#"
            icon={CreditCard}
          />
        </div>
        <div onClick={() => openAction("Edit Manual document Number")}>
          <WcvActionCard
            title="Edit Manual document Number"
            description="Edit Manual document Number"
            href="#"
            icon={FileText}
          />
        </div>
        <div onClick={() => openAction("Edit Voucher Date")}>
          <WcvActionCard
            title="Edit Voucher Date"
            description="Edit Voucher Date"
            href="#"
            icon={Calendar}
          />
        </div>
        <div onClick={() => openAction("Edit Cheque No & Date")}>
          <WcvActionCard
            title="Edit Cheque No & Date"
            description="Edit Cheque No & Date"
            href="#"
            icon={CreditCard}
          />
        </div>

        {/* Row 5 */}
        <div onClick={() => openAction("Cancel Cheque")}>
          <WcvActionCard
            title="Cancel Cheque"
            description="Cancel Cheque"
            href="#"
            icon={XCircle}
          />
        </div>
        <div onClick={() => openAction("Cancel Voucher")}>
          <WcvActionCard
            title="Cancel Voucher"
            description="Cancel Voucher"
            href="#"
            icon={XCircle}
          />
        </div>
        <div onClick={() => openAction("Edit Account Head")}>
          <WcvActionCard
            title="Edit Account Head"
            description="Edit Account Head"
            href="#"
            icon={Edit3}
          />
        </div>
        <WcvActionCard
          title="Edit Docket"
          description="Edit Docket"
          href="/dashboard/operations/dockets"
          icon={FileSpreadsheet}
        />

        {/* Row 6 */}
        <div onClick={() => openAction("Edit Narration")}>
          <WcvActionCard
            title="Edit Narration"
            description="Edit Narration"
            href="#"
            icon={Edit3}
          />
        </div>
        <div onClick={() => openAction("Edit Voucher Amount")}>
          <WcvActionCard
            title="Edit Voucher Amount"
            description="Edit Voucher Amount"
            href="#"
            icon={DollarSign}
          />
        </div>
        <div onClick={() => openAction("Edit PDC Non-Financial to Financial")}>
          <WcvActionCard
            title="Edit PDC Non-Financial to Financial"
            description="Edit PDC Non-Financial to Financial"
            href="#"
            icon={Edit3}
          />
        </div>
        <div onClick={() => openAction("Update Vendor PAN NUMBER")}>
          <WcvActionCard
            title="Update Vendor PAN NUMBER"
            description="Update Vendor PAN NUMBER"
            href="#"
            icon={CreditCard}
          />
        </div>

        {/* Row 7 */}
        <div onClick={() => openAction("Cancel Vendor Invoice")}>
          <WcvActionCard
            title="Cancel Vendor Invoice"
            description="Cancel Vendor Invoice"
            href="#"
            icon={XCircle}
          />
        </div>
        <div onClick={() => openAction("Cancel Vendor Payment")}>
          <WcvActionCard
            title="Cancel Vendor Payment"
            description="Cancel Vendor Payment"
            href="#"
            icon={XCircle}
          />
        </div>
        <div onClick={() => openAction("Edit Other Bill Amount")}>
          <WcvActionCard
            title="Edit Other Bill Amount"
            description="QryOtherBill,EditOtherBill"
            href="#"
            icon={DollarSign}
          />
        </div>
        <div onClick={() => openAction("Update Vendor TDS Aplicable")}>
          <WcvActionCard
            title="Update Vendor TDS Aplicable"
            description="Update Vendor TDS Aplicable"
            href="#"
            icon={FileMinus}
          />
        </div>

        {/* Row 8 */}
        <div onClick={() => openAction("Edit Dedicated Bill Amount")}>
          <WcvActionCard
            title="Edit Dedicated Bill Amount"
            description="Edit Dedicated Bill Amount"
            href="#"
            icon={DollarSign}
          />
        </div>
      </div>

      {/* Interactive Exceptional Override Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Exceptional Finance Override</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Action selected: <strong>{activeModal}</strong>
            </p>
            <p className="text-xs text-slate-500 mb-4 bg-amber-50 p-3 rounded-lg border border-amber-200">
              This operation requires Administrator / Head Office accounting approval. Any modification creates an audit record logged under operator ID AL002.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  window.location.href = "/dashboard/finance/billing";
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Proceed to Financial Ledger ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
