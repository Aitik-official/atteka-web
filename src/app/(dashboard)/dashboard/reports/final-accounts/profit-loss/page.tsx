"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toastBus";

type PlRow = {
  groupName: string;
  subGroupName: string;
  amount: number | null;
  totalAmount: number | null;
  isCategoryHeader?: boolean;
  isSubTotal?: boolean;
  isSectionTotal?: boolean;
  isProfit?: boolean;
  hrefCode?: string;
};

function toDisplayDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function formatReportDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function fmt(n: number | null | undefined) {
  if (n == null || n === 0) return n === 0 ? "0" : "";
  return Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function ProfitLossStatementPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [branch, setBranch] = useState("--Show All--");
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([]);
  const [rows, setRows] = useState<PlRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // default FY if today is later
    const y = new Date().getFullYear();
    const month = new Date().getMonth(); // 0-based
    const fyStart = month >= 3 ? y : y - 1;
    setFromDate(`${fyStart}-04-01`);
    setToDate(`${fyStart + 1}-03-31`);

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

  const loadReport = async () => {
    setLoading(true);
    try {
      const br = branch.includes(" - ") ? branch.split(" - ").pop()!.trim() : branch;
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        branch: br || "Show All"
      });
      const res = await fetch(`/api/reports/profit-loss?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Profit & Loss Statement");
        return;
      }
      setRows(data.data || []);
      setStep("report");
    } catch {
      toast.error("Failed to load Profit & Loss Statement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10">

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
              className="h-8 min-w-[220px] px-2 border border-slate-300 rounded-sm bg-white"
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
          <div className="px-4 py-3 text-[12px] flex flex-wrap items-center gap-3">
            <span className="text-slate-700 font-semibold w-[90px]">Date Range</span>
            <span className="text-slate-600">From</span>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[150px]"
              />
              <span className="sr-only">{toDisplayDate(fromDate)}</span>
            </div>
            <span className="text-slate-600 ml-2">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[150px]"
            />
          </div>

          <div className="flex justify-center py-3 border-t border-slate-200 bg-slate-50/50">
            <button
              type="button"
              disabled={loading}
              onClick={loadReport}
              className="text-[#0171d3] font-bold text-sm hover:underline disabled:opacity-60"
            >
              {loading ? "Loading..." : "GO"}
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
              className="h-8 w-8 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-bold text-slate-900">Profit &amp; Loss Statement</h1>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
              Select Branch / Profit Center
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-3 py-2 text-[12px] border-b border-slate-200 bg-[#e8f1fb]">
              <div>
                <span className="text-slate-600 font-semibold">Branch / Profit Center: </span>
                <span>{branch}</span>
              </div>
              <div>
                <span className="text-slate-600 font-semibold">From: </span>
                <span>{formatReportDate(fromDate)}</span>
              </div>
              <div>
                <span className="text-slate-600 font-semibold">To: </span>
                <span>{formatReportDate(toDate)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[720px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#015fae] px-3 py-1.5 text-left font-semibold">
                      Group Name
                    </th>
                    <th className="border border-[#015fae] px-3 py-1.5 text-left font-semibold">
                      Sub Group Name
                    </th>
                    <th className="border border-[#015fae] px-3 py-1.5 text-right font-semibold">
                      Amount
                    </th>
                    <th className="border border-[#015fae] px-3 py-1.5 text-right font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    if (r.isProfit) {
                      return (
                        <tr key={`profit-${idx}`} className="bg-[#0171d3] text-white font-bold">
                          <td className="border border-[#015fae] px-3 py-2" colSpan={2}>
                            {r.groupName}
                          </td>
                          <td className="border border-[#015fae] px-3 py-2 text-right" />
                          <td className="border border-[#015fae] px-3 py-2 text-right font-mono">
                            {fmt(r.totalAmount)}
                          </td>
                        </tr>
                      );
                    }

                    const isHeader =
                      r.isCategoryHeader &&
                      (r.groupName === "INCOME" ||
                        r.groupName === "EXPENSE" ||
                        (!r.groupName && !!r.subGroupName && !r.subGroupName.includes("~")));

                    return (
                      <tr
                        key={`${r.subGroupName}-${idx}`}
                        className={
                          r.isSubTotal || r.isSectionTotal
                            ? "bg-slate-100 font-semibold"
                            : isHeader
                              ? "bg-white font-bold"
                              : "odd:bg-white even:bg-slate-50"
                        }
                      >
                        <td className="border border-slate-200 px-3 py-1.5 whitespace-nowrap font-semibold text-slate-800">
                          {r.groupName}
                        </td>
                        <td className="border border-slate-200 px-3 py-1.5 whitespace-nowrap">
                          {r.hrefCode ? (
                            <button
                              type="button"
                              className="text-[#6b21a8] underline font-medium hover:text-[#4c1d95]"
                              onClick={() => toast.info(`Ledger drill-down: ${r.subGroupName}`)}
                            >
                              {r.subGroupName}
                            </button>
                          ) : (
                            <span className={isHeader ? "text-slate-800" : ""}>{r.subGroupName}</span>
                          )}
                        </td>
                        <td className="border border-slate-200 px-3 py-1.5 text-right font-mono whitespace-nowrap">
                          {r.amount != null ? fmt(r.amount) : ""}
                        </td>
                        <td className="border border-slate-200 px-3 py-1.5 text-right font-mono whitespace-nowrap">
                          {r.totalAmount != null ? fmt(r.totalAmount) : ""}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No P&amp;L data for selected filters.
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
