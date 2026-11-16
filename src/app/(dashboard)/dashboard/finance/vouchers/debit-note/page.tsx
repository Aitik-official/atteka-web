"use client";

import React, { useState } from "react";
import { toast } from "@/lib/toastBus";

type InvoiceInfo = {
  invoiceNo?: string;
  voucherNumber?: string;
  vendor?: string;
  payTo?: string;
  amount?: number;
  totalAccountedAmount?: number;
  location?: string;
  branch?: string;
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function GenerateDebitNotePage() {
  const [step, setStep] = useState<"lookup" | "entry">("lookup");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoice, setInvoice] = useState<InvoiceInfo | null>(null);
  const [debitAmount, setDebitAmount] = useState(1000);
  const [debitNoteDate, setDebitNoteDate] = useState(toInputDate(new Date()));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLookup = async () => {
    if (!invoiceNo.trim()) {
      toast.error("Enter Vendor Invoice No.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/finance/debit-note?invoiceNo=${encodeURIComponent(invoiceNo.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Lookup failed");
        return;
      }
      const row = data.data || {};
      setInvoice(row);
      setDebitAmount(Number(row.totalAccountedAmount || row.amount || 1000));
      setStep("entry");
    } catch {
      toast.error("Lookup failed");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/finance/debit-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo: invoice?.invoiceNo || invoiceNo,
          vendor: invoice?.vendor || invoice?.payTo,
          amount: debitAmount,
          debitNoteDate,
          location: invoice?.location || invoice?.branch || "ALC1",
          reason: reason.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to generate debit note");
        return;
      }
      toast.success(data.message || `Debit note ${data.data?.voucherNumber} generated`);
      setStep("lookup");
      setInvoice(null);
      setInvoiceNo("");
      setReason("");
      setDebitAmount(1000);
    } catch {
      toast.error("Failed to generate debit note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-lg font-bold text-[#0171d3]">Generate Debit Note.</h1>
        <div className="mt-1 border-b border-[#0171d3]" />
      </div>

      {step === "lookup" ? (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-2xl mx-auto mt-6">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Enter Vendor Invoice No
          </div>

          <table className="w-full text-[12px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-[42%] px-3 py-3 text-[#0171d3] font-semibold align-middle">
                  Enter Vendor Invoice No.
                </td>
                <td className="px-3 py-3">
                  <input
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleLookup();
                    }}
                    className="w-full max-w-sm h-8 px-2 border border-slate-400 rounded-sm bg-white text-[12px] font-mono uppercase focus:outline-none focus:border-[#0171d3]"
                    autoFocus
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="py-4 flex justify-center border-t border-slate-100">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleLookup()}
              className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
            >
              {saving ? "..." : "Submit"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-2xl mx-auto mt-6">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Debit Note Entry
          </div>
          <div className="p-4 space-y-3 text-[12px]">
            <p>
              <span className="font-semibold">Invoice:</span>{" "}
              <span className="font-mono text-blue-700">
                {invoice?.invoiceNo || invoiceNo}
              </span>
            </p>
            <p>
              <span className="font-semibold">Vendor:</span>{" "}
              {invoice?.vendor || invoice?.payTo || "VENDOR"}
            </p>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Debit Note Date</span>
              <input
                type="date"
                value={debitNoteDate}
                onChange={(e) => setDebitNoteDate(e.target.value)}
                className="h-8 px-2 border border-slate-300 rounded-sm max-w-xs"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Debit Amount</span>
              <input
                type="number"
                value={debitAmount}
                onChange={(e) => setDebitAmount(Number(e.target.value) || 0)}
                className="h-8 px-2 border border-slate-300 rounded-sm max-w-xs font-mono"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">Reason</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-8 px-2 border border-slate-300 rounded-sm"
                placeholder="Optional"
              />
            </label>
          </div>
          <div className="py-4 flex justify-center gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setStep("lookup");
                setInvoice(null);
              }}
              className="min-w-[110px] h-9 px-6 rounded-full border border-slate-300 text-slate-700 bg-white text-[12px] font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleGenerate()}
              className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Generate"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
