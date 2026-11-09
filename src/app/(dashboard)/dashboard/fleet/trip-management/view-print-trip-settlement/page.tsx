"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { DocumentDateFilter,
  SelectionDocumentDateForm
} from "@/components/fleet/SelectionDocumentDateForm";

type Row = { documentNo: string;
  tripsheetNo: string;
  vehicleNo: string;
  driverName: string;
  branch: string;
  documentDate: string;
  route: string;
  grossFreight: number;
  advancePaid: number;
  dieselExpense: number;
  tollExpense: number;
  unloadingLabor: number;
  status: string;
};

function netOf(row: Row) { return (
    row.grossFreight - row.advancePaid - row.dieselExpense - row.tollExpense - row.unloadingLabor
  );
}

function inr(n: number) { return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function printSettlement(row: Row) { const net = netOf(row);
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${row.tripsheetNo}</title>
  <style>
    @page{size:A4;margin:12mm}
    body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:12px;margin:0;padding:16px}
    h1{font-size:18px;margin:0 0 4px}
    .muted{color:#475569;font-size:11px}
    .box{border:1px solid #334155;margin-top:12px}
    .hd{background:#e8f1fb;padding:6px 10px;font-weight:700;border-bottom:1px solid #334155}
    .bd{padding:10px}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th,td{border:1px solid #334155;padding:6px 8px;text-align:left}
    th{background:#f8fafc;font-size:10px;text-transform:uppercase}
    .num{text-align:right;font-variant-numeric:tabular-nums}
    .tot{font-weight:700}
    .toolbar{margin-bottom:12px}
    .toolbar button{border:0;background:#0171d3;color:#fff;padding:8px 14px;border-radius:6px;font-weight:700;cursor:pointer}
    @media print{.toolbar{display:none!important}}
  </style></head><body>
  <div class="toolbar"><button onclick="window.print()">Print Settlement</button></div>
  <h1>Ateka Logistics — Trip Settlement</h1>
  <div class="muted">Company Vehicle Payment · View / Print Trip Settlement</div>
  <div class="box">
    <div class="hd">Settlement Summary</div>
    <div class="bd">
      <div><strong>Document / Tripsheet No:</strong> ${row.documentNo}</div>
      <div><strong>Date:</strong> ${row.documentDate}</div>
      <div><strong>Vehicle No:</strong> ${row.vehicleNo}</div>
      <div><strong>Driver:</strong> ${row.driverName}</div>
      <div><strong>Route:</strong> ${row.route}</div>
      <div><strong>Branch:</strong> ${row.branch}</div>
      <div><strong>Status:</strong> ${row.status}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>Particulars</th><th class="num">Amount (₹)</th></tr></thead>
    <tbody>
      <tr><td>Gross Freight</td><td class="num">${inr(row.grossFreight)}</td></tr>
      <tr><td>Less: Advance Paid</td><td class="num">(${inr(row.advancePaid)})</td></tr>
      <tr><td>Diesel Expense</td><td class="num">(${inr(row.dieselExpense)})</td></tr>
      <tr><td>Toll Expense</td><td class="num">(${inr(row.tollExpense)})</td></tr>
      <tr><td>Unloading Labor</td><td class="num">(${inr(row.unloadingLabor)})</td></tr>
      <tr class="tot"><td>Net Balance Payable</td><td class="num">${inr(net)}</td></tr>
    </tbody>
  </table>
  <p class="muted" style="margin-top:18px">Computer generated trip settlement statement · Ateka Logistics</p>
  </body></html>`);
  win.document.close();
}

export default function ViewPrintTripSettlementPage() { const [step, setStep] = useState<"filter" | "list">("filter");
  const [results, setResults] = useState<Row[]>([]);

  const handleFilter = async (filter: DocumentDateFilter) => { if (filter.searchMode === "document" && !filter.documentNo.trim()) { toast.error("Enter Document No.");
      return;
    }
    try { const params = new URLSearchParams();
      params.set("status", "SETTLED");
      if (filter.searchMode === "document") params.set("documentNo", filter.documentNo.trim());
      else { params.set("from", filter.fromDate);
        params.set("to", filter.toDate);
      }
      const res = await fetch(`/api/fleet/trip-settlements?${params.toString()}`);
      const data = await res.json();
      const rows: Row[] = (data.data || []).map((d: any) => ({ documentNo: d.documentNo || d.tripsheetNo,
        tripsheetNo: d.tripsheetNo || d.documentNo,
        vehicleNo: d.vehicleNo,
        driverName: d.driverName || "",
        branch: d.branch || "ALC1",
        documentDate: d.documentDate ? new Date(d.documentDate).toLocaleDateString("en-GB") : "",
        route: d.route || "",
        grossFreight: Number(d.grossFreight) || 0,
        advancePaid: Number(d.advancePaid) || 0,
        dieselExpense: Number(d.dieselExpense) || 0,
        tollExpense: Number(d.tollExpense) || 0,
        unloadingLabor: Number(d.unloadingLabor) || 0,
        status: d.status || "SETTLED"
      }));
      setResults(rows.length ? rows : []);
      setStep("list");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — showing memory fallback");
      if (!rows.length) toast.info("No settled documents found in database for this filter");
    } catch { toast.error("Failed to load settlements from database");
    }
  };

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-10">
      {step === "filter" && (
        <SelectionDocumentDateForm showVehicle={false} onSubmit={handleFilter} />
      )}

      {step === "list" && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 flex items-center justify-between">
            <span>View / Print Trip Settlement</span>
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="text-[11px] font-medium bg-white/15 hover:bg-white/25 px-2 py-1 rounded"
            >
              Change Filter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#e8f1fb] text-slate-700">
                  <th className="border border-slate-200 px-2 py-2 text-left">Document No</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Vehicle No</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Driver</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Route</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Date</th>
                  <th className="border border-slate-200 px-2 py-2 text-right">Net Payable</th>
                  <th className="border border-slate-200 px-2 py-2 text-center">Print</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.documentNo} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-2 font-mono font-semibold text-[#0171d3]">
                      {row.documentNo}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 font-mono font-bold">{row.vehicleNo}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.driverName}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.route}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.documentDate}</td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono font-semibold text-emerald-700">
                      {inr(netOf(row))}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => printSettlement(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#7eb6e8] text-[#0171d3] font-semibold hover:bg-[#e8f1fb]"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No settlement documents found.
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
