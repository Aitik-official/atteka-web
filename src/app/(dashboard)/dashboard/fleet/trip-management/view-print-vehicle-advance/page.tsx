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
  payMode: string;
  amount: number;
  remark: string;
  status: string;
};

function inr(n: number) { return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function printAdvance(row: Row) { const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${row.documentNo}</title>
  <style>
    @page{size:A4;margin:12mm}
    body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:12px;margin:0;padding:16px}
    h1{font-size:18px;margin:0 0 4px}
    .muted{color:#475569;font-size:11px}
    .box{border:1px solid #334155;margin-top:12px}
    .hd{background:#e8f1fb;padding:6px 10px;font-weight:700;border-bottom:1px solid #334155}
    .bd{padding:10px;line-height:1.55}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th,td{border:1px solid #334155;padding:6px 8px;text-align:left}
    th{background:#f8fafc;font-size:10px;text-transform:uppercase}
    .num{text-align:right;font-variant-numeric:tabular-nums}
    .tot{font-weight:700}
    .sign{margin-top:36px;display:flex;justify-content:space-between}
    .sign div{width:200px;text-align:center;border-top:1px solid #334155;padding-top:6px;font-size:11px}
    .toolbar{margin-bottom:12px}
    .toolbar button{border:0;background:#0171d3;color:#fff;padding:8px 14px;border-radius:6px;font-weight:700;cursor:pointer}
    @media print{.toolbar{display:none!important}}
  </style></head><body>
  <div class="toolbar"><button onclick="window.print()">Print Advance Receipt</button></div>
  <h1>Ateka Logistics — Vehicle Advance Payment</h1>
  <div class="muted">Company Vehicle Payment · View / Print Vehicle Advance Payment</div>
  <div class="box">
    <div class="hd">Advance Disbursement Receipt</div>
    <div class="bd">
      <div><strong>Document No:</strong> ${row.documentNo}</div>
      <div><strong>Document Date:</strong> ${row.documentDate}</div>
      <div><strong>Tripsheet No:</strong> ${row.tripsheetNo}</div>
      <div><strong>Vehicle No:</strong> ${row.vehicleNo}</div>
      <div><strong>Driver:</strong> ${row.driverName}</div>
      <div><strong>Branch:</strong> ${row.branch}</div>
      <div><strong>Payment Mode:</strong> ${row.payMode}</div>
      <div><strong>Status:</strong> ${row.status}</div>
      <div><strong>Remark:</strong> ${row.remark}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>Particulars</th><th class="num">Amount (₹)</th></tr></thead>
    <tbody>
      <tr class="tot"><td>Advance Amount Paid</td><td class="num">${inr(row.amount)}</td></tr>
    </tbody>
  </table>
  <div class="sign">
    <div>Receiver Signature<br/>(Driver)</div>
    <div>Authorised Signatory<br/>Ateka Logistics</div>
  </div>
  <p class="muted" style="margin-top:18px">Computer generated vehicle advance payment receipt · Ateka Logistics</p>
  </body></html>`);
  win.document.close();
}

export default function ViewPrintVehicleAdvancePage() { const [step, setStep] = useState<"filter" | "list">("filter");
  const [results, setResults] = useState<Row[]>([]);

  const handleFilter = async (filter: DocumentDateFilter) => { if (filter.searchMode === "document" && !filter.documentNo.trim()) { toast.error("Enter Document No.");
      return;
    }
    try { const params = new URLSearchParams();
      if (filter.searchMode === "document") params.set("documentNo", filter.documentNo.trim());
      else { params.set("from", filter.fromDate);
        params.set("to", filter.toDate);
      }
      const res = await fetch(`/api/fleet/advance-payments?${params.toString()}`);
      const data = await res.json();
      const rows: Row[] = (data.data || []).map((d: any) => ({ documentNo: d.documentNo,
        tripsheetNo: d.tripsheetNo || "",
        vehicleNo: d.vehicleNo,
        driverName: d.driverName || "",
        branch: d.branch || "ALC1",
        documentDate: d.documentDate ? new Date(d.documentDate).toLocaleDateString("en-GB") : "",
        payMode: d.payMode || "CASH",
        amount: Number(d.amount) || 0,
        remark: d.remark || "",
        status: d.status || "PAID"
      }));
      setResults(rows);
      setStep("list");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — showing memory fallback");
      if (!rows.length) toast.info("No advance payments found in database for this filter");
    } catch { toast.error("Failed to load advance payments from database");
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
            <span>View / Print Vehicle Advance Payment</span>
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
                  <th className="border border-slate-200 px-2 py-2 text-left">Tripsheet</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Vehicle No</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Driver</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Date</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Mode</th>
                  <th className="border border-slate-200 px-2 py-2 text-right">Amount</th>
                  <th className="border border-slate-200 px-2 py-2 text-center">Print</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.documentNo} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-2 font-mono font-semibold text-[#0171d3]">
                      {row.documentNo}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 font-mono">{row.tripsheetNo}</td>
                    <td className="border border-slate-200 px-2 py-2 font-mono font-bold">{row.vehicleNo}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.driverName}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.documentDate}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.payMode}</td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono font-semibold">
                      {inr(row.amount)}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => printAdvance(row)}
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
                    <td colSpan={8} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No advance payment documents found.
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
