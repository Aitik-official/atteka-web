"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileSpreadsheet, Printer, RefreshCw, Search } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printScoped } from "@/lib/printEngine";

type Row = Record<string, string | number>;

const COLUMNS: { key: string; label: string; align?: "right" }[] = [
  { key: "srNo", label: "Sr No", align: "right" },
  { key: "docketNo", label: "Docket No" },
  { key: "docketDateLabel", label: "Docket Date" },
  { key: "octroiDateLabel", label: "Octroi Date" },
  { key: "octroiBranch", label: "Octroi Branch" },
  { key: "party", label: "Party" },
  { key: "fromLocation", label: "From" },
  { key: "toLocation", label: "To" },
  { key: "octroiAgent", label: "Octroi Agent" },
  { key: "octroiReceiptNo", label: "Octroi Receipt No" },
  { key: "invoiceNo", label: "Invoice No" },
  { key: "invoiceValue", label: "Invoice Value", align: "right" },
  { key: "packages", label: "Pkgs", align: "right" },
  { key: "actWt", label: "Act Wt", align: "right" },
  { key: "chrgWt", label: "Chrg Wt", align: "right" },
  { key: "octroiAmount", label: "Octroi Amount", align: "right" },
  { key: "formCharges", label: "Form Charges", align: "right" },
  { key: "otherCharges", label: "Other Charges", align: "right" },
  { key: "totalOctroi", label: "Total Octroi", align: "right" },
  { key: "paidBy", label: "Paid By" },
  { key: "remark", label: "Remark" }
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

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function cellValue(row: Row, key: string) {
  const v = row[key];
  if (v == null || v === "") return "";
  return String(v);
}

export default function DocketWiseOctroiPage() {
  const today = toInputDate(new Date());
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [octroiBranch, setOctroiBranch] = useState("--Show All--");
  const [party, setParty] = useState("--Show All--");
  const [octroiAgent, setOctroiAgent] = useState("");
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([]);
  const [parties, setParties] = useState<{ code: string; name: string }[]>([]);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState("100%");
  const [findText, setFindText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 40;

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

  const filtered = useMemo(() => {
    const q = findText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => COLUMNS.map((c) => cellValue(r, c.key)).join(" ").toLowerCase().includes(q));
  }, [rows, findText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const zoomScale = Number(String(zoom).replace("%", "")) / 100 || 1;

  const loadReport = async (alsoExport = false) => {
    setLoading(true);
    try {
      const br =
        octroiBranch.includes(" - ") ? octroiBranch.split(" - ").pop()!.trim() : octroiBranch;
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        octroiBranch: br || "Show All",
        party,
        octroiAgent
      });
      const res = await fetch(`/api/reports/docket-wise-octroi?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load Docket Wise Octroi Details");
        return;
      }
      const withSr = (data.data || []).map((r: Row, i: number) => ({ ...r, srNo: i + 1 }));
      setRows(withSr);
      setPage(1);
      setFindText("");
      setStep("report");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — memory fallback");
      if (alsoExport) exportCsv(withSr);
    } catch {
      toast.error("Failed to load Docket Wise Octroi Details");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = (list: Row[] = filtered) => {
    if (!list.length) {
      toast.error("No data to export");
      return;
    }
    const headers = COLUMNS.map((c) => c.label);
    const lines = list.map((r) =>
      COLUMNS.map((c) => `"${cellValue(r, c.key).replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Docket_Wise_Octroi_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel / CSV exported");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {step === "filter" && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-center text-sm font-semibold py-2 tracking-wide">
              Selection Criteria
            </div>

            <div className="divide-y divide-slate-200">
              <div className="grid grid-cols-[160px_1fr] gap-3 items-center px-4 py-3">
                <div className="text-sm text-slate-700 font-medium flex items-center gap-2">
                  <input type="radio" checked readOnly className="accent-[#0171d3]" />
                  Octroi Date
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-600">From</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="h-9 px-2 border border-slate-300 rounded-md text-sm w-[150px]"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                      {toDisplayDate(fromDate)}
                    </span>
                  </div>
                  <span className="text-slate-600 ml-2">To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 px-2 border border-slate-300 rounded-md text-sm w-[150px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[160px_1fr] gap-3 items-center px-4 py-3">
                <div className="text-sm text-slate-700 font-medium">Octroi Branch</div>
                <select
                  value={octroiBranch}
                  onChange={(e) => setOctroiBranch(e.target.value)}
                  className="h-9 px-2 border border-slate-300 rounded-md text-sm bg-white max-w-md"
                >
                  <option value="--Show All--">--Show All--</option>
                  {branches.map((b) => (
                    <option key={b.code} value={b.label}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[160px_1fr] gap-3 items-center px-4 py-3">
                <div className="text-sm text-slate-700 font-medium">Party</div>
                <select
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  className="h-9 px-2 border border-slate-300 rounded-md text-sm bg-white max-w-md"
                >
                  <option value="--Show All--">--Show All--</option>
                  {parties.map((p) => (
                    <option key={`${p.code}-${p.name}`} value={p.name}>
                      {p.code ? `${p.code} - ${p.name}` : p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[160px_1fr] gap-3 items-center px-4 py-3">
                <div className="text-sm text-slate-700 font-medium">Octroi Agent</div>
                <div className="relative max-w-md">
                  <input
                    value={octroiAgent}
                    onChange={(e) => setOctroiAgent(e.target.value)}
                    className="w-full h-9 pl-3 pr-9 border border-slate-300 rounded-md text-sm"
                    placeholder=""
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="py-4 flex justify-center border-t border-slate-200">
              <button
                type="button"
                disabled={loading}
                onClick={() => loadReport(false)}
                className="min-w-[110px] h-9 px-6 rounded-md border-2 border-[#0171d3] text-[#0171d3] font-semibold text-sm hover:bg-[#0171d3] hover:text-white disabled:opacity-60 transition-colors"
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div data-print-root className="bg-white border border-slate-300 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-300 text-[11px] print:hidden">
            <span className="text-slate-600">
              {page} of {totalPages}
            </span>
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
                onChange={(e) => {
                  setFindText(e.target.value);
                  setPage(1);
                }}
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
              <div className="text-sm font-bold text-red-600">Docket Wise Octroi Details</div>
              <div className="text-xs text-red-600 mt-0.5">
                Octroi Date From {formatLong(fromDate)} To {formatLong(toDate)}
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
                {paged.map((r, idx) => (
                  <tr key={`${r.docketNo}-${idx}`} className="odd:bg-white even:bg-slate-50">
                    {COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`border border-slate-200 px-2 py-1 whitespace-nowrap ${
                          c.align === "right" ? "text-right" : ""
                        } ${c.key === "docketNo" ? "font-mono font-semibold text-[#0171d3]" : ""}`}
                      >
                        {cellValue(r, c.key)}
                      </td>
                    ))}
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No octroi details found for selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center px-3 py-2 border-t border-slate-200 text-xs print:hidden">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 border border-slate-300 rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {page} / {totalPages} · {filtered.length} rows
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 border border-slate-300 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
