"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronDown } from "lucide-react";
import { toast } from "@/lib/toastBus";

type BillRow = {
  billNumber: string;
  manualBillNumber: string;
  billingBranch: string;
  partyCode: string;
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
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

export default function GenerateBillMrRebatePage() {
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
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

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
    if (mode === "filter" && billScope === "range" && !customer.trim() && billType === "Show All") {
      // allow empty customer (show all) like WCV "All Bills" path
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
      setSearch("");
      setStep("report");
      if (!list.length) toast.warning("No bills found for selected criteria");
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.billNumber,
        r.manualBillNumber,
        r.billingBranch,
        r.partyName,
        r.billType,
        r.generationDate,
        r.dueDate
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allPageSelected = paged.length > 0 && paged.every((r) => selected[r.billNumber]);
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const toggleAllPage = (checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      paged.forEach((r) => {
        next[r.billNumber] = checked;
      });
      return next;
    });
  };

  const continueMr = () => {
    if (!selectedCount) {
      toast.error("Select at least one bill");
      return;
    }
    toast.success(`${selectedCount} bill(s) selected for Bill MR with Rebate (demo)`);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">

      {step === "filter" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white px-3 py-2.5 flex items-center gap-2 rounded-t-xl">
            <Link
              href="/dashboard/finance/mr-entry"
              className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 inline-flex items-center justify-center"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-sm font-semibold">Generate Bill MR.</h1>
          </div>

          <div className="p-5 space-y-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                <label className="relative block">
                  <span className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                    Manual Bill Number
                  </span>
                  <textarea
                    value={manualBills}
                    onChange={(e) => setManualBills(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0171d3] resize-y"
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-500 pb-2 max-w-[160px]">
                For Multiple Bills use &apos;,&apos; separator
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadBills("manual")}
                className="h-9 px-5 rounded-md border-2 border-[#0171d3] text-[#0171d3] text-sm font-semibold hover:bg-blue-50 disabled:opacity-60 mb-1"
              >
                Submit
              </button>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">
                OR Select Bills For Preparing Bill MR
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="relative block">
                  <span className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3] z-10">
                    Enter Customer
                  </span>
                  <input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    list="mr-rebate-customers"
                    className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0171d3]"
                  />
                  <datalist id="mr-rebate-customers">
                    {customers.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </datalist>
                </label>

                <label className="relative block">
                  <span className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3] z-10">
                    Bill Type
                  </span>
                  <select
                    value={billType}
                    onChange={(e) => setBillType(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0171d3]"
                  >
                    {billTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="billScope"
                    checked={billScope === "range"}
                    onChange={() => setBillScope("range")}
                    className="mt-3 accent-[#0171d3]"
                  />
                  <div className="relative flex-1">
                    <button
                      type="button"
                      disabled={billScope !== "range"}
                      onClick={() => setShowDates((v) => !v)}
                      className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm bg-white flex items-center gap-2 text-left disabled:bg-slate-50"
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

                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
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

              <div className="flex justify-start pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void loadBills("filter")}
                  className="h-9 px-6 rounded-md border-2 border-[#0171d3] text-[#0171d3] text-sm font-semibold hover:bg-blue-50 disabled:opacity-60"
                >
                  {loading ? "Loading..." : "Submit"}
                </button>
              </div>
            </div>
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
                <h1 className="text-base font-bold text-slate-900">Generate Bill MR With Rebate</h1>
                <p className="text-[11px] text-slate-500">
                  {selectedCount} selected · {filtered.length} bill(s)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={continueMr}
              className="h-9 px-4 rounded-md bg-[#0171d3] text-white text-sm font-semibold hover:bg-[#015fae]"
            >
              Prepare MR
            </button>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 text-[12px]">
              <label className="inline-flex items-center gap-2 text-slate-700">
                Show
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 px-1 border border-slate-300 rounded bg-white"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                entries
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700">
                Search:
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-7 px-2 border border-slate-300 rounded w-[180px]"
                />
              </label>
            </div>

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

            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-slate-200 text-[12px]">
              <span className="text-slate-600">
                Showing {(page - 1) * pageSize + (filtered.length ? 1 : 0)} to{" "}
                {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 border border-slate-300 rounded bg-white disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                  .map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`h-7 min-w-[28px] px-1.5 border rounded ${
                        n === page
                          ? "bg-[#0171d3] border-[#0171d3] text-white"
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
                  className="h-7 px-2 border border-slate-300 rounded bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
