"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { EInvoiceAuthGate } from "@/components/finance/EInvoiceAuthGate";

type CnRow = {
  id: string;
  creditNoteDate: string;
  creditNoteNo: string;
  party: string;
  branch: string;
  gstin: string;
  sacCode: string;
  incomeHeads: string;
  amount: number;
  igst: number;
  cgst: number;
  sgst: number;
  grossAmount: number;
  irnStatus: "Pending" | "Generated" | "Failed";
  irn?: string | null;
  ackNo?: string | null;
};

type CustomerOpt = { code: string; name: string; label: string };
type DateMode = "range" | "today" | "last7" | "all";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function todayLongLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function GenerateCreditNoteIrnPage() {
  const today = useMemo(() => toInputDate(new Date()), []);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [dateMode, setDateMode] = useState<DateMode>("all");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [customer, setCustomer] = useState("");
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [rows, setRows] = useState<CnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/finance/generate-credit-note-irn?customers=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCustomers(d.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (dateMode === "today") {
      setFromDate(today);
      setToDate(today);
    } else if (dateMode === "last7") {
      setFromDate(toInputDate(daysAgo(6)));
      setToDate(today);
    }
  }, [dateMode, today]);

  const resolveDates = () => {
    if (dateMode === "all") return { from: "2000-01-01", to: "2099-12-31", showAll: true };
    if (dateMode === "today") return { from: today, to: today, showAll: false };
    if (dateMode === "last7") return { from: toInputDate(daysAgo(6)), to: today, showAll: false };
    return { from: fromDate, to: toDate, showAll: false };
  };

  const loadNotes = async () => {
    setLoading(true);
    try {
      const { from, to, showAll } = resolveDates();
      const params = new URLSearchParams({
        from,
        to,
        showAll: showAll ? "1" : "0",
        customer: customer.trim()
      });
      const res = await fetch(`/api/finance/generate-credit-note-irn?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load credit notes");
        return;
      }
      setRows(data.data || []);
      setStep("report");
      if (!(data.data || []).length) toast.warning("No credit notes found for selected criteria");
    } catch {
      toast.error("Failed to load credit notes");
    } finally {
      setLoading(false);
    }
  };

  const generateIrn = async (row: CnRow) => {
    if (row.irnStatus === "Generated") {
      toast.info(`IRN already generated: ${row.irn}`);
      return;
    }
    setGeneratingId(row.creditNoteNo);
    try {
      const res = await fetch("/api/finance/generate-credit-note-irn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditNoteNo: row.creditNoteNo })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Credit Note IRN generation failed");
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.creditNoteNo === row.creditNoteNo
            ? {
                ...r,
                irnStatus: "Generated",
                irn: data.data?.irn || null,
                ackNo: data.data?.ackNo || null
              }
            : r
        )
      );
      if (data.data?.irn) {
        toast.document("Credit Note IRN generated successfully (demo). GST / NIC IRP pending.", {
          title: "Credit Note IRN",
          code: data.data.irn
        });
      } else {
        toast.success("Credit Note IRN generated successfully (demo). GST / NIC IRP pending.", {
          title: "Credit Note IRN"
        });
      }
      if (data.data?.ackNo) {
        toast.info(`Ack No: ${data.data.ackNo}`, { durationMs: 5000 });
      }
    } catch {
      toast.error("Credit Note IRN request failed");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <EInvoiceAuthGate moduleLabel="Generate Credit Note IRN">
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Credit Note Details Selection Criteria
          </div>

          <div className="px-4 py-4 space-y-4 text-[12px]">
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-start">
              <div className="font-semibold text-slate-800 pt-1">Credit Note Date</div>
              <div className="space-y-2.5">
                <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cnDate"
                    checked={dateMode === "range"}
                    onChange={() => setDateMode("range")}
                    className="accent-[#0171d3]"
                  />
                  <span>From :</span>
                  <input
                    type="date"
                    value={fromDate}
                    disabled={dateMode !== "range"}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[145px] disabled:bg-slate-100"
                  />
                  <span>To :</span>
                  <input
                    type="date"
                    value={toDate}
                    disabled={dateMode !== "range"}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-8 px-2 border border-slate-300 rounded-sm text-sm w-[145px] disabled:bg-slate-100"
                  />
                </label>

                <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cnDate"
                    checked={dateMode === "today"}
                    onChange={() => setDateMode("today")}
                    className="accent-[#0171d3]"
                  />
                  <span>Todays - {todayLongLabel()}</span>
                </label>

                <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cnDate"
                    checked={dateMode === "last7"}
                    onChange={() => setDateMode("last7")}
                    className="accent-[#0171d3]"
                  />
                  <span>Last 7 Days</span>
                </label>

                <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cnDate"
                    checked={dateMode === "all"}
                    onChange={() => setDateMode("all")}
                    className="accent-[#0171d3]"
                  />
                  <span>Show All</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-center border-t border-slate-200 pt-4">
              <div className="font-semibold text-slate-800">Customer</div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    list="cn-irn-customers"
                    placeholder="Leave blank for all customers"
                    className="w-full h-9 pl-3 pr-9 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#0171d3]"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  <datalist id="cn-irn-customers">
                    {customers.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.label}
                      </option>
                    ))}
                  </datalist>
                </div>
                <span className="text-[11px] text-[#0171d3] italic">
                  For All Customer list, keep blank the input box.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center py-4 border-t border-slate-200">
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadNotes()}
              className="h-9 min-w-[100px] px-8 rounded-md border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-sm font-semibold hover:bg-[#d7e8f8] disabled:opacity-60"
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
              <div>
                <h1 className="text-base font-bold text-slate-900">Genrate Credit Note (IRN)</h1>
                <p className="text-[11px] text-slate-500">
                  {rows.length} credit note(s) · GST / NIC IRP integration pending
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1280px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    {[
                      "Credit Note Date",
                      "Credit Note No",
                      "Party",
                      "Branch",
                      "GSTIN",
                      "SAC CODE",
                      "Income Heads",
                      "AMOUNT",
                      "IGST",
                      "CGST",
                      "SGST",
                      "Gross Amount",
                      "Generate IRN"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          ["AMOUNT", "IGST", "CGST", "SGST", "Gross Amount"].includes(h)
                            ? "text-right"
                            : h === "Generate IRN"
                              ? "text-center"
                              : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/40">
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.creditNoteDate}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono">
                        {r.creditNoteNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.party}</td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.branch}</td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono">
                        {r.gstin}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.sacCode}</td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.incomeHeads}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono whitespace-nowrap">
                        {fmt(r.amount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono whitespace-nowrap">
                        {fmt(r.igst)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono whitespace-nowrap">
                        {fmt(r.cgst)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono whitespace-nowrap">
                        {fmt(r.sgst)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono whitespace-nowrap">
                        {fmt(r.grossAmount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                        {r.irnStatus === "Generated" ? (
                          <span className="text-emerald-700 font-semibold text-[10px]" title={r.irn || ""}>
                            Generated
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={generatingId === r.creditNoteNo}
                            onClick={() => void generateIrn(r)}
                            className="h-7 px-2 rounded bg-[#0171d3] text-white text-[10px] font-semibold hover:bg-[#015fae] disabled:opacity-60"
                          >
                            {generatingId === r.creditNoteNo ? "..." : "Generate IRN"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={13} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No credit notes to display.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-slate-200 text-[11px] text-slate-500 bg-slate-50">
              Demo credit notes are seeded for testing. Generated IRNs appear on Cancel IRN. Live GST
              wiring uses{" "}
              <code className="font-mono text-[10px]">POST /api/finance/generate-credit-note-irn</code>.
            </div>
          </div>
        </div>
      )}
    </div>
    </EInvoiceAuthGate>
  );
}
