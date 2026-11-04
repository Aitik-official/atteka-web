"use client";

import React, { useState, useEffect } from "react";
import { Building2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { StatusBadge } from "@/components/common/StatusBadge";

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
    <div className="space-y-4 pb-10">
      <PageHeader
        moduleCode="C054"
        title="Branch & Operating Location Master"
        subtitle="Masters • BranchListMaster.aspx • Ateka regional hubs, branches, and transhipment stations"
        breadcrumbs={[
          { label: "Masters", href: "/dashboard" },
          { label: "Branch Master" }
        ]}
      />

      <ResponsiveTableWrapper
        title="Operational Branches & Hub Stations"
        totalCount={branches.length}
        showSwipeHint={true}
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[650px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Branch Code</th>
              <th className="py-3 px-3.5">Branch Name</th>
              <th className="py-3 px-3.5">City</th>
              <th className="py-3 px-3.5">Hub Classification</th>
              <th className="py-3 px-3.5">State Jurisdiction</th>
              <th className="py-3 px-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {branches.map((b) => (
              <tr key={b.branchCode} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">{b.branchCode}</td>
                <td className="py-2.5 px-3.5 text-slate-900 font-semibold">{b.branchName}</td>
                <td className="py-2.5 px-3.5 text-slate-600">{b.city}</td>
                <td className="py-2.5 px-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.isHub
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {b.isHub ? "TRANS-HUB" : "BRANCH"}
                  </span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-600">{b.state || "Maharashtra"}</td>
                <td className="py-2.5 px-3.5">
                  <StatusBadge status="ACTIVE" size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTableWrapper>
    </div>
  );
}
