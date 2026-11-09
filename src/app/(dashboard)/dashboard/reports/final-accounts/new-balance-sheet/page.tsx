"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, BarChart2, FileSpreadsheet, Printer, RefreshCw, Search, Send, Table2 } from "lucide-react";
import { toast } from "@/lib/toastBus";

type Line = {
  section: "EQUITY" | "ASSETS";
  heading?: string;
  particulars: string;
  noteNo?: string;
  current: number;
  previous: number;
  isHeading?: boolean;
  isTotal?: boolean;
};

function formatReportDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function fmt(n: number) {
  if (!n && n !== 0) return "";
  if (n < 0) {
    return `(${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
  }
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ROUND_OPTIONS = [
  "Rs. in Unit (0)",
  "Rs. in Thousands (000)",
  "Rs. in Lakhs",
  "Rs. in Crores"
];

export default function NewBalanceSheetPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [branch, setBranch] = useState("--Show All--");
  const [roundFigure, setRoundFigure] = useState("Rs. in Unit (0)");
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([]);
  const [rows, setRows] = useState<Line[]>([]);
  const [meta, setMeta] = useState({
    companyName: "Ateka Logistics",
    cinNo: "",
    branchLabel: "All",
    asAtCurrent: "31 March 2027",
    asAtPrevious: "31 March 2026",
    currencyLabel: "Rupees"
  });
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState("100%");

  useEffect(() => {
    const y = new Date().getFullYear();
    const month = new Date().getMonth();
    const fyStart = month >= 3 ? y : y - 1;
    setFromDate(`${fyStart}-04-01`);
    setToDate(`${fyStart + 1}-03-31`);

    fetch("/api/branches")
      .then((r) => r.json())
      .then((b) => {
        if (!b.success) return;
        const list = (b.data || [])
          .map((x: any) => {
            const code = String(x.branchCode || x.code || "").trim().toUpperCase();
            const name = String(x.branchName || x.name || code).trim();
            return code ? { code, label: `${name} - ${code}` } : null;
          })
          .filter(Boolean) as { code: string; label: string }[];
        if (!list.some((x) => x.code === "ALC1")) {
          list.unshift({ code: "ALC1", label: "Ateka Logistics - ALC1" });
        }
        setBranches(list);
      })
      .catch(() => {});
  }, []);

  const zoomScale = Number(String(zoom).replace("%", "")) / 100 || 1;

  const loadReport = async (alsoExport = false) => {
    setLoading(true);
    try {
      const br = branch.includes(" - ") ? branch.split(" - ").pop()!.trim() : branch;
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        branch: br || "Show All",
        roundFigure
      });
      const res = await fetch(`/api/reports/new-balance-sheet?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load New Balance Sheet");
        return;
      }
      setRows(data.data || []);
      setMeta({
        companyName: data.companyName || "Ateka Logistics",
        cinNo: data.cinNo || "",
        branchLabel: data.branchLabel || "All",
        asAtCurrent: data.asAtCurrent || formatReportDate(toDate),
        asAtPrevious: data.asAtPrevious || "",
        currencyLabel: data.currencyLabel || "Rupees"
      });
      setStep("report");
      if (alsoExport) exportCsv(data.data || [], data);
    } catch {
      toast.error("Failed to load New Balance Sheet");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = (list: Line[] = rows, m = meta) => {
    if (!list.length) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Particulars", "Note No", `As at ${m.asAtCurrent}`, `As at ${m.asAtPrevious}`];
    const lines = list.map((r) =>
      [
        `"${r.particulars.replace(/"/g, '""')}"`,
        r.noteNo || "",
        r.isHeading ? "" : r.current,
        r.isHeading ? "" : r.previous
      ].join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `New_Balance_Sheet_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10">

      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Select Branch / Profit Center
          </div>
          <div className="px-4 py-3 border-b border-slate-200 text-[12px] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-700 font-semibold whitespace-nowrap">
                Select Branch / Profit Center :
              </span>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="h-8 min-w-[180px] px-2 border border-slate-300 rounded-sm bg-white"
              >
                <option value="--Show All--">--Show All--</option>
                {branches.map((b) => (
                  <option key={b.code} value={b.label}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-700 font-semibold whitespace-nowrap">Select Round figure :</span>
              <select
                value={roundFigure}
                onChange={(e) => setRoundFigure(e.target.value)}
                className="h-8 min-w-[180px] px-2 border border-slate-300 rounded-sm bg-white"
              >
                {ROUND_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Select Voucher Date Range
          </div>
          <div className="px-4 py-3 text-[12px] flex flex-wrap items-center gap-3">
            <span className="text-slate-700 font-semibold w-[90px]">Date Range</span>
            <span className="text-slate-600">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[150px]"
            />
            <span className="text-slate-600 ml-2">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[150px]"
            />
          </div>

          <div className="flex justify-center gap-3 py-4 border-t border-slate-200 bg-slate-50/50">
            <button
              type="button"
              title="Excel"
              disabled={loading}
              onClick={() => loadReport(true)}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center disabled:opacity-60"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Table"
              disabled={loading}
              onClick={() => loadReport(false)}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center disabled:opacity-60"
            >
              <Table2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Chart"
              onClick={() => toast.info("Open Table for balance sheet details")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Send"
              onClick={() => toast.info("Email / share not configured in replica")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-300 text-[11px] print:hidden">
            <span className="text-slate-600">1 of 1</span>
            <button
              type="button"
              title="Refresh"
              onClick={() => loadReport(false)}
              className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Back"
              onClick={() => setStep("filter")}
              className="h-7 w-7 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <select
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
              className="h-7 px-1 border border-slate-300 rounded bg-white"
            >
              <option>75%</option>
              <option>100%</option>
              <option>125%</option>
            </select>
            <button
              type="button"
              onClick={() => exportCsv()}
              className="h-7 px-2 border border-slate-300 rounded bg-white inline-flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-7 px-2 border border-slate-300 rounded bg-white inline-flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input placeholder="Find" className="h-7 w-40 px-2 border border-slate-300 rounded" />
              <button type="button" className="h-7 px-2 border border-slate-300 rounded bg-white">
                Next
              </button>
            </div>
          </div>

          <div style={{ zoom: zoomScale }} className="p-6 overflow-x-auto">
            <div className="text-center mb-4 space-y-0.5">
              <div className="text-base font-bold text-slate-900">{meta.companyName}</div>
              <div className="text-xs text-slate-600">CIN No : {meta.cinNo || "—"}</div>
              <div className="text-xs text-slate-600">Branch / Profit Center : {meta.branchLabel}</div>
              <div className="text-sm font-semibold text-slate-800 mt-2">
                Balance Sheet as on {formatReportDate(fromDate)} to {formatReportDate(toDate)}
              </div>
              <div className="text-xs text-slate-500">(In &quot; {meta.currencyLabel})</div>
            </div>

            <table className="w-full border-collapse text-[12px] min-w-[760px]">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  <th className="border border-[#015fae] px-3 py-2 text-left font-semibold">Particulars</th>
                  <th className="border border-[#015fae] px-3 py-2 text-center font-semibold w-[80px]">
                    Note No
                  </th>
                  <th className="border border-[#015fae] px-3 py-2 text-right font-semibold">
                    As at {meta.asAtCurrent}
                  </th>
                  <th className="border border-[#015fae] px-3 py-2 text-right font-semibold">
                    As at {meta.asAtPrevious}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  if (r.isTotal) {
                    return (
                      <tr key={`tot-${idx}`} className="bg-[#0171d3] text-white font-bold">
                        <td className="border border-[#015fae] px-3 py-2">{r.particulars}</td>
                        <td className="border border-[#015fae] px-3 py-2" />
                        <td className="border border-[#015fae] px-3 py-2 text-right font-mono">
                          {fmt(r.current)}
                        </td>
                        <td className="border border-[#015fae] px-3 py-2 text-right font-mono">
                          {fmt(r.previous)}
                        </td>
                      </tr>
                    );
                  }
                  if (r.isHeading) {
                    const isMain = r.particulars === "EQUITY AND LIABILITIES" || r.particulars === "ASSETS";
                    return (
                      <tr
                        key={`h-${idx}`}
                        className={isMain ? "bg-[#cfe2f5] font-bold" : "bg-slate-50 font-semibold"}
                      >
                        <td className="border border-slate-200 px-3 py-1.5" colSpan={4}>
                          {r.particulars}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={`r-${idx}`} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-1.5 pl-6 whitespace-nowrap">
                        {r.particulars}
                      </td>
                      <td className="border border-slate-200 px-3 py-1.5 text-center">{r.noteNo || ""}</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-right font-mono whitespace-nowrap">
                        {fmt(r.current)}
                      </td>
                      <td className="border border-slate-200 px-3 py-1.5 text-right font-mono whitespace-nowrap">
                        {fmt(r.previous)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-6 text-[11px] text-slate-600 space-y-1">
              <p>See Accompanying note forming part of the financial statement</p>
              <p>In terms of our report attached.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
