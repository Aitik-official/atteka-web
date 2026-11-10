"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart2, FileSpreadsheet, Printer, RefreshCw, Search, Send, Table2 } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type PlRow = {
  branch: string;
  accountCategory: string;
  ledgerGroup: string;
  ledger: string;
  amount: number | null;
  total: number | null;
  isSectionTotal?: boolean;
  isProfit?: boolean;
};

type Meta = {
  branch: string;
  branchDisplay: string;
  dateRange: string;
  totalIncome: number;
  totalExpense: number;
  profitLoss: number;
};

function fyDefaults() {
  const y = new Date().getFullYear();
  const month = new Date().getMonth();
  const fyStart = month >= 3 ? y : y - 1;
  return { from: `${fyStart}-04-01`, to: `${fyStart + 1}-03-31` };
}

function fmt(n: number | null | undefined) {
  if (n == null) return "";
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function BranchProfitLossPage() {
  const defaults = useMemo(() => fyDefaults(), []);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [branch, setBranch] = useState("--Show All--");
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([]);
  const [rows, setRows] = useState<PlRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState("100%");
  const [findText, setFindText] = useState("");

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((b) => {
        if (!b.success) return;
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
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.branch, r.accountCategory, r.ledgerGroup, r.ledger].join(" ").toLowerCase().includes(q)
    );
  }, [rows, findText]);

  const zoomScale = Number(String(zoom).replace("%", "")) / 100 || 1;

  const loadReport = async (alsoExport = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        branch
      });
      const res = await fetch(`/api/reports/branch-profit-loss?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Branch Profit and Loss Report");
        return;
      }
      setRows(data.data || []);
      setMeta(data.meta || null);
      setFindText("");
      setStep("report");
      if (alsoExport) exportCsv(data.data || []);
    } catch {
      toast.error("Failed to load Branch Profit and Loss Report");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = (list: PlRow[] = filtered) => {
    if (!list.length) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Branch", "Account Category", "Ledger Group", "Ledger", "Amount", "Total"];
    const lines = list.map((r) =>
      [r.branch, r.accountCategory, r.ledgerGroup, r.ledger, r.amount ?? "", r.total ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Branch_PL_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

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
              <option value="--Show All--">--Show All--</option>
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

          <div className="flex items-center justify-center gap-3 py-4 bg-slate-50/40">
            <button
              type="button"
              title="Excel"
              disabled={loading}
              onClick={() => void loadReport(true)}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center disabled:opacity-60"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Table"
              disabled={loading}
              onClick={() => void loadReport(false)}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center disabled:opacity-60"
            >
              <Table2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Chart"
              onClick={() => toast.info("Open Table to view Branch P&L details")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Send"
              onClick={() => toast.info("Report send is simulated in this replica")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === "report" && (
        <div data-print-root className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("filter")}
                className="h-8 w-8 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-slate-900">Branch Profit and Loss Report</h1>
                <p className="text-[11px] text-slate-500">{meta?.dateRange}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50 text-[11px]">
              <span className="text-slate-600">Page 1 of 1</span>
              <select
                value={zoom}
                onChange={(e) => setZoom(e.target.value)}
                className="h-7 px-1 border border-slate-300 rounded bg-white"
              >
                {["75%", "100%", "125%", "150%"].map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 ml-auto">
                <input
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="Find"
                  className="h-7 px-2 border border-slate-300 rounded w-[140px]"
                />
                <button
                  type="button"
                  className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
                  title="Find"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => printScoped()}
                  className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
                  title="Print"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => exportCsv()}
                  className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
                  title="Export"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void loadReport(false)}
                  className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="px-3 py-2 text-[12px] border-b border-slate-200 bg-[#e8f1fb] flex flex-wrap gap-4">
              <div>
                <span className="font-semibold text-slate-700">Branch / Profit Center : </span>
                <span>{meta?.branch || branch}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Date Range : </span>
                <span>{meta?.dateRange}</span>
              </div>
            </div>

            <div className="overflow-x-auto p-2">
              <div style={{ transform: `scale(${zoomScale})`, transformOrigin: "top left" }}>
                <table className="w-full border-collapse text-[11px] min-w-[980px]">
                  <thead>
                    <tr className="bg-[#0171d3] text-white">
                      {["Branch", "Account Category", "Ledger Group", "Ledger", "Amount", "Total"].map(
                        (h) => (
                          <th
                            key={h}
                            className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                              h === "Amount" || h === "Total" ? "text-right" : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => (
                      <tr
                        key={`${r.ledger}-${idx}`}
                        className={
                          r.isProfit
                            ? "bg-[#0b1f3a] text-white font-bold"
                            : r.isSectionTotal
                              ? "bg-[#5b9bd5] text-white font-semibold"
                              : "odd:bg-white even:bg-slate-50"
                        }
                      >
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap font-semibold">
                          {r.branch}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap font-semibold">
                          {r.accountCategory}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.ledgerGroup}
                        </td>
                        <td
                          className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${
                            r.isSectionTotal || r.isProfit ? "text-right font-bold" : ""
                          }`}
                        >
                          {r.ledger}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {fmt(r.amount)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {fmt(r.total)}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                          No Branch P&amp;L rows for selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
