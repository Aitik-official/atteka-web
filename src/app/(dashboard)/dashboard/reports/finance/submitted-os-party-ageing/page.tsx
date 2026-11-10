"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart2, Calendar, ChevronDown, FileSpreadsheet, Pencil, Printer, RefreshCw, Search, Table2, X } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type Cell = { bills: number; amount: number };

type AgeRow = {
  partyCode: string;
  partyName: string;
  crPeriod: number;
  crLimited: number;
  typeOfCustomer: string;
  salesPerson: string;
  collectionOwner: string;
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
  onAccountAmount: number;
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

export default function SubmittedOsPartyAgeingPage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [asOnDate, setAsOnDate] = useState(toInputDate(new Date()));
  const [vertical, setVertical] = useState("Select");
  const [billingBranch, setBillingBranch] = useState("--Show All--");
  const [collectionBranch, setCollectionBranch] = useState("--Show All--");
  const [billingParty, setBillingParty] = useState("--Show All--");
  const [billType, setBillType] = useState("All");
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
      (r) =>
        r.partyCode.toLowerCase().includes(q) ||
        r.partyName.toLowerCase().includes(q) ||
        r.salesPerson.toLowerCase().includes(q) ||
        r.collectionOwner.toLowerCase().includes(q)
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
        billType: !billType || /^all$/i.test(billType) ? "Show All" : billType
      });
      const res = await fetch(`/api/reports/submitted-os-party-ageing?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Submitted O/S Party wise ageing");
        return;
      }
      setRows(data.data || []);
      setTotals(data.totals || null);
      setFindText("");
      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (alsoExport) exportCsv(data.data || [], data.totals || null);
    } catch {
      toast.error("Failed to load Submitted O/S Party wise ageing");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = (list: AgeRow[] = filtered, tot: AgeRow | null = totals) => {
    if (!list.length && !tot) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Party Code",
      "Party Name",
      "Cr. Period",
      "Cr. Limited",
      "Type of Customer",
      "Sales Person",
      "Collection Owner",
      ...AGE_GROUPS.flatMap((g) => [`${g.label} Bills`, `${g.label} Amount`]),
      "Total O/S Bills",
      "Total O/S Amount",
      "POD Bills",
      "POD Amount",
      "Tot Bills",
      "Net Amount",
      "ON Account Amount"
    ];
    const lineFor = (r: AgeRow) =>
      [
        r.partyCode,
        `"${String(r.partyName).replace(/"/g, '""')}"`,
        r.crPeriod,
        r.crLimited,
        r.typeOfCustomer,
        r.salesPerson,
        r.collectionOwner,
        ...AGE_GROUPS.flatMap((g) => {
          const v = r.buckets[g.key];
          return [v.bills, fmt(v.amount)];
        }),
        r.totalOs.bills,
        fmt(r.totalOs.amount),
        r.pddTotal.bills,
        fmt(r.pddTotal.amount),
        r.netOs.bills,
        fmt(r.netOs.amount),
        fmt(r.onAccountAmount)
      ].join(",");
    const lines = list.map(lineFor);
    if (tot) lines.push(lineFor(tot));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Submitted_OS_Party_Ageing_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  const chipField = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    options: { value: string; label: string }[],
    showAll = true
  ) => (
    <div className="relative">
      <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
        {label}
      </label>
      <div className="min-h-11 px-2 py-1.5 border border-slate-300 rounded-md flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 h-7 px-2 rounded bg-slate-100 text-xs text-slate-700 border border-slate-200">
          {value || "--Show All--"}
          {value && value !== "--Show All--" && (
            <button type="button" onClick={() => setValue(showAll ? "--Show All--" : "")}>
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) setValue(e.target.value);
          }}
          className="flex-1 min-w-[120px] h-8 border-0 bg-transparent text-sm outline-none"
        >
          <option value="">Add...</option>
          {showAll && <option value="--Show All--">--Show All--</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderRow = (r: AgeRow, emphasize = false) => (
    <tr key={`${r.partyCode}-${r.partyName}`} className={emphasize ? "" : "odd:bg-white even:bg-slate-50"}>
      <td className={`border border-slate-200 px-2 py-1 whitespace-nowrap font-semibold ${emphasize ? "bg-[#e8f1fb]" : ""}`}>
        {r.partyCode}
      </td>
      <td className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${emphasize ? "bg-[#e8f1fb] font-semibold" : ""}`}>
        {r.partyName}
      </td>
      <td className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${emphasize ? "bg-[#e8f1fb]" : ""}`}>
        {emphasize ? "" : r.crPeriod}
      </td>
      <td className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${emphasize ? "bg-[#e8f1fb]" : ""}`}>
        {emphasize ? "" : fmt(r.crLimited)}
      </td>
      <td className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${emphasize ? "bg-[#e8f1fb]" : ""}`}>
        {r.typeOfCustomer}
      </td>
      <td className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${emphasize ? "bg-[#e8f1fb]" : ""}`}>
        {r.salesPerson}
      </td>
      <td className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${emphasize ? "bg-[#e8f1fb]" : ""}`}>
        {r.collectionOwner}
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
              {v.bills || ""}
            </td>
            <td
              className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${
                emphasize ? "bg-[#e8f1fb] font-semibold" : ""
              }`}
            >
              {v.amount ? fmt(v.amount) : emphasize ? "0.00" : ""}
            </td>
          </React.Fragment>
        );
      })}
      <td className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${emphasize ? "bg-[#e8f1fb] font-semibold" : ""}`}>
        {r.totalOs.bills || ""}
      </td>
      <td className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${emphasize ? "bg-[#e8f1fb] font-semibold" : ""}`}>
        {fmt(r.totalOs.amount)}
      </td>
      <td className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${emphasize ? "bg-[#e8f1fb] font-semibold" : ""}`}>
        {r.pddTotal.bills || ""}
      </td>
      <td className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${emphasize ? "bg-[#e8f1fb] font-semibold" : ""}`}>
        {fmt(r.pddTotal.amount)}
      </td>
      <td className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${emphasize ? "bg-[#e8f1fb] font-semibold" : ""}`}>
        {r.netOs.bills || ""}
      </td>
      <td className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${emphasize ? "bg-[#e8f1fb] font-semibold" : ""}`}>
        {fmt(r.netOs.amount)}
      </td>
      <td className={`border border-slate-200 px-2 py-1 text-right whitespace-nowrap ${emphasize ? "bg-[#e8f1fb] font-semibold" : ""}`}>
        {fmt(r.onAccountAmount)}
      </td>
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
              onClick={() => toast.info("Open Table for party wise ageing")}
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

            {chipField(
              "Billing Branch",
              billingBranch,
              setBillingBranch,
              branches.map((b) => ({ value: b.label, label: b.label }))
            )}
            {chipField(
              "Collection Branch",
              collectionBranch,
              setCollectionBranch,
              branches.map((b) => ({ value: b.label, label: b.label }))
            )}
            {chipField(
              "Billing Party",
              billingParty,
              setBillingParty,
              parties.map((p) => ({
                value: p.name,
                label: p.code ? `${p.code} - ${p.name}` : p.name
              }))
            )}

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3]">
                Bill Type
              </label>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white text-slate-800"
              >
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
              <div className="text-sm font-bold text-red-600">Submitted O/S Customer wise ageing [All Bill]</div>
              <div className="text-xs text-red-600 mt-0.5">
                Bill Date From {formatLong(fromDate)} To {formatLong(toDate)}
              </div>
              <div className="text-xs text-red-600 mt-0.5">
                Outstanding as on : {formatLong(asOnDate)}
              </div>
            </div>

            <table className="w-full border-collapse text-[11px] min-w-[3200px]">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                    Party Code
                  </th>
                  <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                    Party Name
                  </th>
                  <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                    Cr. Period
                  </th>
                  <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                    Cr. Limited
                  </th>
                  <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                    Type of Customer
                  </th>
                  <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                    Sales Person
                  </th>
                  <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                    Collection Owner
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
                  <th colSpan={2} className="border border-[#015fae] px-2 py-1.5 text-center font-semibold whitespace-nowrap">
                    Total O/S
                  </th>
                  <th colSpan={2} className="border border-[#015fae] px-2 py-1.5 text-center font-semibold whitespace-nowrap">
                    PDD Total
                  </th>
                  <th colSpan={2} className="border border-[#015fae] px-2 py-1.5 text-center font-semibold whitespace-nowrap">
                    Net O/S
                  </th>
                  <th rowSpan={2} className="border border-[#015fae] px-2 py-1.5 text-center font-semibold whitespace-nowrap">
                    ON Account
                    <div className="font-normal text-[10px]">ON Account Amount</div>
                  </th>
                </tr>
                <tr className="bg-[#0171d3] text-white">
                  {AGE_GROUPS.map((g) => (
                    <React.Fragment key={`sub-${g.key}`}>
                      <th className="border border-[#015fae] px-2 py-1 text-center font-semibold whitespace-nowrap">
                        Bills
                      </th>
                      <th className="border border-[#015fae] px-2 py-1 text-center font-semibold whitespace-nowrap">
                        Amount
                      </th>
                    </React.Fragment>
                  ))}
                  <th className="border border-[#015fae] px-2 py-1 text-center font-semibold whitespace-nowrap">
                    Bills
                  </th>
                  <th className="border border-[#015fae] px-2 py-1 text-center font-semibold whitespace-nowrap">
                    Amount
                  </th>
                  <th className="border border-[#015fae] px-2 py-1 text-center font-semibold whitespace-nowrap">
                    POD Bills
                  </th>
                  <th className="border border-[#015fae] px-2 py-1 text-center font-semibold whitespace-nowrap">
                    POD Amount
                  </th>
                  <th className="border border-[#015fae] px-2 py-1 text-center font-semibold whitespace-nowrap">
                    Tot Bills
                  </th>
                  <th className="border border-[#015fae] px-2 py-1 text-center font-semibold whitespace-nowrap">
                    Net Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {totals && renderRow(totals, true)}
                {filtered.map((r) => renderRow(r))}
                {filtered.length === 0 && !totals && (
                  <tr>
                    <td colSpan={28} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No party wise ageing data for selected filters.
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
