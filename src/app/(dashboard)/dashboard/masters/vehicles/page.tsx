"use client";

import React, { useState, useEffect } from "react";
import { Truck, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function VehicleMasterPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVehicles(d.data);
      });
  }, []);

  return (
    <div className="space-y-4 pb-10">
      <PageHeader
        moduleCode="C648"
        title="Vehicle Master & Fleet Registry"
        subtitle="Fleet • VehicleListMst.aspx • Fleet specifications, payload capacity, and assigned drivers"
        breadcrumbs={[
          { label: "Fleet", href: "/dashboard" },
          { label: "Vehicle Master" }
        ]}
      />

      <ResponsiveTableWrapper
        title="Registered Transport Fleet"
        totalCount={vehicles.length}
        showSwipeHint={true}
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Vehicle Number</th>
              <th className="py-3 px-3.5">Vehicle Spec</th>
              <th className="py-3 px-3.5">Ownership</th>
              <th className="py-3 px-3.5">Capacity</th>
              <th className="py-3 px-3.5">Assigned Driver</th>
              <th className="py-3 px-3.5">Driver Contact</th>
              <th className="py-3 px-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {vehicles.map((v) => (
              <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">{v.vehicleNumber}</td>
                <td className="py-2.5 px-3.5 text-slate-900 font-semibold">{v.vehicleType}</td>
                <td className="py-2.5 px-3.5 text-slate-600">{v.ownerType}</td>
                <td className="py-2.5 px-3.5 text-slate-700 font-bold">{v.capacityTons} MT</td>
                <td className="py-2.5 px-3.5 text-slate-700">{v.driverName || "-"}</td>
                <td className="py-2.5 px-3.5 text-slate-600">{v.driverPhone || "-"}</td>
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
