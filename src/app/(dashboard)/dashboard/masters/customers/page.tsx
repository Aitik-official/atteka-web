"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, CheckCircle2, Search, X, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function CustomerMasterPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [gstin, setGstin] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [creditPeriod, setCreditPeriod] = useState(30);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadCustomers = () => {
    fetch(`/api/customers?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCustomers(d.data);
      });
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerCode: code.toUpperCase(),
          name,
          gstin: gstin.toUpperCase(),
          city,
          phone,
          creditPeriod: Number(creditPeriod)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setSuccessMsg(`Customer ${name} added successfully!`);
        setName("");
        setCode("");
        setGstin("");
        setCity("");
        setPhone("");
        loadCustomers();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to create customer");
      }
    } catch {
      setErrorMsg("Network error adding customer");
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Reusable PageHeader */}
      <PageHeader
        moduleCode="C061"
        title="Customer Master & GSTIN Registration"
        subtitle="Masters • CustomerListMaster.aspx & CustGSTRegsList.aspx • Commercial accounts and tax IDs"
        breadcrumbs={[
          { label: "Masters", href: "/dashboard" },
          { label: "Customer Master" }
        ]}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        }
      />

      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, code or GSTIN..."
          className="w-full text-xs bg-transparent focus:outline-none text-slate-700"
        />
      </div>

      {/* Responsive Table Wrapper */}
      <ResponsiveTableWrapper
        title="Customer Directory"
        totalCount={customers.length}
        showSwipeHint={true}
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[680px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Code</th>
              <th className="py-3 px-3.5">Customer Name</th>
              <th className="py-3 px-3.5">GSTIN</th>
              <th className="py-3 px-3.5">City</th>
              <th className="py-3 px-3.5">Phone</th>
              <th className="py-3 px-3.5">Credit Terms</th>
              <th className="py-3 px-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {customers.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">{c.customerCode}</td>
                <td className="py-2.5 px-3.5 text-slate-900 font-semibold">{c.name}</td>
                <td className="py-2.5 px-3.5 font-mono text-slate-600">{c.gstin || "Unregistered"}</td>
                <td className="py-2.5 px-3.5 text-slate-600">{c.city || "-"}</td>
                <td className="py-2.5 px-3.5 text-slate-600">{c.phone || "-"}</td>
                <td className="py-2.5 px-3.5 text-slate-700 font-medium">{c.creditPeriod} Days</td>
                <td className="py-2.5 px-3.5">
                  <StatusBadge status="ACTIVE" size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTableWrapper>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Add New Customer</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Customer Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CUST-009"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg font-bold uppercase focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Customer / Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Official registered company name"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="15-digit GSTIN (optional)"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono uppercase focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Credit Terms (Days)</label>
                  <input
                    type="number"
                    value={creditPeriod}
                    onChange={(e) => setCreditPeriod(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-bold focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
