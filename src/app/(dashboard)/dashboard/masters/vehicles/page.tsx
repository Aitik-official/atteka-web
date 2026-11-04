"use client";

import React, { useState, useEffect } from "react";
import { Truck, Plus, ShieldCheck } from "lucide-react";

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
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C648</span>
            <h1 className="text-lg font-bold text-slate-800">Vehicle Master & Fleet Registry</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">PAGES/MASTERS.PAGES/VehicleListMst.aspx</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
            <tr>
              <th className="py-2.5 px-3">Vehicle Number</th>
              <th className="py-2.5 px-3">Vehicle Type</th>
              <th className="py-2.5 px-3">Ownership</th>
              <th className="py-2.5 px-3">Capacity (Tons)</th>
              <th className="py-2.5 px-3">Driver Name</th>
              <th className="py-2.5 px-3">Driver Contact</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {vehicles.map((v) => (
              <tr key={v._id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-blue-700 font-mono">{v.vehicleNumber}</td>
                <td className="py-2.5 px-3 text-slate-800 font-semibold">{v.vehicleType}</td>
                <td className="py-2.5 px-3 text-slate-600">{v.ownerType}</td>
                <td className="py-2.5 px-3 text-slate-700">{v.capacityTons} MT</td>
                <td className="py-2.5 px-3 text-slate-700">{v.driverName || "-"}</td>
                <td className="py-2.5 px-3 text-slate-600">{v.driverPhone || "-"}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                    OPERATIONAL
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

