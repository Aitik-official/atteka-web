"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, FileSpreadsheet, MoreHorizontal } from "lucide-react";
import { toast } from "@/lib/toastBus";

type SlRow = {
  srNo: string;
  branch: string;
  date: string;
  particular: string;
  debit: number;
  credit: number;
  voucherRef: string;
  docRef: string;
  narration: string;
  chequeNo: string;
  chequeDate: string;
  costCenter: string;
  isOpening?: boolean;
  isPeriodTotal?: boolean;
  isClosing?: boolean;
  isGrandTotal?: boolean;
};

type Meta = {
  branch: string;
  dateRange: string;
  accountHead: string;
  partyType: string;
  partyName: string;
  customerName: string;
};

type PartyOpt = { code: string; label: string; name: string };

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

const COLUMNS = [
  { key: "srNo", label: "Sr.No" },
  { key: "branch", label: "Branch" },
  { key: "date", label: "Date" },
  { key: "particular", label: "Particular" },
  { key: "debit", label: "Debit", align: "right" as const },
  { key: "credit", label: "Credit", align: "right" as const },
  { key: "voucherRef", label: "Voucher/Ref No." },
  { key: "docRef", label: "Doc/Ref No." },
  { key: "narration", label: "Narration" },
  { key: "chequeNo", label: "Cheque No" },
  { key: "chequeDate", label: "Cheque Date" },
  { key: "costCenter", label: "Cost Center" }
];

