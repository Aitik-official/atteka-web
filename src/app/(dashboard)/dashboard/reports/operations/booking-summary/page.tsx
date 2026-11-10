"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart2, Calendar, ChevronDown, FileSpreadsheet, Pencil, Printer, RefreshCw, Search, Table2 } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type ReportType = "party" | "branch" | "party-month" | "branch-month" | "";

type PartyRow = { billingParty: string; totalCns: number; amount: number };
type BranchRegion = {
  region: string;
  totalDocket: number;
  totalFreight: number;
  branches: { region: string; branch: string; branchCode: string; totalDocket: number; totalFreight: number }[];
};
type MonthCol = { key: string; label: string };
type PartyMonthRow = {
  billingParty: string;
  months: Record<string, { cnt: number; freight: number }>;
  totalCnt: number;
  totalFreight: number;
};
type BranchMonthRow = {
  branch: string;
  months: Record<string, { cnt: number; freight: number }>;
  totalCnt: number;
  totalFreight: number;
};

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "", label: "--Select--" },
  { value: "party", label: "Party Wise" },
  { value: "branch", label: "Branch Wise" },
  { value: "party-month", label: "Party Wise & Month Wise" },
  { value: "branch-month", label: "Branch Wise & Month Wise" }
];

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

function formatNum(n: number, decimals = 0) {
  if (decimals > 0) return Number(n || 0).toFixed(decimals);
  return String(Math.round(Number(n || 0)));
}

function formatMoney(n: number) {
  const v = Number(n || 0);
  return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(2);
}

