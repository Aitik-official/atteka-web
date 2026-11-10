"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "@/lib/toastBus";

type Party = {
  code: string;
  name: string;
  label: string;
  gstin: string;
  creditLimit: number;
  osAmt: number;
};

type ChargeKey =
  | "vehicleDetention"
  | "handling"
  | "demurrage"
  | "pendingDemurrage"
  | "pod"
  | "reDelivery"
  | "loadingUnloading"
  | "miscellaneous"
  | "godownRent";

const CHARGE_ROWS: { key: ChargeKey; label: string; hasWeightRate?: boolean }[] = [
  { key: "vehicleDetention", label: "Vehicle Detention Charges" },
  { key: "handling", label: "Handling Charges" },
  { key: "demurrage", label: "Demurrage Charges" },
  { key: "pendingDemurrage", label: "Pending Demurrage Charges" },
  { key: "pod", label: "POD Charges" },
  { key: "reDelivery", label: "Re-Delivery Charges" },
  { key: "loadingUnloading", label: "Loading/Unloading Charges", hasWeightRate: true },
  { key: "miscellaneous", label: "Miscellaneous Charges" },
  { key: "godownRent", label: "Godown Rent Charges" }
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function num(v: string | number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function OtherBillGenerationPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [billingParty, setBillingParty] = useState("");
  const [manualBillNo, setManualBillNo] = useState("");
  const [billDate, setBillDate] = useState(toInputDate(new Date()));
  const [gstNo, setGstNo] = useState("");
  const [periodFrom, setPeriodFrom] = useState(toInputDate(new Date()));
  const [periodTo, setPeriodTo] = useState(toInputDate(new Date()));
  const [profitCenter, setProfitCenter] = useState("ALC1");
  const [collectionBranch, setCollectionBranch] = useState("ALC1");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [docketNo, setDocketNo] = useState("");
  const [remark, setRemark] = useState("");
  const [osAmt, setOsAmt] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [charges, setCharges] = useState<Record<ChargeKey, number>>({
    vehicleDetention: 0,
    handling: 0,
    demurrage: 0,
    pendingDemurrage: 0,
    pod: 0,
    reDelivery: 0,
    loadingUnloading: 0,
    miscellaneous: 0,
    godownRent: 0
  });
  const [luWeight, setLuWeight] = useState(0);
  const [luRate, setLuRate] = useState(0);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatedBillNo, setGeneratedBillNo] = useState("");

  useEffect(() => {
    fetch("/api/finance/other-bill?parties=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setParties(d.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const computed = Number((luWeight * luRate).toFixed(2));
    setCharges((prev) => ({ ...prev, loadingUnloading: computed }));
  }, [luWeight, luRate]);

  const filteredParties = useMemo(() => {
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q)
    );
  }, [parties, lookupQuery]);

  const total = useMemo(
    () => Object.values(charges).reduce((s, v) => s + num(v), 0),
    [charges]
  );

  const selectParty = (p: Party) => {
    setBillingParty(p.label);
    setGstNo(p.gstin);
    setOsAmt(p.osAmt);
    setCreditLimit(p.creditLimit);
    setLookupOpen(false);
    setLookupQuery("");
  };

  const setCharge = (key: ChargeKey, value: string) => {
    setCharges((prev) => ({ ...prev, [key]: num(value) }));
  };

  const submit = async () => {
    if (!billingParty.trim()) {
      toast.error("Select Billing Party");
      return;
    }
    if (total <= 0) {
      toast.error("Enter at least one charge amount");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/finance/other-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingParty,
          manualBillNo,
          billDate,
          gstNo,
          periodFrom,
          periodTo,
          profitCenter,
          collectionBranch,
          destinationAddress,
          docketNo,
          remark,
          charges,
          loadingUnloading: { weight: luWeight, rate: luRate },
          total
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to generate Other Bill");
        return;
      }
      setGeneratedBillNo(data.data?.billNo || "");
      toast.success(data.message || "Other Bill generated");
    } catch {
      toast.error("Failed to generate Other Bill");
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    "h-8 px-2 border border-slate-300 rounded-sm bg-white text-[12px] focus:outline-none focus:border-[#0171d3]";
  const label = "text-[11px] font-semibold text-slate-700 whitespace-nowrap";

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
          Other Bill Generation
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className={`${label} w-[130px]`}>Bill No</span>
            <span className="text-red-600 font-semibold">
              {generatedBillNo || "System Generated..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${label} w-[130px]`}>Manual Bill No</span>
            <input
              value={manualBillNo}
              onChange={(e) => setManualBillNo(e.target.value.toUpperCase())}
              className={`${field} flex-1`}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className={`${label} w-[130px]`}>Billing Party</span>
            <input
              value={billingParty}
              onChange={(e) => setBillingParty(e.target.value)}
              className={`${field} flex-1`}
            />
            <button
              type="button"
              onClick={() => setLookupOpen(true)}
              className="h-8 w-8 rounded-full border border-[#7eb6e8] text-[#0171d3] text-[10px] font-bold hover:bg-[#e8f1fb]"
              title="Lookup Billing Party"
            >
              ...
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${label} w-[130px]`}>Bill Date</span>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className={`${field} w-[160px]`}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className={`${label} w-[130px]`}>GSTNO</span>
            <input
              value={gstNo}
              onChange={(e) => setGstNo(e.target.value.toUpperCase())}
              className={`${field} flex-1 uppercase`}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${label} w-[130px]`}>Billing Period</span>
            <span className="text-slate-600">From</span>
            <input
              type="date"
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
              className={`${field} w-[140px]`}
            />
            <span className="text-slate-600">To</span>
            <input
              type="date"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
              className={`${field} w-[140px]`}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className={`${label} w-[130px]`}>Prepared At</span>
            <span className="font-semibold text-slate-800">ALC1</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${label} w-[130px]`}>Prepared By</span>
            <span className="font-semibold text-slate-800">AL002</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`${label} w-[130px]`}>Profit Center</span>
            <input
              value={profitCenter}
              onChange={(e) => setProfitCenter(e.target.value.toUpperCase())}
              className={`${field} flex-1 uppercase`}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={`${label} w-[130px]`}>Current O.S Amt. / Credit Limit</span>
            <span className="text-red-600 font-semibold">
              {osAmt.toLocaleString("en-IN")} / {creditLimit.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`${label} w-[130px]`}>Collection Branch</span>
            <input
              value={collectionBranch}
              onChange={(e) => setCollectionBranch(e.target.value.toUpperCase())}
              className={`${field} flex-1 uppercase`}
            />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <span className={`${label} w-[130px]`}>Destination Address</span>
            <input
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              className={`${field} flex-1`}
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`${label} w-[130px]`}>Docket No</span>
              <input
                value={docketNo}
                onChange={(e) => setDocketNo(e.target.value)}
                className={`${field} flex-1`}
              />
            </div>
            <p className="text-[10px] text-slate-500 pl-[138px]">
              For multiple Docket use , separator. Ex: 570001, 570002
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
          Bill Charges Details
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[640px]">
            <thead>
              <tr className="bg-[#5b9bd5] text-white">
                <th className="border border-[#4a8ac4] px-2 py-1.5 w-16 text-center">Sr. No</th>
                <th className="border border-[#4a8ac4] px-2 py-1.5 text-left">Billing Head</th>
                <th className="border border-[#4a8ac4] px-2 py-1.5 text-right w-[220px]">
                  Amount in Rs.
                </th>
              </tr>
            </thead>
            <tbody>
              {CHARGE_ROWS.map((row, idx) => (
                <tr key={row.key} className="odd:bg-white even:bg-slate-50/70">
                  <td className="border border-slate-200 px-2 py-1.5 text-center">{idx + 1}</td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>{row.label}</span>
                      {row.hasWeightRate ? (
                        <>
                          <label className="inline-flex items-center gap-1 text-[11px]">
                            Weight:
                            <input
                              type="number"
                              value={luWeight}
                              onChange={(e) => setLuWeight(num(e.target.value))}
                              className="h-7 w-20 px-1 border border-slate-300 rounded-sm"
                            />
                          </label>
                          <label className="inline-flex items-center gap-1 text-[11px]">
                            Rate:
                            <input
                              type="number"
                              value={luRate}
                              onChange={(e) => setLuRate(num(e.target.value))}
                              className="h-7 w-20 px-1 border border-slate-300 rounded-sm"
                            />
                          </label>
                        </>
                      ) : null}
                    </div>
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-right">
                    <input
                      type="number"
                      value={charges[row.key]}
                      onChange={(e) => setCharge(row.key, e.target.value)}
                      readOnly={row.hasWeightRate}
                      className={`h-8 w-full max-w-[180px] ml-auto px-2 border border-slate-300 rounded-sm text-right ${
                        row.hasWeightRate ? "bg-slate-50" : "bg-white"
                      }`}
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-[#e8f1fb] font-semibold">
                <td className="border border-slate-200 px-2 py-2" colSpan={2}>
                  TOTAL
                </td>
                <td className="border border-slate-200 px-2 py-2 text-right text-[#0171d3]">
                  {total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200">
          <label className="block text-[12px] font-semibold text-slate-700 mb-1">Remark</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-[12px] focus:outline-none focus:border-[#0171d3]"
          />
        </div>

        <div className="flex justify-center py-4">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {lookupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Select Billing Party</h2>
              <button
                type="button"
                onClick={() => setLookupOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Search party"
                  className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-xs"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto text-xs">
              {filteredParties.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => selectParty(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50"
                >
                  <span className="font-mono font-semibold text-blue-700">{p.code}</span>
                  <span className="text-slate-700 ml-2">{p.name}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">{p.gstin}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
