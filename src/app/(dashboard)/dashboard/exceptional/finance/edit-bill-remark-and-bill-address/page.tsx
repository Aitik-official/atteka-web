"use client";

import React, { useState } from "react";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { toast } from "@/lib/toastBus";

type BillDetail = {
  billNumber: string;
  manualBillNo: string;
  remark: string;
  billAddress: string;
  billingParty: string;
  customerCode: string;
  customerName: string;
  billAmount: number;
  billDate: string;
  billBranch: string;
  customerGstin: string;
  destinationAddress: string;
  city: string;
  pinCode: string;
};

type GstOption = {
  id: string;
  gstin: string;
  city: string;
  destinationAddress: string;
  pinCode: string;
};

const SLUG = "edit-bill-remark-and-bill-address";

export default function EditBillRemarkAndBillAddressPage() {
  const [step, setStep] = useState<"search" | "edit">("search");
  const [billNo, setBillNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [remark, setRemark] = useState("");
  const [billAddress, setBillAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [gstOpen, setGstOpen] = useState(false);
  const [gstOptions, setGstOptions] = useState<GstOption[]>([]);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstSelected, setGstSelected] = useState("");

  const loadBill = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const no = billNo.trim().toUpperCase();
    if (!no) {
      toast.error("Enter Bill No.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/exceptional/finance?slug=${SLUG}&billNo=${encodeURIComponent(no)}`
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Bill not found");
        return;
      }
      const b = data.data as BillDetail;
      setBill(b);
      setRemark(b.remark || "OK");
      setBillAddress(b.billAddress || "");
      setGstin(b.customerGstin || "");
      setDestinationAddress(b.destinationAddress || b.billAddress || "");
      setCity(b.city || "");
      setPinCode(b.pinCode || "");
      setStep("edit");
    } catch {
      toast.error("Failed to load bill");
    } finally {
      setLoading(false);
    }
  };

  const openGstPicker = async () => {
    if (!bill) return;
    setGstOpen(true);
    setGstLoading(true);
    setGstSelected("");
    try {
      const res = await fetch(
        `/api/exceptional/finance?slug=${SLUG}&billNo=${encodeURIComponent(bill.billNumber)}&gstOptions=1`
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load GST options");
        setGstOptions([]);
        return;
      }
      setGstOptions(data.data || []);
    } catch {
      toast.error("Failed to load GST options");
      setGstOptions([]);
    } finally {
      setGstLoading(false);
    }
  };

  const applyGstOption = () => {
    const opt = gstOptions.find((o) => o.id === gstSelected);
    if (!opt) {
      toast.error("Select a GST No.");
      return;
    }
    setGstin(opt.gstin);
    if (opt.destinationAddress) setDestinationAddress(opt.destinationAddress);
    if (opt.city) setCity(opt.city);
    if (opt.pinCode) setPinCode(opt.pinCode);
    setGstOpen(false);
    toast.success("GST / destination applied");
  };

  const save = async () => {
    if (!bill) return;
    setSaving(true);
    try {
      const res = await fetch("/api/exceptional/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: SLUG,
          billNumber: bill.billNumber,
          remark,
          billAddress,
          customerGstin: gstin,
          destinationAddress,
          city,
          pinCode
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update bill");
        return;
      }
      toast.document(`Bill ${bill.billNumber} updated`, {
        title: data.isMemoryStore ? "Updated (Memory)" : "Remark & Address Updated",
        code: bill.billNumber
      });
      setBill({
        ...bill,
        remark,
        billAddress,
        customerGstin: gstin,
        destinationAddress,
        city,
        pinCode
      });
    } catch {
      toast.error("Failed to update bill");
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    "w-full min-h-[36px] px-2.5 py-2 border border-slate-300 rounded-sm text-[12px] bg-white focus:outline-none focus:border-[#0171d3]";
  const labelCls = "block text-[12px] font-semibold text-slate-700 mb-1";

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10">
      {step === "search" && (
        <form
          onSubmit={loadBill}
          className="bg-white border border-slate-300 shadow-sm max-w-lg mx-auto overflow-hidden"
        >
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Change Bill Remark &amp; Bill address
          </div>
          <div className="px-4 py-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[12px] font-semibold text-slate-700 whitespace-nowrap">
                Enter Bill No.
              </span>
              <input
                value={billNo}
                onChange={(e) => setBillNo(e.target.value.toUpperCase())}
                className="flex-1 min-w-[200px] h-9 px-2 border border-slate-300 rounded-sm text-[12px] font-mono focus:outline-none focus:border-[#0171d3]"
                placeholder="e.g. BLARC126000713"
                autoFocus
              />
            </div>
            <div className="flex justify-center pt-1">
              <button
                type="submit"
                disabled={loading}
                className="min-w-[120px] h-9 px-4 rounded-sm bg-[#0171d3] text-white text-sm font-semibold hover:bg-[#015fae] disabled:opacity-60"
              >
                {loading ? "Loading…" : "Submit"}
              </button>
            </div>
          </div>
        </form>
      )}

      {step === "edit" && bill && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#0a5fad] px-2 py-2 text-left">System Bill No</th>
                    <th className="border border-[#0a5fad] px-2 py-2 text-left">Manual Bill No</th>
                    <th className="border border-[#0a5fad] px-2 py-2 text-left">Remark</th>
                    <th className="border border-[#0a5fad] px-2 py-2 text-left">Bill Address</th>
                    <th className="border border-[#0a5fad] px-2 py-2 text-left">Billing Party</th>
                    <th className="border border-[#0a5fad] px-2 py-2 text-right">Bill Amount</th>
                    <th className="border border-[#0a5fad] px-2 py-2 text-left">Bill Date</th>
                    <th className="border border-[#0a5fad] px-2 py-2 text-left">Bill Branch</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border border-slate-200 px-2 py-2 font-mono font-semibold text-[#0171d3]">
                      {bill.billNumber}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 font-mono">{bill.manualBillNo}</td>
                    <td className="border border-slate-200 px-2 py-2 max-w-[140px] truncate" title={bill.remark}>
                      {bill.remark}
                    </td>
                    <td
                      className="border border-slate-200 px-2 py-2 max-w-[220px] truncate"
                      title={bill.billAddress}
                    >
                      {bill.billAddress || "—"}
                    </td>
                    <td className="border border-slate-200 px-2 py-2">{bill.billingParty}</td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                      {Number(bill.billAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 whitespace-nowrap">{bill.billDate}</td>
                    <td className="border border-slate-200 px-2 py-2">{bill.billBranch}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm p-4 space-y-3">
            <div>
              <label className={labelCls}>Change Bill Remark</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Change Bill Address</label>
              <textarea
                value={billAddress}
                onChange={(e) => setBillAddress(e.target.value)}
                rows={3}
                className={fieldCls}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <label className={labelCls}>GST IN</label>
                <div className="flex gap-2">
                  <input
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className={`${fieldCls} font-mono`}
                  />
                  <button
                    type="button"
                    onClick={openGstPicker}
                    title="Select GST No."
                    className="h-9 w-9 shrink-0 rounded-full bg-[#0171d3] text-white inline-flex items-center justify-center hover:bg-[#015fae]"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Destination Address</label>
              <input
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value.toUpperCase())}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>PinCode</label>
                <input
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className={`${fieldCls} font-mono`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("search");
                  setBill(null);
                }}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-sm border border-slate-300 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="min-w-[120px] h-9 px-4 rounded-sm bg-[#0171d3] text-white text-sm font-semibold hover:bg-[#015fae] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {gstOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-700">Select GST No.</span>
              <button
                type="button"
                onClick={() => setGstOpen(false)}
                className="w-7 h-7 text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>
            <div className="px-3 py-2 text-[11px] text-slate-600 border-b border-slate-100">
              <span className="font-semibold">Note:</span> Click on radio button to select GST NO.
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#0a5fad] px-2 py-1.5 w-16">Select</th>
                    <th className="border border-[#0a5fad] px-2 py-1.5 text-left">GST No.</th>
                    <th className="border border-[#0a5fad] px-2 py-1.5 text-left">City</th>
                    <th className="border border-[#0a5fad] px-2 py-1.5 text-left">Destination Address</th>
                  </tr>
                </thead>
                <tbody>
                  {gstLoading ? (
                    <tr>
                      <td colSpan={4} className="border border-slate-200 px-3 py-8 text-center text-slate-400">
                        Loading…
                      </td>
                    </tr>
                  ) : gstOptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="border border-slate-200 px-3 py-8 text-center text-slate-400">
                        No GST / destination rows found for this party.
                      </td>
                    </tr>
                  ) : (
                    gstOptions.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="border border-slate-200 px-2 py-1.5 text-center">
                          <input
                            type="radio"
                            name="gstPick"
                            checked={gstSelected === o.id}
                            onChange={() => setGstSelected(o.id)}
                            className="accent-[#0171d3]"
                          />
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 font-mono font-semibold">
                          {o.gstin || "—"}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5">{o.city || "—"}</td>
                        <td className="border border-slate-200 px-2 py-1.5">{o.destinationAddress || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGstOpen(false)}
                className="h-8 px-3 rounded-sm border border-slate-300 text-[12px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyGstOption}
                className="h-8 px-4 rounded-sm bg-[#0171d3] text-white text-[12px] font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
