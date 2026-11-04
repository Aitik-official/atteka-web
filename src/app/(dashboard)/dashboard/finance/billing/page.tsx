"use client";

import React, { useState, useEffect } from "react";
import { Receipt, CheckSquare, Square, FileText, ArrowRight, CheckCircle2 } from "lucide-react";

export default function CustomerBillingPage() {
  const [consignments, setConsignments] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("TATA MOTORS LTD");
  const [selectedDockets, setSelectedDockets] = useState<string[]>([]);
  const [generatedBills, setGeneratedBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = () => {
    setLoading(true);
    fetch("/api/consignments")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const unbilled = data.data.filter((c: any) => c.status !== "BILLED");
          setConsignments(unbilled);
        }
      });

    fetch("/api/billing")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setGeneratedBills(data.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleDocket = (docketNo: string) => {
    if (selectedDockets.includes(docketNo)) {
      setSelectedDockets(selectedDockets.filter((d) => d !== docketNo));
    } else {
      setSelectedDockets([...selectedDockets, docketNo]);
    }
  };

  const handleSelectAll = () => {
    const matching = consignments.filter((c) => c.billingParty === selectedCustomer).map((c) => c.docketNo);
    if (selectedDockets.length === matching.length) {
      setSelectedDockets([]);
    } else {
      setSelectedDockets(matching);
    }
  };

  const handleGenerateBill = async () => {
    if (selectedDockets.length === 0) {
      alert("Please select at least one consignment docket to bill.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerCode: "CUST-001",
          customerName: selectedCustomer,
          consignmentIds: selectedDockets
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Customer Transport Bill ${data.data?.billNumber} generated successfully!`);
        setSelectedDockets([]);
        loadData();
      } else {
        alert(data.error || "Bill generation failed");
      }
    } catch {
      alert("Error generating bill");
    } finally {
      setGenerating(false);
    }
  };

  const matchingDockets = consignments.filter((c) => c.billingParty === selectedCustomer);
  const selectedTotalFreight = consignments
    .filter((c) => selectedDockets.includes(c.docketNo))
    .reduce((acc, c) => acc + (c.financials?.freightAmount || 0), 0);
  const selectedGst = Math.round(selectedTotalFreight * 0.05);
  const selectedGrandTotal = selectedTotalFreight + selectedGst;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C194</span>
            <h1 className="text-lg font-bold text-slate-800">Customer Transport Billing (Bill Generation Step 1)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/ACCOUNTS.PAGES/Bill/BillGenrateStep1.aspx • Select customer dockets & generate official transport tax invoice
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Filter / Customer Selection */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600">Select Billing Customer:</label>
          <select
            value={selectedCustomer}
            onChange={(e) => {
              setSelectedCustomer(e.target.value);
              setSelectedDockets([]);
            }}
            className="h-9 px-3 text-xs border border-slate-300 rounded font-bold text-blue-700 bg-white"
          >
            <option value="TATA MOTORS LTD">TATA MOTORS LTD</option>
            <option value="RELIANCE INDUSTRIES LTD">RELIANCE INDUSTRIES LTD</option>
            <option value="MAHINDRA & MAHINDRA">MAHINDRA & MAHINDRA</option>
            <option value="LARSEN & TOUBRO">LARSEN & TOUBRO</option>
          </select>
        </div>

        <div className="text-xs text-slate-600 flex items-center gap-4">
          <span>Unbilled Dockets: <strong className="text-blue-700">{matchingDockets.length}</strong></span>
          <span>Selected: <strong className="text-blue-700">{selectedDockets.length}</strong></span>
          <span>Total: <strong className="text-emerald-700">&#8377;{selectedGrandTotal.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Unbilled Dockets Grid */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
          >
            {selectedDockets.length === matchingDockets.length && matchingDockets.length > 0 ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Select All for {selectedCustomer}
          </button>

          <button
            type="button"
            onClick={handleGenerateBill}
            disabled={selectedDockets.length === 0 || generating}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Receipt className="w-3.5 h-3.5" />
            {generating ? "Generating..." : `Generate Bill (${selectedDockets.length} Dockets)`}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
              <tr>
                <th className="py-2.5 px-3 w-10">Select</th>
                <th className="py-2.5 px-3">Docket No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Origin &rarr; Destination</th>
                <th className="py-2.5 px-3">Packages</th>
                <th className="py-2.5 px-3">Charged Wt</th>
                <th className="py-2.5 px-3">Freight (&#8377;)</th>
                <th className="py-2.5 px-3">Grand Total (&#8377;)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {matchingDockets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    No unbilled dockets found for {selectedCustomer}.
                  </td>
                </tr>
              ) : (
                matchingDockets.map((d) => {
                  const isSelected = selectedDockets.includes(d.docketNo);
                  return (
                    <tr
                      key={d._id}
                      onClick={() => toggleDocket(d.docketNo)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-blue-700">{d.docketNo}</td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(d.bookingDate).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 text-slate-600">{d.fromLocation} &rarr; {d.toLocation}</td>
                      <td className="py-2.5 px-3 text-slate-600">{d.packageDetails?.packagesCount} pkgs</td>
                      <td className="py-2.5 px-3 text-slate-600">{d.packageDetails?.chargedWeight} kg</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">&#8377;{d.financials?.freightAmount?.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">&#8377;{d.financials?.grandTotal?.toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Bills History */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Generated Customer Bills
          </h2>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
            <tr>
              <th className="py-2 px-3">Bill Number</th>
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Customer</th>
              <th className="py-2 px-3">Dockets</th>
              <th className="py-2 px-3">Freight</th>
              <th className="py-2 px-3">GST (5%)</th>
              <th className="py-2 px-3">Total Amount</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {generatedBills.map((b) => (
              <tr key={b._id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-blue-700">{b.billNumber}</td>
                <td className="py-2.5 px-3 text-slate-500">{new Date(b.billDate).toLocaleDateString()}</td>
                <td className="py-2.5 px-3 text-slate-700">{b.customerName}</td>
                <td className="py-2.5 px-3 text-slate-600">{b.consignments?.length} dockets</td>
                <td className="py-2.5 px-3">&#8377;{b.totalFreight?.toLocaleString()}</td>
                <td className="py-2.5 px-3">&#8377;{b.taxAmount?.toLocaleString()}</td>
                <td className="py-2.5 px-3 font-bold text-slate-800">&#8377;{b.grandTotal?.toLocaleString()}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

