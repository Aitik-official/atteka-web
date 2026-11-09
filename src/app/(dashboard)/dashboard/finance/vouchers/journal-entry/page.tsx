"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Columns3,
  Copy,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Plus,
  Printer,
  Search,
  Table2
} from "lucide-react";
import { toast } from "@/lib/toastBus";

type JournalRow = {
  srNo: number;
  voucherNumber: string;
  voucherDate: string;
  voucherDateIso: string;
  voucherType: string;
  docRefNo: string;
  branch: string;
  payTo: string;
  totalAccountedAmount: number;
  narration: string;
  entryBy: string;
  entryDt: string;
  status: "Active" | "Cancelled";
};

type AccountOpt = { code: string; name: string; group: string };

type Line = {
  id: string;
  particular: string;
  accountGroup: string;
  openDebit: number;
  openCredit: number;
  debit: number;
  credit: number;
};

const COLS = [
  { key: "srNo", label: "Sr No" },
  { key: "voucherNumber", label: "Voucher Number" },
  { key: "voucherDate", label: "Voucher Date" },
  { key: "docRefNo", label: "Doc/ref No." },
  { key: "branch", label: "Branch" },
  { key: "payTo", label: "Pay To" },
  { key: "totalAccountedAmount", label: "Total Accounted Amount" },
  { key: "narration", label: "Narration" },
  { key: "entryBy", label: "Entry By" },
  { key: "entryDt", label: "Entry Dt." }
] as const;

type ColKey = (typeof COLS)[number]["key"];

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
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function fmtAmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function emptyLine(): Line {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    particular: "",
    accountGroup: "",
    openDebit: 0,
    openCredit: 0,
    debit: 0,
    credit: 0
  };
}