export default function BookingSummaryPage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [bookingBranch, setBookingBranch] = useState("Ateka Logistics-ALC1");
  const [billingParty, setBillingParty] = useState("");
  const [reportType, setReportType] = useState<ReportType>("");
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([]);
  const [parties, setParties] = useState<string[]>([]);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState("100%");
  const [findText, setFindText] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});

  const [partyRows, setPartyRows] = useState<PartyRow[]>([]);
  const [partyTotals, setPartyTotals] = useState({ totalCns: 0, amount: 0 });
  const [regions, setRegions] = useState<BranchRegion[]>([]);
  const [branchChart, setBranchChart] = useState<{ label: string; dktCount: number; sumFrt: number }[]>([]);
  const [branchTotals, setBranchTotals] = useState({ totalDocket: 0, totalFreight: 0 });
  const [months, setMonths] = useState<MonthCol[]>([]);
  const [partyMonthRows, setPartyMonthRows] = useState<PartyMonthRow[]>([]);
  const [partyMonthTotals, setPartyMonthTotals] = useState<{
    months: Record<string, { cnt: number; freight: number }>;
    totalCnt: number;
    totalFreight: number;
  }>({ months: {}, totalCnt: 0, totalFreight: 0 });
  const [branchMonthRows, setBranchMonthRows] = useState<BranchMonthRow[]>([]);
  const [branchMonthTotals, setBranchMonthTotals] = useState<{
    months: Record<string, { cnt: number; freight: number }>;
    totalCnt: number;
    totalFreight: number;
  }>({ months: {}, totalCnt: 0, totalFreight: 0 });
  const [activeType, setActiveType] = useState<ReportType>("");

  useEffect(() => {
    Promise.all([fetch("/api/branches"), fetch("/api/customers")])
      .then(async ([bRes, cRes]) => {
        const b = await bRes.json();
        const c = await cRes.json();
        if (b.success) {
          const list = (b.data || [])
            .map((x: any) => {
              const code = String(x.branchCode || x.code || "").trim().toUpperCase();
              const name = String(x.branchName || x.name || "Atteka Logistics").trim();
              if (!code) return null;
              return { code, label: `${name}-${code}` };
            })
            .filter(Boolean) as { code: string; label: string }[];
          if (!list.some((x) => x.code === "ALC1")) {
            list.unshift({ code: "ALC1", label: "Ateka Logistics-ALC1" });
          }
          setBranches(list);
        } else {
          setBranches([{ code: "ALC1", label: "Ateka Logistics-ALC1" }]);
        }
        if (c.success) {
          setParties(
            (c.data || [])
              .map((x: any) => String(x.customerName || x.name || "").trim())
              .filter(Boolean)
          );
        }
      })
      .catch(() => {
        setBranches([{ code: "ALC1", label: "Ateka Logistics-ALC1" }]);
      });
  }, []);

  const dateLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;
  const zoomScale = Number(String(zoom).replace("%", "")) / 100 || 1;
  const reportTitle =
    activeType === "party"
      ? "Party wise Booking Summary"
      : activeType === "branch"
        ? "Branch Wise Booking Summary"
        : activeType === "party-month"
          ? "Party Wise & Month Wise Booking Summary"
          : activeType === "branch-month"
            ? "Branch and Month Wise Booking Summary"
            : "Booking Summary";

  const filteredParty = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return partyRows;
    return partyRows.filter((r) => r.billingParty.toLowerCase().includes(q) || String(r.amount).includes(q));
  }, [partyRows, findText]);

  const filteredRegions = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return regions;
    return regions
      .map((r) => ({
        ...r,
        branches: r.branches.filter(
          (b) =>
            b.branch.toLowerCase().includes(q) ||
            r.region.toLowerCase().includes(q) ||
            String(b.totalFreight).includes(q)
        )
      }))
      .filter((r) => r.region.toLowerCase().includes(q) || r.branches.length > 0);
  }, [regions, findText]);

  const filteredPartyMonth = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return partyMonthRows;
    return partyMonthRows.filter((r) => r.billingParty.toLowerCase().includes(q));
  }, [partyMonthRows, findText]);

  const filteredBranchMonth = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return branchMonthRows;
    return branchMonthRows.filter((r) => r.branch.toLowerCase().includes(q));
  }, [branchMonthRows, findText]);

  const maxChart = Math.max(1, ...branchChart.map((c) => Math.max(c.dktCount, c.sumFrt)));

  const loadReport = async (opts?: {
    exportExcel?: boolean;
    forceChart?: boolean;
    typeOverride?: ReportType;
  }) => {
    const type = opts?.typeOverride || reportType;
    if (!type) {
      toast.error("Select a Report Type");
      return;
    }
    if (opts?.typeOverride) setReportType(opts.typeOverride);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        bookingBranch,
        billingParty: billingParty || "ALL",
        reportType: type
      });
      const res = await fetch(`/api/reports/booking-summary?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load booking summary");
        return;
      }
      setActiveType(type);
      setShowChart(Boolean(opts?.forceChart) || type === "branch");
      setFindText("");

      if (type === "party") {
        setPartyRows(data.data || []);
        setPartyTotals(data.totals || { totalCns: 0, amount: 0 });
      } else if (type === "branch") {
        setRegions(data.regions || []);
        setBranchChart(data.chart || []);
        setBranchTotals(data.totals || { totalDocket: 0, totalFreight: 0 });
        const exp: Record<string, boolean> = {};
        for (const r of data.regions || []) exp[r.region] = false;
        setExpandedRegions(exp);
      } else if (type === "party-month") {
        setMonths(data.months || []);
        setPartyMonthRows(data.data || []);
        setPartyMonthTotals(data.totals || { months: {}, totalCnt: 0, totalFreight: 0 });
      } else if (type === "branch-month") {
        setMonths(data.months || []);
        setBranchMonthRows(data.data || []);
        setBranchMonthTotals(data.totals || { months: {}, totalCnt: 0, totalFreight: 0 });
      }

      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (opts?.exportExcel) {
        setTimeout(() => exportCsv(type, data), 0);
      }
    } catch {
      toast.error("Failed to load booking summary");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = (type: ReportType = activeType, payload?: any) => {
    let csv = "";
    let filename = `Booking_Summary_${fromDate}_${toDate}.csv`;

    if (type === "party") {
      const rows: PartyRow[] = payload?.data || filteredParty;
      const totals = payload?.totals || partyTotals;
      csv = [
        "Billing Party,Total CNS,Amount",
        ...rows.map((r) => `"${r.billingParty.replace(/"/g, '""')}",${r.totalCns},${r.amount}`),
        `"Total",${totals.totalCns},${totals.amount}`
      ].join("\n");
      filename = `Party_Wise_Booking_Summary_${fromDate}_${toDate}.csv`;
    } else if (type === "branch") {
      const regs: BranchRegion[] = payload?.regions || filteredRegions;
      const totals = payload?.totals || branchTotals;
      const lines = ["Regions,Branch,Total Docket,Total Freight"];
      for (const r of regs) {
        lines.push(`"${r.region}",,${r.totalDocket},${r.totalFreight}`);
        for (const b of r.branches) {
          lines.push(`,"${b.branch.replace(/"/g, '""')}",${b.totalDocket},${b.totalFreight}`);
        }
      }
      lines.push(`"Total",,${totals.totalDocket},${totals.totalFreight}`);
      csv = lines.join("\n");
      filename = `Branch_Wise_Booking_Summary_${fromDate}_${toDate}.csv`;
    } else if (type === "party-month") {
      const cols: MonthCol[] = payload?.months || months;
      const rows: PartyMonthRow[] = payload?.data || filteredPartyMonth;
      const totals = payload?.totals || partyMonthTotals;
      const headers = [
        "Billing Party",
        ...cols.flatMap((m) => [`${m.label} CNT`, `${m.label} Freight`]),
        "Total CNT",
        "Total Freight"
      ];
      const lines = [
        headers.join(","),
        ...rows.map((r) =>
          [
            `"${r.billingParty.replace(/"/g, '""')}"`,
            ...cols.flatMap((m) => [r.months[m.key]?.cnt || 0, (r.months[m.key]?.freight || 0).toFixed(2)]),
            r.totalCnt,
            r.totalFreight.toFixed(2)
          ].join(",")
        ),
        [
          "Total",
          ...cols.flatMap((m) => [totals.months[m.key]?.cnt || 0, (totals.months[m.key]?.freight || 0).toFixed(2)]),
          totals.totalCnt,
          totals.totalFreight.toFixed(2)
        ].join(",")
      ];
      csv = lines.join("\n");
      filename = `Party_Month_Wise_Booking_Summary_${fromDate}_${toDate}.csv`;
    } else if (type === "branch-month") {
      const cols: MonthCol[] = payload?.months || months;
      const rows: BranchMonthRow[] = payload?.data || filteredBranchMonth;
      const totals = payload?.totals || branchMonthTotals;
      const headers = [
        "Branch",
        ...cols.flatMap((m) => [`${m.label} cnt`, `${m.label} Freight`]),
        "Total cnt",
        "Total Freight"
      ];
      const lines = [
        headers.join(","),
        ...rows.map((r) =>
          [
            `"${r.branch.replace(/"/g, '""')}"`,
            ...cols.flatMap((m) => [r.months[m.key]?.cnt || 0, (r.months[m.key]?.freight || 0).toFixed(2)]),
            r.totalCnt,
            r.totalFreight.toFixed(2)
          ].join(",")
        ),
        [
          "Total",
          ...cols.flatMap((m) => [totals.months[m.key]?.cnt || 0, (totals.months[m.key]?.freight || 0).toFixed(2)]),
          totals.totalCnt,
          totals.totalFreight.toFixed(2)
        ].join(",")
      ];
      csv = lines.join("\n");
      filename = `Branch_Month_Wise_Booking_Summary_${fromDate}_${toDate}.csv`;
    } else {
      toast.error("No data to export");
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) => ({ ...prev, [region]: !prev[region] }));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {step === "filter" && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              title="Excel"
              onClick={() => loadReport({ exportExcel: true })}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Table"
              disabled={loading}
              onClick={() => loadReport({ forceChart: false })}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center disabled:opacity-60"
            >
              <Table2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Chart"
              disabled={loading}
              onClick={() => loadReport({ forceChart: true, typeOverride: "branch" })}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center disabled:opacity-60"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Edit filters"
              onClick={() => toast.info("Adjust filters below, then open Table / Chart")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div>
              <div className="h-11 px-3 border border-slate-300 rounded-md text-sm flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate flex-1">{dateLabel}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 px-2 border border-slate-300 rounded text-xs"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 px-2 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Booking Branch
              </label>
              <select
                value={bookingBranch}
                onChange={(e) => setBookingBranch(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option value="ALL">--Show All--</option>
                {branches.map((b) => (
                  <option key={b.code} value={b.label}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Billing Party
              </label>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex h-7 w-5 items-center justify-center rounded-sm bg-[#0171d3] text-white text-xs font-bold shadow">
                  &gt;
                </span>
              </div>
              <select
                value={billingParty}
                onChange={(e) => setBillingParty(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option value="">--Show All--</option>
                {parties.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white"
              >
                {REPORT_OPTIONS.map((o) => (
                  <option key={o.value || "select"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div data-print-root className="bg-white border border-slate-300 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-300 text-[11px] print:hidden">
            <span className="text-slate-600">1 of 1</span>
            <button
              type="button"
              title="Refresh"
              onClick={() => loadReport({ forceChart: showChart })}
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
              onClick={() => printScoped()}
              className="h-7 px-2 border border-slate-300 rounded bg-white inline-flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Find"
                className="h-7 w-40 px-2 border border-slate-300 rounded"
              />
              <button type="button" className="h-7 px-2 border border-slate-300 rounded bg-white">
                Next
              </button>
            </div>
            {activeType === "branch" && (
              <button
                type="button"
                onClick={() => setShowChart((v) => !v)}
                className="h-7 px-2 border border-slate-300 rounded bg-white"
              >
                {showChart ? "Hide Chart" : "Show Chart"}
              </button>
            )}
          </div>

          <div style={{ zoom: zoomScale }} className="p-4 overflow-x-auto">
            {activeType === "party" && (
              <>
                <div className="text-center mb-3">
                  <div className="text-sm font-bold text-[#0171d3]">{reportTitle}</div>
                </div>
                <table className="w-full border-collapse text-[11px] max-w-3xl mx-auto">
                  <thead>
                    <tr className="bg-[#0171d3] text-white">
                      <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold">Billing Party</th>
                      <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold">Total CNS</th>
                      <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParty.map((r, idx) => (
                      <tr key={`${r.billingParty}-${idx}`} className="odd:bg-white even:bg-slate-50">
                        <td className="border border-slate-200 px-2 py-1">{r.billingParty || "\u00A0"}</td>
                        <td className="border border-slate-200 px-2 py-1 text-right">{formatNum(r.totalCns)}</td>
                        <td className="border border-slate-200 px-2 py-1 text-right">{formatMoney(r.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-semibold">
                      <td className="border border-slate-200 px-2 py-1.5">Total</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">{formatNum(partyTotals.totalCns)}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">{formatMoney(partyTotals.amount)}</td>
                    </tr>
                    {filteredParty.length === 0 && (
                      <tr>
                        <td colSpan={3} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                          No bookings found for selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}

            {activeType === "branch" && (
              <>
                {showChart && (
                  <div className="mb-6">
                    <div className="text-center mb-2">
                      <div className="text-sm font-bold text-slate-800">{reportTitle}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(toDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-[11px] mb-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 bg-[#c62828] inline-block" /> DKTCOUNT
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 bg-[#1565c0] inline-block" /> SUMFRT
                      </span>
                    </div>
                    <div className="flex items-end justify-center gap-10 h-56 border-b border-l border-slate-300 px-8 pb-1 relative">
                      {branchChart.map((c) => (
                        <div key={c.label} className="flex items-end gap-3 h-full">
                          <div className="flex flex-col items-center justify-end h-full gap-1">
                            <span className="text-[10px] font-semibold text-[#c62828]">{formatNum(c.dktCount)}</span>
                            <div
                              className="w-10 bg-[#c62828] rounded-t-sm shadow"
                              style={{ height: `${Math.max(4, (c.dktCount / maxChart) * 100)}%` }}
                              title={`DKTCOUNT: ${c.dktCount}`}
                            />
                          </div>
                          <div className="flex flex-col items-center justify-end h-full gap-1">
                            <span className="text-[10px] font-semibold text-[#1565c0]">{formatMoney(c.sumFrt)}</span>
                            <div
                              className="w-14 bg-[#1565c0] rounded-t-sm shadow"
                              style={{
                                height: `${Math.max(8, (c.sumFrt / maxChart) * 100)}%`,
                                transform: "perspective(40px) rotateY(-8deg)",
                                transformOrigin: "bottom"
                              }}
                              title={`SUMFRT: ${c.sumFrt}`}
                            />
                          </div>
                        </div>
                      ))}
                      {branchChart.length === 0 && (
                        <div className="text-slate-400 text-sm self-center">No chart data</div>
                      )}
                    </div>
                    <div className="flex justify-center gap-10 mt-1 text-[11px] font-semibold text-slate-700">
                      {branchChart.map((c) => (
                        <div key={`lbl-${c.label}`} className="w-[6.5rem] text-center">
                          {c.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <table className="w-full border-collapse text-[11px] max-w-4xl mx-auto">
                  <thead>
                    <tr className="bg-[#0171d3] text-white">
                      <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold">Regions</th>
                      <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold">Branch</th>
                      <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold">Total Docket</th>
                      <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold">Total Freight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegions.map((r) => (
                      <React.Fragment key={r.region}>
                        <tr className="bg-white">
                          <td className="border border-slate-200 px-2 py-1">
                            <button
                              type="button"
                              onClick={() => toggleRegion(r.region)}
                              className="inline-flex items-center gap-1 font-semibold"
                            >
                              <span className="inline-flex w-4 h-4 items-center justify-center border border-slate-400 text-[10px] leading-none bg-slate-50">
                                {expandedRegions[r.region] ? "−" : "+"}
                              </span>
                              {r.region}
                            </button>
                          </td>
                          <td className="border border-slate-200 px-2 py-1" />
                          <td className="border border-slate-200 px-2 py-1 text-right">{formatNum(r.totalDocket)}</td>
                          <td className="border border-slate-200 px-2 py-1 text-right">{formatMoney(r.totalFreight)}</td>
                        </tr>
                        {expandedRegions[r.region] &&
                          r.branches.map((b) => (
                            <tr key={b.branchCode} className="bg-slate-50">
                              <td className="border border-slate-200 px-2 py-1" />
                              <td className="border border-slate-200 px-2 py-1">{b.branch}</td>
                              <td className="border border-slate-200 px-2 py-1 text-right">{formatNum(b.totalDocket)}</td>
                              <td className="border border-slate-200 px-2 py-1 text-right">
                                {formatMoney(b.totalFreight)}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    ))}
                    <tr className="bg-slate-100 font-semibold">
                      <td className="border border-slate-200 px-2 py-1.5" colSpan={2}>
                        Total
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">
                        {formatNum(branchTotals.totalDocket)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">
                        {formatMoney(branchTotals.totalFreight)}
                      </td>
                    </tr>
                    {filteredRegions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                          No bookings found for selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}

            {activeType === "party-month" && (
              <table className="w-full border-collapse text-[11px] min-w-[720px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold align-bottom">
                      Billing Party
                    </th>
                    {months.map((m) => (
                      <th key={m.key} colSpan={2} className="border border-[#015fae] px-2 py-1.5 text-center font-semibold">
                        {m.label}
                      </th>
                    ))}
                    <th colSpan={2} className="border border-[#015fae] px-2 py-1.5 text-center font-semibold">
                      Total
                    </th>
                  </tr>
                  <tr className="bg-[#0171d3] text-white">
                    {months.map((m) => (
                      <React.Fragment key={`sub-${m.key}`}>
                        <th className="border border-[#015fae] px-2 py-1 text-right font-semibold">CNT</th>
                        <th className="border border-[#015fae] px-2 py-1 text-right font-semibold">Freight</th>
                      </React.Fragment>
                    ))}
                    <th className="border border-[#015fae] px-2 py-1 text-right font-semibold">CNT</th>
                    <th className="border border-[#015fae] px-2 py-1 text-right font-semibold">Freight</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartyMonth.map((r, idx) => (
                    <tr key={`${r.billingParty}-${idx}`} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.billingParty || "\u00A0"}</td>
                      {months.map((m) => (
                        <React.Fragment key={`${r.billingParty}-${m.key}`}>
                          <td className="border border-slate-200 px-2 py-1 text-right">
                            {formatNum(r.months[m.key]?.cnt || 0)}
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-right">
                            {(r.months[m.key]?.freight || 0).toFixed(2)}
                          </td>
                        </React.Fragment>
                      ))}
                      <td className="border border-slate-200 px-2 py-1 text-right">{formatNum(r.totalCnt)}</td>
                      <td className="border border-slate-200 px-2 py-1 text-right">{r.totalFreight.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-semibold">
                    <td className="border border-slate-200 px-2 py-1.5">Total</td>
                    {months.map((m) => (
                      <React.Fragment key={`tot-${m.key}`}>
                        <td className="border border-slate-200 px-2 py-1.5 text-right">
                          {formatNum(partyMonthTotals.months[m.key]?.cnt || 0)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right">
                          {(partyMonthTotals.months[m.key]?.freight || 0).toFixed(2)}
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="border border-slate-200 px-2 py-1.5 text-right">{formatNum(partyMonthTotals.totalCnt)}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right">
                      {partyMonthTotals.totalFreight.toFixed(2)}
                    </td>
                  </tr>
                  {filteredPartyMonth.length === 0 && (
                    <tr>
                      <td
                        colSpan={3 + months.length * 2}
                        className="border border-slate-200 px-3 py-8 text-center text-slate-500"
                      >
                        No bookings found for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeType === "branch-month" && (
              <table className="w-full border-collapse text-[11px] min-w-[720px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold align-bottom">
                      Branch
                    </th>
                    {months.map((m) => (
                      <th key={m.key} colSpan={2} className="border border-[#015fae] px-2 py-1.5 text-center font-semibold">
                        {m.label}
                      </th>
                    ))}
                    <th colSpan={2} className="border border-[#015fae] px-2 py-1.5 text-center font-semibold">
                      Total
                    </th>
                  </tr>
                  <tr className="bg-[#0171d3] text-white">
                    {months.map((m) => (
                      <React.Fragment key={`bsub-${m.key}`}>
                        <th className="border border-[#015fae] px-2 py-1 text-right font-semibold">cnt</th>
                        <th className="border border-[#015fae] px-2 py-1 text-right font-semibold">Freight</th>
                      </React.Fragment>
                    ))}
                    <th className="border border-[#015fae] px-2 py-1 text-right font-semibold">cnt</th>
                    <th className="border border-[#015fae] px-2 py-1 text-right font-semibold">Freight</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranchMonth.map((r) => (
                    <tr key={r.branch} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.branch}</td>
                      {months.map((m) => (
                        <React.Fragment key={`${r.branch}-${m.key}`}>
                          <td className="border border-slate-200 px-2 py-1 text-right">
                            {formatNum(r.months[m.key]?.cnt || 0)}
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-right">
                            {(r.months[m.key]?.freight || 0).toFixed(2)}
                          </td>
                        </React.Fragment>
                      ))}
                      <td className="border border-slate-200 px-2 py-1 text-right">{formatNum(r.totalCnt)}</td>
                      <td className="border border-slate-200 px-2 py-1 text-right">{r.totalFreight.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-semibold">
                    <td className="border border-slate-200 px-2 py-1.5">Total</td>
                    {months.map((m) => (
                      <React.Fragment key={`btot-${m.key}`}>
                        <td className="border border-slate-200 px-2 py-1.5 text-right">
                          {formatNum(branchMonthTotals.months[m.key]?.cnt || 0)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right">
                          {(branchMonthTotals.months[m.key]?.freight || 0).toFixed(2)}
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="border border-slate-200 px-2 py-1.5 text-right">
                      {formatNum(branchMonthTotals.totalCnt)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right">
                      {branchMonthTotals.totalFreight.toFixed(2)}
                    </td>
                  </tr>
                  {filteredBranchMonth.length === 0 && (
                    <tr>
                      <td
                        colSpan={3 + months.length * 2}
                        className="border border-slate-200 px-3 py-8 text-center text-slate-500"
                      >
                        No bookings found for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
