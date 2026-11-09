"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Download } from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { exportToCsv, stampFilename } from "@/lib/exportCsv";
import { toast } from "@/lib/toastBus";

type Props = {
  onBack: () => void;
};

export function VendorApprovalPanel({ onBack }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/vendors?status=PENDING")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRows(d.data || []);
      })
      .catch(() => setFeedback({ type: "error", message: "Failed to load pending vendors." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((r) => r.vendorCode)));
  };

  const act = async (approvalStatus: "APPROVED" | "REJECTED") => {
    if (selected.size === 0) {
      setFeedback({ type: "error", message: "Select at least one vendor." });
      return;
    }
    setActing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/vendors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorCodes: Array.from(selected),
          approvalStatus
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: data.message });
        toast.success(data.message || `Vendor(s) marked ${approvalStatus}.`);
        setSelected(new Set());
        load();
      } else {
        const msg = data.error || "Action failed.";
        setFeedback({ type: "error", message: msg });
        toast.error(msg);
      }
    } catch {
      const msg = "Network error while updating approval.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.vendorCode));

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Vendor Approval" />
          <p className="text-xs text-slate-500 mt-1">Admin · Business Partners · Vendor Approval</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          ← Business Partners
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-blue-700 text-white font-bold">
              <tr>
                <th className="py-2.5 px-3 w-16">
                  <div className="flex items-center gap-2">
                    <span>Select</span>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="rounded border-white/40"
                    />
                  </div>
                </th>
                <th className="py-2.5 px-3">Vendor Code</th>
                <th className="py-2.5 px-3">Vendor Name</th>
                <th className="py-2.5 px-3">Pan No</th>
                <th className="py-2.5 px-3">Account No</th>
                <th className="py-2.5 px-3">Branch Name</th>
                <th className="py-2.5 px-3">Purchase Person</th>
                <th className="py-2.5 px-3">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading pending vendors...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No vendors pending approval.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id || r.vendorCode} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selected.has(r.vendorCode)}
                        onChange={() => toggle(r.vendorCode)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{r.vendorCode}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{r.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{r.pan || ""}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{r.accountNo || ""}</td>
                    <td className="py-2.5 px-3 text-slate-700">{r.locationName || ""}</td>
                    <td className="py-2.5 px-3 text-slate-700">{r.contactPerson || ""}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.remark || ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-4 flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            disabled={acting}
            onClick={() => act("APPROVED")}
            className="min-w-[110px] px-5 py-2 text-sm font-bold rounded-md border-2 border-blue-500 text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50"
          >
            Approved
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => act("REJECTED")}
            className="min-w-[110px] px-5 py-2 text-sm font-bold rounded-md border-2 border-blue-500 text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => {
              if (rows.length === 0) {
                setFeedback({ type: "error", message: "No pending vendors to export." });
                return;
              }
              exportToCsv(
                stampFilename("VendorApproval_Pending"),
                [
                  "Vendor Code",
                  "Vendor Name",
                  "Pan No",
                  "Account No",
                  "Branch Name",
                  "Purchase Person",
                  "Remark"
                ],
                rows.map((r) => [
                  r.vendorCode || "",
                  r.name || "",
                  r.pan || "",
                  r.accountNo || "",
                  r.locationName || "",
                  r.contactPerson || "",
                  r.remark || ""
                ])
              );
              setFeedback({
                type: "success",
                message: `Exported ${rows.length} pending vendor(s) to Excel/CSV.`
              });
            }}
            className="min-w-[110px] px-5 py-2 text-sm font-bold rounded-md border-2 border-blue-500 text-blue-600 bg-white hover:bg-blue-50 inline-flex items-center justify-center gap-1.5"
            title="Export Excel"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
