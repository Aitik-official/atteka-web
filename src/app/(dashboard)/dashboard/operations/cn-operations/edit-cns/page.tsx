"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toastBus";

type FilterMode = "range" | "today" | "last7" | "cnno";

type Row = {
  id: string;
  cnNo: string;
  labelsGenDate: string;
  origin: string;
  destination: string;
  totalPackages: number;
  volumetric: string;
  codDod: string;
  dacc: string;
  mode: string;
  h4: string;
  serviceType: string;
  nonHpConsignor: string;
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayLong() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

export default function EditCnsPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [filterMode, setFilterMode] = useState<FilterMode>("today");
  const [fromDate, setFromDate] = useState(toInputDate(new Date()));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [cnNo, setCnNo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");

  const todayLabel = useMemo(() => `Todays - ${todayLong()}`, []);

  const showCns = async () => {
    if (filterMode === "cnno" && !cnNo.trim()) {
      toast.error("Enter CN No");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: filterMode,
        from: fromDate,
        to: toDate,
        cnNo: cnNo.trim()
      });
      const res = await fetch(`/api/operations/edit-cns?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load pending CNs");
        return;
      }
      setRows(data.data || []);
      setSource(data.source || "");
      setStep("report");
    } catch {
      toast.error("Failed to load pending CNs");
    } finally {
      setLoading(false);
    }
  };

  const radioCls = "accent-[#0171d3] w-4 h-4";

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="max-w-xl mx-auto">
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-sm">
            <div className="bg-[#0171d3] px-4 py-2.5">
              <h1 className="text-white text-sm font-bold tracking-wide">Select CN Date</h1>
            </div>

            <div className="px-5 py-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="cnDateMode"
                  className={`${radioCls} mt-1`}
                  checked={filterMode === "range"}
                  onChange={() => setFilterMode("range")}
                />
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-slate-700 font-medium w-12">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setFilterMode("range");
                    }}
                    className="h-9 px-2 border border-slate-300 rounded-sm text-[13px] bg-white"
                  />
                  <span className="text-[13px] text-slate-700 font-medium w-8">To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setFilterMode("range");
                    }}
                    className="h-9 px-2 border border-slate-300 rounded-sm text-[13px] bg-white"
                  />
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="cnDateMode"
                  className={radioCls}
                  checked={filterMode === "today"}
                  onChange={() => setFilterMode("today")}
                />
                <span className="text-[13px] text-slate-800">{todayLabel}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="cnDateMode"
                  className={radioCls}
                  checked={filterMode === "last7"}
                  onChange={() => setFilterMode("last7")}
                />
                <span className="text-[13px] text-slate-800">Last 7 Days</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="cnDateMode"
                  className={radioCls}
                  checked={filterMode === "cnno"}
                  onChange={() => setFilterMode("cnno")}
                />
                <span className="text-[13px] text-slate-800 w-14">CN No</span>
                <input
                  value={cnNo}
                  onChange={(e) => {
                    setCnNo(e.target.value.toUpperCase());
                    setFilterMode("cnno");
                  }}
                  onFocus={() => setFilterMode("cnno")}
                  className="h-9 flex-1 px-3 border border-slate-300 rounded-sm text-[13px] font-mono"
                  placeholder="Enter CN No"
                />
              </label>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void showCns()}
                  className="h-9 min-w-[120px] px-6 rounded-full bg-[#0171d3] text-white text-sm font-semibold hover:bg-[#0159a8] disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Show CNs"}
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-[#0171d3] text-sm font-semibold mt-4">List of the Pending CNs</p>
        </div>
      )}

      {step === "report" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <h2 className="text-sm font-bold text-slate-800">List of the Pending CNs</h2>
            <span className="text-xs text-slate-500">
              {rows.length} record(s){source ? ` · ${source}` : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  <th rowSpan={2} className="px-3 py-2 text-left font-semibold border border-[#0a5fad] whitespace-nowrap">
                    CN No
                  </th>
                  <th rowSpan={2} className="px-3 py-2 text-left font-semibold border border-[#0a5fad] whitespace-nowrap">
                    Labels Gen. Date
                  </th>
                  <th rowSpan={2} className="px-3 py-2 text-left font-semibold border border-[#0a5fad] whitespace-nowrap">
                    Origin
                  </th>
                  <th rowSpan={2} className="px-3 py-2 text-left font-semibold border border-[#0a5fad] whitespace-nowrap">
                    Destination
                  </th>
                  <th rowSpan={2} className="px-3 py-2 text-right font-semibold border border-[#0a5fad] whitespace-nowrap">
                    Total Packages
                  </th>
                  <th colSpan={7} className="px-3 py-2 text-center font-semibold border border-[#0a5fad]">
                    Services
                  </th>
                </tr>
                <tr className="bg-[#0171d3] text-white">
                  <th className="px-2 py-1.5 text-center font-semibold border border-[#0a5fad] whitespace-nowrap">
                    Volumetric
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold border border-[#0a5fad] whitespace-nowrap">
                    COD/DOD
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold border border-[#0a5fad] whitespace-nowrap">
                    DACC
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold border border-[#0a5fad] whitespace-nowrap">
                    Mode
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold border border-[#0a5fad] whitespace-nowrap">
                    H4
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold border border-[#0a5fad] whitespace-nowrap">
                    Service Type
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold border border-[#0a5fad] whitespace-nowrap">
                    Non HP Consignor
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-slate-500 border border-slate-200">
                      No pending CNs found for selected criteria
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-3 py-2 border border-slate-200 whitespace-nowrap">
                        <Link
                          href={`/dashboard/operations/dockets?action=edit&docket=${encodeURIComponent(r.cnNo)}`}
                          className="text-[#0171d3] font-semibold hover:underline"
                        >
                          {r.cnNo}
                        </Link>
                      </td>
                      <td className="px-3 py-2 border border-slate-200 whitespace-nowrap text-slate-700">
                        {r.labelsGenDate}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 whitespace-nowrap text-slate-700">
                        {r.origin}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 whitespace-nowrap text-slate-700">
                        {r.destination}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 text-right text-slate-700">
                        {r.totalPackages}
                      </td>
                      <td className="px-2 py-2 border border-slate-200 text-center">{r.volumetric}</td>
                      <td className="px-2 py-2 border border-slate-200 text-center">{r.codDod}</td>
                      <td className="px-2 py-2 border border-slate-200 text-center">{r.dacc}</td>
                      <td className="px-2 py-2 border border-slate-200 text-center">{r.mode}</td>
                      <td className="px-2 py-2 border border-slate-200 text-center">{r.h4}</td>
                      <td className="px-2 py-2 border border-slate-200 text-center">{r.serviceType}</td>
                      <td className="px-2 py-2 border border-slate-200 text-center">{r.nonHpConsignor}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
