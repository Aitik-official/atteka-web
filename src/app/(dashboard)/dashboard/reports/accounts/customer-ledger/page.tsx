"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileSpreadsheet, MoreHorizontal } from "lucide-react";
import { toast } from "@/lib/toastBus";

type ClRow = {
  srNo: string;
  date: string;
  particular: string;
  voucherType: string;
  voucherRef: string;
  docRef: string;
  narration: string;
  debit: number;
  credit: number;
  balance: number;
  isOpening?: boolean;
  isPeriodTotal?: boolean;
  isClosing?: boolean;
  isGrandTotal?: boolean;
};

type Meta = {
  customerCode: string;
  customerName: string;
  customerLabel: string;
  dateRange: string;
};

type CustomerOpt = { code: string; name: string; label: string };

type DateMode = "range" | "today" | "last7";

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

function fmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

const COLUMNS = [
  { key: "srNo", label: "Sr.No" },
  { key: "date", label: "Date" },
  { key: "particular", label: "Particular" },
  { key: "voucherType", label: "Voucher Type" },
  { key: "voucherRef", label: "Voucher/Ref No." },
  { key: "docRef", label: "Doc/Ref No." },
  { key: "narration", label: "Narration" },
  { key: "debit", label: "Debit", align: "right" as const },
  { key: "credit", label: "Credit", align: "right" as const },
  { key: "balance", label: "Balance", align: "right" as const }
];

export default function CustomerLedgerPage() {
  const today = useMemo(() => toInputDate(new Date()), []);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [customer, setCustomer] = useState("CUS0002");
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [rows, setRows] = useState<ClRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/reports/customer-ledger?customers=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCustomers(d.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (dateMode === "today") {
      setFromDate(today);
      setToDate(today);
    } else if (dateMode === "last7") {
      setFromDate(toInputDate(daysAgo(6)));
      setToDate(today);
    }
  }, [dateMode, today]);

  const resolveDates = () => {
    if (dateMode === "today") return { from: today, to: today };
    if (dateMode === "last7") return { from: toInputDate(daysAgo(6)), to: today };
    return { from: fromDate, to: toDate };
  };

  const pickCustomer = () => {
    const first = customers[0];
    if (!first) {
      toast.error("No demo customers available");
      return;
    }
    const next =
      customers.find((c) => c.code !== customer) || first;
    setCustomer(next.code);
    toast.success(`Customer selected: ${next.label}`);
  };

  const loadReport = async () => {
    if (!customer.trim()) {
      toast.error("Please enter Customer");
      return;
    }
    const { from, to } = resolveDates();
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from,
        to,
        customer: customer.trim()
      });
      const res = await fetch(`/api/reports/customer-ledger?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Customer Ledger");
        return;
      }
      setRows(data.data || []);
      setMeta(data.meta || null);
      setStep("report");
    } catch {
      toast.error("Failed to load Customer Ledger");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!rows.length) {
      toast.error("No data to export");
      return;
    }
    const headers = COLUMNS.map((c) => c.label);
    const lines = rows.map((r) =>
      COLUMNS.map((c) => {
        const v = (r as any)[c.key];
        const s = typeof v === "number" ? fmt(v) : String(v ?? "");
        return `"${s.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Customer_Ledger_${customer}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to Excel / CSV");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {step === "filter" && (
        <div className="bg-white border-2 border-[#0171d3] shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Customer Ledger Report Selection Criteria
          </div>

          <div className="px-4 py-4 space-y-4 text-[12px]">
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-start">
              <div className="font-semibold text-slate-800 pt-1">Document Date</div>
              <div className="space-y-2.5">
                <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="docDate"
                    checked={dateMode === "range"}
                    onChange={() => setDateMode("range")}
                    className="accent-[#0171d3]"
                  />
                  <span>From :</span>
                  <input
                    type="date"
                    value={fromDate}
                    disabled={dateMode !== "range"}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[145px] disabled:bg-slate-100"
                  />
                  <span>To :</span>
                  <input
                    type="date"
                    value={toDate}
                    disabled={dateMode !== "range"}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[145px] disabled:bg-slate-100"
                  />
                </label>

                <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="docDate"
                    checked={dateMode === "today"}
                    onChange={() => setDateMode("today")}
                    className="accent-[#0171d3]"
                  />
                  <span>Todays - {todayLongLabel()}</span>
                </label>

                <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="docDate"
                    checked={dateMode === "last7"}
                    onChange={() => setDateMode("last7")}
                    className="accent-[#0171d3]"
                  />
                  <span>Last 7 Days</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-center border-t border-slate-200 pt-4">
              <div className="font-semibold text-slate-800">Customer</div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  list="cl-customers"
                  placeholder="CUS0001"
                  className="h-8 min-w-[180px] px-2 border border-slate-300 rounded-sm bg-white"
                />
                <datalist id="cl-customers">
                  {customers.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={pickCustomer}
                  className="h-8 w-8 rounded-full border border-slate-300 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50"
                  title="Select customer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center py-4 border-t border-slate-200">
            <button
              type="button"
              disabled={loading}
              onClick={loadReport}
              className="h-9 min-w-[100px] px-8 rounded-full border-2 border-[#0171d3] text-[#0171d3] bg-white text-sm font-semibold hover:bg-blue-50 disabled:opacity-60"
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
              <h1 className="text-base font-bold text-slate-900">Customer Ledger</h1>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="h-9 px-3 rounded-md bg-[#0171d3] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#015fae]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export To Excel
            </button>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="px-4 py-3 text-[12px] space-y-1 border-b border-slate-200 bg-[#e8f1fb]">
              <div>
                <span className="font-semibold text-slate-700">Customer : </span>
                <span>{meta?.customerLabel || customer}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Date Range : </span>
                <span>{meta?.dateRange}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1100px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    {COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          c.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const summary = r.isOpening || r.isPeriodTotal || r.isClosing || r.isGrandTotal;
                    return (
                      <tr
                        key={`${r.srNo}-${r.voucherRef}-${idx}`}
                        className={
                          r.isGrandTotal
                            ? "bg-[#0b1f3a] text-white font-bold"
                            : summary
                              ? "bg-[#5b9bd5] text-white font-semibold"
                              : "odd:bg-white even:bg-slate-50"
                        }
                      >
                        <td className="border border-slate-200 px-2 py-1 text-center whitespace-nowrap">
                          {r.srNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.date}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.particular}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.voucherType}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.voucherRef}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.docRef}</td>
                        <td className="border border-slate-200 px-2 py-1">{r.narration}</td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {fmt(r.debit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {fmt(r.credit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {r.isOpening || !summary ? fmt(r.balance) : ""}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No customer ledger rows for selected filters.
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
