"use client";

import React, { useMemo, useState } from "react";

import { toast } from "@/lib/toastBus";

type SearchMode = "date" | "system" | "manual";

type DocRow = {
  documentNo: string;
  documentType: string;
  documentDate?: string | Date;
  docketNo?: string;
  fromLocation?: string;
  toLocation?: string;
  vehicleNo?: string;
  billingParty?: string;
  status?: string;
  statusLabel?: string;
  billNo?: string;
  billAmount?: number;
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatShort(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function mapRows(data: any[], docType: string): DocRow[] {
  return (data || []).map((c) => {
    const type = docType && docType !== "--Select--" ? docType : "CN";
    const documentNo =
      type === "THC"
        ? c.tripSheetNo || c.thcPdcNo || c.docketNo
        : type === "PDC"
          ? c.thcPdcNo || `DS${c.docketNo}`
          : type === "TC"
            ? c.tripSheetNo || c.docketNo
            : c.docketNo;

    return {
      documentNo: String(documentNo || c.docketNo || ""),
      documentType: type,
      documentDate: c.bookingDate,
      docketNo: c.docketNo,
      fromLocation: c.fromLocation,
      toLocation: c.toLocation,
      vehicleNo: c.vehicleNo,
      billingParty: c.billingParty || c.billingParty,
      status: c.status,
      statusLabel: c.statusLabel || c.status,
      billNo: c.billNo,
      billAmount: c.billAmount
    };
  });
}

export default function TrackDocumentsPage() {
  const today = toInputDate(new Date());
  const [mode, setMode] = useState<SearchMode>("date");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [docType, setDocType] = useState("--Select--");
  const [systemDocNo, setSystemDocNo] = useState("");
  const [manualDocNo, setManualDocNo] = useState("");
  const [step, setStep] = useState<"filter" | "results">("filter");
  const [rows, setRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState("");

  const filtered = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.documentNo, r.docketNo, r.vehicleNo, r.billingParty, r.statusLabel, r.fromLocation, r.toLocation]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, tableSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "date" && docType === "--Select--") {
      toast.error("Select Document Type");
      return;
    }
    if (mode === "system" && !systemDocNo.trim()) {
      toast.error("Enter System Document No");
      return;
    }
    if (mode === "manual" && !manualDocNo.trim()) {
      toast.error("Enter Manual Document No");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      const type = docType === "--Select--" ? "ALL" : docType;
      params.set("docType", type);

      if (mode === "date") {
        params.set("from", fromDate);
        params.set("to", toDate);
      } else if (mode === "system") {
        params.set("docketNo", systemDocNo.trim());
      } else {
        params.set("docketNo", manualDocNo.trim());
      }

      const res = await fetch(`/api/tracking/cn?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to track documents");
        return;
      }
      const mapped = mapRows(data.data || [], type === "ALL" ? "CN" : type);
      setRows(mapped);
      setStep("results");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (!mapped.length) toast.info("No documents found for selected criteria");
    } catch {
      toast.error("Failed to track documents");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10">

      {step === "filter" && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-300 shadow-sm max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">Tracking Document</div>

          <table className="w-full text-[12px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-[170px] align-top bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
                  Document Date
                </td>
                <td className="px-3 py-3">
                  <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trackMode"
                      checked={mode === "date"}
                      onChange={() => setMode("date")}
                      className="accent-[#0171d3]"
                    />
                    <span>From :</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setMode("date");
                        setFromDate(e.target.value);
                      }}
                      className="h-8 px-2 border border-[#7eb6e8] rounded-sm bg-white"
                    />
                    <span className="ml-1">To :</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setMode("date");
                        setToDate(e.target.value);
                      }}
                      className="h-8 px-2 border border-[#7eb6e8] rounded-sm bg-white"
                    />
                  </label>
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td className="align-middle bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
                  Select Document Type
                </td>
                <td className="px-3 py-3">
                  <select
                    value={docType}
                    onChange={(e) => {
                      setMode("date");
                      setDocType(e.target.value);
                    }}
                    className="h-8 min-w-[220px] px-2 border border-[#7eb6e8] rounded-sm bg-white"
                  >
                    <option value="--Select--">--Select--</option>
                    <option value="CN">CN</option>
                    <option value="TC">TC</option>
                    <option value="THC">THC</option>
                    <option value="PDC">PDC</option>
                  </select>
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td colSpan={2} className="text-center py-2">
                  <span className="text-red-600 font-bold tracking-wide">OR</span>
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td className="align-middle bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
                  System Document No
                </td>
                <td className="px-3 py-3">
                  <label className="inline-flex items-center gap-2 w-full">
                    <input
                      type="radio"
                      name="trackMode"
                      checked={mode === "system"}
                      onChange={() => setMode("system")}
                      className="accent-[#0171d3]"
                    />
                    <input
                      type="text"
                      value={systemDocNo}
                      onChange={(e) => {
                        setMode("system");
                        setSystemDocNo(e.target.value.toUpperCase());
                      }}
                      onFocus={() => setMode("system")}
                      className="h-8 flex-1 px-2 border border-[#7eb6e8] rounded-sm uppercase font-mono"
                    />
                  </label>
                </td>
              </tr>

              <tr>
                <td className="align-middle bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
                  Manual Document No.
                </td>
                <td className="px-3 py-3">
                  <label className="inline-flex items-center gap-2 w-full">
                    <input
                      type="radio"
                      name="trackMode"
                      checked={mode === "manual"}
                      onChange={() => setMode("manual")}
                      className="accent-[#0171d3]"
                    />
                    <input
                      type="text"
                      value={manualDocNo}
                      onChange={(e) => {
                        setMode("manual");
                        setManualDocNo(e.target.value.toUpperCase());
                      }}
                      onFocus={() => setMode("manual")}
                      className="h-8 flex-1 px-2 border border-[#7eb6e8] rounded-sm uppercase font-mono"
                    />
                  </label>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-center py-4 border-t border-slate-200 bg-slate-50/60">
            <button
              type="submit"
              disabled={loading}
              className="min-w-[110px] h-9 px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] font-semibold text-sm hover:bg-[#e8f1fb] shadow-sm disabled:opacity-60"
            >
              {loading ? "Searching..." : "Submit"}
            </button>
          </div>
        </form>
      )}

      {step === "results" && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 flex items-center justify-between">
            <span>
              Tracking Document Result — {docType !== "--Select--" ? docType : "ALL"} ({filtered.length})
            </span>
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="text-[11px] font-medium bg-white/15 hover:bg-white/25 px-2 py-1 rounded"
            >
              Change Filter
            </button>
          </div>

          <div className="px-3 py-2 border-b border-slate-200 flex justify-end">
            <input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search..."
              className="h-8 px-2 border border-slate-300 rounded text-xs w-56"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#e8f1fb] text-slate-700">
                  <th className="border border-slate-200 px-2 py-2 text-left">Document Type</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Document No</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Date</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">CN / Docket</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Movement</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Vehicle No</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Billing Party</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Status</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Bill No</th>
                  <th className="border border-slate-200 px-2 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr key={`${r.documentNo}-${idx}`} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-2 font-semibold">{r.documentType}</td>
                    <td className="border border-slate-200 px-2 py-2 font-mono font-bold text-[#0171d3]">
                      {r.documentNo}
                    </td>
                    <td className="border border-slate-200 px-2 py-2">{formatShort(r.documentDate)}</td>
                    <td className="border border-slate-200 px-2 py-2 font-mono">{r.docketNo}</td>
                    <td className="border border-slate-200 px-2 py-2">
                      {r.fromLocation || "-"} → {r.toLocation || "-"}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 font-mono">{r.vehicleNo || "-"}</td>
                    <td className="border border-slate-200 px-2 py-2">{r.billingParty || "-"}</td>
                    <td className="border border-slate-200 px-2 py-2">{r.statusLabel || r.status || "-"}</td>
                    <td className="border border-slate-200 px-2 py-2 font-mono">{r.billNo || "-"}</td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                      {Number(r.billAmount || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No documents found.
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
