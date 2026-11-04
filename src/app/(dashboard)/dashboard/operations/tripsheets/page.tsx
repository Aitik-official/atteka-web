"use client";

import React, { useState } from "react";
import { Truck, FileCheck, MapPin, Plus, CheckCircle2 } from "lucide-react";

export default function TripSheetsPage() {
  const [activeTab, setActiveTab] = useState<"PICKUP" | "DELIVERY" | "MANIFEST">("PICKUP");

  const [pickupPDCs, setPickupPDCs] = useState([
    {
      pdcNo: "PPDC-MUM-2024-001",
      date: "2026-11-04",
      vehicleNo: "MH04AB1234",
      driverName: "Ramesh Yadav",
      route: "MUMBAI CENTRAL &rarr; BHIWANDI HUB",
      packages: 120,
      weight: 4800,
      status: "COMPLETED"
    },
    {
      pdcNo: "PPDC-MUM-2024-002",
      date: "2026-11-04",
      vehicleNo: "MH12CD5678",
      driverName: "Sanjay Patil",
      route: "PUNE MIDC &rarr; TALEGAON",
      packages: 85,
      weight: 3200,
      status: "IN_PROGRESS"
    }
  ]);

  const [deliveryPDCs, setDeliveryPDCs] = useState([
    {
      pdcNo: "DPDC-DEL-2024-089",
      date: "2026-11-03",
      vehicleNo: "DL01EF9988",
      driverName: "Kuldeep Singh",
      route: "DELHI HUB &rarr; NOIDA SECTOR 62",
      packages: 64,
      weight: 2100,
      status: "DELIVERED"
    }
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C035</span>
            <h1 className="text-lg font-bold text-slate-800">TripSheet & PDC Operations</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/OPERATIONS.PAGES/PickupPDC.aspx & DLYPDC.aspx • Local Dispatch & Trip Management
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("PICKUP")}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "PICKUP" ? "bg-blue-600 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-100 border"
          }`}
        >
          Pickup PDCs (C036)
        </button>
        <button
          onClick={() => setActiveTab("DELIVERY")}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "DELIVERY" ? "bg-blue-600 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-100 border"
          }`}
        >
          Delivery PDCs (C037)
        </button>
        <button
          onClick={() => setActiveTab("MANIFEST")}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "MANIFEST" ? "bg-blue-600 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-100 border"
          }`}
        >
          Loading Slip & Manifest (C709)
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {activeTab === "PICKUP" && "Active Pickup PDCs (Goods Inward Dispatch)"}
            {activeTab === "DELIVERY" && "Active Delivery PDCs (Door Delivery Outward Dispatch)"}
            {activeTab === "MANIFEST" && "Hub Transhipment Manifest Slips"}
          </h2>
          <button
            onClick={() => alert("New PDC generator dialog initialized.")}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Create {activeTab} PDC
          </button>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
            <tr>
              <th className="py-2.5 px-3">PDC Number</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Vehicle No</th>
              <th className="py-2.5 px-3">Driver</th>
              <th className="py-2.5 px-3">Corridor Route</th>
              <th className="py-2.5 px-3">Load Details</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {(activeTab === "PICKUP" ? pickupPDCs : deliveryPDCs).map((p) => (
              <tr key={p.pdcNo} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-blue-700">{p.pdcNo}</td>
                <td className="py-2.5 px-3 text-slate-500">{p.date}</td>
                <td className="py-2.5 px-3 font-mono">{p.vehicleNo}</td>
                <td className="py-2.5 px-3 text-slate-700">{p.driverName}</td>
                <td className="py-2.5 px-3 text-slate-600" dangerouslySetInnerHTML={{ __html: p.route }} />
                <td className="py-2.5 px-3 text-slate-600">
                  {p.packages} pkgs ({p.weight} kg)
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                    {p.status}
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

