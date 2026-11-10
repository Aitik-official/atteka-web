"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { toast } from "@/lib/toastBus";

type CbsRow = {
  srNo: string;
  date: string;
  particulars: string;
  voucherNo: string;
  documentNo: string;
  chequeNo: string;
  debit: number;
  credit: number;
  balance: number;
  isOpening?: boolean;
  isTotalTxn?: boolean;
  isClosing?: boolean;
  isGrandTotal?: boolean;
};

type Meta = {
  cashBank: string;
  preparedAt: string;
  from: string;
  to: string;
  preparedBy: string;
  certifiedBy: string;
  dateTime: string;
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function fmt(n: number) {
  if (!n) return "0.00";
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtBal(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function ViewPrintCbsPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [branch, setBranch] = useState("--Select--");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(7)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [account, setAccount] = useState("--Select--");
  const [withNarration, setWithNarration] = useState("Yes");
  const [voucherType, setVoucherType] = useState("Approved");
  const [resultMode, setResultMode] = useState("Screen");
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([]);
  const [accounts, setAccounts] = useState<{ code: string; label: string }[]>([]);
  const [rows, setRows] = useState<CbsRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/branches"),
      fetch("/api/reports/cash-bank-statement?accounts=1")
    ])
      .then(async ([bRes, aRes]) => {
        const b = await bRes.json();
        const a = await aRes.json();
        if (b.success) {
          const list = (b.data || [])
            .map((x: any) => {
              const code = String(x.branchCode || x.code || "").trim().toUpperCase();
              const name = String(x.branchName || x.name || code).trim();
              return code ? { code, label: `${name} - ${code}` } : null;
            })
            .filter(Boolean) as { code: string; label: string }[];
          if (!list.some((x) => x.code === "ALC1")) {
            list.unshift({ code: "ALC1", label: "Ateka Logistics - ALC1" });
          }
          setBranches(list);
        }
        if (a.success) setAccounts(a.data || []);
      })
      .catch(() => {});
  }, []);

  const loadReport = async () => {
    if (!branch || branch === "--Select--") {
      toast.error("Please select Branch / Profit Center");
      return;
    }
    if (!account || account === "--Select--") {
      toast.error("Please select Account");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        branch,
        account,
        withNarration,
        voucherType,
        resultMode
      });
      const res = await fetch(`/api/reports/cash-bank-statement?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Cash and Bank Statement");
        return;
      }
      setRows(data.data || []);
      setMeta(data.meta || null);
      setStep("report");
    } catch {
      toast.error("Failed to load Cash and Bank Statement");
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    "h-8 px-2 border border-slate-300 rounded-sm bg-white text-[12px] focus:outline-none focus:border-[#0171d3]";

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Select Branch / Profit Center
          </div>
          <div className="px-4 py-3 border-b border-slate-200 text-[12px] flex flex-wrap items-center gap-2">
            <span className="text-slate-800 font-semibold whitespace-nowrap">
              Select Branch / Profit Center :
            </span>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className={`${fieldCls} min-w-[260px]`}
            >
              <option value="--Select--">—Select—</option>
              {branches.map((b) => (
                <option key={b.code} value={b.label}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Select Voucher Date Range
          </div>
          <div className="px-4 py-3 border-b border-slate-200 text-[12px] flex flex-wrap items-center gap-3">
            <span className="text-slate-800 font-semibold w-[90px]">Date Range</span>
            <span className="text-slate-700">From :</span>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={`${fieldCls} pl-7 w-[150px]`}
              />
            </div>
            <span className="text-slate-700">To :</span>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={`${fieldCls} pl-7 w-[150px]`}
              />
            </div>
          </div>

          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Select Account
          </div>
          <div className="px-4 py-4 border-b border-slate-200 text-[12px] space-y-3">
            <div className="flex justify-center">
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className={`${fieldCls} min-w-[340px] max-w-full`}
              >
                <option value="--Select--">--Select--</option>
                {accounts.map((a) => (
                  <option key={a.code} value={a.label}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              <label className="inline-flex items-center gap-2">
                <span className="font-semibold text-slate-800">With Narration</span>
                <select
                  value={withNarration}
                  onChange={(e) => setWithNarration(e.target.value)}
                  className={`${fieldCls} min-w-[100px]`}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2">
                <span className="font-semibold text-slate-800">Voucher Type</span>
                <select
                  value={voucherType}
                  onChange={(e) => setVoucherType(e.target.value)}
                  className={`${fieldCls} min-w-[120px]`}
                >
                  <option value="Approved">Approved</option>
                  <option value="UnApproved">UnApproved</option>
                  <option value="All">All</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2">
                <span className="font-semibold text-slate-800">Result Mode</span>
                <select
                  value={resultMode}
                  onChange={(e) => setResultMode(e.target.value)}
                  className={`${fieldCls} min-w-[100px]`}
                >
                  <option value="Screen">Screen</option>
                  <option value="Excel">Excel</option>
                  <option value="PDF">PDF</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex justify-center py-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadReport()}
              className="h-9 min-w-[100px] px-6 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-sm font-semibold hover:bg-[#d7e8f8] disabled:opacity-60"
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setStep("filter")}
            className="h-8 px-4 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#d7e8f8]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
              Select Branch / Profit Center
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 text-[12px] border-b border-slate-200">
              <div className="px-3 py-2 border-b lg:border-b-0 lg:border-r border-slate-200">
                <span className="font-semibold text-slate-800">Cash / Bank : </span>
                <span>{meta?.cashBank || account}</span>
              </div>
              <div className="px-3 py-2">
                <table className="w-full text-[12px]">
                  <tbody>
                    <tr>
                      <td className="font-semibold text-slate-800 py-0.5 w-[110px]">Prepared At :</td>
                      <td className="py-0.5">{meta?.preparedAt || branch}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-800 py-0.5">From :</td>
                      <td className="py-0.5">{meta?.from}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-800 py-0.5">To :</td>
                      <td className="py-0.5">{meta?.to}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[980px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    {[
                      "Sr.No",
                      "Date",
                      "Particulars",
                      "Voucher No",
                      "Document No",
                      "Cheque No",
                      "Debit",
                      "Credit",
                      "Balance"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          ["Debit", "Credit", "Balance"].includes(h) ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const summary = r.isOpening || r.isTotalTxn || r.isClosing || r.isGrandTotal;
                    return (
                      <tr
                        key={`${r.srNo}-${r.voucherNo}-${idx}`}
                        className={
                          r.isGrandTotal || r.isTotalTxn || r.isClosing
                            ? "bg-[#5b9bd5] text-white font-semibold"
                            : r.isOpening
                              ? "bg-slate-50 font-semibold"
                              : "odd:bg-white even:bg-slate-50/60"
                        }
                      >
                        <td className="border border-slate-200 px-2 py-1 text-center whitespace-nowrap">
                          {r.srNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="border border-slate-200 px-2 py-1">{r.particulars}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.voucherNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.documentNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.chequeNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right whitespace-nowrap">
                          {r.isOpening ? "" : fmt(r.debit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right whitespace-nowrap">
                          {r.isOpening ? "" : fmt(r.credit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right whitespace-nowrap">
                          {r.isOpening || !summary ? fmtBal(r.balance) : ""}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="border border-slate-200 px-3 py-8 text-center text-slate-500"
                      >
                        No transactions for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-300 text-[11px]">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-0 border-b border-slate-200">
                <div className="px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200 min-h-[56px]">
                  <div className="font-semibold text-slate-800">Prepare By :</div>
                  <div className="mt-1 text-slate-400">______________</div>
                </div>
                <div className="px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200 min-h-[56px]">
                  <div className="font-semibold text-slate-800">AL002 :</div>
                  <div className="mt-1 text-slate-600">{meta?.preparedBy?.split("/")[0]?.trim() || ""}</div>
                </div>
                <div className="px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200 min-h-[56px]">
                  <div className="font-semibold text-slate-800">At :</div>
                  <div className="mt-1 text-slate-400">______________</div>
                </div>
                <div className="px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200 min-h-[56px]">
                  <div className="font-semibold text-slate-800">ALC1 :</div>
                  <div className="mt-1 text-slate-600">ALC1</div>
                </div>
                <div className="px-3 py-2 min-h-[56px]">
                  <div className="font-semibold text-slate-800">Date &amp; Time :</div>
                  <div className="mt-1 text-slate-800">
                    {meta?.dateTime?.split(",")[0] ||
                      new Date().toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                  </div>
                </div>
              </div>
              <div className="px-3 py-3 min-h-[56px]">
                <div className="font-semibold text-slate-800">Certified &amp; Approved By :</div>
                <div className="mt-1 text-slate-400">________________________________</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
