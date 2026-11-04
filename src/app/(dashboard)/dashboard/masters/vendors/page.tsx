"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, CheckCircle2, Search } from "lucide-react";

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
      if (res.ok) {
        setShowAdd(false);
        setCode("");
        setName("");
        setPan("");
        loadVendors();
      } else {
        alert("Failed to add vendor");
      }
    } catch {
      alert("Error adding vendor");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C063</span>
            <h1 className="text-lg font-bold text-slate-800">Vendor Master & TDS Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/MASTERS.PAGES/VendorListMaster.aspx & VendorAproval.aspx (C615)
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Vendor
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
            <tr>
              <th className="py-2.5 px-3">Code</th>
              <th className="py-2.5 px-3">Vendor / Fleet Partner</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">PAN</th>
              <th className="py-2.5 px-3">TDS %</th>
              <th className="py-2.5 px-3">Bank Details</th>
              <th className="py-2.5 px-3">Approval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {vendors.map((v) => (
              <tr key={v._id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-blue-700">{v.vendorCode}</td>
                <td className="py-2.5 px-3 text-slate-800 font-semibold">{v.name}</td>
                <td className="py-2.5 px-3 text-slate-600">{v.vendorType}</td>
                <td className="py-2.5 px-3 font-mono text-slate-600">{v.pan || "-"}</td>
                <td className="py-2.5 px-3 text-slate-700">{v.tdsRate}%</td>
                <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                  {v.bankName ? `${v.bankName} (${v.accountNo})` : "-"}
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                    {v.approvalStatus || "APPROVED"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border space-y-3">
            <h2 className="text-sm font-bold text-slate-800 border-b pb-2">Add New Vendor</h2>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Vendor Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. VEN-005"
                  className="w-full h-8 px-2 border rounded font-bold uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-8 px-2 border rounded"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-8 px-2 border rounded bg-white"
                  >
                    <option value="ATTACHED_VEHICLE">Attached Vehicle</option>
                    <option value="MARKET_VEHICLE">Market Vehicle</option>
                    <option value="COURIER">Courier / Express</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    className="w-full h-8 px-2 border rounded font-mono uppercase"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded text-xs"
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

