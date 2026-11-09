"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, Filter, Play, X } from "lucide-react";
import { toast } from "@/lib/toastBus";

type TbRow = {
  group: string;
  subGroup: string;
  accountName: string;
  accountCode: string;
  openingDebit: number;
  openingCredit: number;
  currentDebit: number;
  currentCredit: number;
  closingDebit: number;
  closingCredit: number;
  isSubTotal?: boolean;
  isDiff?: boolean;
  isGrandTotal?: boolean;
};

const MONEY_KEYS = [
  "openingDebit",
  "openingCredit",
  "currentDebit",
  "currentCredit",
  "closingDebit",
  "closingCredit"
] as const;

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatReportDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fyBounds(fy: string): { from: string; to: string } | null {
  const m = fy.match(/(\d{4})\s*[-–]\s*(\d{4})/);
  if (!m) return null;
  return { from: `${Number(m[1])}-04-01`, to: `${Number(m[2])}-03-31` };
}

export default function TrialBalancePage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [showFilter, setShowFilter] = useState(true);
  const [fy, setFy] = useState("2025-2026");
  const [fromDate, setFromDate] = useState("2025-04-01");
  const [toDate, setToDate] = useState("2026-03-31");
  const [branch, setBranch] = useState("--Show All--");
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([]);
  const [rows, setRows] = useState<TbRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fyOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return ["--Select--", "2024-2025", "2025-2026", "2026-2027", `${y - 1}-${y}`, `${y}-${y + 1}`].filter(
      (v, i, a) => a.indexOf(v) === i
    );
  }, []);

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

  useEffect(() => {
    if (fy && fy !== "--Select--") {
      const b = fyBounds(fy);
      if (b) {
        setFromDate(b.from);
        setToDate(b.to);
      }
    }
  }, [fy]);

  const periodLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadReport = async () => {
    setLoading(true);
    try {
      const br = branch.includes(" - ") ? branch.split(" - ").pop()!.trim() : branch;
      const params = new URLSearchParams({
        fy: fy === "--Select--" ? "" : fy,
        from: fromDate,
        to: toDate,
        branch: br || "Show All"
      });
      const res = await fetch(`/api/reports/trial-balance?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Trial Balance");
        return;
      }
      setRows(data.data || []);
      setStep("report");
      setShowFilter(false);
    } catch {
      toast.error("Failed to load Trial Balance");
    } finally {
      setLoading(false);
    }
  };

  const filterPanel = (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Filter className="w-4 h-4 text-violet-600" />
          Report Filter
        </div>
        {step === "report" && (
          <button
            type="button"
            onClick={() => setShowFilter(false)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 bg-slate-50/40">
        <div>
          <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
            Financial Year
          </label>
          <select
            value={fy}
            onChange={(e) => setFy(e.target.value)}
            className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white"
          >
            {fyOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
            Transaction Period
          </label>
          <div className="h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white flex items-center text-slate-700">
            <span className="truncate flex-1">{periodLabel}</span>
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 px-2 border border-slate-300 rounded-lg text-xs bg-white"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 px-2 border border-slate-300 rounded-lg text-xs bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
            Branch / Profit Center
          </label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="--Show All--">--Show All--</option>
            {branches.map((b) => (
              <option key={b.code} value={b.label}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 pt-2">
        <button
          type="button"
          disabled={loading}
          onClick={loadReport}
          className="w-full h-11 rounded-lg bg-[#0b1f3a] hover:bg-[#132a4a] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Play className="w-4 h-4 fill-white" />
          {loading ? "Generating Report..." : "Generate Report"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {step === "filter" && <div className="flex justify-center pt-6">{filterPanel}</div>}

      {step === "report" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep("filter");
                  setShowFilter(true);
                }}
                className="h-8 w-8 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Trial Balance</h1>
                <p className="text-[11px] text-slate-500">Trial Balance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFilter((v) => !v)}
              className="h-9 px-3 rounded-md bg-[#6b21a8] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#581c87]"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>

          {showFilter && (
            <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onClick={() => setShowFilter(false)}>
              <div className="h-full w-full max-w-md p-3" onClick={(e) => e.stopPropagation()}>
                {filterPanel}
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
              Select Branch / Profit Center
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-3 py-2 text-[12px] border-b border-slate-200 bg-[#e8f1fb]">
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
              <table className="w-full border-collapse text-[11px] min-w-[1100px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    {[
                      "Group",
                      "Sub Group",
                      "Account Name",
                      "Opening Debit",
                      "Opening Credit",
                      "Current Debit",
                      "Current Credit",
                      "Closing Debit",
                      "Closing Credit"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          h.includes("Debit") || h.includes("Credit") ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr
                      key={`${r.accountCode || r.accountName}-${idx}`}
                      className={
                        r.isGrandTotal
                          ? "bg-[#0b1f3a] text-white font-bold"
                          : r.isSubTotal
                            ? "bg-[#5b9bd5] text-white font-semibold"
                            : r.isDiff
                              ? "bg-amber-50 font-semibold"
                              : "odd:bg-white even:bg-slate-50"
                      }
                    >
                      <td className="border border-slate-200 px-2 py-1 whitespace-nowrap font-semibold">
                        {r.group}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.subGroup}</td>
                      <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.accountName}</td>
                      {MONEY_KEYS.map((k) => (
                        <td
                          key={k}
                          className="border border-slate-200 px-2 py-1 text-right whitespace-nowrap font-mono"
                        >
                          {fmt(r[k])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No trial balance rows for selected filters.
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