export default function JournalEntryPage() {
  const [step, setStep] = useState<"filter" | "report" | "form">("filter");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(6)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [voucherType, setVoucherType] = useState("");
  const [voucherNumber, setVoucherNumber] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [voucherTypes, setVoucherTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<AccountOpt[]>([]);
  const [rows, setRows] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState("");
  const [cardView, setCardView] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>(
    Object.fromEntries(COLS.map((c) => [c.key, true])) as Record<ColKey, boolean>
  );
  const [colFilters, setColFilters] = useState<Record<string, string>>(
    Object.fromEntries(COLS.map((c) => [c.key, ""]))
  );

  const [voucherDate, setVoucherDate] = useState(toInputDate(new Date()));
  const [preparedAt] = useState("ALC1 : Ateka Logistics");
  const [preparedBy] = useState("AL002 : ANISHA OZARKAR");
  const [refNo, setRefNo] = useState("");
  const [refDate, setRefDate] = useState(toInputDate(new Date()));
  const [location, setLocation] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);

  useEffect(() => {
    fetch("/api/finance/journal-entry?lists=1")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setVoucherTypes(d.data?.voucherTypes || []);
        setLocations(d.data?.locations || []);
        setAccounts(d.data?.accounts || []);
      })
      .catch(() => {});
  }, []);

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const lineTotals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const credit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    return {
      debit: Number(debit.toFixed(2)),
      credit: Number(credit.toFixed(2)),
      difference: Number((debit - credit).toFixed(2))
    };
  }, [lines]);

  const loadRows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        voucherType,
        voucherNumber: voucherNumber.trim(),
        documentNumber: documentNumber.trim()
      });
      const res = await fetch(`/api/finance/journal-entry?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load journals");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setTableSearch("");
      setStep("report");
      if (!(data.data || []).length) toast.warning("No journals found");
    } catch {
      toast.error("Failed to load journals");
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
          r.docRefNo.toLowerCase().includes(q) ||
          r.payTo.toLowerCase().includes(q) ||
          r.narration.toLowerCase().includes(q) ||
          r.entryBy.toLowerCase().includes(q)
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
    if (f.docRefNo.trim())
      list = list.filter((r) => r.docRefNo.toLowerCase().includes(f.docRefNo.trim().toLowerCase()));
    if (f.branch.trim())
      list = list.filter((r) => r.branch.toLowerCase().includes(f.branch.trim().toLowerCase()));
    if (f.payTo.trim())
      list = list.filter((r) => r.payTo.toLowerCase().includes(f.payTo.trim().toLowerCase()));
    if (f.totalAccountedAmount.trim())
      list = list.filter((r) => String(r.totalAccountedAmount).includes(f.totalAccountedAmount.trim()));
    if (f.narration.trim())
      list = list.filter((r) =>
        r.narration.toLowerCase().includes(f.narration.trim().toLowerCase())
      );
    if (f.entryBy.trim())
      list = list.filter((r) => r.entryBy.toLowerCase().includes(f.entryBy.trim().toLowerCase()));
    if (f.entryDt.trim())
      list = list.filter((r) => r.entryDt.toLowerCase().includes(f.entryDt.trim().toLowerCase()));
    return list;
  }, [rows, tableSearch, colFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const fromEntry = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toEntry = Math.min(page * pageSize, filtered.length);
  const col = (key: ColKey) => visibleCols[key] !== false;

  const setFilter = (key: string, value: string) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const openNew = () => {
    setVoucherDate(toInputDate(new Date()));
    setRefNo("");
    setRefDate(toInputDate(new Date()));
    setLocation("");
    setPaidTo("");
    setNarration("");
    setLines([emptyLine(), emptyLine()]);
    setStep("form");
  };

  const updateLine = (id: string, patch: Partial<Line>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...patch };
        if (patch.particular !== undefined) {
          const acc = accounts.find((a) => a.name === patch.particular || a.code === patch.particular);
          next.accountGroup = acc?.group || "";
          if (acc) next.particular = acc.name;
        }
        return next;
      })
    );
  };

  const submitJournal = async () => {
    if (lineTotals.difference !== 0 || lineTotals.debit <= 0) {
      toast.error("Debit and Credit must balance and be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/finance/journal-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucherDate,
          refNo,
          refDate,
          location,
          paidTo,
          narration,
          totalDebit: lineTotals.debit,
          totalCredit: lineTotals.credit,
          lines
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save journal");
        return;
      }
      toast.success(`Journal voucher ${data.data?.voucherNumber} saved (demo)`);
      setRows((prev) => [{ srNo: 1, ...data.data }, ...prev.map((r, i) => ({ ...r, srNo: i + 2 }))]);
      setStep("report");
    } catch {
      toast.error("Failed to save journal");
    } finally {
      setSaving(false);
    }
  };

  const exportExcel = () => {
    const headers = COLS.map((c) => c.label);
    const body = filtered.map((r, idx) => [
      idx + 1,
      r.voucherNumber,
      r.voucherDate,
      r.docRefNo,
      r.branch,
      r.payTo,
      r.totalAccountedAmount,
      r.narration,
      r.entryBy,
      r.entryDt
    ]);
    const csv = [headers, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ManualJournal_${toInputDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyTable = async () => {
    const text = filtered
      .map(
        (r, idx) =>
          `${idx + 1}\t${r.voucherNumber}\t${r.voucherDate}\t${r.docRefNo}\t${r.branch}\t${r.payTo}\t${r.totalAccountedAmount}\t${r.narration}\t${r.entryBy}\t${r.entryDt}`
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied journal rows");
    } catch {
      toast.error("Unable to copy");
    }
  };

  const fieldCls =
    "w-full h-9 px-2.5 border border-blue-200 rounded-md text-xs bg-white focus:outline-none focus:border-[#0171d3]";
  const labelCls = "block text-[11px] font-semibold text-slate-600 mb-1";

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
            <input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
              placeholder="Document Number"
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
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("filter")}
                className="h-8 w-8 border border-slate-200 rounded-lg inline-flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white">
                Manual Journal
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColumnsMenu((v) => !v)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg inline-flex items-center gap-1.5"
                >
                  <Columns3 className="w-3.5 h-3.5" /> Column visibility
                </button>
                {showColumnsMenu && (
                  <div className="absolute z-20 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-xs max-h-64 overflow-y-auto">
                    {COLS.map((c) => (
                      <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleCols[c.key]}
                          onChange={() =>
                            setVisibleCols((prev) => ({ ...prev, [c.key]: !prev[c.key] }))
                          }
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={copyTable} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg inline-flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button type="button" onClick={exportExcel} className="px-3 py-1.5 text-xs font-semibold border border-emerald-200 text-emerald-800 bg-emerald-50 rounded-lg inline-flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button type="button" onClick={exportExcel} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button type="button" onClick={() => window.print()} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg inline-flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                type="button"
                onClick={() => setCardView((v) => !v)}
                className={`px-3 py-1.5 text-xs font-semibold border rounded-lg inline-flex items-center gap-1.5 ${
                  cardView ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> CARD VIEW
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <button
                type="button"
                onClick={openNew}
                className="h-8 px-3 rounded-lg bg-blue-600 text-white font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
              <label className="text-slate-600">
                Show{" "}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="mx-1 h-8 px-2 border border-slate-200 rounded-md"
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search:"
                  className="w-full h-8 pl-8 pr-3 border border-slate-200 rounded-md text-xs"
                />
              </div>
            </div>
          </div>

          {!cardView ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1200px]">
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
                            <input
                              value={colFilters[c.key]}
                              onChange={(e) => setFilter(c.key, e.target.value)}
                              placeholder={`Search ${c.label}`}
                              className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                            />
                          </th>
                        )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    paged.map((r, idx) => (
                      <tr key={r.voucherNumber} className="hover:bg-slate-50/80">
                        {col("srNo") && (
                          <td className="py-2.5 px-3 font-mono">{(page - 1) * pageSize + idx + 1}</td>
                        )}
                        {col("voucherNumber") && (
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {r.voucherNumber}
                          </td>
                        )}
                        {col("voucherDate") && (
                          <td className="py-2.5 px-3 whitespace-nowrap">{r.voucherDate}</td>
                        )}
                        {col("docRefNo") && (
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">{r.docRefNo}</td>
                        )}
                        {col("branch") && <td className="py-2.5 px-3 font-mono">{r.branch}</td>}
                        {col("payTo") && <td className="py-2.5 px-3">{r.payTo}</td>}
                        {col("totalAccountedAmount") && (
                          <td className="py-2.5 px-3 font-mono text-right">
                            {fmtAmt(r.totalAccountedAmount)}
                          </td>
                        )}
                        {col("narration") && (
                          <td className="py-2.5 px-3 max-w-[220px] truncate" title={r.narration}>
                            {r.narration}
                          </td>
                        )}
                        {col("entryBy") && <td className="py-2.5 px-3 font-mono">{r.entryBy}</td>}
                        {col("entryDt") && (
                          <td className="py-2.5 px-3 whitespace-nowrap">{r.entryDt}</td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paged.map((r) => (
                <div key={r.voucherNumber} className="border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-mono font-bold text-blue-700">{r.voucherNumber}</div>
                  <div className="font-medium">{r.payTo}</div>
                  <div className="text-slate-500">
                    {r.voucherDate} · {r.entryBy}
                  </div>
                  <div className="font-mono font-semibold">{fmtAmt(r.totalAccountedAmount)}</div>
                </div>
              ))}
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

      {step === "form" && (
        <div className="space-y-4">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-4 py-2.5 rounded-sm flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("report")}
              className="w-7 h-7 rounded-full bg-white/20 inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            Journal Voucher
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
            <div className="p-4 sm:p-5 space-y-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-700 italic">
                Please Enter Voucher Information...
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Voucher Number</label>
                  <input readOnly value="System Generated..." className={`${fieldCls} bg-slate-50 italic text-slate-500`} />
                </div>
                <div>
                  <label className={labelCls}>Voucher Date</label>
                  <input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Prepared At</label>
                  <input readOnly value={preparedAt} className={`${fieldCls} bg-slate-50`} />
                </div>
                <div>
                  <label className={labelCls}>Prepared By</label>
                  <input readOnly value={preparedBy} className={`${fieldCls} bg-slate-50`} />
                </div>
                <div>
                  <label className={labelCls}>Ref. No.</label>
                  <input value={refNo} onChange={(e) => setRefNo(e.target.value.toUpperCase())} className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Ref. Date</label>
                  <input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Locations</label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className={fieldCls}>
                    <option value="">---select---</option>
                    {locations.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Paid To</label>
                  <input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} className={fieldCls} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Narration</label>
                  <input value={narration} onChange={(e) => setNarration(e.target.value)} className={fieldCls} />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-700 italic">Account Details...</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px] min-w-[1100px]">
                  <thead>
                    <tr className="bg-[#0171d3] text-white">
                      {[
                        "Particulars",
                        "Account Groups",
                        "Open Debit",
                        "Open Credit",
                        "Debit",
                        "Credit",
                        "Closing Debit",
                        "Closing Credit"
                      ].map((h) => (
                        <th key={h} className="border border-[#015fae] px-2 py-2 font-semibold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => {
                      const closingDebit = Number(line.openDebit || 0) + Number(line.debit || 0);
                      const closingCredit = Number(line.openCredit || 0) + Number(line.credit || 0);
                      return (
                        <tr key={line.id}>
                          <td className="border border-slate-200 px-1 py-1">
                            <select
                              value={line.particular}
                              onChange={(e) => updateLine(line.id, { particular: e.target.value })}
                              className="w-full h-8 px-1 border border-slate-200 rounded-sm"
                            >
                              <option value="">--Select--</option>
                              {accounts.map((a) => (
                                <option key={a.code} value={a.name}>
                                  {a.code} - {a.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-slate-600 whitespace-nowrap">
                            {line.accountGroup || "—"}
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-right font-mono text-slate-400">
                            {fmtAmt(line.openDebit)}
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-right font-mono text-slate-400">
                            {fmtAmt(line.openCredit)}
                          </td>
                          <td className="border border-slate-200 px-1 py-1">
                            <input
                              type="number"
                              value={line.debit}
                              onChange={(e) =>
                                updateLine(line.id, {
                                  debit: Number(e.target.value) || 0,
                                  credit: Number(e.target.value) > 0 ? 0 : line.credit
                                })
                              }
                              className="w-full h-8 px-1 border border-slate-200 rounded-sm text-right font-mono"
                            />
                          </td>
                          <td className="border border-slate-200 px-1 py-1">
                            <input
                              type="number"
                              value={line.credit}
                              onChange={(e) =>
                                updateLine(line.id, {
                                  credit: Number(e.target.value) || 0,
                                  debit: Number(e.target.value) > 0 ? 0 : line.debit
                                })
                              }
                              className="w-full h-8 px-1 border border-slate-200 rounded-sm text-right font-mono"
                            />
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-right font-mono">
                            {fmtAmt(closingDebit)}
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-right font-mono">
                            {fmtAmt(closingCredit)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="border border-slate-200 px-2 py-2" colSpan={4}>
                        Sub Total
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                        {fmtAmt(lineTotals.debit)}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                        {fmtAmt(lineTotals.credit)}
                      </td>
                      <td className="border border-slate-200" colSpan={2} />
                    </tr>
                    <tr className="font-semibold">
                      <td className="border border-slate-200 px-2 py-2" colSpan={4}>
                        Total (₹)
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                        {fmtAmt(lineTotals.debit)}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                        {fmtAmt(lineTotals.credit)}
                      </td>
                      <td className="border border-slate-200" colSpan={2} />
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-2 py-2 font-semibold" colSpan={4}>
                        Difference
                      </td>
                      <td
                        className={`border border-slate-200 px-2 py-2 text-right font-mono font-bold ${
                          lineTotals.difference === 0 ? "text-emerald-700" : "text-amber-700"
                        }`}
                        colSpan={2}
                      >
                        {fmtAmt(lineTotals.difference)}
                      </td>
                      <td className="border border-slate-200" colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                + Add line
              </button>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={submitJournal}
                  className="min-w-[160px] h-9 px-6 rounded-md border border-[#0171d3] text-[#0171d3] bg-white text-xs font-semibold hover:bg-blue-50 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Submit Voucher"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
