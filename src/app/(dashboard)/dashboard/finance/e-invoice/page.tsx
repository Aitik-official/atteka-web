"use client";

import React, { useState, useEffect } from "react";
import { QrCode, FileText, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { SimulatedBadge } from "@/components/common/SimulatedBadge";

export default function EInvoicePage() {
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [cancelIrn, setCancelIrn] = useState("");
  const [cancelReason, setCancelReason] = useState("Data entry typo");
  const [cancelMsg, setCancelMsg] = useState("");

  const loadBills = () => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBills(d.data);
      });
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleGenerateIRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    setLoading(true);
    setResult(null);

    const billObj = bills.find((b) => b.billNumber === selectedBill);

    try {
      const res = await fetch("/api/gst/irn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billNumber: selectedBill,
          sellerGstin: "27AABCA1234F1Z5",
          buyerGstin: "27AABCB9876G1Z2",
          totalAmount: billObj?.grandTotal || 25000,
          taxAmount: billObj?.taxAmount || 1250
        })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.data?.responsePayload);
        loadBills();
      } else {
        alert(data.error || "Generation failed");
      }
    } catch {
      alert("Error contacting GST Mock Adapter");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelIRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelIrn) return;

    try {
      const res = await fetch(`/api/gst/irn?irn=${encodeURIComponent(cancelIrn)}&reason=${encodeURIComponent(cancelReason)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setCancelMsg(data.message);
        setCancelIrn("");
        loadBills();
      } else {
        alert(data.error || "Cancel failed");
      }
    } catch {
      alert("Error during IRN cancellation");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C655</span>
            <h1 className="text-lg font-bold text-slate-800">Generate E-Invoice (IRN Engine)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/ACCOUNTS.PAGES/Bill/GenrateIRN.aspx • Government E-Invoice System Interface
          </p>
        </div>
        <SimulatedBadge text="GST MOCK ADAPTER ENABLED" />
      </div>

      {/* Generation Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b pb-2">
            Generate E-Invoice & IRN
          </h2>
          <form onSubmit={handleGenerateIRN} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Select Customer Transport Bill</label>
              <select
                value={selectedBill}
                onChange={(e) => setSelectedBill(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded font-semibold text-blue-700 bg-white"
                required
              >
                <option value="">-- Choose Bill --</option>
                {bills.map((b) => (
                  <option key={b.billNumber} value={b.billNumber}>
                    {b.billNumber} - {b.customerName} (&#8377;{b.grandTotal?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Seller GSTIN</label>
                <input
                  type="text"
                  readOnly
                  value="27AABCA1234F1Z5"
                  className="w-full h-8 px-2 border rounded bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Buyer GSTIN</label>
                <input
                  type="text"
                  readOnly
                  value="27AABCB9876G1Z2"
                  className="w-full h-8 px-2 border rounded bg-slate-50 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedBill}
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow transition-colors disabled:opacity-50"
            >
              {loading ? "Generating IRN..." : "Generate Official E-Invoice (IRN)"}
            </button>
          </form>

          {result && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>IRN Generated Successfully</span>
              </div>
              <p className="font-mono text-[11px] break-all bg-white p-2 border rounded text-slate-700">
                <strong className="text-slate-900 block mb-0.5">IRN Hash (64 chars):</strong>
                {result.irn}
              </p>
              <div className="flex justify-between text-slate-600">
                <span>Ack Number: <strong>{result.ackNo}</strong></span>
                <span>Status: <strong className="text-emerald-700">{result.status}</strong></span>
              </div>
              <p className="text-[10px] text-amber-700 italic">
                * Note: Operation completed via Mock GST Integration Adapter. No live portal charges incurred.
              </p>
            </div>
          )}
        </div>

        {/* Cancellation Section */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-red-700 uppercase tracking-wider border-b pb-2">
            Cancel E-Invoice (IRN)
          </h2>
          <form onSubmit={handleCancelIRN} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Enter 64-character IRN Number</label>
              <input
                type="text"
                value={cancelIrn}
                onChange={(e) => setCancelIrn(e.target.value)}
                placeholder="Paste full IRN hash here..."
                className="w-full h-9 px-3 border border-slate-300 rounded font-mono text-[11px]"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Cancellation Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-9 px-2 border border-slate-300 rounded bg-white"
              >
                <option value="Duplicate entry">1. Duplicate Entry</option>
                <option value="Data entry typo">2. Data Entry Typo / Miscalculation</option>
                <option value="Order cancelled">3. Order Cancelled by Buyer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!cancelIrn}
              className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-semibold rounded shadow transition-colors disabled:opacity-50"
            >
              Cancel E-Invoice
            </button>
          </form>

          {cancelMsg && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {cancelMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

