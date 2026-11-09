"use client";

import React, { useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { toast } from "@/lib/toastBus";

type ChargeBreakdown = {
  freight: number;
  statisticalCharges: number;
  detentionCharges: number;
  collectionCharges: number;
  otherCharge: number;
  extraWtCharge: number;
  deliveryCharges: number;
  loadingCharges: number;
  unloadingCharges: number;
  escortCharges: number;
  diplomatCharges: number;
  codDddCharges: number;
  serviceCharges: number;
};

type BillDetail = {
  systemBillNo: string;
  billDate: string;
  billBranch: string;
  billingToParty: string;
  partyName: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  osAmount: number;
  cnNo: string;
  charges: ChargeBreakdown;
  igst: number;
  cgst: number;
  sgst: number;
};

const CHARGE_COLS: { key: keyof ChargeBreakdown; label: string }[] = [
  { key: "freight", label: "Freight" },
  { key: "statisticalCharges", label: "Statistical Charges" },
  { key: "detentionCharges", label: "Detention charges" },
  { key: "collectionCharges", label: "Collection Charges" },
  { key: "otherCharge", label: "Other Charge" },
  { key: "extraWtCharge", label: "Extra Wt Charge" },
  { key: "deliveryCharges", label: "Delivery Charges" },
  { key: "loadingCharges", label: "Loading Charges" },
  { key: "unloadingCharges", label: "Unloading Charges" },
  { key: "escortCharges", label: "Escort Charges" },
  { key: "diplomatCharges", label: "Diplomat Charges" },
  { key: "codDddCharges", label: "COD/DDD Charges" },
  { key: "serviceCharges", label: "Service Charges" }
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtPlain(n: number) {
  const v = Number(n || 0);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

export default function CreditNotePage() {
  const [step, setStep] = useState<"filter" | "detail">("filter");
  const [billNo, setBillNo] = useState("");
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [charges, setCharges] = useState<ChargeBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [creditNoteNo, setCreditNoteNo] = useState("");
  const [creditNoteDate, setCreditNoteDate] = useState(toInputDate(new Date()));
  const [reason, setReason] = useState("");

  const totals = useMemo(() => {
    if (!charges) return { sTotal: 0, igst: 0, cgst: 0, sgst: 0, total: 0 };
    const sTotal = Object.values(charges).reduce((a, b) => a + Number(b || 0), 0);
    const cgst = Number((sTotal * 0.09).toFixed(2));
    const sgst = Number((sTotal * 0.09).toFixed(2));
    const igst = 0;
    const total = Number((sTotal + cgst + sgst + igst).toFixed(2));
    return { sTotal: Number(sTotal.toFixed(2)), igst, cgst, sgst, total };
  }, [charges]);

  const loadBill = async () => {
    if (!billNo.trim()) {
      toast.error("Enter Bill No.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ billNo: billNo.trim() });
      const res = await fetch(`/api/finance/credit-note?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Bill not found");
        return;
      }
      const detail: BillDetail = data.data;
      setBill(detail);
      setCharges({ ...detail.charges });
      setCreditNoteNo("");
      setCreditNoteDate(toInputDate(new Date()));
      setReason("");
      setStep("detail");
    } catch {
      toast.error("Failed to load bill details");
    } finally {
      setLoading(false);
    }
  };

  const updateCharge = (key: keyof ChargeBreakdown, value: string) => {
    setCharges((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: Number(value) || 0 };
    });
  };

  const generateCreditNote = async () => {
    if (!bill || !charges) return;
    setSaving(true);
    try {
      const res = await fetch("/api/finance/credit-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemBillNo: bill.systemBillNo,
          creditNoteNo: creditNoteNo.trim(),
          creditNoteDate,
          amount: totals.sTotal,
          igst: totals.igst,
          cgst: totals.cgst,
          sgst: totals.sgst,
          totalAmt: totals.total,
          reason: reason.trim(),
          charges,
          cnNo: bill.cnNo
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to generate credit note");
        return;
      }
      setCreditNoteNo(data.data?.creditNoteNo || creditNoteNo);
      toast.success(`Credit Note ${data.data?.creditNoteNo} generated (demo)`);
    } catch {
      toast.error("Failed to generate credit note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto mt-6">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Enter Bill No
          </div>

          <table className="w-full text-[12px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-[28%] px-3 py-3 text-[#0171d3] font-semibold align-middle">
                  Enter Bill No.
                </td>
                <td className="px-3 py-3">
                  <input
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadBill();
                    }}
                    className="w-full max-w-md h-8 px-2 border border-blue-300 rounded-sm bg-white text-[12px] font-mono uppercase"
                    autoFocus
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="py-4 flex justify-center border-t border-slate-100">
            <button
              type="button"
              disabled={loading}
              onClick={loadBill}
              className="min-w-[100px] h-8 px-5 border border-[#0171d3] text-[#0171d3] bg-white rounded-md text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {step === "detail" && bill && charges && (
        <div className="space-y-3">
          {/* Bill Details banner */}
          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">Bill Details</div>
            <div className="px-3 py-2.5 text-[11px] flex flex-wrap gap-x-5 gap-y-1.5 text-slate-800 border-b border-slate-200">
              <span>
                <span className="font-semibold">System Bill No. :</span>{" "}
                <span className="font-mono text-blue-700">{bill.systemBillNo}</span>
              </span>
              <span>
                <span className="font-semibold">Bill Date :</span> {bill.billDate}
              </span>
              <span>
                <span className="font-semibold">Bill Branch :</span> {bill.billBranch}
              </span>
              <span>
                <span className="font-semibold">Billing to Party :</span> {bill.billingToParty}
              </span>
              <span>
                <span className="font-semibold">Amount :</span> {fmtPlain(bill.amount)}
              </span>
              <span>
                <span className="font-semibold">GST Amount :</span> {fmtPlain(bill.gstAmount)}
              </span>
              <span>
                <span className="font-semibold">Total Amount :</span> {fmtPlain(bill.totalAmount)}
              </span>
              <span>
                <span className="font-semibold">O/S Amount :</span> {fmtPlain(bill.osAmount)}
              </span>
            </div>

            {/* Charges table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse min-w-[1400px]">
                <thead>
                  <tr className="bg-[#0d47a1] text-white">
                    <th className="px-1.5 py-2 font-semibold border border-[#1565c0] whitespace-nowrap">
                      CN No
                    </th>
                    {CHARGE_COLS.map((c) => (
                      <th
                        key={c.key}
                        className="px-1.5 py-2 font-semibold border border-[#1565c0] whitespace-nowrap"
                      >
                        {c.label}
                      </th>
                    ))}
                    <th className="px-1.5 py-2 font-semibold border border-[#1565c0]">S.Total</th>
                    <th className="px-1.5 py-2 font-semibold border border-[#1565c0]">IGST</th>
                    <th className="px-1.5 py-2 font-semibold border border-[#1565c0]">CGST</th>
                    <th className="px-1.5 py-2 font-semibold border border-[#1565c0]">SGST</th>
                    <th className="px-1.5 py-2 font-semibold border border-[#1565c0]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-1.5 py-1.5 border border-slate-200 font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {bill.cnNo}
                    </td>
                    {CHARGE_COLS.map((c) => (
                      <td key={c.key} className="px-0.5 py-1 border border-slate-200">
                        <input
                          type="number"
                          value={charges[c.key]}
                          onChange={(e) => updateCharge(c.key, e.target.value)}
                          className="w-full min-w-[56px] h-7 px-1 border border-slate-200 rounded-sm text-[10px] text-right font-mono"
                        />
                      </td>
                    ))}
                    <td className="px-1.5 py-1.5 border border-slate-200 text-right font-mono font-semibold">
                      {fmtPlain(totals.sTotal)}
                    </td>
                    <td className="px-1.5 py-1.5 border border-slate-200 text-right font-mono">
                      {fmtPlain(totals.igst)}
                    </td>
                    <td className="px-1.5 py-1.5 border border-slate-200 text-right font-mono">
                      {fmtPlain(totals.cgst)}
                    </td>
                    <td className="px-1.5 py-1.5 border border-slate-200 text-right font-mono">
                      {fmtPlain(totals.sgst)}
                    </td>
                    <td className="px-1.5 py-1.5 border border-slate-200 text-right font-mono font-bold text-emerald-700">
                      {fmtPlain(totals.total)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-semibold">
                    <td
                      className="px-1.5 py-2 border border-slate-200 text-right"
                      colSpan={1 + CHARGE_COLS.length}
                    >
                      Total
                    </td>
                    <td className="px-1.5 py-2 border border-slate-200 text-right font-mono">
                      {fmt(totals.sTotal)}
                    </td>
                    <td className="px-1.5 py-2 border border-slate-200 text-right font-mono">
                      {fmt(totals.igst)}
                    </td>
                    <td className="px-1.5 py-2 border border-slate-200 text-right font-mono">
                      {fmt(totals.cgst)}
                    </td>
                    <td className="px-1.5 py-2 border border-slate-200 text-right font-mono">
                      {fmt(totals.sgst)}
                    </td>
                    <td className="px-1.5 py-2 border border-slate-200 text-right font-mono text-emerald-700">
                      {fmt(totals.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Credit note entry form */}
          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="p-4 space-y-3 text-[12px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 max-w-3xl">
                <label className="flex items-center gap-3">
                  <span className="w-36 shrink-0 font-semibold text-slate-700">Credit Note No. :</span>
                  <input
                    value={creditNoteNo}
                    onChange={(e) => setCreditNoteNo(e.target.value.toUpperCase())}
                    className="flex-1 h-8 px-2 border border-slate-300 rounded-sm font-mono"
                    placeholder="Auto on generate"
                  />
                </label>

                <label className="flex items-center gap-3">
                  <span className="w-36 shrink-0 font-semibold text-slate-700">Credit Note Date :</span>
                  <div className="relative flex-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
                    <input
                      type="date"
                      value={creditNoteDate}
                      onChange={(e) => setCreditNoteDate(e.target.value)}
                      className="w-full h-8 pl-7 pr-2 border border-slate-300 rounded-sm"
                    />
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <span className="w-36 shrink-0 font-semibold text-slate-700">Amount :</span>
                  <input
                    readOnly
                    value={fmt(totals.sTotal)}
                    className="flex-1 h-8 px-2 border border-slate-200 rounded-sm bg-slate-50 font-mono"
                  />
                </label>

                <label className="flex items-center gap-3">
                  <span className="w-36 shrink-0 font-semibold text-slate-700">IGST :</span>
                  <input
                    readOnly
                    value={fmt(totals.igst)}
                    className="flex-1 h-8 px-2 border border-slate-200 rounded-sm bg-slate-50 font-mono"
                  />
                </label>

                <label className="flex items-center gap-3">
                  <span className="w-36 shrink-0 font-semibold text-slate-700">CGST :</span>
                  <input
                    readOnly
                    value={fmt(totals.cgst)}
                    className="flex-1 h-8 px-2 border border-slate-200 rounded-sm bg-slate-50 font-mono"
                  />
                </label>

                <label className="flex items-center gap-3">
                  <span className="w-36 shrink-0 font-semibold text-slate-700">SGST :</span>
                  <input
                    readOnly
                    value={fmt(totals.sgst)}
                    className="flex-1 h-8 px-2 border border-slate-200 rounded-sm bg-slate-50 font-mono"
                  />
                </label>

                <label className="flex items-center gap-3 md:col-span-2">
                  <span className="w-36 shrink-0 font-semibold text-slate-700">Total Amt. :</span>
                  <input
                    readOnly
                    value={fmtPlain(totals.total)}
                    className="flex-1 max-w-xs h-8 px-2 border border-slate-200 rounded-sm bg-slate-50 font-mono font-bold text-emerald-700"
                  />
                </label>
              </div>

              <div className="max-w-3xl">
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Credit Note :
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-sm text-[12px] resize-y min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={generateCreditNote}
                  className="min-w-[160px] h-9 px-4 border border-[#0171d3] text-[#0171d3] bg-white rounded-md text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
                >
                  {saving ? "Generating..." : "Generate Credit Note"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("filter")}
                  className="min-w-[100px] h-9 px-4 border border-slate-400 text-slate-700 bg-white rounded-md text-[12px] font-semibold hover:bg-slate-50"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
