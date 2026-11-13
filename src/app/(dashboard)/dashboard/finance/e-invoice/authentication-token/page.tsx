"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileCog, KeyRound, ShieldCheck, X } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { useEInvoiceAuthSession } from "@/hooks/useEInvoiceAuthSession";
import type { AuthTokenEntry, EInvoiceTokenType } from "@/lib/eInvoiceAuthSession";

const TOKEN_ROWS: { type: EInvoiceTokenType; label: string; unlocks: string }[] = [
  {
    type: "e-invoice",
    label: "E-Invoice Author Token",
    unlocks: "Unlocks Generate IRN, Cancel IRN, Credit Note IRN"
  },
  {
    type: "e-waybill",
    label: "E-WayBill Author Token",
    unlocks: "Independent E-WayBill session auth (can be active with E-Invoice)"
  }
];

function formatSavedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

function TokenStatusChip({ entry }: { entry: AuthTokenEntry }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px] text-emerald-900">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      <span className="font-semibold">Active</span>
      <span className="font-mono bg-white border border-emerald-200 rounded px-1.5 py-0.5">
        {entry.ackCode}
      </span>
      <span className="text-emerald-700/70">{formatSavedAt(entry.savedAt)}</span>
    </span>
  );
}

export default function AuthenticationTokenPage() {
  const { ready, invoiceToken, waybillToken, save, clearOne, hasInvoiceToken } =
    useEInvoiceAuthSession();
  const [savingType, setSavingType] = useState<EInvoiceTokenType | null>(null);

  const entryFor = (type: EInvoiceTokenType) =>
    type === "e-invoice" ? invoiceToken : waybillToken;

  const handleSave = async (type: EInvoiceTokenType) => {
    setSavingType(type);
    try {
      await new Promise((r) => setTimeout(r, 350));
      const next = save(type);
      toast.auth(`${next.label} saved for this session.`, {
        title: "Authentication Token",
        code: next.ackCode
      });
    } catch {
      toast.error("Failed to save authentication token");
    } finally {
      setSavingType(null);
    }
  };

  const handleClear = (type: EInvoiceTokenType) => {
    const label =
      type === "e-invoice" ? "E-Invoice Author Token" : "E-WayBill Author Token";
    clearOne(type);
    toast.auth(`${label} cleared for this session.`, {
      title: "Authentication Token",
      type: "info"
    });
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
        <FileCog className="w-4 h-4 text-slate-600" />
        <span>E-WayBill &amp; E-Invoice Author Token...</span>
      </div>

      <p className="text-[12px] text-slate-500 leading-relaxed">
        These are <strong>two separate</strong> session auths — both can be active at the same time.
        Closing the tab clears them. IRN screens need the E-Invoice token.
      </p>

      {ready && hasInvoiceToken && (
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <Link
            href="/dashboard/finance/e-invoice/generate-irn"
            className="text-[#0171d3] font-semibold hover:underline"
          >
            Go to Generate IRN →
          </Link>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 shadow-sm space-y-4">
        <fieldset className="border border-[#0171d3] rounded-md px-3 py-3 space-y-3">
          <legend className="px-1 text-[11px] font-semibold text-slate-600">
            E-WayBill &amp; E-Invoice
          </legend>

          {TOKEN_ROWS.map((row) => {
            const entry = entryFor(row.type);
            const busy = savingType === row.type;
            return (
              <div
                key={row.type}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-slate-200 bg-slate-50/60 px-3 py-3"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0171d3] flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{row.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{row.unlocks}</div>
                    {entry ? (
                      <div className="mt-1.5">
                        <TokenStatusChip entry={entry} />
                      </div>
                    ) : (
                      <div className="mt-1.5 text-[11px] text-amber-700 font-medium">Not saved</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:self-center">
                  {entry && (
                    <button
                      type="button"
                      onClick={() => handleClear(row.type)}
                      className="h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-600 text-xs font-semibold inline-flex items-center gap-1 hover:bg-slate-50"
                      title={`Clear ${row.label}`}
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSave(row.type)}
                    className="h-9 min-w-[88px] px-5 rounded-md text-white text-sm font-semibold shadow-sm disabled:opacity-60 bg-gradient-to-b from-[#4da3e8] to-[#0171d3] hover:from-[#3d93d8] hover:to-[#015fae]"
                  >
                    {busy ? "Saving..." : entry ? "Refresh" : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </fieldset>
      </div>
    </div>
  );
}
