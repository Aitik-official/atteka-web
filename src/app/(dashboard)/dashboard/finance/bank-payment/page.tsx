"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Landmark, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { SimulatedBadge } from "@/components/common/SimulatedBadge";

export default function BankPaymentPage() {
  const [beneficiaryName, setBeneficiaryName] = useState("SHREE ROADWAYS (ATTACHED VENDOR)");
  const [accountNumber, setAccountNumber] = useState("201009876543");
  const [ifscCode, setIfscCode] = useState("INDB0000001");
  const [amount, setAmount] = useState("35000");
  const [remarks, setRemarks] = useState("Trip Advance - Mumbai to Delhi");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = () => {
    fetch("/api/bank/payment")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setHistory(d.data);
      });
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/bank/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beneficiaryName,
          accountNumber,
          ifscCode,
          amount: Number(amount),
          remarks
        })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.data);
        loadHistory();
      } else {
        alert(data.error || "Payment failed");
      }
    } catch {
      alert("Error contacting Mock Bank Gateway");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C782</span>
            <h1 className="text-lg font-bold text-slate-800">IndusInd Bank Online Payment Process</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/ACCOUNTS.PAGES/Vouchers/H2HOnlineBankPayment.aspx • Host-to-Host (H2H) Corporate Banking Gateway
          </p>
        </div>
        <SimulatedBadge text="INDUSIND H2H MOCK ADAPTER" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Form */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b pb-2">
            Initiate H2H Corporate Payout
          </h2>

          <form onSubmit={handlePay} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Corporate Debit Account</label>
              <input
                type="text"
                readOnly
                value="201002938471 (IndusInd Corporate Current A/c - Atteka Logistics)"
                className="w-full h-8 px-2 border rounded bg-slate-50 font-semibold text-slate-700"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Beneficiary Name (Vendor/Driver)</label>
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Beneficiary Account No</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-300 rounded font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 border border-slate-300 rounded uppercase font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Payment Amount (&#8377;)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-300 rounded font-bold text-blue-700"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Payment Mode</label>
                <select className="w-full h-9 px-2 border border-slate-300 rounded bg-white">
                  <option value="NEFT">NEFT (National Electronic Fund)</option>
                  <option value="RTGS">RTGS (Real Time Gross)</option>
                  <option value="IMPS">IMPS Immediate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Payment Narration / Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              {loading ? "Processing via Mock Gateway..." : `Process Payout of ₹${Number(amount).toLocaleString()}`}
            </button>
          </form>

          {result && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Payment Dispatched (Mock Confirmation)</span>
              </div>
              <div className="space-y-1 text-slate-700">
                <p>Transaction ID: <strong className="font-mono">{result.transactionId}</strong></p>
                <p>Bank UTR Ref: <strong className="font-mono text-emerald-800">{result.utrNumber}</strong></p>
                <p>Beneficiary: <strong>{result.beneficiaryName}</strong></p>
                <p>Status: <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-200 text-emerald-800 font-bold">{result.status}</span></p>
              </div>
              <p className="text-[10px] text-amber-700 italic border-t pt-1">
                * Note: Simulation operation only. No real banking or financial transaction has occurred.
              </p>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Online Bank Payments
            </h2>
            <button onClick={loadHistory} className="text-slate-400 hover:text-slate-600">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[420px] space-y-2 text-xs">
            {history.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No online payments yet.</p>
            ) : (
              history.map((h) => (
                <div key={h._id} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 block">{h.beneficiaryName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">UTR: {h.utrNumber}</span>
                    <span className="text-[10px] text-slate-400 block">{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">&#8377;{h.amount?.toLocaleString()}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                      {h.status}
                    </span>
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

