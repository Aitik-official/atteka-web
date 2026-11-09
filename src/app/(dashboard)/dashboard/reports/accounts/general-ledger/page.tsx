"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart2, Calendar, ChevronDown, FileSpreadsheet, MoreHorizontal, Pencil, Table2 } from "lucide-react";
import { toast } from "@/lib/toastBus";

type GlRow = {
  srNo: string;
  branch: string;
  date: string;
  particular: string;
  debit: number;
  credit: number;
  voucherRef: string;
  docRef: string;
  narration: string;
  payto: string;
  expenseBranch: string;
  isOpening?: boolean;
  isCurrentTotal?: boolean;
  isPeriodTotal?: boolean;
  isClosing?: boolean;
  isGrandTotal?: boolean;
};

type Meta = {
  branch: string;
  dateRange: string;
  account: string;
};

function fyDefaults() {
  const y = new Date().getFullYear();
  const month = new Date().getMonth();
  const fyStart = month >= 3 ? y : y - 1;
  return { from: `${fyStart}-04-01`, to: `${fyStart + 1}-03-31` };
}

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

const COLUMNS = [
  { key: "srNo", label: "Sr.No" },
  { key: "branch", label: "Branch" },
  { key: "date", label: "Date" },
  { key: "particular", label: "Particular" },
  { key: "debit", label: "Debit", align: "right" as const },
  { key: "credit", label: "Credit", align: "right" as const },
  { key: "voucherRef", label: "Voucher/Ref No." },
  { key: "docRef", label: "Doc/Ref No." },
  { key: "narration", label: "Narration" },
  { key: "payto", label: "Payto" },
  { key: "expenseBranch", label: "Expense Branch" }
];

export default function GeneralLedgerPage() {
  const defaults = useMemo(() => fyDefaults(), []);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [showDates, setShowDates] = useState(false);
  const [branch, setBranch] = useState("--Show All--");
  const [account, setAccount] = useState("--Select Account--");
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([]);
  const [accounts, setAccounts] = useState<{ code: string; label: string }[]>([]);
  const [rows, setRows] = useState<GlRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<"table" | "chart" | "edit">("table");

  useEffect(() => {
    Promise.all([fetch("/api/branches"), fetch("/api/reports/general-ledger?accounts=1")])
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

  const periodLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadReport = async (accountOverride?: string) => {
    const selectedAccount = accountOverride ?? account;
    if (!selectedAccount || selectedAccount === "--Select Account--") {
      toast.error("Please select an Account");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        branch,
        account: selectedAccount
      });
      const res = await fetch(`/api/reports/general-ledger?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load General Ledger");
        return;
      }
      setRows(data.data || []);
      setMeta(data.meta || null);
      setStep("report");
    } catch {
      toast.error("Failed to load General Ledger");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!rows.length) {
      toast.error("No data to export");
      return;
    }
    const headers = COLUMNS.map((c) => c.label);
    const lines = rows.map((r) =>
      COLUMNS.map((c) => {
        const v = (r as any)[c.key];
        const s = typeof v === "number" ? fmt(v) : String(v ?? "");
        return `"${s.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `General_Ledger_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {step === "filter" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[420px]">
          <div className="flex items-center justify-center gap-2 pt-5 pb-3">
            {(
              [
                { id: "table" as const, Icon: Table2 },
                { id: "chart" as const, Icon: BarChart2 },
                { id: "edit" as const, Icon: Pencil }
              ] as const
            ).map(({ id, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTool(id)}
                className={`h-9 w-9 rounded-md inline-flex items-center justify-center border ${
                  tool === id
                    ? "bg-[#0171d3] border-[#0171d3] text-white"
                    : "bg-white border-[#0171d3] text-[#0171d3] hover:bg-blue-50"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="max-w-xl mx-auto px-6 pb-10 space-y-5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDates((v) => !v)}
                className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm bg-white flex items-center gap-2 text-left text-slate-700"
              >
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate flex-1">{periodLabel}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
              {showDates && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">From</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full h-9 px-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">To</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full h-9 px-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDates(false)}
                    className="col-span-2 h-8 rounded-md bg-[#0171d3] text-white text-xs font-semibold"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0171d3] mb-1.5">
                Branch / Profit Center
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="--Show All--">--Show All--</option>
                {branches.map((b) => (
                  <option key={b.code} value={b.label}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0171d3] mb-1.5">Accounts</label>
              <div className="flex items-center gap-2">
                <select
                  value={account}
                  onChange={(e) => {
                    const next = e.target.value;
                    setAccount(next);
                    if (next && next !== "--Select Account--") {
                      void loadReport(next);
                    }
                  }}
                  className="flex-1 h-11 px-3 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="--Select Account--">--Select Account--</option>
                  {accounts.map((a) => (
                    <option key={a.code} value={a.label}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  title="More accounts"
                  className="h-11 w-11 rounded-full border border-slate-300 text-slate-600 inline-flex items-center justify-center hover:bg-slate-50 shrink-0"
                  onClick={() => toast.info("Account picker — select from the Accounts list")}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => void loadReport()}
              className="w-full h-11 rounded-lg bg-[#0b1f3a] hover:bg-[#132a4a] text-white font-semibold text-sm disabled:opacity-60"
            >
              {loading ? "Generating Report..." : "Generate Report"}
            </button>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="space-y-3">
          <div className="bg-[#0171d3] text-white rounded-t-md px-3 py-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 inline-flex items-center justify-center"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-semibold">General Ledger</h1>
          </div>

          <div className="bg-white border border-slate-200 rounded-b-md shadow-sm overflow-hidden -mt-3">
            <div className="px-4 py-3 text-[12px] space-y-1 border-b border-slate-200">
              <div>
                <span className="font-semibold text-slate-700">Branch / Profit Center : </span>
                <span>{meta?.branch || branch}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Date Range : </span>
                <span>{meta?.dateRange}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Accounts : </span>
                <span>{meta?.account || account}</span>
              </div>
            </div>

            <div className="flex justify-end px-3 py-2">
              <button
                type="button"
                onClick={exportCsv}
                className="h-9 w-9 rounded-md bg-[#0171d3] text-white inline-flex items-center justify-center hover:bg-[#015fae]"
                title="Export Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto px-2 pb-4">
              <table className="w-full border-collapse text-[11px] min-w-[1100px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    {COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          c.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const summary =
                      r.isOpening ||
                      r.isCurrentTotal ||
                      r.isPeriodTotal ||
                      r.isClosing ||
                      r.isGrandTotal;
                    return (
                      <tr
                        key={`${r.srNo}-${r.voucherRef}-${idx}`}
                        className={
                          r.isGrandTotal
                            ? "bg-[#0b1f3a] text-white font-bold"
                            : summary
                              ? "bg-[#5b9bd5] text-white font-semibold"
                              : "odd:bg-white even:bg-slate-50"
                        }
                      >
                        <td className="border border-slate-200 px-2 py-1 text-center whitespace-nowrap">
                          {r.srNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.branch}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.date}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.particular}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {fmt(r.debit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {fmt(r.credit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.voucherRef}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.docRef}</td>
                        <td className="border border-slate-200 px-2 py-1">{r.narration}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.payto}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.expenseBranch}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={11} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No ledger rows for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
