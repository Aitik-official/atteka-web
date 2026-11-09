"use client";

import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "@/lib/toastBus";

type Gstr2bRow = {
  id: string;
  invoiceDate: string;
  invoiceNo: string;
  gstin: string;
  vendorCode: string;
  vendorName: string;
  taxableAmount: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  invoiceAmount: number;
  accountDesc: string;
};

function fmtAmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function Gstr2bInvoiceBookingPage() {
  const [rows, setRows] = useState<Gstr2bRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/finance/gstr2b-invoice-booking")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRows(d.data || []);
      })
      .catch(() => toast.error("Failed to load GSTR2B invoices"))
      .finally(() => setLoading(false));
  }, []);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = rows.length > 0 && rows.every((r) => selected[r.id]);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    rows.forEach((r) => {
      next[r.id] = checked;
    });
    setSelected(next);
  };

  const submit = async () => {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!ids.length) {
      toast.error("Select at least one invoice");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/finance/gstr2b-invoice-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Booking failed");
        return;
      }
      toast.success(data.message || "Booked (demo)");
      setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
      setSelected({});
    } catch {
      toast.error("Booking failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-lg font-bold text-[#0171d3]">GSTR2B Invoice Booking</h1>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Partial layout from available screen — demo invoices only; live GSTR2B sync not wired.
        </p>
      </div>

      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] min-w-[1280px]">
            <thead>
              <tr className="bg-white text-[#0d47a1]">
                <th className="border border-slate-200 px-2 py-2 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    disabled={!rows.length}
                  />
                </th>
                {[
                  "Invoice Date",
                  "Invoice No",
                  "GSTIN",
                  "Vendor Code",
                  "Vendor Name",
                  "Taxable Amount",
                  "IGST",
                  "CGST",
                  "SGST",
                  "CESS",
                  "InVoice Amount",
                  "Account Desc"
                ].map((h) => (
                  <th
                    key={h}
                    className={`border border-slate-200 px-2 py-2 font-semibold whitespace-nowrap ${
                      ["Taxable Amount", "IGST", "CGST", "SGST", "CESS", "InVoice Amount"].includes(h)
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} className="border border-slate-200 px-3 py-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="border border-slate-200 px-3 py-8 text-center text-slate-400">
                    No GSTR2B invoices to book.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/40">
                    <td className="border border-slate-200 px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [r.id]: e.target.checked }))
                        }
                      />
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                      {r.invoiceDate}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 font-mono whitespace-nowrap">
                      {r.invoiceNo}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 font-mono whitespace-nowrap">
                      {r.gstin}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 font-mono">{r.vendorCode}</td>
                    <td className="border border-slate-200 px-2 py-1.5 max-w-[180px] truncate" title={r.vendorName}>
                      {r.vendorName}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                      {fmtAmt(r.taxableAmount)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                      {fmtAmt(r.igst)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                      {fmtAmt(r.cgst)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                      {fmtAmt(r.sgst)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                      {fmtAmt(r.cess)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right font-mono font-semibold">
                      {fmtAmt(r.invoiceAmount)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                      {r.accountDesc}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          disabled={saving || !selectedCount}
          onClick={() => void submit()}
          className="h-10 min-w-[120px] px-5 rounded-md bg-[#0171d3] hover:bg-[#015fae] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          <Check className="w-4 h-4" />
          {saving ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
