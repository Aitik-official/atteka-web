"use client";

import React, { useState, useEffect } from "react";
import { QrCode, FileText, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { SimulatedBadge } from "@/components/common/SimulatedBadge";

export default function EInvoicePage() {
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [cancelIrn, setCancelIrn] = useState("");
  const [cancelReason, setCancelReason] = useState("Data entry typo");
  const [cancelMsg, setCancelMsg] = useState("");
  const [genError, setGenError] = useState("");
  const [cancelError, setCancelError] = useState("");

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
    setGenError("");

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
        setGenError(data.error || "IRN Generation failed");
      }
    } catch {
      setGenError("Error contacting GST Mock Adapter");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelIRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelIrn) return;
    setCancelMsg("");
    setCancelError("");

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
        setCancelError(data.error || "Cancel failed");
      }
    } catch {
      setCancelError("Error during IRN cancellation");
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Reusable Header */}
      <PageHeader
        moduleCode="C655"
        title="Generate E-Invoice (IRN Engine)"
        subtitle="Finance • GenrateIRN.aspx • Government GST / NIC E-Invoice System Interface"
        breadcrumbs={[
          { label: "Finance", href: "/dashboard" },
          { label: "E-Invoice Engine" }
        ]}
        actions={<SimulatedBadge text="GST IRP SIMULATION" />}
      />

      {/* Generation Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard
          title="Generate E-Invoice & IRN"
          icon={QrCode}
          badge="NIC PORTAL"
        >
          <form onSubmit={handleGenerateIRN} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Select Customer Transport Bill</label>
              <select
                value={selectedBill}
                onChange={(e) => setSelectedBill(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-semibold text-blue-700 bg-slate-50 focus:bg-white"
                required
              >
                <option value="">-- Choose Bill --</option>
                {bills.map((b) => (
                  <option key={b.billNumber} value={b.billNumber}>
                    {b.billNumber} - {b.customerName} (₹{b.grandTotal?.toLocaleString()})
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
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg bg-slate-100 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Buyer GSTIN</label>
                <input
                  type="text"
                  readOnly
                  value="27AABCB9876G1Z2"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg bg-slate-100 font-mono text-[11px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedBill}
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Generating IRN..." : "Generate Official E-Invoice (IRN)"}
            </button>
          </form>

          {genError && (
            <div className="mt-3.5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{genError}</span>
            </div>
          )}

          {result && (
            <div className="mt-3.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>IRN Generated Successfully</span>
              </div>
              <p className="font-mono text-[11px] break-all bg-white p-2.5 border border-blue-100 rounded-lg text-slate-700 select-all">
                <strong className="text-slate-900 block mb-0.5">IRN Hash (64 chars):</strong>
                {result.irn}
              </p>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Ack Number: <strong className="font-mono">{result.ackNo}</strong></span>
                <span>Status: <strong className="text-emerald-700">{result.status}</strong></span>
              </div>
              <p className="text-[10px] text-amber-700 italic">
                * Note: Operation completed via GST Integration Adapter.
              </p>
            </div>
          )}
        </SectionCard>

        {/* Cancellation Section */}
        <SectionCard
          title="Cancel E-Invoice (IRN)"
          icon={XCircle}
          badge="REVOCATION"
        >
          <form onSubmit={handleCancelIRN} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Enter 64-character IRN Number</label>
              <input
                type="text"
                value={cancelIrn}
                onChange={(e) => setCancelIrn(e.target.value)}
                placeholder="Paste full IRN hash here..."
                className="w-full h-9 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg font-mono text-[11px]"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Cancellation Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-9 px-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg"
              >
                <option value="Duplicate entry">1. Duplicate Entry</option>
                <option value="Data entry typo">2. Data Entry Typo / Miscalculation</option>
                <option value="Order cancelled">3. Order Cancelled by Buyer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!cancelIrn}
              className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel E-Invoice
            </button>
          </form>

          {cancelMsg && (
            <div className="mt-3.5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl animate-in fade-in">
              {cancelMsg}
            </div>
          )}

          {cancelError && (
            <div className="mt-3.5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
