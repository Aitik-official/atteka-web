"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { EInvoiceAuthGate } from "@/components/finance/EInvoiceAuthGate";
import { useEInvoiceAuthSession } from "@/hooks/useEInvoiceAuthSession";

type CancelRow = {
  documentType: string;
  documentNo: string;
  documentDate: string;
  party: string;
  branch: string;
  gstin: string;
  ackNo: string;
  ackDate: string;
  irnNo: string;
  status: "Generated" | "Cancelled" | "Failed";
};

export default function CancelIrnPage() {
  const { isAuthenticated, ready } = useEInvoiceAuthSession();
  const [rows, setRows] = useState<CancelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await fetch("/api/finance/cancel-irn");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load IRNs");
        return;
      }
      setRows(data.data || []);
    } catch {
      toast.error("Failed to load IRNs for cancel");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!ready || !isAuthenticated) {
      setRows([]);
      return;
    }
    void load();
  }, [ready, isAuthenticated, load]);

  const handleCancel = async (row: CancelRow) => {
    const ok = toast.confirm(
      `Cancel IRN for ${row.documentNo}?\n\nIRN: ${row.irnNo}\n\nGST integration is pending — this saves a demo cancel stub.`
    );
    if (!ok) return;

    setCancelling(row.documentNo);
    try {
      const res = await fetch("/api/finance/cancel-irn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentNo: row.documentNo,
          irnNo: row.irnNo,
          reason: "1"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cancel IRN failed");
        return;
      }
      toast.document("IRN cancelled successfully (demo). GST / NIC IRP pending.", {
        title: "Cancel IRN",
        code: row.irnNo
      });
      await load();
    } catch {
      toast.error("Cancel IRN request failed");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <EInvoiceAuthGate moduleLabel="Cancel IRN">
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            Cancel Invoice Reference Number (IRN)
          </h1>
          <p className="text-[11px] text-slate-500">
            {loading ? "Loading..." : `${rows.length} cancellable IRN(s)`} · GST / NIC IRP integration
            pending
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="h-8 px-3 rounded-md border border-slate-300 bg-white text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] min-w-[1100px]">
            <thead>
              <tr className="bg-[#0171d3] text-white">
                {[
                  "Document Type",
                  "Document No",
                  "Document Date",
                  "Party",
                  "Branch",
                  "GSTIN",
                  "Ack No",
                  "Ack Date",
                  "IRN No",
                  "Cancel IRN"
                ].map((h) => (
                  <th
                    key={h}
                    className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                      h === "Cancel IRN" ? "text-center" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.documentNo} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/40">
                  <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                    {r.documentType}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono">
                    {r.documentNo}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                    {r.documentDate}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.party}</td>
                  <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.branch}</td>
                  <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono">
                    {r.gstin}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono">
                    {r.ackNo}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.ackDate}</td>
                  <td
                    className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono max-w-[220px] truncate"
                    title={r.irnNo}
                  >
                    {r.irnNo}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      disabled={cancelling === r.documentNo}
                      onClick={() => void handleCancel(r)}
                      className="h-7 px-2 rounded bg-[#0171d3] text-white text-[10px] font-semibold hover:bg-[#015fae] disabled:opacity-60"
                    >
                      {cancelling === r.documentNo ? "..." : "Cancel IRN"}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                    No cancellable IRNs. Generate an IRN first, then refresh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-slate-200 text-[11px] text-slate-500 bg-slate-50">
          Next: wire live GST cancel using{" "}
          <code className="font-mono text-[10px]">preparedCancelPayload</code> from{" "}
          <code className="font-mono text-[10px]">POST /api/finance/cancel-irn</code>.
        </div>
      </div>
    </div>
    </EInvoiceAuthGate>
  );
}
