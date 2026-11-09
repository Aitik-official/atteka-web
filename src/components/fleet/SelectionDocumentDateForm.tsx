"use client";

import React, { useEffect, useMemo, useState } from "react";

export type DateMode = "range" | "today" | "last7";
export type SearchMode = "dateVehicle" | "document";

export type DocumentDateFilter = {
  dateMode: DateMode;
  searchMode: SearchMode;
  fromDate: string;
  toDate: string;
  vehicleNo: string;
  documentNo: string;
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatLongToday(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

type Props = {
  vehicleLabel?: string;
  vehicles?: string[];
  /** When false, only date + document no. (View Print Trip Settlement) */
  showVehicle?: boolean;
  onSubmit: (filter: DocumentDateFilter) => void;
};

export function SelectionDocumentDateForm({
  vehicleLabel = "Enter Vehicle No.",
  vehicles = [],
  showVehicle = true,
  onSubmit
}: Props) {
  const today = useMemo(() => new Date(), []);
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [searchMode, setSearchMode] = useState<SearchMode>("dateVehicle");
  const [fromDate, setFromDate] = useState(toInputDate(today));
  const [toDate, setToDate] = useState(toInputDate(today));
  const [vehicleNo, setVehicleNo] = useState("Show all");
  const [documentNo, setDocumentNo] = useState("");

  useEffect(() => {
    if (dateMode === "today") {
      const t = toInputDate(new Date());
      setFromDate(t);
      setToDate(t);
    } else if (dateMode === "last7") {
      setFromDate(toInputDate(daysAgo(6)));
      setToDate(toInputDate(new Date()));
    }
  }, [dateMode]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ dateMode, searchMode, fromDate, toDate, vehicleNo, documentNo });
      }}
      className="bg-white border border-slate-300 shadow-sm"
    >
      <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">Selection Document Date</div>

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
                  name="dateMode"
                  checked={dateMode === "range" && searchMode === "dateVehicle"}
                  onChange={() => {
                    setSearchMode("dateVehicle");
                    setDateMode("range");
                  }}
                  className="accent-[#0171d3]"
                />
                <span className="text-slate-700">From :</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setSearchMode("dateVehicle");
                    setDateMode("range");
                    setFromDate(e.target.value);
                  }}
                  className="h-7 px-2 border border-slate-300 rounded-sm bg-white"
                />
                <span className="text-slate-700 ml-1">To :</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setSearchMode("dateVehicle");
                    setDateMode("range");
                    setToDate(e.target.value);
                  }}
                  className="h-7 px-2 border border-slate-300 rounded-sm bg-white"
                />
                <span className="text-[10px] text-slate-400 font-mono">
                  ({formatDisplayDate(fromDate)} – {formatDisplayDate(toDate)})
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateMode"
                  checked={dateMode === "today" && searchMode === "dateVehicle"}
                  onChange={() => {
                    setSearchMode("dateVehicle");
                    setDateMode("today");
                  }}
                  className="accent-[#0171d3]"
                />
                <span className="text-slate-800">Todays - {formatLongToday(today)}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateMode"
                  checked={dateMode === "last7" && searchMode === "dateVehicle"}
                  onChange={() => {
                    setSearchMode("dateVehicle");
                    setDateMode("last7");
                  }}
                  className="accent-[#0171d3]"
                />
                <span className="text-slate-800">Last 7 Days</span>
              </label>
            </td>
          </tr>

          {showVehicle && (
            <tr className="border-b border-slate-200">
              <td className="align-middle bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
                {vehicleLabel}
              </td>
              <td className="px-3 py-3">
                <select
                  value={vehicleNo}
                  onChange={(e) => {
                    setSearchMode("dateVehicle");
                    setVehicleNo(e.target.value);
                  }}
                  className="h-8 min-w-[220px] px-2 border border-slate-300 rounded-sm bg-white"
                >
                  <option value="Show all">Show all</option>
                  {vehicles.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          )}

          {showVehicle && (
            <tr className="border-b border-slate-200">
              <td colSpan={2} className="bg-white text-center py-2">
                <span className="inline-block text-[#0171d3] font-bold text-sm tracking-wide">OR</span>
              </td>
            </tr>
          )}

          <tr>
            <td className="align-middle bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
              Enter Document No.
            </td>
            <td className="px-3 py-3">
              <label className="inline-flex items-center gap-2 w-full max-w-xl">
                <input
                  type="radio"
                  name="searchMode"
                  checked={searchMode === "document"}
                  onChange={() => setSearchMode("document")}
                  className="accent-[#0171d3]"
                />
                <input
                  type="text"
                  value={documentNo}
                  onChange={(e) => {
                    setSearchMode("document");
                    setDocumentNo(e.target.value.toUpperCase());
                  }}
                  onFocus={() => setSearchMode("document")}
                  className="h-8 flex-1 px-2 border border-slate-300 rounded-sm uppercase font-mono"
                />
              </label>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-center py-4 border-t border-slate-200 bg-slate-50/60">
        <button
          type="submit"
          className="min-w-[110px] h-9 px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] font-semibold text-sm hover:bg-[#e8f1fb] shadow-sm"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
