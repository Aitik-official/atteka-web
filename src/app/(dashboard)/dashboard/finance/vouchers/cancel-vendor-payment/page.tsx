"use client";

import React, { useState } from "react";
import { toast } from "@/lib/toastBus";

type FoundVoucher = {
  voucherNumber: string;
  voucherDate?: string;
  payTo?: string;
  totalAccountedAmount?: number;
  status?: string;
  narration?: string;
};

export default function CancelVendorPaymentPage() {
  const [voucherNumber, setVoucherNumber] = useState("");
  const [step, setStep] = useState<"lookup" | "confirm">("lookup");
  const [found, setFound] = useState<FoundVoucher | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLookup = async () => {
    if (!voucherNumber.trim()) {
      toast.error("Enter Voucher Number");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/finance/cancel-vendor-payment?voucherNumber=${encodeURIComponent(voucherNumber.trim())}`
      );
      const data = await res.json();
      if (!res.ok || !data.data) {
        toast.error(data.error || "Voucher not found");
        return;
      }
      if (String(data.data.status || "").toLowerCase() === "cancelled") {
        toast.error("Voucher already cancelled");
        return;
      }
      setFound(data.data);
      setStep("confirm");
    } catch {
      toast.error("Lookup failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!found?.voucherNumber) return;
    setSaving(true);
    try {
      const res = await fetch("/api/finance/cancel-vendor-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucherNumber: found.voucherNumber,
          reason: reason.trim() || "Vendor payment cancelled"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cancel failed");
        return;
      }
      toast.success(data.message || `${found.voucherNumber} cancelled`);
      setStep("lookup");
      setFound(null);
      setVoucherNumber("");
      setReason("");
    } catch {
      toast.error("Cancel failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-lg font-bold text-[#0171d3]">Cancel Vendor Invoice Payment</h1>
        <div className="mt-1 border-b border-[#0171d3]" />
      </div>

      {step === "lookup" ? (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-2xl mx-auto mt-6">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Select Voucher No
          </div>

          <table className="w-full text-[12px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-[36%] px-3 py-3 font-semibold text-slate-800 align-middle">
                  Voucher Number
                </td>
                <td className="px-3 py-3">
                  <input
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleLookup();
                    }}
                    className="w-full max-w-sm h-8 px-2 border border-blue-300 rounded-md bg-white text-[12px] font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-400"
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
            Confirm Cancel
          </div>
          <div className="p-4 text-[12px] space-y-2">
            <p>
              <span className="font-semibold">Voucher:</span>{" "}
              <span className="font-mono text-blue-700">{found?.voucherNumber}</span>
            </p>
            <p>
              <span className="font-semibold">Vendor:</span> {found?.payTo || "—"}
            </p>
            <p>
              <span className="font-semibold">Amount:</span>{" "}
              {Number(found?.totalAccountedAmount || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2
              })}
            </p>
            <label className="flex flex-col gap-1 pt-2">
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
                setFound(null);
              }}
              className="min-w-[110px] h-9 px-6 rounded-full border border-slate-300 text-slate-700 bg-white text-[12px] font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleCancel()}
              className="min-w-[110px] h-9 px-6 rounded-full border border-rose-500 text-rose-600 bg-white text-[12px] font-semibold hover:bg-rose-50 disabled:opacity-50"
            >
              {saving ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
