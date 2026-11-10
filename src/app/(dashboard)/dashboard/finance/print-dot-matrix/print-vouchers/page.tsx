"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "@/lib/toastBus";

type VoucherRow = {
  srNo: number;
  voucherNumber: string;
  voucherDate: string;
  voucherDateIso: string;
  voucherType: string;
  branch: string;
  payTo: string;
  totalAccountedAmount: number;
};

type DateMode = "range" | "today" | "last7";
type SearchMode = "criteria" | "number";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
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

export default function PrintVouchersDotMatrixPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [searchMode, setSearchMode] = useState<SearchMode>("criteria");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [fromDate, setFromDate] = useState(toInputDate(new Date()));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [voucherType, setVoucherType] = useState("");
  const [voucherNumber, setVoucherNumber] = useState("");
  const [voucherTypes, setVoucherTypes] = useState<string[]>([]);
  const [rows, setRows] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/finance/view-print-vouchers?lists=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVoucherTypes(d.data?.voucherTypes || []);
      })
      .catch(() => {});
  }, []);

  const resolveDates = () => {
    const today = toInputDate(new Date());
    if (dateMode === "today") return { from: today, to: today };
    if (dateMode === "last7") return { from: toInputDate(daysAgo(6)), to: today };
    return { from: fromDate, to: toDate };
  };

  const loadReport = async () => {
    if (searchMode === "number" && !voucherNumber.trim()) {
      toast.error("Enter Voucher number");
      return;
    }
    if (searchMode === "criteria" && !voucherType) {
      toast.error("Please select Voucher Type");
      return;
    }

    setLoading(true);
    try {
      const { from, to } = resolveDates();
      const params = new URLSearchParams();
      if (searchMode === "number") {
        params.set("voucherNumber", voucherNumber.trim());
      } else {
        params.set("from", from);
        params.set("to", to);
        params.set("voucherType", voucherType);
      }
      const res = await fetch(`/api/finance/view-print-vouchers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load vouchers");
        return;
      }
      setRows(data.data || []);
      setStep("report");
    } catch {
      toast.error("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const printOne = (voucherNumberValue: string) => {
    toast.success(`Voucher ${voucherNumberValue} sent to Dot-Matrix printer (demo)`);
    window.print();
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Select Voucher to View and Print
          </div>

          <div className="px-4 py-4 space-y-3 text-[12px]">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <span className="font-semibold text-slate-800 w-[130px] pt-1.5 shrink-0">Voucher Date</span>
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
                  <span>From :</span>
                  <input
                    type="date"
                    value={fromDate}
                    disabled={dateMode !== "range" || searchMode !== "criteria"}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-8 px-2 border border-slate-300 rounded-sm disabled:bg-slate-50"
                  />
                  <span>To :</span>
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

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-800 w-[130px] shrink-0">Select Voucher Type</span>
              <select
                value={voucherType}
                disabled={searchMode === "number"}
                onChange={(e) => {
                  setVoucherType(e.target.value);
                  setSearchMode("criteria");
                }}
                className="h-8 min-w-[200px] px-2 border border-slate-300 rounded-sm bg-white disabled:bg-slate-50"
              >
                <option value="">--Select--</option>
                {voucherTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center py-1">
              <span className="text-red-600 font-bold text-sm">OR</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-800 w-[130px] shrink-0">Voucher number</span>
              <label className="inline-flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="radio"
                  name="searchMode"
                  checked={searchMode === "number"}
                  onChange={() => setSearchMode("number")}
                  className="accent-[#0171d3]"
                />
                <input
                  value={voucherNumber}
                  onChange={(e) => {
                    setVoucherNumber(e.target.value.toUpperCase());
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
        <div className="space-y-3">
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
              Print Voucher [Dot-Matrix]
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[900px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    {[
                      "Sr No",
                      "Voucher Number",
                      "Voucher Date",
                      "Branch",
                      "Pay To",
                      "Total Accounted Amount",
                      "Print"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          h === "Total Accounted Amount" ? "text-right" : "text-center"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.voucherNumber}-${r.srNo}`} className="odd:bg-white even:bg-slate-50/70">
                      <td className="border border-slate-200 px-2 py-1.5 text-center">{r.srNo}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap font-semibold">
                        {r.voucherNumber}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.voucherDate}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.branch}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.payTo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold">
                        {inr(r.totalAccountedAmount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => printOne(r.voucherNumber)}
                          className="h-7 px-2.5 rounded-full border border-[#0171d3] text-[#0171d3] text-[10px] font-semibold inline-flex items-center gap-1 hover:bg-[#e8f1fb]"
                        >
                          <Printer className="w-3 h-3" />
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="border border-slate-200 px-3 py-10 text-center text-slate-500"
                      >
                        No vouchers found for selected filters.
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
