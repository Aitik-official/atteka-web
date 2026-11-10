"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, Search, X } from "lucide-react";
import { toast } from "@/lib/toastBus";

type VendorOpt = { code: string; name: string; label: string };

type Row = {
  id: string;
  srNo: number;
  vehicleNo: string;
  pdcNumber: string;
  manualPdcNo: string;
  pdcDateLabel: string;
  pdcAmount: number;
  advanceAmt: number;
  balanceAmt: number;
  dcName: string;
};

type Meta = {
  from: string;
  to: string;
  vendor: string;
  tripSheetNo: string;
  advanceVendorbillNo: string;
  mode: string;
};

type SearchMode = "criteria" | "doc";

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

function inr(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function VendorBillFinalizationPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [searchMode, setSearchMode] = useState<SearchMode>("criteria");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [vendor, setVendor] = useState("");
  const [tripSheetNo, setTripSheetNo] = useState("");
  const [advanceVendorbillNo, setAdvanceVendorbillNo] = useState("");
  const [vendors, setVendors] = useState<VendorOpt[]>([]);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/finance/vendor-bill-finalization?vendors=1")
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
    if (searchMode === "doc" && !tripSheetNo.trim() && !advanceVendorbillNo.trim()) {
      toast.error("Enter Tripsheet No or Advance Vendorbill No");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: searchMode,
        from: fromDate,
        to: toDate,
        vendor,
        tripSheetNo: tripSheetNo.trim(),
        advanceVendorbillNo: advanceVendorbillNo.trim()
      });
      const res = await fetch(`/api/finance/vendor-bill-finalization?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load vendor bills");
        return;
      }
      setRows(data.data || []);
      setMeta(data.meta || null);
      setSelected(new Set());
      setStep("report");
    } catch {
      toast.error("Failed to load vendor bills");
    } finally {
      setLoading(false);
    }
  };

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const continueFinalize = async () => {
    if (!selected.size) {
      toast.error("Select at least one row");
      return;
    }
    setActing(true);
    try {
      const res = await fetch("/api/finance/vendor-bill-finalization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Finalization failed");
        return;
      }
      toast.success(data.message || "Vendor bills finalized");
      toast.info(
        `Batch ${data.data?.batchRef || ""} · Balance ₹${Number(data.data?.totalBalance || 0).toLocaleString("en-IN")}`
      );
    } catch {
      toast.error("Finalization failed");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
              Selection Criteria
            </div>

            <div className="px-4 py-4 space-y-3 text-[12px]">
              <div className="flex flex-wrap items-start gap-3">
                <span className="font-semibold text-slate-800 w-[160px] pt-1.5 shrink-0">
                  Select Document Date
                </span>
                <div className="flex-1 space-y-2 min-w-[260px]">
                  <label className="inline-flex items-center gap-2 flex-wrap">
                    <input
                      type="radio"
                      name="searchMode"
                      checked={searchMode === "criteria"}
                      onChange={() => setSearchMode("criteria")}
                      className="accent-[#0171d3]"
                    />
                    <span>From</span>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                      <input
                        type="date"
                        value={fromDate}
                        disabled={searchMode !== "criteria"}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="h-8 pl-7 pr-2 border border-slate-300 rounded-sm disabled:bg-slate-50"
                      />
                    </div>
                    <span>To</span>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                      <input
                        type="date"
                        value={toDate}
                        disabled={searchMode !== "criteria"}
                        onChange={(e) => setToDate(e.target.value)}
                        className="h-8 pl-7 pr-2 border border-slate-300 rounded-sm disabled:bg-slate-50"
                      />
                    </div>
                  </label>
                  <div className="inline-flex items-center gap-2 text-[11px] text-slate-600 border border-slate-200 rounded-sm px-2 py-1 bg-slate-50">
                    <Calendar className="w-3.5 h-3.5" />
                    {dateRangeLabel}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                <span className="font-semibold text-slate-800 w-[160px] shrink-0">Vendor</span>
                <input
                  value={vendor}
                  disabled={searchMode !== "criteria"}
                  onChange={(e) => {
                    setVendor(e.target.value);
                    setSearchMode("criteria");
                  }}
                  className="h-8 min-w-[180px] px-2 border border-slate-300 rounded-sm disabled:bg-slate-50"
                />
                <button
                  type="button"
                  disabled={searchMode !== "criteria"}
                  onClick={() => setLookupOpen(true)}
                  className="h-8 w-8 rounded-full border border-[#7eb6e8] text-[#0171d3] text-[10px] font-bold hover:bg-[#e8f1fb] disabled:opacity-40"
                  title="Lookup Vendor"
                >
                  ...
                </button>
              </div>

              <div className="text-center py-1">
                <span className="text-slate-800 font-bold text-sm">OR</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                <span className="font-semibold text-slate-800 w-[160px] shrink-0">Tripsheet No</span>
                <input
                  value={tripSheetNo}
                  onChange={(e) => {
                    setTripSheetNo(e.target.value.toUpperCase());
                    setSearchMode("doc");
                  }}
                  disabled={searchMode !== "doc"}
                  onFocus={() => setSearchMode("doc")}
                  className="h-8 min-w-[220px] px-2 border border-slate-300 rounded-sm uppercase disabled:bg-slate-50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                <span className="font-semibold text-slate-800 w-[160px] shrink-0">
                  Advance Vendorbill No
                </span>
                <input
                  value={advanceVendorbillNo}
                  onChange={(e) => {
                    setAdvanceVendorbillNo(e.target.value.toUpperCase());
                    setSearchMode("doc");
                  }}
                  disabled={searchMode !== "doc"}
                  onFocus={() => setSearchMode("doc")}
                  className="h-8 min-w-[220px] px-2 border border-slate-300 rounded-sm uppercase disabled:bg-slate-50"
                />
              </div>

              <div className="flex justify-center pt-2">
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

          <div className="flex justify-center border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => {
                if (!rows.length) toast.info("Submit selection criteria first");
                else setStep("report");
              }}
              className="h-9 min-w-[110px] px-6 rounded-sm border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb]"
            >
              Continue
            </button>
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
              Vendor Bill Finalization Process
            </div>
            <div className="px-3 py-2 text-[12px] border-b border-slate-200 bg-[#e8f1fb] flex flex-wrap gap-x-4 gap-y-1">
              {meta?.mode === "doc" ? (
                <>
                  {meta.tripSheetNo ? (
                    <span>
                      <span className="font-semibold">Tripsheet No :</span> {meta.tripSheetNo}
                    </span>
                  ) : null}
                  {meta.advanceVendorbillNo ? (
                    <span>
                      <span className="font-semibold">Advance Vendorbill No :</span>{" "}
                      {meta.advanceVendorbillNo}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <span>
                    <span className="font-semibold">Document Date :</span> {meta?.from} — {meta?.to}
                  </span>
                  <span>
                    <span className="font-semibold">Vendor :</span> {meta?.vendor || "All"}
                  </span>
                </>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1100px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#015fae] px-2 py-1.5 w-16 text-center font-semibold">
                      Select
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          className="accent-white"
                        />
                      </div>
                    </th>
                    {[
                      "Vehicle Number",
                      "PDC Number",
                      "Manual PDC No",
                      "PDC Date",
                      "PDC Amount",
                      "Advance Amt",
                      "Balance Amt",
                      "Dc Name"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          ["PDC Amount", "Advance Amt", "Balance Amt"].includes(h)
                            ? "text-right"
                            : "text-center"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-[#eef5fc]">
                      <td className="border border-slate-200 px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          className="accent-[#0171d3]"
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap font-mono font-semibold">
                        {r.vehicleNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.pdcNumber}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.manualPdcNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.pdcDateLabel}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold">
                        {inr(r.pdcAmount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap">
                        {inr(r.advanceAmt)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold text-[#0171d3]">
                        {inr(r.balanceAmt)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.dcName}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="border border-slate-200 px-3 py-10 text-center text-slate-500"
                      >
                        No vendor bills for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center py-4">
              <button
                type="button"
                disabled={acting || !selected.size}
                onClick={() => void continueFinalize()}
                className="h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
              >
                {acting ? "..." : "Continue"}
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
                  setSearchMode("criteria");
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
                    setSearchMode("criteria");
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
