"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, CheckCircle2, Search } from "lucide-react";

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
      if (res.ok) {
        setShowAddModal(false);
        setName("");
        setCode("");
        setGstin("");
        loadCustomers();
      } else {
        alert("Failed to create customer");
      }
    } catch {
      alert("Error adding customer");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C061</span>
            <h1 className="text-lg font-bold text-slate-800">Customer Master & GSTIN Registration</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/MASTERS.PAGES/CustomerListMaster.aspx & CustGSTRegsList.aspx
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-lg border flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, code or GSTIN..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
            <tr>
              <th className="py-2.5 px-3">Code</th>
              <th className="py-2.5 px-3">Customer Name</th>
              <th className="py-2.5 px-3">GSTIN</th>
              <th className="py-2.5 px-3">City</th>
              <th className="py-2.5 px-3">Phone</th>
              <th className="py-2.5 px-3">Credit (Days)</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {customers.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-blue-700">{c.customerCode}</td>
                <td className="py-2.5 px-3 text-slate-800 font-semibold">{c.name}</td>
                <td className="py-2.5 px-3 font-mono text-slate-600">{c.gstin || "Unregistered"}</td>
                <td className="py-2.5 px-3 text-slate-600">{c.city || "-"}</td>
                <td className="py-2.5 px-3 text-slate-600">{c.phone || "-"}</td>
                <td className="py-2.5 px-3 text-slate-700">{c.creditPeriod} Days</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                    ACTIVE
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b pb-2">Add New Customer</h2>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Customer Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CUST-009"
                  className="w-full h-8 px-2 border rounded font-bold uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Customer / Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-8 px-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="15-digit GSTIN"
                  className="w-full h-8 px-2 border rounded font-mono uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-8 px-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Credit (Days)</label>
                  <input
                    type="number"
                    value={creditPeriod}
                    onChange={(e) => setCreditPeriod(Number(e.target.value))}
                    className="w-full h-8 px-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded text-xs"
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

