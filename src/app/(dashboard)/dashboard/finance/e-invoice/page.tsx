"use client";

import React from "react";
import Link from "next/link";
import { QrCode, XCircle, ShieldCheck, Key, FileSpreadsheet, Lock } from "lucide-react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { useEInvoiceAuthSession } from "@/hooks/useEInvoiceAuthSession";

export default function EInvoicePage() {
  const { invoiceToken, waybillToken, ready, isAuthenticated, hasAnyToken } =
    useEInvoiceAuthSession();

  return (
    <div className="space-y-4 pb-10">
      <WcvRibbonHeader
        title="Genrate E-Invoice (IRN)"
        subtitle="Finance • C655 • GenrateIRN.aspx • GST / NIC E-Invoice"
      />

      {ready && hasAnyToken ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[12px] text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          {invoiceToken ? (
            <>
              <span className="font-semibold">E-Invoice</span>
              <span className="font-mono text-[11px] bg-white/80 border border-emerald-200 rounded px-1.5 py-0.5">
                {invoiceToken.ackCode}
              </span>
            </>
          ) : (
            <span className="text-amber-800 font-medium">E-Invoice token missing</span>
          )}
          {waybillToken && (
            <>
              <span className="text-emerald-700/50">·</span>
              <span className="font-semibold">E-WayBill</span>
              <span className="font-mono text-[11px] bg-sky-50 border border-sky-200 text-sky-800 rounded px-1.5 py-0.5">
                {waybillToken.ackCode}
              </span>
            </>
          )}
          <span className="text-emerald-700/80">active this session</span>
        </div>
      ) : ready ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-[12px] text-amber-950">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Save the <strong>E-Invoice Author Token</strong> to unlock IRN screens. E-WayBill is a
            separate auth and can be saved at the same time.
          </span>
          <Link
            href="/dashboard/finance/e-invoice/authentication-token"
            className="ml-auto font-semibold text-[#0171d3] hover:underline"
          >
            Open Authentication Token →
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-2">
        <WcvActionCard
          title="Authentication Token"
          description="E-Invoice & E-WayBill (independent)"
          href="/dashboard/finance/e-invoice/authentication-token"
          icon={Key}
          badge={
            isAuthenticated && waybillToken
              ? "Both active"
              : isAuthenticated
                ? "E-Invoice"
                : waybillToken
                  ? "E-WayBill only"
                  : "Required"
          }
        />
        <WcvActionCard
          title="Genrate IRN"
          description="Genrate IRN"
          href="/dashboard/finance/e-invoice/generate-irn"
          icon={QrCode}
          unavailable={!isAuthenticated}
          unavailableReason="Save E-Invoice Author Token for this session first"
        />
        <WcvActionCard
          title="Cancel IRN"
          description="Cancel IRN"
          href="/dashboard/finance/e-invoice/cancel-irn"
          icon={XCircle}
          unavailable={!isAuthenticated}
          unavailableReason="Save E-Invoice Author Token for this session first"
        />
        <WcvActionCard
          title="Genrate Credit Note IRN"
          description="Genrate Credit Note IRN"
          href="/dashboard/finance/e-invoice/generate-credit-note-irn"
          icon={FileSpreadsheet}
          unavailable={!isAuthenticated}
          unavailableReason="Save E-Invoice Author Token for this session first"
        />
      </div>
    </div>
  );
}
