"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

type Props = {
  onBack: () => void;
};

export function RouteCostMasterPanel({ onBack }: Props) {
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
  const [submitted, setSubmitted] = useState<{ month: string; week: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const weeks = useMemo(
    () => ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!month || !week) {
      setFeedback({ type: "error", message: "Select both Months and Weeks." });
      setSubmitted(null);
      return;
    }
    setFeedback({
      type: "success",
      message: `Selection applied: ${month} · ${week}`
    });
    setSubmitted({ month, week });
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Route Cost Master" />
          <p className="text-xs text-slate-500 mt-1">Admin · Operations · Route Cost Master</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          ← Operations
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden max-w-xl mx-auto"
      >
        <div className="px-4 py-3 bg-blue-600 text-white text-sm font-bold tracking-wide text-center sm:text-left">
          Selection Months and Weeks
        </div>

        <div className="p-6 sm:p-8 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-[88px_1fr] items-center gap-2 sm:gap-4">
            <label className="font-semibold text-slate-700">Months</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-400"
            >
              <option value="">---select---</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[88px_1fr] items-center gap-2 sm:gap-4">
            <label className="font-semibold text-slate-700">Weeks</label>
            <select
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-400"
            >
              <option value="">---select---</option>
              {weeks.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              className="min-w-[100px] px-6 py-2 text-sm font-bold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Submit
            </button>
          </div>
        </div>
      </form>

      {submitted && (
        <div className="max-w-xl mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
          Route cost period locked to <span className="font-bold text-slate-800">{submitted.month}</span> /{" "}
          <span className="font-bold text-slate-800">{submitted.week}</span>. Cost matrix entry for this period can be
          extended here later.
        </div>
      )}
    </div>
  );
}
