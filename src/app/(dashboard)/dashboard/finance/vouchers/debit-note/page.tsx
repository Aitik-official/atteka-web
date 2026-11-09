"use client";

import React, { useState } from "react";
import { toast } from "@/lib/toastBus";

export default function GenerateDebitNotePage() {
  const [invoiceNo, setInvoiceNo] = useState("");

  const handleSubmit = () => {
    if (!invoiceNo.trim()) {
      toast.error("Enter Vendor Invoice No.");
      return;
    }
    // Next generate step intentionally not enabled — avoids creating debit notes.
    toast.info(
      `Invoice ${invoiceNo.trim().toUpperCase()}. Debit note entry step not enabled (demo).`
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-lg font-bold text-[#0171d3]">Generate Debit Note.</h1>
        <div className="mt-1 border-b border-[#0171d3]" />
      </div>

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
                    if (e.key === "Enter") handleSubmit();
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
