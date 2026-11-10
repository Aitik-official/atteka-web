"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  LineChart,
  PieChart,
  Save,
  Search,
  Table2
} from "lucide-react";
import { toast } from "@/lib/toastBus";

type BankAccount = {
  code: string;
  label: string;
  bank: string;
  accountNo: string;
};

type TxnRow = {
  id: string;
  srNo: number;
  txnDate: string;
  txnDateLabel: string;
  valueDateLabel: string;
  refNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  channel: string;
  status: "Posted" | "Pending" | "Reversed";
};

type Summary = {
  txnCount: number;
  totalDebit: number;
  totalCredit: number;
  net: number;
  closingBalance: number;
  byChannel: Record<string, number>;
  byDay: Record<string, number>;
};

type ResultMeta = {
  bankAccount: string;
  bank: string;
  accountNo: string;
  from: string;
  to: string;
  fetchedAt: string;
};

type ViewTab = "table" | "chart" | "export";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function inr(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function fmtAmt(n: number) {
  if (!n) return "";
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function statusCls(status: TxnRow["status"]) {
  if (status === "Posted") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (status === "Pending") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-700 bg-slate-100 border-slate-200";
}

export default function ApiBankStatementPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [bankAccount, setBankAccount] = useState("");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(1)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [rows, setRows] = useState<TxnRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [meta, setMeta] = useState<ResultMeta | null>(null);
  const [fetched, setFetched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTab>("table");
  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    fetch("/api/bank/api-statement?accounts=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAccounts(d.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const tick = () =>
      setLiveTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit"
        })
      );
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const channelBars = useMemo(() => {
    if (!summary) return [];
    const entries = Object.entries(summary.byChannel || {});
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([label, value]) => ({
      label,
      value,
      pct: Math.round((value / max) * 100)
    }));
  }, [summary]);

  const dayBars = useMemo(() => {
    if (!summary) return [];
    const entries = Object.entries(summary.byDay || {}).sort(([a], [b]) => a.localeCompare(b));
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([label, value]) => ({
      label,
      value,
      pct: Math.round((value / max) * 100)
    }));
  }, [summary]);

  const fetchStatement = async () => {
    if (!bankAccount) {
      toast.error("Please select Bank Account");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        bankAccount,
        from: fromDate,
        to: toDate
      });
      const res = await fetch(`/api/bank/api-statement?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to fetch statement from bank API");
        return;
      }
      setRows(data.data || []);
      setSummary(data.summary || null);
      setMeta(data.meta || null);
      setFetched(true);
      setViewTab("table");
      toast.success(`Fetched ${data.count || 0} transaction(s) via API (demo)`);
    } catch {
      toast.error("Failed to fetch statement from bank API");
    } finally {
      setLoading(false);
    }
  };

  const saveQuery = async () => {
    if (!bankAccount) {
      toast.error("Please select Bank Account");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/bank/api-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          bankAccount,
          from: fromDate,
          to: toDate
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save query");
        return;
      }
      toast.success(data.message || "Query saved");
    } catch {
      toast.error("Failed to save query");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "Sr.No",
      "Txn Date",
      "Value Date",
      "Ref No",
      "Description",
      "Channel",
      "Debit",
      "Credit",
      "Balance",
      "Status"
    ];
    const lines = rows.map((r) =>
      [
        r.srNo,
        r.txnDateLabel,
        r.valueDateLabel,
        r.refNo,
        `"${(r.description || "").replace(/"/g, '""')}"`,
        r.channel,
        r.debit,
        r.credit,
        r.balance,
        r.status
      ].join(",")
    );
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-bank-statement-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started (demo CSV)");
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0b3d6e]">Account Statement Analytics</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Comprehensive transaction analysis and reporting
          </p>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {liveTime || "—"}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#0171d3]" />
            <h2 className="text-sm font-bold text-slate-800">Statement Query</h2>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">Configure parameters to fetch statement</p>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-[12px] text-slate-600 space-y-1">
              <span className="font-semibold text-slate-700">Bank Account</span>
              <select
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-[13px] text-slate-800 focus:outline-none focus:border-[#0171d3]"
              >
                <option value="">Select Bank</option>
                {accounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[12px] text-slate-600 space-y-1">
              <span className="font-semibold text-slate-700">From Date</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:border-[#0171d3]"
              />
            </label>
            <label className="text-[12px] text-slate-600 space-y-1">
              <span className="font-semibold text-slate-700">To Date</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:border-[#0171d3]"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void fetchStatement()}
              className="h-10 px-4 rounded-lg bg-[#0171d3] hover:bg-[#015fae] text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {loading ? "Fetching..." : "Fetch Statement"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveQuery()}
              className="h-10 px-4 rounded-lg bg-[#0171d3] hover:bg-[#015fae] text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Query"}
            </button>
          </div>
        </div>
      </div>

      {!fetched && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-6 py-12 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-[#e8f1fb] text-[#0171d3] inline-flex items-center justify-center mb-4">
            <LineChart className="w-9 h-9" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Advanced Statement Analytics</h3>
          <p className="text-[13px] text-slate-500 max-w-xl mx-auto mt-2">
            Get detailed insights into your transaction history with interactive charts, advanced
            filtering, and comprehensive analysis tools.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#e8f1fb] text-[#0171d3] inline-flex items-center justify-center">
              <Table2 className="w-5 h-5" />
            </div>
            <div className="h-12 w-12 rounded-lg bg-[#e8f1fb] text-[#0171d3] inline-flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <div className="h-12 w-12 rounded-lg bg-[#e8f1fb] text-[#0171d3] inline-flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {fetched && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { label: "Transactions", value: String(summary?.txnCount || 0), color: "text-slate-900" },
              { label: "Total Debit", value: inr(summary?.totalDebit || 0), color: "text-red-600" },
              { label: "Total Credit", value: inr(summary?.totalCredit || 0), color: "text-emerald-600" },
              { label: "Net", value: inr(summary?.net || 0), color: "text-[#0171d3]" },
              { label: "Closing Balance", value: inr(summary?.closingBalance || 0), color: "text-slate-900" }
            ].map((c) => (
              <div
                key={c.label}
                className="bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2.5"
              >
                <p className="text-[11px] font-semibold text-slate-500">{c.label}</p>
                <p className={`text-sm font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[12px] text-slate-600">
                <span className="font-semibold text-slate-800">{meta?.bankAccount}</span>
                <span className="mx-2">·</span>
                {meta?.from} — {meta?.to}
                <span className="mx-2">·</span>
                Fetched {meta?.fetchedAt}
              </div>
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewTab("table")}
                  className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border ${
                    viewTab === "table"
                      ? "border-[#0171d3] bg-[#e8f1fb] text-[#0171d3]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab("chart")}
                  className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border ${
                    viewTab === "chart"
                      ? "border-[#0171d3] bg-[#e8f1fb] text-[#0171d3]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" /> Charts
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewTab("export");
                    exportCsv();
                  }}
                  className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border ${
                    viewTab === "export"
                      ? "border-[#0171d3] bg-[#e8f1fb] text-[#0171d3]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>

            {(viewTab === "table" || viewTab === "export") && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px] min-w-[980px]">
                  <thead>
                    <tr className="bg-[#0171d3] text-white">
                      {[
                        "Sr.No",
                        "Txn Date",
                        "Value Date",
                        "Ref No",
                        "Description",
                        "Channel",
                        "Debit",
                        "Credit",
                        "Balance",
                        "Status"
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
                    {rows.map((r) => (
                      <tr key={r.id} className="odd:bg-white even:bg-slate-50/70">
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{r.srNo}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          {r.txnDateLabel}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          {r.valueDateLabel}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono text-[10px]">
                          {r.refNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 max-w-[260px]">{r.description}</td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.channel}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold text-red-700">
                          {fmtAmt(r.debit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold text-emerald-700">
                          {fmtAmt(r.credit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold">
                          {fmtAmt(r.balance) || "0.00"}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${statusCls(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={10}
                          className="border border-slate-200 px-3 py-10 text-center text-slate-500"
                        >
                          No transactions returned for selected API query.
                        </td>
                      </tr>
                    )}
                    {rows.length > 0 && (
                      <tr className="bg-[#5b9bd5] text-white font-semibold">
                        <td className="border border-slate-200 px-2 py-1.5" colSpan={6}>
                          Total ({summary?.txnCount || rows.length})
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right">
                          {fmtAmt(summary?.totalDebit || 0) || "0.00"}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right">
                          {fmtAmt(summary?.totalCredit || 0) || "0.00"}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right">
                          {fmtAmt(summary?.closingBalance || 0) || "0.00"}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5" />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {viewTab === "chart" && (
              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-slate-800 mb-3">Volume by Channel</h3>
                  <div className="space-y-2">
                    {channelBars.map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="font-semibold text-slate-700">{b.label}</span>
                          <span>{inr(b.value)}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0171d3]" style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    {channelBars.length === 0 && (
                      <p className="text-[11px] text-slate-500">No channel data.</p>
                    )}
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-slate-800 mb-3">Volume by Day</h3>
                  <div className="space-y-2">
                    {dayBars.map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="font-semibold text-slate-700">{b.label}</span>
                          <span>{inr(b.value)}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    {dayBars.length === 0 && (
                      <p className="text-[11px] text-slate-500">No daily data.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
