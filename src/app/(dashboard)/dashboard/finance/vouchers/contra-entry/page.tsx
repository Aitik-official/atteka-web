"use client";

import React, { useMemo, useState } from "react";
import { toast } from "@/lib/toastBus";

type ContraLine = {
  id: string;
  particular: string;
  debit: number;
  credit: number;
  chequeNo: string;
  chequeDate: string;
};

const ACCOUNTS = [
  "Cash in Hand - ALC1",
  "Cash in Hand - ALC2",
  "HDFC Bank - Ops",
  "ICICI Bank - Current",
  "Petty Cash",
  "Bank OD Account"
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtAmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function emptyLine(): ContraLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    particular: "",
    debit: 0,
    credit: 0,
    chequeNo: "",
    chequeDate: ""
  };
}

export default function ContraEntryPage() {
  const [voucherNo, setVoucherNo] = useState("");
  const [voucherDate, setVoucherDate] = useState(toInputDate(new Date()));
  const [preparedAt] = useState("ALC1 :");
  const [preparedBy] = useState("AL002 :");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<ContraLine[]>([emptyLine(), emptyLine()]);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const credit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    return {
      debit: Number(debit.toFixed(2)),
      credit: Number(credit.toFixed(2)),
      balanced: Number(debit.toFixed(2)) === Number(credit.toFixed(2)) && debit > 0
    };
  }, [lines]);

  const updateLine = (id: string, patch: Partial<ContraLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const submit = async () => {
    if (!totals.balanced) {
      toast.error("Debit and Credit totals must match and be greater than 0");
      return;
    }
    const incomplete = lines.some((l) => !l.particular && (l.debit > 0 || l.credit > 0));
    if (incomplete) {
      toast.error("Select Particulars for lines with amounts");
      return;
    }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 350));
      const no = voucherNo.trim() || `CNALC1${String(Date.now()).slice(-8)}`;
      toast.success(`Contra entry ${no} submitted (demo)`);
    } catch {
      toast.error("Failed to submit contra entry");
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    "h-8 px-2 border border-slate-300 rounded-sm text-[12px] bg-white focus:outline-none focus:border-[#0171d3]";

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        {/* Voucher Information */}
        <div className="border-b border-slate-200">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Please Enter Voucher Information
          </div>
          <div className="p-4 text-[12px] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Voucher No</span>
                <input
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value.toUpperCase())}
                  placeholder="System / Manual"
                  className={fieldCls}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Voucher Date</span>
                <input
                  type="date"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  className={fieldCls}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Prepared At</span>
                <input readOnly value={preparedAt} className={`${fieldCls} bg-slate-50`} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Prepared By</span>
                <input readOnly value={preparedBy} className={`${fieldCls} bg-slate-50`} />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-slate-700">Narration</span>
              <textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-sm text-[12px] resize-y min-h-[72px]"
              />
            </label>
          </div>
        </div>

        {/* Contra Voucher Details */}
        <div>
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Contra Voucher Details
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[900px]">
              <thead>
                <tr className="bg-[#0d47a1] text-white">
                  {["Sr.No.", "Particulars", "Debit", "Credit", "Cheque No", "Cheque Date"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`border border-[#1565c0] px-2 py-2 font-semibold whitespace-nowrap ${
                          h === "Debit" || h === "Credit" ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.id} className="bg-white">
                    <td className="border border-slate-200 px-2 py-1.5 text-center font-mono w-16">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-200 px-1 py-1">
                      <select
                        value={line.particular}
                        onChange={(e) => updateLine(line.id, { particular: e.target.value })}
                        className="w-full h-8 px-1 border border-slate-200 rounded-sm text-[12px]"
                      >
                        <option value="">---Select---</option>
                        {ACCOUNTS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-slate-200 px-1 py-1 w-32">
                      <input
                        type="number"
                        value={line.debit}
                        onChange={(e) =>
                          updateLine(line.id, {
                            debit: Number(e.target.value) || 0,
                            credit: Number(e.target.value) > 0 ? 0 : line.credit
                          })
                        }
                        className="w-full h-8 px-1 border border-slate-200 rounded-sm text-right font-mono"
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1 w-32">
                      <input
                        type="number"
                        value={line.credit}
                        onChange={(e) =>
                          updateLine(line.id, {
                            credit: Number(e.target.value) || 0,
                            debit: Number(e.target.value) > 0 ? 0 : line.debit
                          })
                        }
                        className="w-full h-8 px-1 border border-slate-200 rounded-sm text-right font-mono"
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1 w-28">
                      <input
                        value={line.chequeNo}
                        onChange={(e) => updateLine(line.id, { chequeNo: e.target.value })}
                        className="w-full h-8 px-1 border border-slate-200 rounded-sm"
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1 w-36">
                      <input
                        type="date"
                        value={line.chequeDate}
                        onChange={(e) => updateLine(line.id, { chequeDate: e.target.value })}
                        className="w-full h-8 px-1 border border-slate-200 rounded-sm"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="border border-slate-200 px-2 py-2 text-right" colSpan={2}>
                    Total
                  </td>
                  <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                    {fmtAmt(totals.debit)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                    {fmtAmt(totals.credit)}
                  </td>
                  <td className="border border-slate-200" colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-3 py-2 text-[11px] text-slate-500 border-t border-slate-100 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
              className="text-blue-600 font-semibold hover:underline"
            >
              + Add line
            </button>
            {!totals.balanced && (totals.debit > 0 || totals.credit > 0) && (
              <span className="text-amber-700">Debit / Credit not balanced</span>
            )}
          </div>
        </div>

        <div className="flex justify-center py-4 border-t border-slate-200">
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="min-w-[110px] h-9 px-6 rounded-md border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
