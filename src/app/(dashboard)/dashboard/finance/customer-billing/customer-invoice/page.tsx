"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "@/lib/toastBus";

type Party = {
  code: string;
  name: string;
  label: string;
  gstin: string;
  gstState: string;
  address: string;
  pinCode: string;
  creditLimit: number;
  osAmt: number;
};

type ProfitCenter = { code: string; name: string; gstin: string; gstState: string };
type BillingHead = { code: string; label: string; sac: string; account: string };
type Branch = { code: string; name: string };

type LineItem = {
  id: string;
  gstRate: number;
  billingHead: string;
  accountDescription: string;
  sacCode: string;
  qty: number;
  rate: number;
  amount: number;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
  docketNo: string;
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function money(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function emptyLine(id: string): LineItem {
  return {
    id,
    gstRate: 18,
    billingHead: "",
    accountDescription: "",
    sacCode: "",
    qty: 1,
    rate: 0,
    amount: 0,
    igst: 0,
    cgst: 0,
    sgst: 0,
    total: 0,
    docketNo: ""
  };
}

function recomputeLine(line: LineItem, isInterState: boolean): LineItem {
  const amount = Number((Math.max(0, line.qty) * Math.max(0, line.rate)).toFixed(2));
  const tax = Number(((amount * Math.max(0, line.gstRate)) / 100).toFixed(2));
  const igst = isInterState ? tax : 0;
  const half = isInterState ? 0 : Number((tax / 2).toFixed(2));
  return {
    ...line,
    amount,
    igst,
    cgst: half,
    sgst: half,
    total: Number((amount + igst + half + half).toFixed(2))
  };
}

export default function CustomerInvoicePage() {
  const [billNo, setBillNo] = useState("BLALC12600608");
  const [billDate, setBillDate] = useState(toInputDate(new Date()));
  const [manualBillNo, setManualBillNo] = useState("");
  const [parties, setParties] = useState<Party[]>([]);
  const [profitCenters, setProfitCenters] = useState<ProfitCenter[]>([]);
  const [billingHeads, setBillingHeads] = useState<BillingHead[]>([]);
  const [sacCodes, setSacCodes] = useState<string[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [billingParty, setBillingParty] = useState("");
  const [partyGst, setPartyGst] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [profitCenter, setProfitCenter] = useState("");
  const [profitCenterGst, setProfitCenterGst] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [osAmt, setOsAmt] = useState(25000);
  const [creditLimit, setCreditLimit] = useState(100000);
  const [partyState, setPartyState] = useState("");
  const [pcState, setPcState] = useState("");
  const [billingFrom, setBillingFrom] = useState(toInputDate(new Date()));
  const [billingTo, setBillingTo] = useState(toInputDate(new Date()));
  const [collectionBranch, setCollectionBranch] = useState("ALC1");
  const [remark, setRemark] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine("line-1")]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/finance/customer-invoice?masters=1")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const m = d.data || {};
        if (m.billNo) setBillNo(m.billNo);
        setParties(m.parties || []);
        setProfitCenters(m.profitCenters || []);
        setBillingHeads(m.billingHeads || []);
        setSacCodes(m.sacCodes || []);
        setBranches(m.collectionBranches || []);
        if (m.collectionBranches?.[0]?.code) setCollectionBranch(m.collectionBranches[0].code);
      })
      .catch(() => {});
  }, []);

  const isInterState = Boolean(partyState && pcState && partyState !== pcState);
  const gstTxnType = !partyState || !pcState
    ? ""
    : isInterState
      ? "Inter-State (IGST)"
      : "Intra-State (CGST + SGST)";

  useEffect(() => {
    setLines((prev) => prev.map((l) => recomputeLine(l, isInterState)));
  }, [isInterState]);

  const totals = useMemo(() => {
    const amount = lines.reduce((s, l) => s + l.amount, 0);
    const igst = lines.reduce((s, l) => s + l.igst, 0);
    const cgst = lines.reduce((s, l) => s + l.cgst, 0);
    const sgst = lines.reduce((s, l) => s + l.sgst, 0);
    return {
      amount: Number(amount.toFixed(2)),
      igst: Number(igst.toFixed(2)),
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      net: Number((amount + igst + cgst + sgst).toFixed(2))
    };
  }, [lines]);

  const selectParty = (code: string) => {
    setBillingParty(code);
    const p = parties.find((x) => x.code === code);
    if (!p) return;
    setPartyGst(p.gstin);
    setDestinationAddress(p.address);
    setPinCode(p.pinCode);
    setOsAmt(p.osAmt);
    setCreditLimit(p.creditLimit);
    setPartyState(p.gstState);
  };

  const selectProfitCenter = (code: string) => {
    setProfitCenter(code);
    const pc = profitCenters.find((x) => x.code === code);
    if (!pc) return;
    setProfitCenterGst(pc.gstin);
    setPcState(pc.gstState);
  };

  const updateLine = (id: string, patch: Partial<LineItem>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        let next = { ...l, ...patch };
        if (patch.billingHead) {
          const head = billingHeads.find((h) => h.code === patch.billingHead);
          if (head) {
            next.accountDescription = head.account;
            next.sacCode = head.sac;
          }
        }
        return recomputeLine(next, isInterState);
      })
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine(`line-${Date.now()}`)]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const resetForm = () => {
    setManualBillNo("");
    setBillingParty("");
    setPartyGst("");
    setDestinationAddress("");
    setPinCode("");
    setProfitCenter("");
    setProfitCenterGst("");
    setDocumentNo("");
    setOsAmt(25000);
    setCreditLimit(100000);
    setPartyState("");
    setPcState("");
    setBillingFrom(toInputDate(new Date()));
    setBillingTo(toInputDate(new Date()));
    setBillDate(toInputDate(new Date()));
    setRemark("");
    setLines([emptyLine("line-1")]);
    toast.success("Form reset");
  };

  const submit = async () => {
    if (!billingParty) {
      toast.error("Select Billing Party");
      return;
    }
    if (!profitCenter) {
      toast.error("Select Profit Center");
      return;
    }
    if (totals.net <= 0) {
      toast.error("Enter Qty and Rate for at least one line");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/finance/customer-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billNo,
          billDate,
          manualBillNo,
          billingParty,
          partyGst,
          destinationAddress,
          pinCode,
          profitCenter,
          profitCenterGst,
          documentNo,
          gstTransactionType: gstTxnType,
          billingFrom,
          billingTo,
          collectionBranch,
          remark: remark.toUpperCase(),
          lines,
          totalAmount: totals.amount,
          totalIgst: totals.igst,
          totalCgst: totals.cgst,
          totalSgst: totals.sgst,
          netPayable: totals.net
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submit failed");
        return;
      }
      toast.success(data.message || "Invoice submitted");
      if (data.data?.billNo) setBillNo(data.data.billNo);
    } catch {
      toast.error("Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    "w-full h-10 px-3 border border-slate-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-[#0171d3]";
  const label = "block text-[11px] font-semibold text-slate-600 mb-1";

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
          <Link
            href="/dashboard/finance/customer-billing"
            className="mt-0.5 h-8 w-8 rounded-full border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Customer Invoice</h1>
            <p className="text-xs text-slate-500">GST Tax Invoice - Rate Contract / E-Invoice</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={label}>Bill No (Auto Predicted)</label>
              <input value={billNo} readOnly className={`${field} bg-slate-50 font-semibold text-[#0171d3]`} />
            </div>
            <div>
              <label className={label}>Bill Date</label>
              <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>Manual Bill No (Optional)</label>
              <input
                value={manualBillNo}
                onChange={(e) => setManualBillNo(e.target.value.toUpperCase())}
                placeholder="Enter manual reference"
                className={field}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={label}>
                Billing Party <span className="text-red-500">*</span>
              </label>
              <select value={billingParty} onChange={(e) => selectParty(e.target.value)} className={field}>
                <option value="">Select Billing Party</option>
                {parties.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>GST No (Party)</label>
              <select
                value={partyGst}
                onChange={(e) => setPartyGst(e.target.value)}
                className={field}
              >
                <option value="">Select GST</option>
                {partyGst ? <option value={partyGst}>{partyGst}</option> : null}
                {parties
                  .filter((p) => p.gstin !== partyGst)
                  .map((p) => (
                    <option key={p.gstin} value={p.gstin}>
                      {p.gstin}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={label}>Destination Address</label>
              <input
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="Complete delivery address"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Pin Code</label>
              <input
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={field}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={label}>Profit Center (Branch)</label>
              <select
                value={profitCenter}
                onChange={(e) => selectProfitCenter(e.target.value)}
                className={field}
              >
                <option value="">--Select Profit Center--</option>
                {profitCenters.map((pc) => (
                  <option key={pc.code} value={pc.code}>
                    {pc.code} - {pc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Profit Center GST No</label>
              <input value={profitCenterGst} readOnly className={`${field} bg-slate-50`} />
            </div>
            <div>
              <label className={label}>Document No (PO, DO, WO)</label>
              <input
                value={documentNo}
                onChange={(e) => setDocumentNo(e.target.value.toUpperCase())}
                placeholder="PO or WO Number"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Current O.S / Credit Limit</label>
              <input
                value={`${money(osAmt)} / ${money(creditLimit)}`}
                readOnly
                className={`${field} bg-slate-50 text-red-600 font-semibold`}
              />
            </div>
          </div>

          <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-2.5 text-[12px] text-slate-700">
            <span className="font-semibold text-[#0171d3]">GST Transaction Type: </span>
            {gstTxnType || "(Based on Client GST State vs Profit Center GST State)"}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={label}>Billing From Date</label>
              <input type="date" value={billingFrom} onChange={(e) => setBillingFrom(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>Billing To Date</label>
              <input type="date" value={billingTo} onChange={(e) => setBillingTo(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>Collection Branch</label>
              <select
                value={collectionBranch}
                onChange={(e) => setCollectionBranch(e.target.value)}
                className={field}
              >
                {branches.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className={label}>Remark</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value.toUpperCase())}
                rows={2}
                placeholder="Additional remarks (auto uppercase)"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-[13px] focus:outline-none focus:border-[#0171d3]"
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-2">Bill Charges Details (Tax Invoice Items)</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-[1200px] w-full text-[11px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="px-2 py-2 text-left font-semibold">GST Rate (%)</th>
                    <th className="px-2 py-2 text-left font-semibold">Billing Head</th>
                    <th className="px-2 py-2 text-left font-semibold">Account Description</th>
                    <th className="px-2 py-2 text-left font-semibold">SAC Code</th>
                    <th className="px-2 py-2 text-left font-semibold">Qty</th>
                    <th className="px-2 py-2 text-left font-semibold">Rate (₹)</th>
                    <th className="px-2 py-2 text-left font-semibold">Amount (₹)</th>
                    <th className="px-2 py-2 text-left font-semibold">IGST (₹)</th>
                    <th className="px-2 py-2 text-left font-semibold">CGST (₹)</th>
                    <th className="px-2 py-2 text-left font-semibold">SGST (₹)</th>
                    <th className="px-2 py-2 text-left font-semibold">Total (₹)</th>
                    <th className="px-2 py-2 text-left font-semibold">Docket No</th>
                    <th className="px-2 py-2 text-center font-semibold"> </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id} className="border-t border-slate-100 bg-white">
                      <td className="px-2 py-1.5">
                        <select
                          value={line.gstRate}
                          onChange={(e) => updateLine(line.id, { gstRate: Number(e.target.value) })}
                          className="h-8 w-full border border-slate-200 rounded px-1"
                        >
                          {[0, 5, 12, 18, 28].map((r) => (
                            <option key={r} value={r}>
                              {r}%
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={line.billingHead}
                          onChange={(e) => updateLine(line.id, { billingHead: e.target.value })}
                          className="h-8 w-full border border-slate-200 rounded px-1 min-w-[140px]"
                        >
                          <option value="">---Select---</option>
                          {billingHeads.map((h) => (
                            <option key={h.code} value={h.code}>
                              {h.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={line.accountDescription}
                          onChange={(e) => updateLine(line.id, { accountDescription: e.target.value })}
                          className="h-8 w-full border border-slate-200 rounded px-2 min-w-[120px]"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={line.sacCode}
                          onChange={(e) => updateLine(line.id, { sacCode: e.target.value })}
                          className="h-8 w-full border border-slate-200 rounded px-1"
                        >
                          <option value="">SAC</option>
                          {sacCodes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          value={line.qty}
                          onChange={(e) => updateLine(line.id, { qty: Number(e.target.value) })}
                          className="h-8 w-16 border border-slate-200 rounded px-2"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          value={line.rate || ""}
                          onChange={(e) => updateLine(line.id, { rate: Number(e.target.value) })}
                          className="h-8 w-20 border border-slate-200 rounded px-2"
                        />
                      </td>
                      <td className="px-2 py-1.5 font-semibold">{money(line.amount)}</td>
                      <td className="px-2 py-1.5">{money(line.igst)}</td>
                      <td className="px-2 py-1.5">{money(line.cgst)}</td>
                      <td className="px-2 py-1.5">{money(line.sgst)}</td>
                      <td className="px-2 py-1.5 font-semibold text-[#0171d3]">{money(line.total)}</td>
                      <td className="px-2 py-1.5">
                        <input
                          value={line.docketNo}
                          onChange={(e) => updateLine(line.id, { docketNo: e.target.value.toUpperCase() })}
                          className="h-8 w-28 border border-slate-200 rounded px-2"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded text-red-500 hover:bg-red-50"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={addLine}
                className="h-9 px-4 rounded-md border border-[#7eb6e8] text-[#0171d3] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#e8f1fb]"
              >
                <Plus className="w-4 h-4" /> Add More Items
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Amount", value: totals.amount },
              { label: "Total IGST", value: totals.igst },
              { label: "Total CGST", value: totals.cgst },
              { label: "Total SGST", value: totals.sgst }
            ].map((t) => (
              <div key={t.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="text-[11px] text-slate-500 font-semibold">{t.label}</div>
                <div className="text-base font-bold text-slate-800 mt-1">{money(t.value)}</div>
              </div>
            ))}
            <div className="rounded-lg border border-[#0171d3] bg-[#0171d3] px-3 py-3 text-white">
              <div className="text-[11px] font-semibold opacity-90">Net Payable (₹)</div>
              <div className="text-base font-bold mt-1">{money(totals.net)}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="h-10 px-5 rounded-md bg-[#0171d3] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#0159a8] disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit Invoice"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="h-10 px-5 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
