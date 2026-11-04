"use client";

import React, { useState, useEffect } from "react";
import { Building2, Plus, MapPin } from "lucide-react";

export default function BranchMasterPage() {
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBranches(d.data);
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C054</span>
            <h1 className="text-lg font-bold text-slate-800">Branch & Operating Location Master</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">PAGES/MASTERS.PAGES/BranchListMaster.aspx</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
            <tr>
              <th className="py-2.5 px-3">Branch Code</th>
              <th className="py-2.5 px-3">Branch Name</th>
              <th className="py-2.5 px-3">City</th>
              <th className="py-2.5 px-3">Hub Status</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {branches.map((b) => (
              <tr key={b.branchCode} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-blue-700">{b.branchCode}</td>
                <td className="py-2.5 px-3 text-slate-800 font-semibold">{b.branchName}</td>
                <td className="py-2.5 px-3 text-slate-600">{b.city}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.isHub ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                    {b.isHub ? "TRANS-HUB" : "BRANCH"}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{b.state || "Maharashtra"}</td>
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
    </div>
  );
}

