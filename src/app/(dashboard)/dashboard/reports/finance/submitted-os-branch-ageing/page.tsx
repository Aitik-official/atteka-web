"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart2, Calendar, ChevronDown, FileSpreadsheet, Pencil, Printer, RefreshCw, Search, Table2, X } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type Cell = { bills: number; amount: number };

type AgeRow = {
  billBr: string;
  collBr: string;
  buckets: {
    d0_30: Cell;
    d31_60: Cell;
    d61_90: Cell;
    d91_120: Cell;
    d121_150: Cell;
    d151_180: Cell;
    d181_365: Cell;
    d365p: Cell;
  };
  totalOs: Cell;
  pddTotal: Cell;
  netOs: Cell;
};

const AGE_GROUPS: { key: keyof AgeRow["buckets"]; label: string }[] = [
  { key: "d0_30", label: "0-30 Days" },
  { key: "d31_60", label: "31-60 Days" },
  { key: "d61_90", label: "61-90 Days" },
  { key: "d91_120", label: "91-120 Days" },
  { key: "d121_150", label: "121-150 Days" },
  { key: "d151_180", label: "151-180 Days" },
  { key: "d181_365", label: "181-365 Days" },
  { key: "d365p", label: ">365 Days" }
];

const SUMMARY_GROUPS: { key: "totalOs" | "pddTotal" | "netOs"; label: string }[] = [
  { key: "totalOs", label: "Total O/S" },
  { key: "pddTotal", label: "PDD Total" },
  { key: "netOs", label: "Net O/S" }
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function toDisplayDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
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

export default function SubmittedOsBranchAgeingPage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [asOnDate, setAsOnDate] = useState(toInputDate(new Date()));
  const [vertical, setVertical] = useState("Select");
  const [billingBranch, setBillingBranch] = useState("");
  const [collectionBranch, setCollectionBranch] = useState("--Show All--");
  const [billingParty, setBillingParty] = useState("--Show All--");
  const [billType, setBillType] = useState("");
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([]);
  const [parties, setParties] = useState<{ code: string; name: string }[]>([]);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [rows, setRows] = useState<AgeRow[]>([]);
  const [totals, setTotals] = useState<AgeRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState("100%");
  const [findText, setFindText] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/branches"), fetch("/api/customers")])
      .then(async ([bRes, cRes]) => {
        const b = await bRes.json();
        const c = await cRes.json();
        if (b.success) {
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
  const filtered = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.billBr.toLowerCase().includes(q) || r.collBr.toLowerCase().includes(q)
    );
  }, [rows, findText]);

  const zoomScale = Number(String(zoom).replace("%", "")) / 100 || 1;

  const loadReport = async (alsoExport = false) => {
    setLoading(true);
    try {
      const branchCode = billingBranch.includes(" - ")
        ? billingBranch.split(" - ").pop()!.trim()
        : billingBranch;
      const collCode = collectionBranch.includes(" - ")
        ? collectionBranch.split(" - ").pop()!.trim()
        : collectionBranch;
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        asOn: asOnDate,
        vertical,
        billingBranch: branchCode || "Show All",
        collectionBranch: collCode,
        billingParty,
        billType: billType || "Show All"
      });
      const res = await fetch(`/api/reports/submitted-os-branch-ageing?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Submitted O/S Branch wise ageing");
        return;
      }
      setRows(data.data || []);
      setTotals(data.totals || null);
      setFindText("");
      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (alsoExport) exportCsv(data.data || [], data.totals || null);
    } catch {
      toast.error("Failed to load Submitted O/S Branch wise ageing");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = (list: AgeRow[] = filtered, tot: AgeRow | null = totals) => {
    if (!list.length) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Bill Br.",
      "Coll. Br.",
      ...AGE_GROUPS.flatMap((g) => [`${g.label} Bills`, `${g.label} Amount`]),
      ...SUMMARY_GROUPS.flatMap((g) => [`${g.label} Bills`, `${g.label} Amount`])
    ];
    const lineFor = (r: AgeRow) =>
      [
        r.billBr,
        r.collBr,
        ...AGE_GROUPS.flatMap((g) => {
          const v = r.buckets[g.key];
          return [v.bills, fmt(v.amount)];
        }),
        ...SUMMARY_GROUPS.flatMap((g) => {
          const v = r[g.key];
          return [v.bills, fmt(v.amount)];
        })
      ].join(",");
    const lines = list.map(lineFor);
    if (tot) lines.push(lineFor(tot));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Submitted_OS_Branch_Ageing_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  const renderCells = (r: AgeRow, emphasize = false) => (
    <>
      <td className={`border border-slate-200 px-2 py-1 whitespace-nowrap font-semibold ${emphasize ? "bg-[#e8f1fb]" : ""}`}>
        {r.billBr}
      </td>
      <td className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${emphasize ? "bg-[#e8f1fb]" : ""}`}>
        {r.collBr}
      </td>
      {AGE_GROUPS.map((g) => {
        const v = r.buckets[g.key];
        return (
          <React.Fragment key={g.key}>
            <td
              className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${
                emphasize ? "bg-[#e8f1fb] font-semibold" : ""
              }`}
            >
              {v.bills}
            </td>
            <td
              className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${
                emphasize ? "bg-[#e8f1fb] font-semibold" : ""
              }`}
            >
              {fmt(v.amount)}
            </td>
          </React.Fragment>
        );
      })}
      {SUMMARY_GROUPS.map((g) => {
        const v = r[g.key];
        return (
          <React.Fragment key={g.key}>
            <td
              className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${
                emphasize ? "bg-[#e8f1fb] font-semibold" : ""
              }`}
            >
              {v.bills}
            </td>
            <td
              className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${
                emphasize ? "bg-[#e8f1fb] font-semibold" : ""
              }`}
            >
              {fmt(v.amount)}
            </td>
          </React.Fragment>
        );
      })}
    </>
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
              onClick={() => toast.info("Open Table for branch wise ageing")}
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
                Bill Date
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
                Vertices or Division
              </label>
              <select
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option>Select</option>
                <option>Show All</option>
                <option>FTL</option>
                <option>PTL</option>
                <option>WAREHOUSE</option>
                <option>EXPRESS</option>
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Billing Branch
              </label>
              <input
                value={billingBranch}
                onChange={(e) => setBillingBranch(e.target.value)}
                list="os-br-age-billing-branch"
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm"
                placeholder=""
              />
              <datalist id="os-br-age-billing-branch">
                {branches.map((b) => (
                  <option key={b.code} value={b.label} />
                ))}
              </datalist>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Collection Branch
              </label>
              <div className="min-h-11 px-2 py-1.5 border border-slate-300 rounded-md flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 h-7 px-2 rounded bg-slate-100 text-xs text-slate-700 border border-slate-200">
                  {collectionBranch || "--Show All--"}
                  {collectionBranch !== "--Show All--" && (
                    <button type="button" onClick={() => setCollectionBranch("--Show All--")}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setCollectionBranch(e.target.value);
                  }}
                  className="flex-1 min-w-[120px] h-8 border-0 bg-transparent text-sm outline-none"
                >
                  <option value="">Add branch...</option>
                  <option value="--Show All--">--Show All--</option>
                  {branches.map((b) => (
                    <option key={`coll-${b.code}`} value={b.label}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Billing Party
              </label>
              <div className="min-h-11 px-2 py-1.5 border border-slate-300 rounded-md flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 h-7 px-2 rounded bg-slate-100 text-xs text-slate-700 border border-slate-200">
                  {billingParty || "--Show All--"}
                  {billingParty !== "--Show All--" && (
                    <button type="button" onClick={() => setBillingParty("--Show All--")}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setBillingParty(e.target.value);
                  }}
                  className="flex-1 min-w-[120px] h-8 border-0 bg-transparent text-sm outline-none"
                >
                  <option value="">Add party...</option>
                  <option value="--Show All--">--Show All--</option>
                  {parties.map((p) => (
                    <option key={`${p.code}-${p.name}`} value={p.name}>
                      {p.code ? `${p.code} - ${p.name}` : p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Bill Type
              </label>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
                className={`w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white ${
                  billType ? "text-slate-800" : "text-slate-400"
                }`}
              >
                <option value="">Bill Type</option>
                <option value="All">All</option>
                <option value="Freight">Freight</option>
                <option value="Freight Bill">Freight Bill</option>
                <option value="Supplementary">Supplementary</option>
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                As on Date
              </label>
              <div className="h-11 px-3 border border-slate-300 rounded-md text-sm flex items-center gap-2">
                <span className="flex-1 text-slate-700">{toDisplayDate(asOnDate)}</span>
                <input
                  type="date"
                  value={asOnDate}
                  onChange={(e) => setAsOnDate(e.target.value)}
                  className="h-8 border border-slate-200 rounded px-1 text-xs"
                />
              </div>
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
          </div>

          <div style={{ zoom: zoomScale }} className="p-4 overflow-x-auto">
            <div className="text-center mb-3">
              <div className="text-sm font-bold text-red-600">Submitted O/S Branch wise ageing [All Bill]</div>
              <div className="text-xs text-red-600 mt-0.5">
                Bill Date From {formatLong(fromDate)} To {formatLong(toDate)}
              </div>
              <div className="text-xs text-red-600 mt-0.5">
                Outstanding as on : {formatLong(asOnDate)}
              </div>
            </div>

            <table className="w-full border-collapse text-[11px] min-w-[2400px]">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                    Bill Br.
                  </th>
                  <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                    Coll. Br.
                  </th>
                  {AGE_GROUPS.map((g) => (
                    <th
                      key={g.key}
                      colSpan={2}
                      className="border border-[#015fae] px-2 py-1.5 text-center font-semibold whitespace-nowrap"
                    >
                      {g.label}
                    </th>
                  ))}
                  {SUMMARY_GROUPS.map((g) => (
                    <th
                      key={g.key}
                      colSpan={2}
                      className="border border-[#015fae] px-2 py-1.5 text-center font-semibold whitespace-nowrap"
                    >
                      {g.label}
                    </th>
                  ))}
                </tr>
                <tr className="bg-[#0171d3] text-white">
                  {[...AGE_GROUPS, ...SUMMARY_GROUPS].map((g) => (
                    <React.Fragment key={`sub-${g.key}`}>
                      <th className="border border-[#015fae] px-2 py-1 text-center font-semibold whitespace-nowrap">
                        Bills
                      </th>
                      <th className="border border-[#015fae] px-2 py-1 text-center font-semibold whitespace-nowrap">
                        Amount
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={`${r.billBr}-${r.collBr}`} className="odd:bg-white even:bg-slate-50">
                    {renderCells(r)}
                  </tr>
                ))}
                {totals && <tr>{renderCells(totals, true)}</tr>}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={2 + (AGE_GROUPS.length + SUMMARY_GROUPS.length) * 2}
                      className="border border-slate-200 px-3 py-8 text-center text-slate-500"
                    >
                      No outstanding branch ageing data for selected filters.
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
