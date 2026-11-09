"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toastBus";

type Line = {
  srNo: number;
  description: string;
  debit: number;
  credit: number;
};

type JournalView = {
  branch: string;
  voucherNo: string;
  chqNo: string;
  date: string;
  narration: string;
  paidRecvdFrom: string;
  lines: Line[];
  totalDebit: number;
  totalCredit: number;
};

function fmtAmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

export default function ViewJournalVouchersPage() {
  const [step, setStep] = useState<"filter" | "view">("filter");
  const [voucherNo, setVoucherNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [voucher, setVoucher] = useState<JournalView | null>(null);

  const loadVoucher = async () => {
    if (!voucherNo.trim()) {
      toast.error("Enter Voucher No.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ voucherNo: voucherNo.trim() });
      const res = await fetch(`/api/finance/view-journal-vouchers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Voucher not found");
        return;
      }
      setVoucher(data.data);
      setStep("view");
    } catch {
      toast.error("Failed to load journal voucher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {step === "filter" && (
        <div className="pt-6">
          <div className="flex justify-end mb-3">
            <span className="text-sm font-semibold text-[#0171d3]">View Journal Vouchers</span>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-2xl mx-auto">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
              Enter Journal Voucher
            </div>

            <table className="w-full text-[12px] border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-[36%] px-3 py-3 text-[#0171d3] font-semibold align-middle">
                    Enter Voucher No.
                  </td>
                  <td className="px-3 py-3">
                    <input
                      value={voucherNo}
                      onChange={(e) => setVoucherNo(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void loadVoucher();
                      }}
                      className="w-full max-w-sm h-8 px-2 border border-blue-300 rounded-sm bg-white text-[12px] font-mono uppercase"
                      autoFocus
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="py-4 flex justify-center border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadVoucher()}
                className="min-w-[100px] h-8 px-5 border border-[#0171d3] text-[#0171d3] bg-white rounded-full text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "view" && voucher && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-8 w-8 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-[#0171d3]">View Journal Vouchers</h1>
          </div>

          {/* Header info */}
          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <table className="w-full text-[12px] border-collapse">
              <tbody>
                <tr>
                  <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 w-[18%] bg-slate-50">
                    Branch
                  </td>
                  <td className="border border-slate-200 px-3 py-2">{voucher.branch}</td>
                  <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 w-[18%] bg-slate-50">
                    Voucher No
                  </td>
                  <td className="border border-slate-200 px-3 py-2 font-mono font-bold text-blue-700">
                    {voucher.voucherNo}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 bg-slate-50">
                    Chq No
                  </td>
                  <td className="border border-slate-200 px-3 py-2 font-mono">
                    {voucher.chqNo || "—"}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 bg-slate-50">
                    Date
                  </td>
                  <td className="border border-slate-200 px-3 py-2">{voucher.date}</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 bg-slate-50">
                    Narration
                  </td>
                  <td className="border border-slate-200 px-3 py-2" colSpan={3}>
                    {voucher.narration}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 bg-slate-50">
                    Paid/Recvd From
                  </td>
                  <td className="border border-slate-200 px-3 py-2" colSpan={3}>
                    {voucher.paidRecvdFrom}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Lines */}
          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[640px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#015fae] px-3 py-2 text-left font-semibold w-20">
                      Sr No
                    </th>
                    <th className="border border-[#015fae] px-3 py-2 text-left font-semibold">
                      Description
                    </th>
                    <th className="border border-[#015fae] px-3 py-2 text-right font-semibold w-36">
                      Debit
                    </th>
                    <th className="border border-[#015fae] px-3 py-2 text-right font-semibold w-36">
                      credit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {voucher.lines.map((line) => (
                    <tr key={line.srNo} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2 font-mono">{line.srNo}</td>
                      <td className="border border-slate-200 px-3 py-2">{line.description}</td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-mono">
                        {fmtAmt(line.debit)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-mono">
                        {fmtAmt(line.credit)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td className="border border-slate-200 px-3 py-2" colSpan={2}>
                      Total
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-mono">
                      {fmtAmt(voucher.totalDebit)}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-mono">
                      {fmtAmt(voucher.totalCredit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
