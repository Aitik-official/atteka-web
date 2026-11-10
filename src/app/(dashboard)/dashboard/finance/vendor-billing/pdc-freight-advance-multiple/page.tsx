"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, ChevronDown, Search, X } from "lucide-react";
import { toast } from "@/lib/toastBus";

type VendorOpt = { code: string; name: string; label: string };

type Row = {
  id: string;
  srNo: number;
  vehicleNo: string;
  pdcNumber: string;
  manualPdcNo: string;
  pdcDate: string;
  pdcDateLabel: string;
  pdcBranch: string;
  vendorLabel: string;
  balanceAmount: number;
};

type Meta = { from: string; to: string; vendor: string };

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

export default function PdcFreightAdvanceMultiplePage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [vendor, setVendor] = useState("");
  const [vendors, setVendors] = useState<VendorOpt[]>([]);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState("");

  useEffect(() => {
    fetch("/api/finance/pdc-freight-advance-multiple?vendors=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVendors(d.data || []);
      })
      .catch(() => {});
  }, []);

  const filteredVendors = useMemo(() => {
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.code.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q)
    );
  }, [vendors, lookupQuery]);

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        vendor
      });
      const res = await fetch(`/api/finance/pdc-freight-advance-multiple?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load PDC list");
        return;
      }
      setRows(data.data || []);
      setMeta(data.meta || null);
      setSelected(new Set());
      setPage(1);
      setStep("report");
    } catch {
      toast.error("Failed to load PDC list");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.vehicleNo, r.pdcNumber, r.manualPdcNo, r.pdcDateLabel, r.pdcBranch, r.vendorLabel]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const fromEntry = filtered.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1;
  const toEntry = Math.min(pageSafe * pageSize, filtered.length);

  const allSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const continuePayment = async () => {
    if (!selected.size) {
      toast.error("Select at least one PDC");
      return;
    }
    setActing(true);
    try {
      const res = await fetch("/api/finance/pdc-freight-advance-multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Continue failed");
        return;
      }
      toast.success(data.message || "Continued to multiple advance payment");
      toast.info(`Batch ${data.data?.batchRef || ""} · ${data.data?.count || 0} PDC(s)`);
    } catch {
      toast.error("Continue failed");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden max-w-xl mx-auto">
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">PDC Date</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDates((v) => !v)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-sm bg-white text-left text-[13px] text-slate-700 inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="flex-1 truncate">{dateRangeLabel}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
                {showDates && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 shadow-lg rounded-sm p-3 flex flex-wrap gap-3">
                    <label className="text-[11px] text-slate-600 flex-1 min-w-[140px]">
                      From
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="mt-1 w-full h-8 px-2 border border-slate-300 rounded-sm text-[12px]"
                      />
                    </label>
                    <label className="text-[11px] text-slate-600 flex-1 min-w-[140px]">
                      To
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="mt-1 w-full h-8 px-2 border border-slate-300 rounded-sm text-[12px]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDates(false)}
                      className="h-8 px-3 self-end rounded-full border border-[#0171d3] text-[#0171d3] text-xs font-semibold"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                  Vendor
                </label>
                <input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full h-11 px-4 border border-[#7eb6e8] rounded-md text-[13px] text-slate-800 focus:outline-none focus:border-[#0171d3]"
                />
              </div>
              <button
                type="button"
                onClick={() => setLookupOpen(true)}
                className="h-10 w-10 rounded-full border border-[#7eb6e8] text-[#0171d3] text-[10px] font-bold hover:bg-[#e8f1fb]"
                title="Lookup Vendor"
              >
                ....
              </button>
            </div>

            <div className="flex justify-center pt-1">
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
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2.5 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 rounded-full bg-white/90" />
              Multiple PDC Advance Payment Entry
            </div>

            <div className="px-3 py-2 text-[12px] border-b border-slate-200 bg-[#e8f1fb]">
              <span className="font-semibold">PDC Date :</span> {meta?.from} — {meta?.to}
              <span className="mx-3">·</span>
              <span className="font-semibold">Vendor :</span> {meta?.vendor || "All"}
            </div>

            <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <label className="inline-flex items-center gap-2 text-slate-600">
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
                entries
              </label>
              <label className="inline-flex items-center gap-2 text-slate-600">
                Search:
                <input
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 px-2 border border-slate-200 rounded-md min-w-[180px]"
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700">
                    <th className="border border-slate-200 px-2 py-1.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="accent-[#0171d3]"
                      />
                    </th>
                    {["Vehicle Number", "PDC Number", "Manual PDC No", "PDC Date", "PDC Branch"].map(
                      (h) => (
                        <th
                          key={h}
                          className="border border-slate-200 px-2 py-1.5 font-semibold whitespace-nowrap text-left"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-[#eef5fc]">
                      <td className="border border-slate-200 px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          className="accent-[#0171d3]"
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono">
                        {r.vehicleNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-semibold">
                        {r.pdcNumber}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.manualPdcNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.pdcDateLabel}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.pdcBranch}
                      </td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="border border-slate-200 px-3 py-10 text-center text-slate-500"
                      >
                        No data available in table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                Showing {fromEntry} to {toEntry} of {filtered.length} entries
              </span>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 rounded-md border border-slate-200 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 rounded-md border border-slate-200 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="flex justify-center py-4">
              <button
                type="button"
                disabled={acting || !selected.size}
                onClick={() => void continuePayment()}
                className="h-9 min-w-[120px] px-6 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-sm font-semibold hover:bg-[#d7e8f8] disabled:opacity-50"
              >
                {acting ? "..." : "Continue..."}
              </button>
            </div>
          </div>
        </div>
      )}

      {lookupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Select Vendor</h2>
              <button
                type="button"
                onClick={() => setLookupOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Search vendor"
                  className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-xs"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto text-xs">
              <button
                type="button"
                onClick={() => {
                  setVendor("");
                  setLookupOpen(false);
                  setLookupQuery("");
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50 text-slate-500"
              >
                All Vendors
              </button>
              {filteredVendors.map((v) => (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => {
                    setVendor(v.label);
                    setLookupOpen(false);
                    setLookupQuery("");
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50"
                >
                  <span className="font-mono font-semibold text-blue-700">{v.code}</span>
                  <span className="text-slate-700 ml-2">{v.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
