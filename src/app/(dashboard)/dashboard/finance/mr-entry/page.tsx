"use client";

import React, { useState, useEffect } from "react";
import { Receipt, CheckCircle2, Plus, RefreshCw } from "lucide-react";

export default function MoneyReceiptPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("TATA MOTORS LTD");
  const [selectedBill, setSelectedBill] = useState("");
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [refNo, setRefNo] = useState("NEFT998822");
  const [receivedAmount, setReceivedAmount] = useState("44625");
  const [tdsAmount, setTdsAmount] = useState("0");
  const [rebateAmount, setRebateAmount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

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
        alert(data.error || "Failed to record MR");
      }
    } catch {
      alert("Error recording receipt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C202</span>
            <h1 className="text-lg font-bold text-slate-800">Money Receipt (MR) Entry & Collection</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/ACCOUNTS.PAGES/MR/BillMR_RebateNew.aspx • Customer Bill Collections & Rebates
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b pb-2">
            Record New Money Receipt
          </h2>

          <form onSubmit={handleCreateMR} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Customer</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-8 px-2 border rounded font-semibold text-slate-700"
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
                className="w-full h-9 px-2 border border-slate-300 rounded bg-white font-medium"
              >
                <option value="">-- Direct On-Account Advance --</option>
                {bills.map((b) => (
                  <option key={b.billNumber} value={b.billNumber}>
                    {b.billNumber} - &#8377;{b.grandTotal?.toLocaleString()} ({b.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full h-8 px-2 border rounded bg-white"
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
                  className="w-full h-8 px-2 border rounded font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Received (&#8377;)</label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full h-8 px-2 border rounded font-bold text-blue-700"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">TDS (&#8377;)</label>
                <input
                  type="number"
                  value={tdsAmount}
                  onChange={(e) => setTdsAmount(e.target.value)}
                  className="w-full h-8 px-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Rebate (&#8377;)</label>
                <input
                  type="number"
                  value={rebateAmount}
                  onChange={(e) => setRebateAmount(e.target.value)}
                  className="w-full h-8 px-2 border rounded"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow transition-colors flex items-center justify-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5" />
              {loading ? "Recording..." : "Save Money Receipt (MR)"}
            </button>
          </form>
        </div>

        {/* Existing Receipts */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
            Recent Money Receipts
          </h2>
          <div className="overflow-y-auto max-h-[380px] space-y-2 text-xs">
            {receipts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No Money Receipts recorded yet.</p>
            ) : (
              receipts.map((r) => (
                <div key={r._id} className="p-3 bg-slate-50 border rounded flex justify-between items-center">
                  <div>
                    <span className="font-bold text-blue-700 block">{r.mrNumber}</span>
                    <span className="text-slate-700">{r.customerName}</span>
                    <span className="text-[11px] text-slate-400 block">Ref: {r.referenceNumber} • {r.paymentMode}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 block">&#8377;{r.totalReceived?.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">{new Date(r.mrDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

