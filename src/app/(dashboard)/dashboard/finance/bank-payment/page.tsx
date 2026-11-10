"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Filter, IndianRupee, Paperclip, Search } from "lucide-react";
import { toast } from "@/lib/toastBus";

type PaymentRow = {
  id: string;
  voucherNo: string;
  voucherDate: string;
  voucherDateLabel: string;
  ageingDays: number;
  documentNo: string;
  paymentType: string;
  projectName: string;
  paidTo: string;
  amount: number;
  income: number;
  expense: number;
  profit: number;
  bankName: string;
  acNoIfsc: string;
  paymentMode: string;
  hdfcRemark: string;
  entryBy: string;
  attachedFile: string;
  narration: string;
  status: "Pending" | "Approved" | "Rejected";
};

type Summary = {
  aPay: number;
  fPay: number;
  bPay: number;
  oPay: number;
  fleet: number;
  salary: number;
  total: number;
  pendingCount: number;
  balance: number;
};

const BANK_OPTIONS = ["INDUSIND BANK", "HDFC BANK", "ICICI BANK", "SBI"];

function inr(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

export default function IndusIndOnlinePaymentProcessPage() {
  const [step, setStep] = useState<"bank" | "process">("bank");
  const [bankAccount, setBankAccount] = useState("INDUSIND BANK");
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [projectSearch, setProjectSearch] = useState("");
  const [entryBySearch, setEntryBySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<{
    availableBalance: number;
    ledgerBalance: number;
    accountNo: string;
    ifsc: string;
    asOf: string;
  } | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        bank: bankAccount,
        project: projectSearch,
        entryBy: entryBySearch,
        status: "Pending"
      });
      const res = await fetch(`/api/bank/h2h-online-payment?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load payment queue");
        return;
      }
      setRows(data.data || []);
      setSummary(data.summary || null);
      setSelected(new Set());
    } catch {
      toast.error("Failed to load payment queue");
    } finally {
      setLoading(false);
    }
  }, [bankAccount, projectSearch, entryBySearch]);

  useEffect(() => {
    if (step !== "process") return;
    const t = setTimeout(() => {
      void loadQueue();
    }, 250);
    return () => clearTimeout(t);
  }, [step, loadQueue]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const selectedAmount = useMemo(
    () => rows.filter((r) => selected.has(r.id)).reduce((s, r) => s + r.amount, 0),
    [rows, selected]
  );

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goNext = () => {
    if (!bankAccount) {
      toast.error("Please select Bank Account");
      return;
    }
    setStep("process");
  };

  const viewBalance = async () => {
    try {
      const res = await fetch("/api/bank/h2h-online-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "balance" })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Unable to fetch balance");
        return;
      }
      setBalanceInfo(data.data);
      setBalanceOpen(true);
    } catch {
      toast.error("Unable to fetch balance");
    }
  };

  const actOnSelected = async (action: "approve" | "reject") => {
    if (!selected.size) {
      toast.error("Select at least one voucher");
      return;
    }
    setActing(true);
    try {
      const res = await fetch("/api/bank/h2h-online-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selected) })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${action}`);
        return;
      }
      toast.success(data.message || `Payments ${action}d`);
      await loadQueue();
    } catch {
      toast.error(`Failed to ${action}`);
    } finally {
      setActing(false);
    }
  };

  const summaryCards = [
    { key: "date", label: `Todays - ${todayLabel()}`, value: null as string | null, color: "text-slate-800" },
    { key: "aPay", label: "A-Pay", value: inr(summary?.aPay || 0), color: "text-red-600" },
    { key: "fPay", label: "F-Pay", value: inr(summary?.fPay || 0), color: "text-emerald-600" },
    { key: "bPay", label: "B-Pay", value: inr(summary?.bPay || 0), color: "text-slate-900" },
    { key: "oPay", label: "O-Pay", value: inr(summary?.oPay || 0), color: "text-slate-900" },
    { key: "fleet", label: "Fleet", value: inr(summary?.fleet || 0), color: "text-slate-900" },
    { key: "salary", label: "Salary", value: inr(summary?.salary || 0), color: "text-slate-900" },
    { key: "total", label: "Total", value: inr(summary?.total || 0), color: "text-slate-900" }
  ];

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-10 font-sans">
      {step === "bank" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2.5 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 rounded-full bg-white/90" />
            H2H Online Banking
          </div>
          <div className="px-4 py-5 flex flex-wrap items-end gap-4">
            <div className="relative min-w-[280px] flex-1 max-w-md">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Bank Account
              </label>
              <select
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-sm bg-white text-[13px] text-slate-800 focus:outline-none focus:border-[#0171d3]"
              >
                {BANK_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={goNext}
              className="h-10 min-w-[88px] px-5 rounded-full border border-[#0171d3] text-[#0171d3] text-sm font-semibold bg-white hover:bg-[#e8f1fb]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === "process" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("bank")}
                className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#d7e8f8]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <h1 className="text-base font-bold text-[#0171d3]">Online Payment Process</h1>
              <span className="text-[11px] text-slate-500">{bankAccount}</span>
            </div>
            <button
              type="button"
              onClick={() => void viewBalance()}
              className="h-9 px-4 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#e8f1fb]"
            >
              <IndianRupee className="w-4 h-4" />
              View Balance
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
            {summaryCards.map((c) => (
              <div
                key={c.key}
                className="bg-white border border-slate-200 shadow-sm rounded-md px-2.5 py-2 min-h-[64px] flex flex-col justify-center"
              >
                {c.key === "date" ? (
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[10px] font-semibold text-slate-700 leading-snug">{c.label}</p>
                    <Filter className="w-3.5 h-3.5 text-[#0171d3] shrink-0 mt-0.5" />
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] font-semibold text-slate-600">{c.label}</p>
                    <p className={`text-sm font-bold ${c.color}`}>{c.value}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          {selected.size > 0 && (
            <p className="text-[11px] text-slate-600">
              Selected <span className="font-semibold">{selected.size}</span> voucher(s) ·{" "}
              <span className="font-semibold text-[#0171d3]">{inr(selectedAmount)}</span>
            </p>
          )}

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1600px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#015fae] px-2 py-1.5 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="accent-white"
                        title="Select All"
                      />
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      Voucher No
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      Voucher Date
                      <br />
                      Ageing
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      Document No
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      Payment Type
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold min-w-[180px]">
                      Project Name
                      <div className="mt-1 relative">
                        <Search className="w-3 h-3 absolute left-1.5 top-1.5 text-slate-400" />
                        <input
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          placeholder="Search Payment"
                          className="h-6 w-full pl-6 pr-2 rounded-sm text-[10px] text-slate-800 border-0 focus:outline-none"
                        />
                      </div>
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      Paid To
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold whitespace-nowrap">
                      Amount
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold whitespace-nowrap">
                      Income-Expense=Profit
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      Bank Name
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      A/C No-IFSC
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      Payment Mode
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      HDFC Bank Remark
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold min-w-[140px]">
                      Entry By
                      <div className="mt-1 relative">
                        <Search className="w-3 h-3 absolute left-1.5 top-1.5 text-slate-400" />
                        <input
                          value={entryBySearch}
                          onChange={(e) => setEntryBySearch(e.target.value)}
                          placeholder="Search Entry By"
                          className="h-6 w-full pl-6 pr-2 rounded-sm text-[10px] text-slate-800 border-0 focus:outline-none"
                        />
                      </div>
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      Attached file
                    </th>
                    <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                      Narration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={16} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        Loading payment queue...
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    rows.map((r) => (
                      <tr key={r.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-[#eef5fc]">
                        <td className="border border-slate-200 px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() => toggleOne(r.id)}
                            className="accent-[#0171d3]"
                          />
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-semibold text-slate-800">
                          {r.voucherNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          <div>{r.voucherDateLabel}</div>
                          <div className="text-slate-500">{r.ageingDays} day(s)</div>
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.documentNo}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          <span
                            className={
                              r.paymentType === "A-Pay"
                                ? "text-red-600 font-semibold"
                                : r.paymentType === "F-Pay"
                                  ? "text-emerald-600 font-semibold"
                                  : "font-semibold text-slate-800"
                            }
                          >
                            {r.paymentType}
                          </span>
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5">{r.projectName}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.paidTo}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold">
                          {inr(r.amount)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap">
                          <span className="text-slate-500">{inr(r.income)}</span>
                          <span className="mx-0.5">-</span>
                          <span className="text-slate-500">{inr(r.expense)}</span>
                          <span className="mx-0.5">=</span>
                          <span className={r.profit >= 0 ? "text-emerald-700 font-semibold" : "text-red-600 font-semibold"}>
                            {inr(r.profit)}
                          </span>
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.bankName}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono text-[10px]">
                          {r.acNoIfsc}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.paymentMode}</td>
                        <td className="border border-slate-200 px-2 py-1.5">{r.hdfcRemark || "—"}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.entryBy}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          {r.attachedFile ? (
                            <span className="inline-flex items-center gap-1 text-[#0171d3]">
                              <Paperclip className="w-3 h-3" />
                              {r.attachedFile}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 max-w-[220px]">{r.narration}</td>
                      </tr>
                    ))}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={16} className="border border-slate-200 px-3 py-10 text-center text-slate-500">
                        No pending online payments for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-1">
            <button
              type="button"
              disabled={acting || !selected.size}
              onClick={() => void actOnSelected("approve")}
              className="h-9 min-w-[110px] px-6 rounded-full border border-[#0171d3] text-[#0171d3] text-sm font-semibold bg-white hover:bg-[#e8f1fb] disabled:opacity-50"
            >
              {acting ? "..." : "Approve"}
            </button>
            <button
              type="button"
              disabled={acting || !selected.size}
              onClick={() => void actOnSelected("reject")}
              className="h-9 min-w-[110px] px-6 rounded-full border border-[#0171d3] text-[#0171d3] text-sm font-semibold bg-white hover:bg-[#e8f1fb] disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {balanceOpen && balanceInfo && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-lg border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#0171d3] text-white px-4 py-2.5 text-sm font-semibold">
              IndusInd H2H — Account Balance
            </div>
            <div className="px-4 py-4 text-[12px] space-y-2">
              <div className="flex justify-between gap-3">
                <span className="text-slate-600">A/C No</span>
                <span className="font-mono font-semibold">{balanceInfo.accountNo}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-600">IFSC</span>
                <span className="font-mono font-semibold">{balanceInfo.ifsc}</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-slate-100 pt-2">
                <span className="text-slate-600">Available Balance</span>
                <span className="font-bold text-emerald-700">{inr(balanceInfo.availableBalance)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-600">Ledger Balance</span>
                <span className="font-semibold">{inr(balanceInfo.ledgerBalance)}</span>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">As of {balanceInfo.asOf} (demo)</p>
            </div>
            <div className="px-4 pb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setBalanceOpen(false)}
                className="h-8 px-4 rounded-full border border-[#0171d3] text-[#0171d3] text-xs font-semibold hover:bg-[#e8f1fb]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
