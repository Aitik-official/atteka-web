"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toastBus";

type DocketRow = {
  docketNo: string;
  docketDate: string;
  customer: string;
  fromLocation: string;
  toLocation: string;
  actualChargeWt: string;
  packageNo: number;
  payBasis: string;
};

type DateMode = "range" | "today" | "last7";
type SearchMode = "date" | "docket";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function todayLongLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

export default function PaidTopayMrPage() {
  const today = useMemo(() => toInputDate(new Date()), []);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [searchMode, setSearchMode] = useState<SearchMode>("date");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [docketNo, setDocketNo] = useState("");
  const [rows, setRows] = useState<DocketRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchMode !== "date") return;
    if (dateMode === "today") {
      setFromDate(today);
      setToDate(today);
    } else if (dateMode === "last7") {
      setFromDate(toInputDate(daysAgo(6)));
      setToDate(today);
    }
  }, [dateMode, searchMode, today]);

  const resolveDates = () => {
    if (dateMode === "today") return { from: today, to: today };
    if (dateMode === "last7") return { from: toInputDate(daysAgo(6)), to: today };
    return { from: fromDate, to: toDate };
  };

  const loadReport = async () => {
    if (searchMode === "docket" && !docketNo.trim()) {
      toast.error("Enter Docket No.");
      return;
    }
    setLoading(true);
    try {
      const { from, to } = resolveDates();
      const params = new URLSearchParams({
        mode: searchMode,
        from,
        to,
        docketNo: docketNo.trim()
      });
      const res = await fetch(`/api/finance/paid-topay-mr?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load dockets");
        return;
      }
      setRows(data.data || []);
      setSelected({});
      setStep("report");
      if (!(data.data || []).length) toast.warning("No dockets found for selected criteria");
    } catch {
      toast.error("Failed to load Paid/Topay dockets");
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = rows.length > 0 && rows.every((r) => selected[r.docketNo]);

  const prepareMr = () => {
    if (!selectedCount) {
      toast.error("Select at least one docket");
      return;
    }
    toast.success(`${selectedCount} docket(s) selected for Paid/Topay MR (demo)`);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Selection Document Date
          </div>

          <table className="w-full text-[12px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-[180px] align-top bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
                  Select Document Date
                </td>
                <td className="px-3 py-3 space-y-2.5">
                  <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="searchModeDate"
                      checked={searchMode === "date" && dateMode === "range"}
                      onChange={() => {
                        setSearchMode("date");
                        setDateMode("range");
                      }}
                      className="accent-[#0171d3]"
                    />
                    <span>From :</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setSearchMode("date");
                        setDateMode("range");
                        setFromDate(e.target.value);
                      }}
                      className="h-7 px-2 border border-slate-300 rounded-sm bg-white"
                    />
                    <span>To :</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setSearchMode("date");
                        setDateMode("range");
                        setToDate(e.target.value);
                      }}
                      className="h-7 px-2 border border-slate-300 rounded-sm bg-white"
                    />
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="searchModeDate"
                      checked={searchMode === "date" && dateMode === "today"}
                      onChange={() => {
                        setSearchMode("date");
                        setDateMode("today");
                      }}
                      className="accent-[#0171d3]"
                    />
                    <span>Todays - {todayLongLabel()}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="searchModeDate"
                      checked={searchMode === "date" && dateMode === "last7"}
                      onChange={() => {
                        setSearchMode("date");
                        setDateMode("last7");
                      }}
                      className="accent-[#0171d3]"
                    />
                    <span>Last 7 Days</span>
                  </label>
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td className="align-middle bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
                  Enter Docket No.
                </td>
                <td className="px-3 py-3">
                  <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="searchModeDate"
                      checked={searchMode === "docket"}
                      onChange={() => setSearchMode("docket")}
                      className="accent-[#0171d3]"
                    />
                    <input
                      value={docketNo}
                      onChange={(e) => {
                        setSearchMode("docket");
                        setDocketNo(e.target.value);
                      }}
                      onFocus={() => setSearchMode("docket")}
                      placeholder="ALC12608000"
                      className="h-8 min-w-[220px] px-2 border border-slate-300 rounded-sm bg-white"
                    />
                  </label>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-center py-4 bg-slate-50/40">
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadReport()}
              className="h-9 min-w-[100px] px-6 rounded-md border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-60"
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="space-y-3">
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
                <h1 className="text-base font-bold text-slate-900">Generate Paid/Topay MR.</h1>
                <p className="text-[11px] text-slate-500">
                  {selectedCount} selected · {rows.length} docket(s)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={prepareMr}
              className="h-9 px-4 rounded-md bg-[#0171d3] text-white text-sm font-semibold hover:bg-[#015fae]"
            >
              Prepare MR
            </button>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[980px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#015fae] px-2 py-1.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const next: Record<string, boolean> = {};
                          rows.forEach((r) => {
                            next[r.docketNo] = checked;
                          });
                          setSelected(next);
                        }}
                        className="accent-white"
                      />
                    </th>
                    {[
                      "Docket No.",
                      "Docket Date",
                      "Customer",
                      "From Location",
                      "To Location",
                      "Actual Wt. / Charge Wt.",
                      "Package No."
                    ].map((h) => (
                      <th
                        key={h}
                        className="border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.docketNo} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/40">
                      <td className="border border-slate-200 px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={!!selected[r.docketNo]}
                          onChange={(e) =>
                            setSelected((prev) => ({ ...prev, [r.docketNo]: e.target.checked }))
                          }
                          className="accent-[#0171d3]"
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono">
                        {r.docketNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.docketDate}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.customer}</td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.fromLocation}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.toLocation}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono">
                        {r.actualChargeWt}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap text-center">
                        {r.packageNo}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No dockets to display.
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
