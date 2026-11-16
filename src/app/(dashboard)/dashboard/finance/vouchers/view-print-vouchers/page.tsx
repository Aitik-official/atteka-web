"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Eye,
  Printer,
  Table2
} from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";
import { ListToolbar } from "@/components/common/ListToolbar";
import { EmptyState, TableEmptyRow } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/TableSkeleton";

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

const COLS = [
  { key: "srNo", label: "Sr No" },
  { key: "voucherNumber", label: "Voucher Number" },
  { key: "voucherDate", label: "Voucher Date" },
  { key: "branch", label: "Branch" },
  { key: "payTo", label: "Pay To" },
  { key: "totalAccountedAmount", label: "Total Accounted Amount" },
  { key: "view", label: "view" }
] as const;

type ColKey = (typeof COLS)[number]["key"];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function fmtAmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

export default function ViewPrintVouchersPage() {
  const today = useMemo(() => toInputDate(new Date()), []);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [showDates, setShowDates] = useState(false);
  const [voucherType, setVoucherType] = useState("");
  const [voucherNumber, setVoucherNumber] = useState("");
  const [voucherTypes, setVoucherTypes] = useState<string[]>([]);
  const [rows, setRows] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState("");
  const [cardView, setCardView] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>(
    Object.fromEntries(COLS.map((c) => [c.key, true])) as Record<ColKey, boolean>
  );
  const [colFilters, setColFilters] = useState<Record<string, string>>(
    Object.fromEntries(COLS.map((c) => [c.key, ""]))
  );
  const [viewDetail, setViewDetail] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const openView = async (voucherNumber: string) => {
    setViewLoading(true);
    try {
      const res = await fetch(
        `/api/finance/view-print-vouchers?detail=1&voucherNumber=${encodeURIComponent(voucherNumber)}`
      );
      const data = await res.json();
      if (!res.ok || !data.data) {
        toast.error(data.error || "Voucher not found");
        return;
      }
      setViewDetail(data.data);
    } catch {
      toast.error("Failed to load voucher");
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/finance/view-print-vouchers?lists=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVoucherTypes(d.data?.voucherTypes || []);
      })
      .catch(() => {});
  }, []);

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadRows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        voucherType,
        voucherNumber: voucherNumber.trim()
      });
      const res = await fetch(`/api/finance/view-print-vouchers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load vouchers");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setTableSearch("");
      setStep("report");
      if (!(data.data || []).length) toast.warning("No vouchers found");
    } catch {
      toast.error("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...rows];
    const q = tableSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.voucherNumber.toLowerCase().includes(q) ||
          r.payTo.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q) ||
          r.voucherDate.toLowerCase().includes(q)
      );
    }
    const f = colFilters;
    if (f.srNo.trim()) list = list.filter((r) => String(r.srNo).includes(f.srNo.trim()));
    if (f.voucherNumber.trim())
      list = list.filter((r) =>
        r.voucherNumber.toLowerCase().includes(f.voucherNumber.trim().toLowerCase())
      );
    if (f.voucherDate.trim())
      list = list.filter((r) =>
        r.voucherDate.toLowerCase().includes(f.voucherDate.trim().toLowerCase())
      );
    if (f.branch.trim())
      list = list.filter((r) => r.branch.toLowerCase().includes(f.branch.trim().toLowerCase()));
    if (f.payTo.trim())
      list = list.filter((r) => r.payTo.toLowerCase().includes(f.payTo.trim().toLowerCase()));
    if (f.totalAccountedAmount.trim())
      list = list.filter((r) =>
        String(r.totalAccountedAmount).includes(f.totalAccountedAmount.trim())
      );
    return list;
  }, [rows, tableSearch, colFilters]);

  const amountSum = useMemo(
    () => filtered.reduce((s, r) => s + Number(r.totalAccountedAmount || 0), 0),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const fromEntry = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toEntry = Math.min(page * pageSize, filtered.length);
  const col = (key: ColKey) => visibleCols[key] !== false;

  const setFilter = (key: string, value: string) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const exportExcel = () => {
    const headers = [
      "Sr No",
      "Voucher Number",
      "Voucher Date",
      "Branch",
      "Pay To",
      "Total Accounted Amount"
    ];
    const body = filtered.map((r, idx) => [
      idx + 1,
      r.voucherNumber,
      r.voucherDate,
      r.branch,
      r.payTo,
      r.totalAccountedAmount
    ]);
    const csv = [headers, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ViewPrintBills_${toInputDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel downloaded");
  };

  const copyTable = async () => {
    const text = filtered
      .map(
        (r, idx) =>
          `${idx + 1}\t${r.voucherNumber}\t${r.voucherDate}\t${r.branch}\t${r.payTo}\t${r.totalAccountedAmount}`
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied voucher rows");
    } catch {
      toast.error("Unable to copy");
    }
  };

  return (
    <div className="space-y-4 pb-16 max-w-7xl mx-auto">
      {step === "filter" && (
        <div className="min-h-[55vh] flex items-start justify-center pt-10 px-4">
          <div className="w-full max-w-md space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Voucher Date</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDates((v) => !v)}
                  className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-left bg-white flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="flex-1 truncate text-slate-700">{dateRangeLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {showDates && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-3 space-y-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">From</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full h-9 px-2 border border-slate-200 rounded-md text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">To</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full h-9 px-2 border border-slate-200 rounded-md text-xs mt-0.5"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDates(false)}
                      className="w-full h-8 bg-blue-600 text-white text-xs font-semibold rounded-md"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            <select
              value={voucherType}
              onChange={(e) => setVoucherType(e.target.value)}
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 bg-white"
            >
              <option value="">Select Voucher Type</option>
              {voucherTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <input
              value={voucherNumber}
              onChange={(e) => setVoucherNumber(e.target.value.toUpperCase())}
              placeholder="Voucher Number"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400"
            />

            <button
              type="button"
              disabled={loading}
              onClick={loadRows}
              className="w-11 h-11 rounded-md bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center disabled:opacity-50"
            >
              <Table2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === "report" && (
        <div data-print-root className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#1e88e5] text-white px-4 py-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h2 className="text-sm font-semibold tracking-wide">View / Print Bills</h2>
          </div>

          <ListToolbar
            title="View / Print Vouchers"
            columns={COLS.map((c) => ({ key: c.key, label: c.label }))}
            visibleCols={visibleCols}
            onToggleColumn={(key) =>
              setVisibleCols((prev) => ({ ...prev, [key]: !prev[key as ColKey] }))
            }
            onCopy={copyTable}
            onExcel={exportExcel}
            onPrint={() => printScoped()}
            cardView={cardView}
            onToggleCardView={() => setCardView((v) => !v)}
            search={tableSearch}
            onSearchChange={(v) => {
              setTableSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search vouchers…"
            right={
              <label className="text-xs text-slate-600 inline-flex items-center gap-1.5">
                Show
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 px-2 border border-slate-200 rounded-md"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            }
          />

          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : !cardView ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1000px]">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {COLS.map(
                      (c) =>
                        col(c.key) && (
                          <th key={c.key} className="py-2 px-3 whitespace-nowrap">
                            {c.label}
                          </th>
                        )
                    )}
                  </tr>
                  <tr className="bg-white font-normal">
                    {COLS.map(
                      (c) =>
                        col(c.key) && (
                          <th key={`f-${c.key}`} className="px-2 pb-2">
                            {c.key === "view" ? (
                              <input
                                disabled
                                placeholder="Search view"
                                className="w-full h-8 px-2 border border-blue-200 rounded text-[11px] bg-slate-50"
                              />
                            ) : c.key === "totalAccountedAmount" ? (
                              <input
                                value={colFilters.totalAccountedAmount || String(amountSum)}
                                onChange={(e) => setFilter("totalAccountedAmount", e.target.value)}
                                className="w-full h-8 px-2 border border-blue-200 rounded text-[11px] font-mono"
                              />
                            ) : (
                              <input
                                value={colFilters[c.key]}
                                onChange={(e) => setFilter(c.key, e.target.value)}
                                placeholder={`Search ${c.label}`}
                                className="w-full h-8 px-2 border border-blue-200 rounded text-[11px]"
                              />
                            )}
                          </th>
                        )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <TableEmptyRow
                      colSpan={7}
                      title="No vouchers found"
                      description="Try a wider date range, or create a debit voucher."
                      actionLabel="New Debit Voucher"
                      actionHref="/dashboard/finance/vouchers/debit-voucher"
                    />
                  ) : (
                    paged.map((r, idx) => (
                      <tr key={r.voucherNumber} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/40">
                        {col("srNo") && (
                          <td className="py-2.5 px-3 font-mono">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                        )}
                        {col("voucherNumber") && (
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {r.voucherNumber}
                          </td>
                        )}
                        {col("voucherDate") && (
                          <td className="py-2.5 px-3 whitespace-nowrap">{r.voucherDate}</td>
                        )}
                        {col("branch") && <td className="py-2.5 px-3 font-mono">{r.branch}</td>}
                        {col("payTo") && (
                          <td className="py-2.5 px-3 max-w-[260px] truncate" title={r.payTo}>
                            {r.payTo}
                          </td>
                        )}
                        {col("totalAccountedAmount") && (
                          <td className="py-2.5 px-3 font-mono text-right">
                            {fmtAmt(r.totalAccountedAmount)}
                          </td>
                        )}
                        {col("view") && (
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => void openView(r.voucherNumber)}
                              className="inline-flex items-center gap-1 text-blue-600 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paged.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    compact
                    title="No vouchers found"
                    description="Try a wider date range, or create a debit voucher."
                    actionLabel="New Debit Voucher"
                    actionHref="/dashboard/finance/vouchers/debit-voucher"
                  />
                </div>
              ) : (
                paged.map((r) => (
                  <div key={r.voucherNumber} className="border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                    <div className="font-mono font-bold text-blue-700">{r.voucherNumber}</div>
                    <div className="font-medium truncate">{r.payTo}</div>
                    <div className="text-slate-500">
                      {r.voucherDate} · {r.branch}
                    </div>
                    <div className="font-mono font-semibold">{fmtAmt(r.totalAccountedAmount)}</div>
                    <button
                      type="button"
                      onClick={() => void openView(r.voucherNumber)}
                      className="text-blue-600 font-semibold"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Showing {fromEntry} to {toEntry} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {(viewDetail || viewLoading) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Voucher View</h2>
              <button
                type="button"
                onClick={() => setViewDetail(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                ×
              </button>
            </div>
            <div className="p-4 text-xs space-y-2">
              {viewLoading && !viewDetail ? (
                <p className="text-slate-400 py-6 text-center">Loading…</p>
              ) : (
                <>
                  <p>
                    <span className="font-semibold">Voucher No:</span>{" "}
                    <span className="font-mono text-blue-700">{viewDetail?.voucherNumber}</span>
                  </p>
                  <p>
                    <span className="font-semibold">Type:</span> {viewDetail?.voucherType}
                  </p>
                  <p>
                    <span className="font-semibold">Date:</span> {viewDetail?.voucherDate}
                  </p>
                  <p>
                    <span className="font-semibold">Branch:</span> {viewDetail?.branch}
                  </p>
                  <p>
                    <span className="font-semibold">Pay To:</span> {viewDetail?.payTo}
                  </p>
                  <p>
                    <span className="font-semibold">Amount:</span>{" "}
                    <span className="font-mono">
                      {fmtAmt(Number(viewDetail?.totalAccountedAmount || 0))}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Narration:</span> {viewDetail?.narration || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span> {viewDetail?.status || "Active"}
                  </p>
                </>
              )}
            </div>
            <div className="px-4 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => printScoped({ title: `Voucher ${viewDetail?.voucherNumber || ""}` })}
                className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold inline-flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                type="button"
                onClick={() => setViewDetail(null)}
                className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
