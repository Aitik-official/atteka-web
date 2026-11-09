"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart2, Calendar, ChevronDown, FileSpreadsheet, Pencil, Printer, RefreshCw, Search, Table2 } from "lucide-react";
import { toast } from "@/lib/toastBus";

type Row = {
  partyName: string;
  branchName: string;
  billType: string;
  amount: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
};

type Totals = {
  amount: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
};

const EMPTY_TOTALS: Totals = {
  amount: 0,
  igstAmount: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  totalAmount: 0
};

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

export default function PartyWiseBillRegisterPage() {
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [billingBranch, setBillingBranch] = useState("");
  const [collectionBranch, setCollectionBranch] = useState("");
  const [billingParty, setBillingParty] = useState("");
  const [billType, setBillType] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [parties, setParties] = useState<{ code: string; name: string }[]>([]);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
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
  const filtered = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.partyName.toLowerCase().includes(q) ||
        r.branchName.toLowerCase().includes(q) ||
        r.billType.toLowerCase().includes(q) ||
        String(r.totalAmount).includes(q)
    );
  }, [rows, findText]);

  const zoomScale = Number(String(zoom).replace("%", "")) / 100 || 1;

  const loadReport = async (alsoExport = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        billingBranch: billingBranch || "Show All",
        collectionBranch: collectionBranch || "Show All",
        billingParty: billingParty || "Show All",
        billType: billType || "Show All"
      });
      const res = await fetch(`/api/reports/party-wise-bill-register?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load party wise bill register");
        return;
      }
      setRows(data.data || []);
      setTotals(data.totals || EMPTY_TOTALS);
      setFindText("");
      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (alsoExport) exportCsv(data.data || [], data.totals || EMPTY_TOTALS);
    } catch {
      toast.error("Failed to load party wise bill register");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = (list: Row[] = filtered, tot: Totals = totals) => {
    if (!list.length) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Party Name",
      "Branch Name",
      "Bill Type",
      "Amount",
      "IGST Amount",
      "CGST Amount",
      "SGST Amount",
      "Total Amount"
    ];
    const lines = list.map((r) =>
      [
        `"${r.partyName.replace(/"/g, '""')}"`,
        r.branchName,
        r.billType,
        r.amount,
        r.igstAmount,
        r.cgstAmount,
        r.sgstAmount,
        r.totalAmount
      ].join(",")
    );
    lines.push(
      [
        "Grand Total",
        "",
        "",
        tot.amount,
        tot.igstAmount,
        tot.cgstAmount,
        tot.sgstAmount,
        tot.totalAmount
      ].join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Party_Wise_Bill_Register_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

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
              onClick={() => toast.info("Open Table for party wise summary")}
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
                Billing Date
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

            <div>
              <select
                value={billingBranch}
                onChange={(e) => setBillingBranch(e.target.value)}
                className={`w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white ${
                  billingBranch ? "text-slate-800" : "text-[#0171d3]"
                }`}
              >
                <option value="">Billing Branch</option>
                <option value="Show All">Show All</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="ALC1">ALC1</option>
              </select>
            </div>

            <div>
              <select
                value={collectionBranch}
                onChange={(e) => setCollectionBranch(e.target.value)}
                className={`w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white ${
                  collectionBranch ? "text-slate-800" : "text-[#0171d3]"
                }`}
              >
                <option value="">Collection Branch</option>
                <option value="Show All">Show All</option>
                {branches.map((b) => (
                  <option key={`coll-${b}`} value={b}>
                    {b}
                  </option>
                ))}
                <option value="ALC1">ALC1</option>
              </select>
            </div>

            <div>
              <select
                value={billingParty}
                onChange={(e) => setBillingParty(e.target.value)}
                className={`w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white ${
                  billingParty ? "text-slate-800" : "text-[#0171d3]"
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

            <div>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
                className={`w-full h-11 px-3 border border-slate-300 rounded-md text-sm bg-white ${
                  billType ? "text-slate-800" : "text-[#0171d3]"
                }`}
              >
                <option value="">Bill Type</option>
                <option value="Show All">Show All</option>
                <option value="Freight">Freight</option>
                <option value="Freight Bill">Freight Bill</option>
                <option value="Supplementary">Supplementary</option>
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
              <div className="text-sm font-bold text-red-600">Party wise Bill Register</div>
              <div className="text-xs text-red-600 mt-0.5">
                Bill Date From {formatLong(fromDate)} To {formatLong(toDate)}
              </div>
            </div>

            <table className="w-full border-collapse text-[11px] max-w-5xl mx-auto">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold">Party Name</th>
                  <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold">Branch Name</th>
                  <th className="border border-[#015fae] px-2 py-1.5 text-left font-semibold">Bill Type</th>
                  <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold">Amount</th>
                  <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold">IGST Amount</th>
                  <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold">CGST Amount</th>
                  <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold">SGST Amount</th>
                  <th className="border border-[#015fae] px-2 py-1.5 text-right font-semibold">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr key={`${r.partyName}-${r.branchName}-${r.billType}-${idx}`} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-1">{r.partyName}</td>
                    <td className="border border-slate-200 px-2 py-1">{r.branchName}</td>
                    <td className="border border-slate-200 px-2 py-1">{r.billType}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right">{r.amount}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right">{r.igstAmount}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right">{r.cgstAmount}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right">{r.sgstAmount}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right font-semibold">{r.totalAmount}</td>
                  </tr>
                ))}
                <tr className="bg-[#0171d3] text-white font-semibold">
                  <td className="border border-[#015fae] px-2 py-1.5" colSpan={3}>
                    Grand Total
                  </td>
                  <td className="border border-[#015fae] px-2 py-1.5 text-right">{totals.amount}</td>
                  <td className="border border-[#015fae] px-2 py-1.5 text-right">{totals.igstAmount}</td>
                  <td className="border border-[#015fae] px-2 py-1.5 text-right">{totals.cgstAmount}</td>
                  <td className="border border-[#015fae] px-2 py-1.5 text-right">{totals.sgstAmount}</td>
                  <td className="border border-[#015fae] px-2 py-1.5 text-right">{totals.totalAmount}</td>
                </tr>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No bills found for selected filters.
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
