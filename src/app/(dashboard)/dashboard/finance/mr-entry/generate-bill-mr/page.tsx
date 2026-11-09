"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";
import { toast } from "@/lib/toastBus";

type BillRow = {
  billNumber: string;
  manualBillNumber: string;
  billingBranch: string;
  partyName: string;
  billType: string;
  billAmount: number;
  unadjustedAmount: number;
  generationDate: string;
  dueDate: string;
};

type CustomerOpt = { code: string; name: string; label: string };

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function GenerateBillMrPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [manualBills, setManualBills] = useState("");
  const [customer, setCustomer] = useState("");
  const [billType, setBillType] = useState("Show All");
  const [billScope, setBillScope] = useState<"range" | "all">("range");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [billTypes, setBillTypes] = useState<string[]>(["Show All"]);
  const [rows, setRows] = useState<BillRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch("/api/finance/generate-bill-mr?lists=1")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setCustomers(d.data?.customers || []);
        setBillTypes(d.data?.billTypes || ["Show All"]);
      })
      .catch(() => {});
  }, []);

  const periodLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadBills = async (mode: "manual" | "filter") => {
    if (mode === "manual" && !manualBills.trim()) {
      toast.error("Enter Manual Bill Number");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode,
        manualBills: manualBills.trim(),
        customer: customer.trim(),
        billType,
        from: billScope === "all" ? "2000-01-01" : fromDate,
        to: billScope === "all" ? "2099-12-31" : toDate
      });
      const res = await fetch(`/api/finance/generate-bill-mr?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load bills");
        return;
      }
      const list: BillRow[] = data.data || [];
      setRows(list);
      setSelected({});
      setPage(1);
      setStep("report");
      if (!list.length) toast.warning("No bills found for selected criteria");
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const allPageSelected = paged.length > 0 && paged.every((r) => selected[r.billNumber]);
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const pageNumbers = useMemo(() => {
    const maxShow = 9;
    if (totalPages <= maxShow) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.min(Math.max(1, page - 4), Math.max(1, totalPages - maxShow + 1));
    return Array.from({ length: maxShow }, (_, i) => start + i).filter((n) => n <= totalPages);
  }, [page, totalPages]);

  const toggleAllPage = (checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      paged.forEach((r) => {
        next[r.billNumber] = checked;
      });
      return next;
    });
  };

  const confirmChecked = () => {
    if (!selectedCount) {
      toast.error("Select at least one bill");
      return;
    }
    toast.success(`${selectedCount} bill(s) confirmed for Generate Bill MR (demo)`);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">

      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="px-4 pt-4 pb-3 border-b border-slate-200">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Manual Bill Number
                </label>
                <textarea
                  value={manualBills}
                  onChange={(e) => setManualBills(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#0171d3]"
                />
                <p className="mt-1 text-[11px] text-red-600 font-medium">
                  For Multiple Bills use &apos;,&apos; separator
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadBills("manual")}
                className="mt-6 h-9 min-w-[88px] px-4 rounded-full bg-[#0171d3] hover:bg-[#015fae] text-white text-sm font-semibold disabled:opacity-60"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Select Bills For Preparing Bill MR
          </div>
          <div className="px-4 py-3 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Enter Customer</label>
              <div className="relative">
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  list="gen-mr-customers"
                  className="w-full h-9 pl-3 pr-9 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#0171d3]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <datalist id="gen-mr-customers">
                  {customers.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Bill Type</label>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
                className="w-full h-9 px-2 border border-slate-300 rounded-sm text-sm bg-white"
              >
                {billTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Select Bill Generation Date Range
          </div>
          <div className="px-4 py-3 space-y-3 text-[12px]">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="billScope"
                checked={billScope === "range"}
                onChange={() => setBillScope("range")}
                className="mt-2.5 accent-[#0171d3]"
              />
              <div className="relative flex-1">
                <button
                  type="button"
                  disabled={billScope !== "range"}
                  onClick={() => setShowDates((v) => !v)}
                  className="w-full h-9 px-3 border border-slate-300 rounded-sm text-sm bg-white flex items-center gap-2 text-left disabled:bg-slate-50"
                >
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate flex-1 text-slate-700">{periodLabel}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
                {showDates && billScope === "range" && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">From</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full h-9 px-2 border border-slate-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">To</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full h-9 px-2 border border-slate-300 rounded-md text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDates(false)}
                      className="col-span-2 h-8 rounded-md bg-[#0171d3] text-white text-xs font-semibold"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="billScope"
                checked={billScope === "all"}
                onChange={() => setBillScope("all")}
                className="accent-[#0171d3]"
              />
              All Bills
            </label>
          </div>

          <div className="flex justify-center py-4 border-t border-slate-200 bg-slate-50/40">
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadBills("filter")}
              className="h-9 min-w-[100px] px-6 rounded-full bg-[#0171d3] hover:bg-[#015fae] text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Loading..." : "Submit"}
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
            <div>
              <h1 className="text-base font-bold text-slate-900">Generate Bill MR.</h1>
              <p className="text-[11px] text-slate-500">
                {selectedCount} selected · {rows.length} bill(s)
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1100px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#015fae] px-2 py-1.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={(e) => toggleAllPage(e.target.checked)}
                        className="accent-white"
                      />
                    </th>
                    {[
                      "Bill Number",
                      "Manual Bill Number",
                      "Billing Branch",
                      "Party Name",
                      "Bill Type",
                      "Bill Amount",
                      "Unadjusted Amount",
                      "Generation Date",
                      "Due Date"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          h.includes("Amount") ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr key={r.billNumber} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/40">
                      <td className="border border-slate-200 px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={!!selected[r.billNumber]}
                          onChange={(e) =>
                            setSelected((prev) => ({ ...prev, [r.billNumber]: e.target.checked }))
                          }
                          className="accent-[#0171d3]"
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono">
                        {r.billNumber}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono">
                        {r.manualBillNumber}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.billingBranch}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.partyName}</td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.billType}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono whitespace-nowrap">
                        {fmt(r.billAmount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono whitespace-nowrap">
                        {fmt(r.unadjustedAmount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.generationDate}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.dueDate}</td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={10} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No bills to display.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 border-t border-slate-200 text-[12px]">
              <button
                type="button"
                onClick={confirmChecked}
                className="text-[#0171d3] font-semibold hover:underline"
              >
                Click Here to Confirm the Check bills
              </button>

              <div className="flex items-center gap-1">
                <span className="text-slate-600 mr-1">Page:</span>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center disabled:opacity-40"
                  title="First"
                >
                  <ChevronFirst className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center disabled:opacity-40"
                  title="Previous"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`h-7 min-w-[28px] px-1.5 border rounded font-semibold ${
                      n === page
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "bg-white border-slate-300 text-slate-700"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center disabled:opacity-40"
                  title="Next"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                  className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center disabled:opacity-40"
                  title="Last"
                >
                  <ChevronLast className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
