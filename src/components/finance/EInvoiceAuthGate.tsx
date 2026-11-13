"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useEInvoiceAuthSession } from "@/hooks/useEInvoiceAuthSession";

function formatSavedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

/** Blocks IRN screens until the E-Invoice author token is saved for this session. */
export function EInvoiceAuthGate({
  children,
  moduleLabel = "this e-invoice screen"
}: {
  children: React.ReactNode;
  moduleLabel?: string;
}) {
  const { invoiceToken, waybillToken, ready, hasInvoiceToken } = useEInvoiceAuthSession();

  if (!ready) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Checking authentication token…
      </div>
    );
  }

  if (!hasInvoiceToken || !invoiceToken) {
    return (
      <div className="max-w-xl mx-auto space-y-4 pb-10">
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-2 min-w-0">
              <h2 className="text-base font-bold text-slate-900">E-Invoice author token required</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Save the <strong>E-Invoice Author Token</strong> for this browser session before you
                can use {moduleLabel}. E-WayBill token is separate and does not unlock IRN screens.
              </p>
              {waybillToken && (
                <p className="text-[12px] text-emerald-800">
                  E-WayBill token is already active ({waybillToken.ackCode}) — still need E-Invoice.
                </p>
              )}
              <Link
                href="/dashboard/finance/e-invoice/authentication-token"
                className="inline-flex items-center gap-2 mt-2 h-9 px-4 rounded-md text-sm font-semibold text-white bg-gradient-to-b from-[#4da3e8] to-[#0171d3] hover:from-[#3d93d8] hover:to-[#015fae]"
              >
                <KeyRound className="w-4 h-4" />
                Open Authentication Token
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[12px] text-emerald-900">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="font-semibold">{invoiceToken.label}</span>
        <span className="text-emerald-700/80">active for this session</span>
        <span className="font-mono text-[11px] bg-white/80 border border-emerald-200 rounded px-1.5 py-0.5">
          {invoiceToken.ackCode}
        </span>
        {waybillToken && (
          <span className="font-mono text-[11px] bg-sky-50 border border-sky-200 text-sky-800 rounded px-1.5 py-0.5">
            E-WayBill {waybillToken.ackCode}
          </span>
        )}
        <span className="text-emerald-700/70 ml-auto">
          Saved {formatSavedAt(invoiceToken.savedAt)}
        </span>
      </div>
      {children}
    </div>
  );
}
