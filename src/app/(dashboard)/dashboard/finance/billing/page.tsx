"use client";

import React, { useState, useEffect } from "react";
import { Receipt, CheckSquare, Square, FileText, ArrowRight, CheckCircle2, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MobileActionFooter } from "@/components/common/MobileActionFooter";

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
    <div className="space-y-4 pb-16 sm:pb-10">
      {/* Reusable Header */}
      <PageHeader
        moduleCode="C194"
        title="Customer Transport Billing (Bill Generation Step 1)"
        subtitle="Finance • BillGenrateStep1.aspx • Select customer dockets & generate official transport tax invoice"
        breadcrumbs={[
          { label: "Finance", href: "/dashboard" },
          { label: "Customer Billing" }
        ]}
      />

      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter / Customer Selection */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 shrink-0">Billing Customer:</label>
          <select
            value={selectedCustomer}
            onChange={(e) => {
              setSelectedCustomer(e.target.value);
              setSelectedDockets([]);
            }}
            className="h-9 px-3 text-xs border border-slate-200 rounded-lg font-bold text-blue-700 bg-slate-50 focus:bg-white flex-1 sm:flex-initial"
          >
            <option value="TATA MOTORS LTD">TATA MOTORS LTD</option>
            <option value="RELIANCE INDUSTRIES LTD">RELIANCE INDUSTRIES LTD</option>
            <option value="MAHINDRA & MAHINDRA">MAHINDRA & MAHINDRA</option>
            <option value="LARSEN & TOUBRO">LARSEN & TOUBRO</option>
          </select>
        </div>

        <div className="text-xs text-slate-600 flex items-center gap-3 sm:gap-4 flex-wrap">
          <span>Unbilled Dockets: <strong className="text-blue-700 font-mono">{matchingDockets.length}</strong></span>
          <span>Selected: <strong className="text-blue-700 font-mono">{selectedDockets.length}</strong></span>
          <span>Total: <strong className="text-emerald-700 font-mono">₹{selectedGrandTotal.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Unbilled Dockets Grid with ResponsiveTableWrapper */}
      <ResponsiveTableWrapper
        title={`Unbilled Dockets for ${selectedCustomer}`}
        totalCount={matchingDockets.length}
        showSwipeHint={true}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-100 transition-colors cursor-pointer"
            >
              {selectedDockets.length === matchingDockets.length && matchingDockets.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>Select All</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateBill}
              disabled={selectedDockets.length === 0 || generating}
              className="hidden sm:flex px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{generating ? "Generating..." : `Generate Bill (${selectedDockets.length})`}</span>
            </button>
          </div>
        }
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5 w-10">Select</th>
              <th className="py-3 px-3.5">Docket No</th>
              <th className="py-3 px-3.5">Date</th>
              <th className="py-3 px-3.5">Corridor Route</th>
              <th className="py-3 px-3.5">Packages</th>
              <th className="py-3 px-3.5">Charged Wt</th>
              <th className="py-3 px-3.5">Freight</th>
              <th className="py-3 px-3.5">Grand Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {matchingDockets.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
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
                      isSelected ? "bg-blue-50/80" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-2.5 px-3.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">{d.docketNo}</td>
                    <td className="py-2.5 px-3.5 text-slate-500">{new Date(d.bookingDate).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3.5 text-slate-600">{d.fromLocation} &rarr; {d.toLocation}</td>
                    <td className="py-2.5 px-3.5 text-slate-600">{d.packageDetails?.packagesCount} pkgs</td>
                    <td className="py-2.5 px-3.5 text-slate-600">{d.packageDetails?.chargedWeight} kg</td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-800 font-mono">₹{d.financials?.freightAmount?.toLocaleString()}</td>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-700 font-mono">₹{d.financials?.grandTotal?.toLocaleString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ResponsiveTableWrapper>

      {/* Generated Bills History */}
      <ResponsiveTableWrapper
        title="Generated Customer Bills Archive"
        totalCount={generatedBills.length}
        showSwipeHint={true}
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Bill Number</th>
              <th className="py-3 px-3.5">Date</th>
              <th className="py-3 px-3.5">Customer</th>
              <th className="py-3 px-3.5">Dockets</th>
              <th className="py-3 px-3.5">Freight</th>
              <th className="py-3 px-3.5">GST (5%)</th>
              <th className="py-3 px-3.5">Total Amount</th>
              <th className="py-3 px-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {generatedBills.map((b) => (
              <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">{b.billNumber}</td>
                <td className="py-2.5 px-3.5 text-slate-500">{new Date(b.billDate).toLocaleDateString()}</td>
                <td className="py-2.5 px-3.5 text-slate-700">{b.customerName}</td>
                <td className="py-2.5 px-3.5 text-slate-600">{b.consignments?.length} dockets</td>
                <td className="py-2.5 px-3.5 font-mono">₹{b.totalFreight?.toLocaleString()}</td>
                <td className="py-2.5 px-3.5 font-mono">₹{b.taxAmount?.toLocaleString()}</td>
                <td className="py-2.5 px-3.5 font-bold text-slate-900 font-mono">₹{b.grandTotal?.toLocaleString()}</td>
                <td className="py-2.5 px-3.5">
                  <StatusBadge status={b.status} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTableWrapper>

      {/* Mobile Sticky Action Footer */}
      <MobileActionFooter>
        <div className="flex-1">
          <span className="text-[10px] text-slate-500 block leading-tight">Selected ({selectedDockets.length})</span>
          <span className="text-sm font-bold text-emerald-700 font-mono">₹{selectedGrandTotal.toLocaleString()}</span>
        </div>
        <button
          type="button"
          onClick={handleGenerateBill}
          disabled={selectedDockets.length === 0 || generating}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Receipt className="w-4 h-4" />
          <span>{generating ? "Generating..." : "Generate Bill"}</span>
        </button>
      </MobileActionFooter>
    </div>
  );
}
