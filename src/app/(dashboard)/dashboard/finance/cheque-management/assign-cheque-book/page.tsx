"use client";

import React, { useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { toast } from "@/lib/toastBus";

const LOCATIONS = ["ALC1", "ALC2", "PUNE", "NASHIK"];
const BANK_ACCOUNTS = [
  "HDFC Bank - Ops · ****4521",
  "ICICI Bank - Current · ****8830",
  "SBI - Collection · ****1102",
  "Axis Bank - Payments · ****7744"
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AssignChequeBookPage() {
  const [entryLocation, setEntryLocation] = useState("");
  const [bankAc, setBankAc] = useState("");
  const [fromSrNo, setFromSrNo] = useState(0);
  const [toSrNo, setToSrNo] = useState(0);
  const [dateOfIssue, setDateOfIssue] = useState(toInputDate(new Date()));
  const [saving, setSaving] = useState(false);

  const totalLeaf = useMemo(() => {
    const from = Number(fromSrNo) || 0;
    const to = Number(toSrNo) || 0;
    if (to < from) return 0;
    return to - from + (from === 0 && to === 0 ? 0 : 1);
  }, [fromSrNo, toSrNo]);

  const submit = async () => {
    if (!entryLocation) {
      toast.error("Select Entry Location");
      return;
    }
    if (!bankAc) {
      toast.error("Select Bank A/C");
      return;
    }
    if (!fromSrNo || !toSrNo || toSrNo < fromSrNo) {
      toast.error("Enter valid From / To Sr.No");
      return;
    }
    setSaving(true);
    try {
      // Demo-only — no cheque book master write.
      await new Promise((r) => setTimeout(r, 350));
      toast.success(
        `Cheque book issued ${fromSrNo}–${toSrNo} (${totalLeaf} leaves) at ${entryLocation} (demo)`
      );
      setFromSrNo(0);
      setToSrNo(0);
      setEntryLocation("");
      setBankAc("");
      setDateOfIssue(toInputDate(new Date()));
    } catch {
      toast.error("Failed to assign cheque book");
    } finally {
      setSaving(false);
    }
  };

  const labelCls = "px-3 py-2.5 text-[12px] font-semibold text-[#0171d3] whitespace-nowrap align-middle";
  const fieldCls =
    "h-8 px-2 border border-blue-300 rounded-md text-xs bg-white focus:outline-none focus:border-[#0171d3]";

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12">
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
          Cheque Book Issue Entry
        </div>

        <table className="w-full text-[12px] border-collapse">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className={`${labelCls} w-[32%] border-r border-slate-100`}>Entry Location</td>
              <td className="px-3 py-2">
                <select
                  value={entryLocation}
                  onChange={(e) => setEntryLocation(e.target.value)}
                  className={`${fieldCls} min-w-[220px]`}
                >
                  <option value="">--Select--</option>
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </td>
            </tr>

            <tr className="border-b border-slate-200">
              <td className={`${labelCls} border-r border-slate-100`}>Bank A/C</td>
              <td className="px-3 py-2">
                <select
                  value={bankAc}
                  onChange={(e) => setBankAc(e.target.value)}
                  className={`${fieldCls} min-w-[280px] max-w-full`}
                >
                  <option value="">--Select--</option>
                  {BANK_ACCOUNTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </td>
            </tr>

            <tr className="border-b border-slate-200">
              <td className={`${labelCls} border-r border-slate-100`}>From Sr.No</td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  value={fromSrNo}
                  onChange={(e) => setFromSrNo(Number(e.target.value) || 0)}
                  className={`${fieldCls} w-36 font-mono`}
                />
              </td>
            </tr>

            <tr className="border-b border-slate-200">
              <td className={`${labelCls} border-r border-slate-100`}>To Sr.No</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    value={toSrNo}
                    onChange={(e) => setToSrNo(Number(e.target.value) || 0)}
                    className={`${fieldCls} w-36 font-mono`}
                  />
                  <span className="text-[#0171d3] font-semibold whitespace-nowrap">
                    Total No of Leaf
                  </span>
                  <input
                    type="number"
                    readOnly
                    value={totalLeaf}
                    className={`${fieldCls} w-24 font-mono bg-slate-50`}
                  />
                </div>
              </td>
            </tr>

            <tr>
              <td className={`${labelCls} border-r border-slate-100`}>Date Of Issue</td>
              <td className="px-3 py-2">
                <div className="relative inline-block">
                  <input
                    type="date"
                    value={dateOfIssue}
                    onChange={(e) => setDateOfIssue(e.target.value)}
                    className={`${fieldCls} w-44 pr-8`}
                  />
                  <Calendar className="w-3.5 h-3.5 text-blue-500 absolute right-2.5 top-2 pointer-events-none" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-center py-4 border-t border-slate-100">
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