export default function SubsidiaryLedgerPage() {
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [branch, setBranch] = useState("--Show All--");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(6)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [accountHead, setAccountHead] = useState("Show All");
  const [customer, setCustomer] = useState("");
  const [vendor, setVendor] = useState("");
  const [octroi, setOctroi] = useState("");
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([]);
  const [accountHeads, setAccountHeads] = useState<string[]>(["Show All"]);
  const [customers, setCustomers] = useState<PartyOpt[]>([]);
  const [vendors, setVendors] = useState<PartyOpt[]>([]);
  const [octroiAgents, setOctroiAgents] = useState<PartyOpt[]>([]);
  const [rows, setRows] = useState<SlRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/branches"), fetch("/api/reports/subsidiary-ledger?lists=1")])
      .then(async ([bRes, lRes]) => {
        const b = await bRes.json();
        const l = await lRes.json();
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
        if (l.success) {
          setAccountHeads(l.data?.accountHeads || ["Show All"]);
          setCustomers(l.data?.customers || []);
          setVendors(l.data?.vendors || []);
          setOctroiAgents(l.data?.octroiAgents || []);
        }
      })
      .catch(() => {});
  }, []);

  const pickParty = (kind: "customer" | "vendor" | "octroi") => {
    if (kind === "customer") {
      const first = customers[0];
      if (!first) return toast.error("No demo customers available");
      setCustomer(first.name);
      setVendor("");
      setOctroi("");
      toast.success(`Customer selected: ${first.name}`);
      return;
    }
    if (kind === "vendor") {
      const first = vendors[0];
      if (!first) return toast.error("No demo vendors available");
      setVendor(first.name);
      setCustomer("");
      setOctroi("");
      toast.success(`Vendor selected: ${first.name}`);
      return;
    }
    const first = octroiAgents[0];
    if (!first) return toast.error("No demo octroi agents available");
    setOctroi(first.name);
    setCustomer("");
    setVendor("");
    toast.success(`Octroi Agent selected: ${first.name}`);
  };

  const loadReport = async () => {
    if (!customer && !vendor && !octroi) {
      toast.error("Enter Customer OR Vendor OR Octroi Agent");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        branch,
        accountHead,
        customer,
        vendor,
        octroi
      });
      const res = await fetch(`/api/reports/subsidiary-ledger?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Subsidiary Ledger");
        return;
      }
      setRows(data.data || []);
      setMeta(data.meta || null);
      setStep("report");
    } catch {
      toast.error("Failed to load Subsidiary Ledger");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!rows.length) {
      toast.error("No data to export");
      return;
    }
    const headers = COLUMNS.map((c) => c.label);
    const lines = rows.map((r) =>
      COLUMNS.map((c) => {
        const v = (r as any)[c.key];
        const s = typeof v === "number" ? fmt(v) : String(v ?? "");
        return `"${s.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Subsidiary_Ledger_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to Excel / CSV");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Select Branch / Profit Center
          </div>
          <div className="px-4 py-3 border-b border-slate-200 text-[12px] flex flex-wrap items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">
              Select Branch / Profit Center :
            </span>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="h-8 min-w-[240px] px-2 border border-slate-300 rounded-sm bg-white"
            >
              <option value="--Show All--">--Show All--</option>
              {branches.map((b) => (
                <option key={b.code} value={b.label}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Select Voucher Date Range
          </div>
          <div className="px-4 py-3 border-b border-slate-200 text-[12px] flex flex-wrap items-center gap-3">
            <span className="text-slate-600">From :</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[150px]"
            />
            <span className="text-slate-600 ml-2">To :</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[150px]"
            />
          </div>

          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">Select Account</div>
          <div className="px-4 py-4 space-y-3 text-[12px] border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={accountHead}
                onChange={(e) => setAccountHead(e.target.value)}
                className="h-8 min-w-[260px] px-2 border border-slate-300 rounded-sm bg-white"
              >
                {accountHeads.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-slate-300 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50"
                title="Account heads"
                onClick={() => toast.info("Pick an Account Head from the list")}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-700 font-semibold w-[120px]">Enter Customer</span>
              <input
                value={customer}
                onChange={(e) => {
                  setCustomer(e.target.value);
                  if (e.target.value) {
                    setVendor("");
                    setOctroi("");
                  }
                }}
                list="sl-customers"
                className="h-8 flex-1 min-w-[220px] px-2 border border-slate-300 rounded-sm bg-white"
              />
              <datalist id="sl-customers">
                {customers.map((c) => (
                  <option key={c.code} value={c.name} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => pickParty("customer")}
                className="h-8 w-8 rounded-full border border-slate-300 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center text-red-600 font-bold text-xs tracking-wide">OR</div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-700 font-semibold w-[120px]">Enter Vendor</span>
              <input
                value={vendor}
                onChange={(e) => {
                  setVendor(e.target.value);
                  if (e.target.value) {
                    setCustomer("");
                    setOctroi("");
                  }
                }}
                list="sl-vendors"
                className="h-8 flex-1 min-w-[220px] px-2 border border-slate-300 rounded-sm bg-white"
              />
              <datalist id="sl-vendors">
                {vendors.map((v) => (
                  <option key={v.code} value={v.name} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => pickParty("vendor")}
                className="h-8 w-8 rounded-full border border-slate-300 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center text-red-600 font-bold text-xs tracking-wide">OR</div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-700 font-semibold w-[120px]">Enter Octroi Agent</span>
              <input
                value={octroi}
                onChange={(e) => {
                  setOctroi(e.target.value);
                  if (e.target.value) {
                    setCustomer("");
                    setVendor("");
                  }
                }}
                list="sl-octroi"
                className="h-8 flex-1 min-w-[220px] px-2 border border-slate-300 rounded-sm bg-white"
              />
              <datalist id="sl-octroi">
                {octroiAgents.map((o) => (
                  <option key={o.code} value={o.name} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => pickParty("octroi")}
                className="h-8 w-8 rounded-full border border-slate-300 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-center py-4 bg-slate-50/40">
            <button
              type="button"
              disabled={loading}
              onClick={loadReport}
              className="h-9 min-w-[110px] px-6 rounded-full bg-[#0171d3] hover:bg-[#015fae] text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("filter")}
                className="h-8 w-8 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-base font-bold text-slate-900">Subsidiary Ledger</h1>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="h-9 px-3 rounded-md bg-[#0171d3] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#015fae]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export To Excel
            </button>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="px-4 py-3 text-[12px] space-y-1 border-b border-slate-200 bg-[#e8f1fb]">
              <div>
                <span className="font-semibold text-slate-700">Branch / Profit Center : </span>
                <span>{meta?.branch || branch}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Date Range : </span>
                <span>{meta?.dateRange}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Account Head : </span>
                <span>{meta?.accountHead || accountHead}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">
                  {meta?.partyType === "Vendor"
                    ? "Vendor Name"
                    : meta?.partyType === "Octroi Agent"
                      ? "Octroi Agent"
                      : "Customer Name"}{" "}
                  :{" "}
                </span>
                <span>{meta?.partyName}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1200px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    {COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          c.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const summary = r.isOpening || r.isPeriodTotal || r.isClosing || r.isGrandTotal;
                    return (
                      <tr
                        key={`${r.srNo}-${r.voucherRef}-${idx}`}
                        className={
                          r.isGrandTotal
                            ? "bg-[#0b1f3a] text-white font-bold"
                            : summary
                              ? "bg-[#5b9bd5] text-white font-semibold"
                              : "odd:bg-white even:bg-slate-50"
                        }
                      >
                        <td className="border border-slate-200 px-2 py-1 text-center whitespace-nowrap">
                          {r.srNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.branch}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.date}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.particular}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {fmt(r.debit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono whitespace-nowrap">
                          {fmt(r.credit)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.voucherRef}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.docRef}</td>
                        <td className="border border-slate-200 px-2 py-1">{r.narration}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">{r.chequeNo}</td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.chequeDate}
                        </td>
                        <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                          {r.costCenter}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={12} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No subsidiary ledger rows for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
