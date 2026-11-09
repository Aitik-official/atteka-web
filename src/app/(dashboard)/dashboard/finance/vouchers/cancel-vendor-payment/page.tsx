"use client";

import React, { useState } from "react";
import { toast } from "@/lib/toastBus";

export default function CancelVendorPaymentPage() {
  const [voucherNumber, setVoucherNumber] = useState("");

  const handleSubmit = () => {
    if (!voucherNumber.trim()) {
      toast.error("Enter Voucher Number");
      return;
    }
    // Next cancel step intentionally not enabled — avoids cancelling payments.
    toast.info(
      `Voucher ${voucherNumber.trim().toUpperCase()}. Cancel confirmation step not enabled (demo).`
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-lg font-bold text-[#0171d3]">Cancel Vendor Invoice Payment</h1>
        <div className="mt-1 border-b border-[#0171d3]" />
      </div>

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
                    if (e.key === "Enter") handleSubmit();
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
            onClick={handleSubmit}
            className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
