"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, CheckCircle2, Search, X, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function VendorMasterPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [pan, setPan] = useState("");
  const [type, setType] = useState("ATTACHED_VEHICLE");
  const [tdsRate, setTdsRate] = useState(1);
  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadVendors = () => {
    fetch(`/api/vendors?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVendors(d.data);
      });
  };

  useEffect(() => {
    loadVendors();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorCode: code.toUpperCase(),
          name,
          pan: pan.toUpperCase(),
          vendorType: type,
          tdsApplicable: tdsRate > 0,
          tdsRate: Number(tdsRate),
          bankName,
          accountNo,
          ifscCode: ifsc.toUpperCase()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAdd(false);
        setSuccessMsg(`Vendor ${name} registered successfully!`);
        setCode("");
        setName("");
        setPan("");
        setBankName("");
        setAccountNo("");
        setIfsc("");
        loadVendors();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to add vendor");
      }
    } catch {
      setErrorMsg("Error communicating with vendor registry");
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Reusable PageHeader */}
      <PageHeader
        moduleCode="C063"
        title="Vendor Master & TDS Management"
        subtitle="Masters • VendorListMaster.aspx & VendorAproval.aspx (C615) • Fleet suppliers, TDS rates, and bank accounts"
        breadcrumbs={[
          { label: "Masters", href: "/dashboard" },
          { label: "Vendor Master" }
        ]}
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vendor</span>
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
          placeholder="Search by vendor name, code or PAN..."
          className="w-full text-xs bg-transparent focus:outline-none text-slate-700"
        />
      </div>

      {/* Responsive Table Wrapper */}
      <ResponsiveTableWrapper
        title="Vendor & Fleet Supplier Registry"
        totalCount={vendors.length}
        showSwipeHint={true}
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Code</th>
              <th className="py-3 px-3.5">Vendor Name</th>
              <th className="py-3 px-3.5">Category</th>
              <th className="py-3 px-3.5">PAN Number</th>
              <th className="py-3 px-3.5">TDS Rate</th>
              <th className="py-3 px-3.5">Bank Account / IFSC</th>
              <th className="py-3 px-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {vendors.map((v) => (
              <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">{v.vendorCode}</td>
                <td className="py-2.5 px-3.5 text-slate-900 font-semibold">{v.name}</td>
                <td className="py-2.5 px-3.5 text-slate-600 text-[11px]">{v.vendorType}</td>
                <td className="py-2.5 px-3.5 font-mono text-slate-700">{v.pan}</td>
                <td className="py-2.5 px-3.5 text-slate-700 font-semibold">{v.tdsRate}% (Sec 194C)</td>
                <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-600">
                  {v.bankDetails?.accountNo || "-"} ({v.bankDetails?.ifscCode || "-"})
                </td>
                <td className="py-2.5 px-3.5">
                  <StatusBadge status="ACTIVE" size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTableWrapper>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Add New Fleet Vendor</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Vendor Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VEN-005"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-bold uppercase focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">PAN Card No</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="10-digit PAN"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono uppercase focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Vendor / Transporter Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Vendor Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-9 px-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  >
                    <option value="ATTACHED_VEHICLE">Attached Fleet Vehicle</option>
                    <option value="MARKET_VEHICLE">Market / Ad-hoc Lorry</option>
                    <option value="TRANSHIPMENT_VENDOR">Transhipment Vendor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">TDS % (Sec 194C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={tdsRate}
                    onChange={(e) => setTdsRate(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-bold focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
