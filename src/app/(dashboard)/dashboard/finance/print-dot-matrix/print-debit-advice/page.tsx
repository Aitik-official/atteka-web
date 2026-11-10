"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type AdviceRow = {
  id: string;
  srNo: number;
  adviceNo: string;
  adviceTransaction: string;
  adviceStatus: "Pending" | "Accepted" | "Rejected" | "Generated";
  raisedBy: string;
  raisedOnLabel: string;
  adviceAmount: number;
  generationDateLabel: string;
  acceptedDateLabel: string;
};

type Meta = {
  mode: string;
  from: string;
  to: string;
  adviceNumber: string;
};

type DateMode = "range" | "today" | "last7";
type SearchMode = "criteria" | "number";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function inr(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function statusCls(status: AdviceRow["adviceStatus"]) {
  if (status === "Accepted") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (status === "Pending") return "text-amber-700 bg-amber-50 border-amber-200";
  if (status === "Rejected") return "text-red-700 bg-red-50 border-red-200";
  return "text-slate-700 bg-slate-100 border-slate-200";
}

export default function PrintDebitAdvicePage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [searchMode, setSearchMode] = useState<SearchMode>("criteria");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [fromDate, setFromDate] = useState(toInputDate(new Date()));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [adviceNumber, setAdviceNumber] = useState("");
  const [rows, setRows] = useState<AdviceRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadReport = async () => {
    if (searchMode === "number" && !adviceNumber.trim()) {
      toast.error("Enter Debit Advice Number");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: searchMode,
        dateMode,
        from: fromDate,
        to: toDate,
        adviceNumber: adviceNumber.trim()
      });
      const res = await fetch(`/api/finance/print-debit-advice?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Debit Advice");
        return;
      }
      setRows(data.data || []);
      setMeta(data.meta || null);
      setSelected(new Set());
      setStep("report");
    } catch {
      toast.error("Failed to load Debit Advice");
    } finally {
      setLoading(false);
    }
  };

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

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

  const printSelected = () => {
    if (!selected.size) {
      toast.error("Select at least one Debit Advice");
      return;
    }
    toast.success(`${selected.size} Debit Advice(s) sent to Dot-Matrix printer (demo)`);
    printScoped();
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Select Top Sheet Criteria
          </div>

          <div className="px-4 py-4 space-y-3 text-[12px]">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <span className="font-semibold text-slate-800 w-[150px] pt-1.5 shrink-0">
                Debit Advice Date
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 flex-1">
                <label className="inline-flex items-center gap-1.5 flex-wrap">
                  <input
                    type="radio"
                    name="dateMode"
                    checked={dateMode === "range" && searchMode === "criteria"}
                    onChange={() => {
                      setSearchMode("criteria");
                      setDateMode("range");
                    }}
                    className="accent-[#0171d3]"
                  />
                  <span>From / To</span>
                  <input
                    type="date"
                    value={fromDate}
                    disabled={dateMode !== "range" || searchMode !== "criteria"}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-8 px-2 border border-slate-300 rounded-sm disabled:bg-slate-50"
                  />
                  <input
                    type="date"
                    value={toDate}
                    disabled={dateMode !== "range" || searchMode !== "criteria"}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-8 px-2 border border-slate-300 rounded-sm disabled:bg-slate-50"
                  />
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="dateMode"
                    checked={dateMode === "today" && searchMode === "criteria"}
                    onChange={() => {
                      setSearchMode("criteria");
                      setDateMode("today");
                    }}
                    className="accent-[#0171d3]"
                  />
                  <span>Todays - {todayLabel()}</span>
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="dateMode"
                    checked={dateMode === "last7" && searchMode === "criteria"}
                    onChange={() => {
                      setSearchMode("criteria");
                      setDateMode("last7");
                    }}
                    className="accent-[#0171d3]"
                  />
                  <span>Last 7 Days</span>
                </label>
              </div>
            </div>

            <div className="text-center py-1 border-t border-slate-100">
              <span className="text-red-600 font-bold text-sm">OR</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-800 w-[150px] shrink-0">
                Debit Advice Number
              </span>
              <label className="inline-flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="radio"
                  name="searchMode"
                  checked={searchMode === "number"}
                  onChange={() => setSearchMode("number")}
                  className="accent-[#0171d3]"
                />
                <input
                  value={adviceNumber}
                  onChange={(e) => {
                    setAdviceNumber(e.target.value.toUpperCase());
                    setSearchMode("number");
                  }}
                  disabled={searchMode !== "number"}
                  className="h-8 flex-1 min-w-[220px] max-w-md px-2 border border-slate-300 rounded-sm disabled:bg-slate-50 uppercase"
                />
              </label>
            </div>

            <div className="flex justify-center pt-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadReport()}
                className="h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div data-print-root className="space-y-3">
          <button
            type="button"
            onClick={() => setStep("filter")}
            className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#d7e8f8]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
              View Print Debit Advice
            </div>
            <div className="px-3 py-2 text-[12px] border-b border-slate-200 bg-[#e8f1fb]">
              {meta?.mode === "number" ? (
                <span>
                  <span className="font-semibold">Debit Advice Number :</span> {meta.adviceNumber}
                </span>
              ) : (
                <span>
                  <span className="font-semibold">Debit Advice Date :</span> {meta?.from} — {meta?.to}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1100px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#015fae] px-2 py-1.5 w-14 text-center font-semibold">
                      Select
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          className="accent-white"
                        />
                      </div>
                    </th>
                    {[
                      "Advice No",
                      "Advice Transaction",
                      "Advice Status",
                      "Raised By",
                      "Raised On",
                      "Advice Amount",
                      "Generation Date",
                      "Accepted Date"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          h === "Advice Amount" ? "text-right" : "text-center"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-[#eef5fc]">
                      <td className="border border-slate-200 px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          className="accent-[#0171d3]"
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap font-semibold">
                        {r.adviceNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center">{r.adviceTransaction}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${statusCls(r.adviceStatus)}`}
                        >
                          {r.adviceStatus}
                        </span>
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.raisedBy}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.raisedOnLabel}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold">
                        {inr(r.adviceAmount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.generationDateLabel}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.acceptedDateLabel}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="border border-slate-200 px-3 py-10 text-center text-slate-500"
                      >
                        No Debit Advice records for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={printSelected}
                className="h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb]"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
