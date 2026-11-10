"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer, Search, X } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type VendorOpt = { code: string; name: string; label: string };

type PdcRow = {
  id: string;
  srNo: number;
  pdcNo: string;
  manualThcNo: string;
  pdcDate: string;
  pdcDateLabel: string;
  vehicleNo: string;
  vendorName: string;
  vendorLabel: string;
  advBranch: string;
  totalHire: number;
  advance: number;
  voucher: string;
};

type Meta = {
  mode: string;
  from: string;
  to: string;
  vendor: string;
  pdcNumbers: string;
};

type DateMode = "range" | "today" | "last7";
type SearchMode = "criteria" | "pdc";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function inr(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function PdcFreightMemoPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [searchMode, setSearchMode] = useState<SearchMode>("criteria");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(6)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [vendor, setVendor] = useState("");
  const [pdcNumbers, setPdcNumbers] = useState("");
  const [vendors, setVendors] = useState<VendorOpt[]>([]);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [rows, setRows] = useState<PdcRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/finance/pdc-freight-memo?vendors=1")
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

  const loadReport = async () => {
    if (searchMode === "pdc" && !pdcNumbers.trim()) {
      toast.error("Enter PDC Number");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: searchMode,
        dateMode,
        from: fromDate,
        to: toDate,
        vendor,
        pdcNumbers: pdcNumbers.trim()
      });
      const res = await fetch(`/api/finance/pdc-freight-memo?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load PDC Freight Memo");
        return;
      }
      setRows(data.data || []);
      setMeta(data.meta || null);
      setSelected(new Set());
      setStep("report");
    } catch {
      toast.error("Failed to load PDC Freight Memo");
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

  const printSelected = () => {
    if (!selected.size) {
      toast.error("Select at least one PDC to print");
      return;
    }
    toast.success(`${selected.size} PDC Freight Memo(s) sent to Dot-Matrix printer (demo)`);
    printScoped();
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-4xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Print PDC Freight Memo [Dot-Matrix]
          </div>

          <div className="px-4 py-4 space-y-3 text-[12px]">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <span className="font-semibold text-slate-800 w-[100px] pt-1.5 shrink-0">PDC Date</span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 flex-1">
                <label className="inline-flex items-center gap-1.5">
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
                  <span>From / To</span>
                  <input
                    type="date"
                    value={fromDate}
                    disabled={dateMode !== "range" || searchMode !== "criteria"}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-8 px-2 border border-slate-300 rounded-sm disabled:bg-slate-50"
                  />
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
                  <span>Todays - Label</span>
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
              <span className="font-semibold text-slate-800 w-[100px] shrink-0">Vendor Name</span>
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <input
                  value={vendor}
                  onChange={(e) => {
                    setVendor(e.target.value);
                    setSearchMode("criteria");
                  }}
                  disabled={searchMode === "pdc"}
                  className="h-8 min-w-[180px] px-2 border border-slate-300 rounded-sm disabled:bg-slate-50"
                />
                <button
                  type="button"
                  disabled={searchMode === "pdc"}
                  onClick={() => setLookupOpen(true)}
                  className="h-8 w-8 rounded-full border border-[#7eb6e8] text-[#0171d3] text-[10px] font-bold hover:bg-[#e8f1fb] disabled:opacity-40"
                  title="Lookup Vendor"
                >
                  ....
                </button>
              </div>
            </div>

            <div className="text-center py-1">
              <span className="text-red-600 font-bold text-sm">OR</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-800 w-[100px] shrink-0">PDC Number</span>
              <label className="inline-flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="radio"
                  name="searchMode"
                  checked={searchMode === "pdc"}
                  onChange={() => setSearchMode("pdc")}
                  className="accent-[#0171d3]"
                />
                <input
                  value={pdcNumbers}
                  onChange={(e) => {
                    setPdcNumbers(e.target.value.toUpperCase());
                    setSearchMode("pdc");
                  }}
                  disabled={searchMode !== "pdc"}
                  className="h-8 flex-1 min-w-[200px] px-2 border border-slate-300 rounded-sm disabled:bg-slate-50 uppercase"
                />
              </label>
              <span className="text-[11px] text-slate-600">
                For multiple PDC use , separator. Ex:{" "}
                <span className="text-red-600">DSBOM11100001,PSBOM31100001</span>
              </span>
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
        <div data-print-root className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#d7e8f8]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={printSelected}
              className="h-9 px-4 rounded-full border border-[#0171d3] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#e8f1fb]"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Selected
            </button>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
              Print PDC Freight Memo [Dot-Matrix]
            </div>
            <div className="px-3 py-2 text-[12px] border-b border-slate-200 bg-[#e8f1fb] flex flex-wrap gap-x-4 gap-y-1">
              {meta?.mode === "pdc" ? (
                <span>
                  <span className="font-semibold">PDC Number :</span> {meta.pdcNumbers}
                </span>
              ) : (
                <>
                  <span>
                    <span className="font-semibold">PDC Date :</span> {meta?.from} — {meta?.to}
                  </span>
                  <span>
                    <span className="font-semibold">Vendor :</span> {meta?.vendor || "All"}
                  </span>
                </>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[980px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#015fae] px-2 py-1.5 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="accent-white"
                      />
                    </th>
                    {[
                      "PDC No.",
                      "Manual THC No.",
                      "PDC Date",
                      "Vehicle No",
                      "Vendor Name",
                      "Adv Branch",
                      "Total Hire",
                      "Advance",
                      "Voucher"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          h === "Total Hire" || h === "Advance" ? "text-right" : "text-center"
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
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap font-semibold">
                        {r.pdcNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.manualThcNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.pdcDateLabel}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap font-mono">
                        {r.vehicleNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.vendorName}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.advBranch}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold">
                        {inr(r.totalHire)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold">
                        {inr(r.advance)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.voucher}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="border border-slate-200 px-3 py-10 text-center text-slate-500"
                      >
                        No PDC Freight Memo records for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
