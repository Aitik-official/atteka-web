"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
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
  if (!n) return "";
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

export default function CashBankTransactionStatementPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [branch, setBranch] = useState("--Select--");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(21)));
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

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">

      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Select Branch / Profit Center
          </div>
          <div className="px-4 py-3 border-b border-slate-200 text-[12px] flex flex-wrap items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">
              Select Branch / Profit Center :
            </span>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="h-8 min-w-[240px] px-2 border border-slate-300 rounded-sm bg-white"
            >
              <option value="--Select--">--Select--</option>
              {branches.map((b) => (
                <option key={b.code} value={b.label}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Select Voucher Date Range
          </div>
          <div className="px-4 py-3 border-b border-slate-200 text-[12px] flex flex-wrap items-center gap-3">
            <span className="text-slate-700 font-semibold w-[90px]">Date Range</span>
            <span className="text-slate-600">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[150px]"
            />
            <span className="text-slate-600 ml-2">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[150px]"
            />
          </div>

          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">Select Account</div>
          <div className="px-4 py-3 border-b border-slate-200 text-[12px]">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="h-8 min-w-[320px] max-w-full px-2 border border-slate-300 rounded-sm bg-white"
            >
              <option value="--Select--">--Select--</option>
              {accounts.map((a) => (
                <option key={a.code} value={a.label}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div className="px-4 py-3 space-y-2.5 text-[12px] border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-700 font-semibold w-[110px]">With Narration</span>
              <select
                value={withNarration}
                onChange={(e) => setWithNarration(e.target.value)}
                className="h-8 min-w-[140px] px-2 border border-slate-300 rounded-sm bg-white"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-700 font-semibold w-[110px]">Voucher Type</span>
              <select
                value={voucherType}
                onChange={(e) => setVoucherType(e.target.value)}
                className="h-8 min-w-[140px] px-2 border border-slate-300 rounded-sm bg-white"
              >
                <option value="Approved">Approved</option>
                <option value="UnApproved">UnApproved</option>
                <option value="All">All</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-700 font-semibold w-[110px]">Result Mode</span>
              <select
                value={resultMode}
                onChange={(e) => setResultMode(e.target.value)}
                className="h-8 min-w-[140px] px-2 border border-slate-300 rounded-sm bg-white"
              >
                <option value="Screen">Screen</option>
                <option value="Excel">Excel</option>
                <option value="PDF">PDF</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center py-4 bg-slate-50/40">
            <button
              type="button"
              disabled={loading}
              onClick={loadReport}
              className="h-9 min-w-[100px] px-6 rounded-sm bg-[#0171d3] hover:bg-[#015fae] text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-9 w-9 rounded-full bg-[#0171d3] text-white inline-flex items-center justify-center hover:bg-[#015fae]"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900">Cash and Bank Transaction Statement</h1>
              <p className="text-[11px] text-slate-500">View / Print CBS</p>
            </div>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
              Select Branch / Profit Center
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 px-3 py-2 text-[12px] border-b border-slate-200 bg-[#e8f1fb]">
              <div>
                <span className="text-slate-600 font-semibold">Cash / Bank: </span>
                <span>{meta?.cashBank || account}</span>
              </div>
              <div>
                <span className="text-slate-600 font-semibold">Prepared At: </span>
                <span>{meta?.preparedAt || branch}</span>
              </div>
              <div>
                <span className="text-slate-600 font-semibold">From: </span>
                <span>{meta?.from}</span>
              </div>
              <div>
                <span className="text-slate-600 font-semibold">To: </span>
                <span>{meta?.to}</span>
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
                          h === "Debit" || h === "Credit" || h === "Balance" ? "text-right" : "text-left"
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
                          r.isGrandTotal
                            ? "bg-[#0b1f3a] text-white font-bold"
                            : r.isTotalTxn || r.isClosing
                              ? "bg-[#5b9bd5] text-white font-semibold"
                              : r.isOpening
                                ? "bg-slate-100 font-semibold"
                                : "odd:bg-white even:bg-slate-50"
                        }
                      >
                        <td className="border border-slate-200 px-2 py-1 text-center whitespace-nowrap">
                          {r.srNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.date}</td>
                        <td className="border border-slate-200 px-2 py-1">{r.particulars}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.voucherNo}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.documentNo}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.chequeNo}</td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {r.isOpening ? "" : fmt(r.debit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {r.isOpening ? "" : fmt(r.credit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {r.isOpening || !summary ? fmtBal(r.balance) : ""}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No transactions for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-t border-slate-300 text-[11px]">
              <div className="border-r border-slate-200 px-3 py-3 min-h-[72px]">
                <div className="font-semibold text-slate-700 mb-1">Prepared By</div>
                <div className="text-slate-800">{meta?.preparedBy || "—"}</div>
              </div>
              <div className="border-r border-slate-200 px-3 py-3 min-h-[72px]">
                <div className="font-semibold text-slate-700 mb-1">Certified &amp; Approved By</div>
                <div className="text-slate-400">{meta?.certifiedBy || "________________"}</div>
              </div>
              <div className="px-3 py-3 min-h-[72px]">
                <div className="font-semibold text-slate-700 mb-1">Date &amp; Time</div>
                <div className="text-slate-800">{meta?.dateTime || "—"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
