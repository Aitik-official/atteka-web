"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart2, Calendar, ChevronDown, FileSpreadsheet, Pencil, Printer, RefreshCw, Search, Table2 } from "lucide-react";
import { toast } from "@/lib/toastBus";

type MrRow = {
  mrNumber: string;
  manualMr: string;
  mrDateLabel: string;
  mrBranch: string;
  partyName: string;
  mrAmount: number;
  freightDed: number;
  claimDed: number;
  otherDed: number;
  tdsDed: number;
  totalDed: number;
  excessAmount: number;
  netAmount: number;
  chqNo: string;
  chqDateLabel: string;
  chqAmount: number;
  depositedIntoBank: string;
  interest24: number;
};

type Totals = {
  mrAmount: number;
  freightDed: number;
  claimDed: number;
  otherDed: number;
  tdsDed: number;
  totalDed: number;
  excessAmount: number;
  netAmount: number;
  chqAmount: number;
  interest24: number;
};

type Section = { groupKey: string; rows: MrRow[]; branchTotal: Totals };

const COLUMNS: { key: keyof MrRow | "label"; label: string; align?: "right"; totalKey?: keyof Totals }[] = [
  { key: "mrNumber", label: "MR Number" },
  { key: "manualMr", label: "Manual MR" },
  { key: "mrDateLabel", label: "MR Date" },
  { key: "mrBranch", label: "MR Branch" },
  { key: "partyName", label: "Party Name" },
  { key: "mrAmount", label: "MR Amount", align: "right", totalKey: "mrAmount" },
  { key: "freightDed", label: "Freigh Ded", align: "right", totalKey: "freightDed" },
  { key: "claimDed", label: "Claim Ded", align: "right", totalKey: "claimDed" },
  { key: "otherDed", label: "Other Ded", align: "right", totalKey: "otherDed" },
  { key: "tdsDed", label: "TDS Ded", align: "right", totalKey: "tdsDed" },
  { key: "totalDed", label: "Total Ded", align: "right", totalKey: "totalDed" },
  { key: "excessAmount", label: "Excess Amount", align: "right", totalKey: "excessAmount" },
  { key: "netAmount", label: "Net Amount", align: "right", totalKey: "netAmount" },
  { key: "chqNo", label: "Chqno" },
  { key: "chqDateLabel", label: "Chq Date" },
  { key: "chqAmount", label: "Chq amount", align: "right", totalKey: "chqAmount" },
  { key: "depositedIntoBank", label: "Deposited into Bank" },
  { key: "interest24", label: "Interest @24%", align: "right", totalKey: "interest24" }
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

function fmt(n: number) {
  return Number(n || 0).toFixed(2);
}

export default function MrWiseCollectionPage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [collectionBranch, setCollectionBranch] = useState("");
  const [billingParty, setBillingParty] = useState("");
  const [groupBy, setGroupBy] = useState("Branch");
  const [branches, setBranches] = useState<string[]>([]);
  const [parties, setParties] = useState<{ code: string; name: string }[]>([]);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [sections, setSections] = useState<Section[]>([]);
  const [grandTotal, setGrandTotal] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState("100%");
  const [findText, setFindText] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/branches"), fetch("/api/customers")])
      .then(async ([bRes, cRes]) => {
        const b = await bRes.json();
        const c = await cRes.json();
        if (b.success) {
          setBranches(
            (b.data || [])
              .map((x: any) => String(x.branchCode || x.code || "").trim().toUpperCase())
              .filter(Boolean)
          );
        }
        if (c.success) {
          setParties(
            (c.data || [])
              .map((x: any) => ({
                code: String(x.customerCode || x.code || "").trim(),
                name: String(x.customerName || x.name || "").trim()
              }))
              .filter((x: { name: string }) => x.name)
          );
        }
      })
      .catch(() => {});
  }, []);

  const dateLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;
  const filteredSections = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        rows: s.rows.filter((r) =>
          [
            r.mrNumber,
            r.manualMr,
            r.partyName,
            r.mrBranch,
            r.chqNo,
            r.depositedIntoBank
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      }))
      .filter((s) => s.rows.length > 0);
  }, [sections, findText]);

  const zoomScale = Number(String(zoom).replace("%", "")) / 100 || 1;

  const loadReport = async (alsoExport = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        collectionBranch: collectionBranch || "Show All",
        billingParty: billingParty || "Show All",
        groupBy
      });
      const res = await fetch(`/api/reports/mr-wise-collection?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load MR wise Collection Report");
        return;
      }
      setSections(data.sections || []);
      setGrandTotal(data.grandTotal || null);
      setFindText("");
      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (alsoExport) exportCsv(data.sections || [], data.grandTotal || null);
    } catch {
      toast.error("Failed to load MR wise Collection Report");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = (secs: Section[] = filteredSections, grand: Totals | null = grandTotal) => {
    const flat = secs.flatMap((s) => s.rows);
    if (!flat.length) {
      toast.error("No data to export");
      return;
    }
    const headers = COLUMNS.map((c) => c.label);
    const lines = flat.map((r) =>
      COLUMNS.map((c) => {
        const v = r[c.key as keyof MrRow];
        return `"${String(v ?? "").replace(/"/g, '""')}"`;
      }).join(",")
    );
    if (grand) {
      lines.push(
        COLUMNS.map((c) => {
          if (c.key === "mrNumber") return '"Grand Total"';
          if (c.totalKey) return `"${fmt(grand[c.totalKey])}"`;
          return '""';
        }).join(",")
      );
    }
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MR_Wise_Collection_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  const renderTotalRow = (label: string, tot: Totals, emphasize: "branch" | "grand") => (
    <tr className={emphasize === "grand" ? "bg-[#cfe2f5]" : "bg-slate-200"}>
      {COLUMNS.map((c, i) => (
        <td
          key={c.key}
          className={`border border-slate-300 px-2 py-1 whitespace-nowrap font-semibold ${
            c.align === "right" ? "text-right" : ""
          }`}
        >
          {i === 0 ? label : c.totalKey ? fmt(tot[c.totalKey]) : ""}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {step === "filter" && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              title="Excel"
              onClick={() => loadReport(true)}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
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
              onClick={() => toast.info("Open Table for MR collection details")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Edit filters"
              onClick={() => toast.info("Adjust filters below, then open Table")}
              className="w-11 h-11 rounded-md bg-[#0171d3] text-white shadow-md hover:bg-[#015fae] flex items-center justify-center"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Colletion Date
              </label>
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
                Collection Branch
              </label>
              <select
                value={collectionBranch}
                onChange={(e) => setCollectionBranch(e.target.value)}
                className={`w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white ${
                  collectionBranch ? "text-slate-800" : "text-slate-400"
                }`}
              >
                <option value="">Collection Branch</option>
                <option value="Show All">Show All</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="ALC1">ALC1</option>
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Billing Party
              </label>
              <select
                value={billingParty}
                onChange={(e) => setBillingParty(e.target.value)}
                className={`w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white ${
                  billingParty ? "text-slate-800" : "text-slate-400"
                }`}
              >
                <option value="">Billing Party</option>
                <option value="Show All">Show All</option>
                {parties.map((p) => (
                  <option key={`${p.code}-${p.name}`} value={p.name}>
                    {p.code ? `${p.code} - ${p.name}` : p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white text-slate-800"
              >
                <option value="Branch">Branch</option>
                <option value="Party">Party</option>
                <option value="Date">Date</option>
                <option value="None">None</option>
              </select>
            </div>
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
          </div>

          <div style={{ zoom: zoomScale }} className="p-4 overflow-x-auto">
            <div className="text-center mb-3">
              <div className="text-sm font-bold text-red-600">MR Wise Collection Reports</div>
              <div className="text-xs text-red-600 mt-0.5">
                Collection Date From {formatLong(fromDate)} To {formatLong(toDate)}
              </div>
            </div>

            <table className="w-full border-collapse text-[11px] min-w-[2200px]">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSections.map((sec) => (
                  <React.Fragment key={sec.groupKey}>
                    {sec.rows.map((r, idx) => (
                      <tr key={`${r.mrNumber}-${idx}`} className="odd:bg-white even:bg-slate-50">
                        {COLUMNS.map((c) => (
                          <td
                            key={c.key}
                            className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${
                              c.align === "right" ? "text-right" : ""
                            } ${c.key === "mrNumber" ? "font-mono font-semibold text-[#0171d3]" : ""}`}
                          >
                            {c.align === "right" && typeof r[c.key as keyof MrRow] === "number"
                              ? fmt(r[c.key as keyof MrRow] as number)
                              : String(r[c.key as keyof MrRow] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {groupBy !== "None" && renderTotalRow("Branch Total", sec.branchTotal, "branch")}
                  </React.Fragment>
                ))}
                {grandTotal && renderTotalRow("Grand Total", grandTotal, "grand")}
                {filteredSections.every((s) => s.rows.length === 0) && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No money receipts found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
