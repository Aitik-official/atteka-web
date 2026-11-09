"use client";

import React, { useState, useEffect } from "react";
import { Receipt, CheckCircle2, AlertCircle, Printer, FileText, FileSpreadsheet, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";

export default function MREntryPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("TATA MOTORS LTD");
  const [selectedBill, setSelectedBill] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("46200");
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [refNo, setRefNo] = useState("UTR-2026-98124");
  const [tdsAmount, setTdsAmount] = useState("0");
  const [rebateAmount, setRebateAmount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = () => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBills(d.data);
      });

    fetch("/api/mr")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReceipts(d.data);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMR = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/mr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerCode: "CUST-001",
          customerName,
          allocatedBills: selectedBill ? [{ billNumber: selectedBill, amount: Number(receivedAmount), rebate: Number(rebateAmount) }] : [],
          paymentMode,
          referenceNumber: refNo,
          totalReceived: Number(receivedAmount),
          tdsDeducted: Number(tdsAmount),
          rebateDiscount: Number(rebateAmount)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Money Receipt ${data.data?.mrNumber} generated & ledger credited!`);
        loadData();
      } else {
        setErrorMsg(data.error || "Failed to record MR");
      }
    } catch {
      setErrorMsg("Error recording receipt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Authentic WebCoreVision Ribbon Header */}
      <WcvRibbonHeader title="MR Entry" />

      {/* 7 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Generate Bill MR With Rebate"
          description="Generate Bill MR With Rebate"
          href="/dashboard/finance/mr-entry/generate-bill-mr-rebate"
          icon={Receipt}
        />
        <WcvActionCard
          title="Generate Bill MR."
          description="Generate Bill MR."
          href="/dashboard/finance/mr-entry/generate-bill-mr"
          icon={Receipt}
        />
        <WcvActionCard
          title="Generate Paid/Topay MR."
          description="Generate Paid/Topay MR."
          href="/dashboard/finance/mr-entry/paid-topay-mr"
          icon={Receipt}
        />
        <WcvActionCard
          title="View Print MR"
          description="View Print MR"
          href="/dashboard/finance/mr-entry/view-print-mr"
          icon={Printer}
        />
        <WcvActionCard
          title="Credit Note"
          description="Credit Note"
          href="/dashboard/finance/mr-entry/credit-note"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="View Print Credit Note"
          description="View Print Credit Note"
          href="/dashboard/finance/mr-entry/view-print-credit-note"
          icon={Printer}
        />
        <WcvActionCard
          title="Credit Note New"
          description="Credit Note New"
          href="/dashboard/finance/mr-entry/credit-note-new"
          icon={PlusCircle}
        />
      </div>

      {/* Reusable Header */}
      <div id="mr-entry-form" className="pt-2">
        <PageHeader
          moduleCode="C202"
          title="Money Receipt (MR) Entry & Collection"
          subtitle="Finance • BillMR_RebateNew.aspx • Customer Bill Collections, Rebates & Ledger Credits"
/>
      </div>

      {success && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form */}
        <SectionCard
          title="Record New Money Receipt"
          icon={Receipt}
          badge="ENTRY"
        >
          <form onSubmit={handleCreateMR} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Customer</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-8.5 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg font-semibold text-slate-700"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Allocate Customer Bill</label>
              <select
                value={selectedBill}
                onChange={(e) => {
                  setSelectedBill(e.target.value);
                  const b = bills.find((x) => x.billNumber === e.target.value);
                  if (b) setReceivedAmount(b.grandTotal.toString());
                }}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-medium"
              >
                <option value="">-- Direct On-Account Advance --</option>
                {bills.map((b) => (
                  <option key={b.billNumber} value={b.billNumber}>
                    {b.billNumber} - ₹{b.grandTotal?.toLocaleString()} ({b.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full h-8.5 px-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                >
                  <option value="NEFT">NEFT Transfer</option>
                  <option value="RTGS">RTGS Transfer</option>
                  <option value="CHEQUE">Cheque Collection</option>
                  <option value="ONLINE">Online Portal</option>
                  <option value="CASH">Cash Collection</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Cheque / UTR Ref No</label>
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  className="w-full h-8.5 px-3 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Received (₹)</label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full h-8.5 px-2.5 border border-slate-200 rounded-lg font-bold text-blue-700"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">TDS (₹)</label>
                <input
                  type="number"
                  value={tdsAmount}
                  onChange={(e) => setTdsAmount(e.target.value)}
                  className="w-full h-8.5 px-2.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Rebate (₹)</label>
                <input
                  type="number"
                  value={rebateAmount}
                  onChange={(e) => setRebateAmount(e.target.value)}
                  className="w-full h-8.5 px-2.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{loading ? "Recording..." : "Save Money Receipt (MR)"}</span>
            </button>
          </form>
        </SectionCard>

        {/* Existing Receipts */}
        <SectionCard
          title="Recent Money Receipts"
          icon={Receipt}
          badge="LEDGER"
        >
          <div className="overflow-y-auto max-h-[380px] space-y-2 text-xs">
            {receipts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No Money Receipts recorded yet.</p>
            ) : (
              receipts.map((r) => (
                <div key={r._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center hover:bg-slate-100/70 transition-colors">
                  <div>
                    <span className="font-bold text-blue-700 font-mono block">{r.mrNumber}</span>
                    <span className="text-slate-700 font-medium">{r.customerName}</span>
                    <span className="text-[11px] text-slate-400 block">Ref: {r.referenceNumber} • {r.paymentMode}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 font-mono block">₹{r.totalReceived?.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">{new Date(r.mrDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
