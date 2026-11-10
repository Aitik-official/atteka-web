"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Download,
  LayoutGrid,
  Table2
} from "lucide-react";
import { toast } from "@/lib/toastBus";

type Party = { code: string; name: string; label: string };

type Row = {
  id: string;
  docketNo: string;
  docketDate: string;
  docketDateLabel: string;
  fromLocation: string;
  toLocation: string;
  vehType: string;
  vehNo: string;
  customer: string;
  consignee: string;
  consignor: string;
  pkgsNo: number;
  weight: number;
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toInputDate(d);
}

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function DownloadMultiplePodsPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [fromDate, setFromDate] = useState(daysAgo(29));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [billingParty, setBillingParty] = useState("");
  const [parties, setParties] = useState<Party[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/finance/download-multiple-pods?parties=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setParties(d.data || []);
      })
      .catch(() => {});
  }, []);

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        billingParty
      });
      const res = await fetch(`/api/finance/download-multiple-pods?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load dockets");
        return;
      }
      setRows(data.data || []);
      setSelected(new Set());
      setStep("report");
    } catch {
      toast.error("Failed to load dockets");
    } finally {
      setLoading(false);
    }
  };

  const allSelected = rows.length > 0 && selected.size === rows.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = useMemo(() => selected.size, [selected]);

  const downloadPods = async () => {
    if (!selected.size) {
      toast.error("Select at least one docket");
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch("/api/finance/download-multiple-pods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Download failed");
        return;
      }
      toast.success(data.message || "POD download started (demo)");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden max-w-xl mx-auto">
          <div className="px-6 py-6 space-y-4">
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadReport()}
                title="View result table"
                className="h-11 w-11 rounded-md bg-[#0171d3] text-white inline-flex items-center justify-center shadow-sm hover:bg-[#0159a8] disabled:opacity-50"
              >
                <Table2 className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Docket Date</label>
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

            <div className="relative">
              <select
                value={billingParty}
                onChange={(e) => setBillingParty(e.target.value)}
                className={`w-full h-11 px-3 border border-[#7eb6e8] rounded-md bg-white text-[13px] focus:outline-none focus:border-[#0171d3] ${
                  billingParty ? "text-slate-800" : "text-[#0171d3]"
                }`}
              >
                <option value="">Billing Party</option>
                {parties.map((p) => (
                  <option key={p.code} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
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
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-[#0171d3] text-white flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-8 w-8 rounded-full bg-white text-amber-500 inline-flex items-center justify-center shadow-sm"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold tracking-wide flex-1">Download Multiple PODs</h2>
            <button
              type="button"
              disabled={downloading || !selectedCount}
              onClick={() => void downloadPods()}
              className="h-8 px-3 rounded-md bg-white text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? "Preparing..." : `Download (${selectedCount})`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1400px] w-full text-[12px]">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  <th className="px-3 py-2.5 text-center w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Docket No</th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Docket Date</th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">From</th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">To</th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Veh Type</th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Veh No</th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Customer</th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Consignee</th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Consignor</th>
                  <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">PKGSNO</th>
                  <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">Weight</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-slate-500">
                      No dockets found for selected criteria
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-t border-slate-200 bg-[#f7f4ef] hover:bg-[#efeae2]">
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          className="text-[#0171d3] font-semibold hover:underline"
                          onClick={() => toast.success(`Docket ${r.docketNo} (demo)`)}
                        >
                          {r.docketNo}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">{r.docketDateLabel}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">{r.fromLocation}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">{r.toLocation}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">{r.vehType}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">{r.vehNo}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">{r.customer}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">{r.consignee}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">{r.consignor}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{r.pkgsNo}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{r.weight}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-500 inline-flex items-center gap-2">
            <LayoutGrid className="w-3.5 h-3.5" />
            {rows.length} docket(s) · {selectedCount} selected
          </div>
        </div>
      )}
    </div>
  );
}
