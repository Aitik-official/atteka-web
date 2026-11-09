"use client";

import React, { useState, useEffect } from "react";
import { Landmark, CreditCard, CheckCircle2, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { SimulatedBadge } from "@/components/common/SimulatedBadge";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function BankPaymentPage() {
  const [beneficiaryName, setBeneficiaryName] = useState("RAMESH LOGISTICS FLEET");
  const [accountNumber, setAccountNumber] = useState("987654321098");
  const [ifscCode, setIfscCode] = useState("INDB0000001");
  const [amount, setAmount] = useState("15000");
  const [remarks, setRemarks] = useState("Advance freight disbursement for corridor trip");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

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
    setErrorMsg("");

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
        setErrorMsg(data.error || "Payment execution failed");
      }
    } catch {
      setErrorMsg("Error contacting Bank Gateway adapter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Reusable PageHeader */}
      <PageHeader
        moduleCode="C782"
        title="IndusInd Bank Online Payment Process"
        subtitle="Finance • H2HOnlineBankPayment.aspx • Host-to-Host (H2H) Corporate Banking Gateway"
actions={<SimulatedBadge text="INDUSIND H2H ADAPTER" />}
      />

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Form */}
        <SectionCard
          title="Initiate H2H Corporate Payout"
          icon={Landmark}
          badge="H2H DIRECT"
        >
          <form onSubmit={handlePay} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Corporate Debit Account</label>
              <input
                type="text"
                readOnly
                value="201002938471 (IndusInd Corporate Current A/c - Atteka Logistics)"
                className="w-full h-8.5 px-3 border border-slate-200 rounded-lg bg-slate-100 font-semibold text-slate-700 text-[11px]"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Beneficiary Name (Vendor / Driver)</label>
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg font-medium focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Beneficiary Account No</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg font-mono focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg uppercase font-mono focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg font-bold text-blue-700 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Payment Mode</label>
                <select className="w-full h-9 px-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg">
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
                className="w-full h-9 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{loading ? "Processing via Gateway..." : `Process Payout of ₹${Number(amount).toLocaleString()}`}</span>
            </button>
          </form>

          {result && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Payment Dispatched (Mock Confirmation)</span>
              </div>
              <div className="space-y-1 text-slate-700">
                <p>Transaction ID: <strong className="font-mono">{result.transactionId}</strong></p>
                <p>Bank UTR Ref: <strong className="font-mono text-emerald-800">{result.utrNumber}</strong></p>
                <p>Beneficiary: <strong>{result.beneficiaryName}</strong></p>
                <p>Status: <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-200 text-emerald-800 font-bold">{result.status}</span></p>
              </div>
              <p className="text-[10px] text-amber-700 italic border-t border-emerald-200 pt-1">
                * Note: Operation completed via Bank Adapter.
              </p>
            </div>
          )}
        </SectionCard>

        {/* Transaction History */}
        <SectionCard
          title="Recent Online Bank Payments"
          icon={CreditCard}
          badge="HISTORY"
          headerAction={
            <button
              onClick={loadHistory}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Refresh History"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="overflow-y-auto max-h-[420px] space-y-2 text-xs">
            {history.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No online payments yet.</p>
            ) : (
              history.map((h) => (
                <div key={h._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center hover:bg-slate-100/60 transition-colors">
                  <div>
                    <span className="font-bold text-slate-800 block">{h.beneficiaryName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">UTR: {h.utrNumber}</span>
                    <span className="text-[10px] text-slate-400 block">{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block font-mono">₹{h.amount?.toLocaleString()}</span>
                    <StatusBadge status={h.status} size="sm" />
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
