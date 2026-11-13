"use client";

import React, { useState } from "react";
import { Truck, FileCheck, MapPin, Plus, CheckCircle2, ArrowRight, X, FileText, ClipboardList } from "lucide-react";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { StatusBadge } from "@/components/common/StatusBadge";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";

export default function TripSheetsPage() {
  const [activeTab, setActiveTab] = useState<"PICKUP" | "DELIVERY" | "MANIFEST">("PICKUP");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [pickupPDCs, setPickupPDCs] = useState([
    {
      pdcNo: "PPDC-MUM-2024-001",
      date: "2026-11-04",
      vehicleNo: "MH04AB1234",
      driverName: "Ramesh Yadav",
      origin: "MUMBAI CENTRAL",
      destination: "BHIWANDI HUB",
      packages: 120,
      weight: 4800,
      status: "COMPLETED"
    },
    {
      pdcNo: "PPDC-MUM-2024-002",
      date: "2026-11-04",
      vehicleNo: "MH12CD5678",
      driverName: "Sanjay Patil",
      origin: "PUNE MIDC",
      destination: "TALEGAON HUB",
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
      origin: "DELHI HUB",
      destination: "NOIDA SECTOR 62",
      packages: 64,
      weight: 2100,
      status: "DELIVERED"
    }
  ]);

  const [manifests, setManifests] = useState([
    {
      pdcNo: "MNF-2026-0041",
      date: "2026-11-04",
      vehicleNo: "MH04AB1234",
      driverName: "Kuldeep Singh",
      origin: "MUMBAI CENTRAL",
      destination: "DELHI REGIONAL",
      packages: 280,
      weight: 12500,
      status: "IN_TRANSIT"
    }
  ]);

  // Form states for Create PDC Modal
  const [formVehicleNo, setFormVehicleNo] = useState("MH04AB1234");
  const [formDriverName, setFormDriverName] = useState("Ramesh Yadav");
  const [formOrigin, setFormOrigin] = useState("MUMBAI CENTRAL");
  const [formDestination, setFormDestination] = useState("BHIWANDI HUB");
  const [formPackages, setFormPackages] = useState(60);
  const [formWeight, setFormWeight] = useState(2400);

  const handleCreatePDC = (e: React.FormEvent) => {
    e.preventDefault();
    const prefix = activeTab === "PICKUP" ? "PPDC" : activeTab === "DELIVERY" ? "DPDC" : "MNF";
    const newNo = `${prefix}-ALC1-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord = {
      pdcNo: newNo,
      date: new Date().toISOString().split("T")[0],
      vehicleNo: formVehicleNo.toUpperCase(),
      driverName: formDriverName,
      origin: formOrigin.toUpperCase(),
      destination: formDestination.toUpperCase(),
      packages: Number(formPackages),
      weight: Number(formWeight),
      status: activeTab === "DELIVERY" ? "DISPATCHED" : "IN_PROGRESS"
    };

    if (activeTab === "PICKUP") {
      setPickupPDCs([newRecord, ...pickupPDCs]);
    } else if (activeTab === "DELIVERY") {
      setDeliveryPDCs([newRecord, ...deliveryPDCs]);
    } else {
      setManifests([newRecord, ...manifests]);
    }

    setShowCreateModal(false);
    setSuccessMsg(`New ${activeTab} PDC ${newNo} created successfully!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const currentList =
    activeTab === "PICKUP" ? pickupPDCs : activeTab === "DELIVERY" ? deliveryPDCs : manifests;

  return (
    <div className="space-y-4 pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching Image 3 */}
      <WcvRibbonHeader title="TripSheet Operations" />

      {/* 4 Action Cards Grid matching Image 3 from ateka.webcorevision.com */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-2">
        <WcvActionCard
          title="Prepare Pickup PDC"
          description="Prepare Pickup PDC"
          href="/dashboard/operations/tripsheets/prepare-pickup-pdc"
          icon={Truck}
        />
        <WcvActionCard
          title="Prepare Delivery PDC"
          description="Prepare Delivery PDC"
          href="/dashboard/operations/tripsheets/prepare-delivery-pdc"
          icon={FileCheck}
        />
        <WcvActionCard
          title="Prepare Loading Slip"
          description="Prepare Loading Slip"
          href="/dashboard/operations/tripsheets/prepare"
          icon={ClipboardList}
        />
        <WcvActionCard
          title="Update Delivery PDC"
          description="Update Delivery PDC"
          href="/dashboard/operations/tripsheets/update-delivery-pdc"
          icon={FileText}
        />
      </div>

      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("PICKUP")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              activeTab === "PICKUP"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Pickup PDCs (C036)
          </button>
          <button
            onClick={() => setActiveTab("DELIVERY")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              activeTab === "DELIVERY"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Delivery PDCs (C037)
          </button>
          <button
            onClick={() => setActiveTab("MANIFEST")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              activeTab === "MANIFEST"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Loading Slip & Manifest (C709)
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create {activeTab} PDC</span>
        </button>
      </div>

      {/* Responsive Table Wrapper */}
      <ResponsiveTableWrapper
        title={
          activeTab === "PICKUP"
            ? "Active Pickup PDCs (Goods Inward Dispatch)"
            : activeTab === "DELIVERY"
            ? "Active Delivery PDCs (Door Delivery Outward Dispatch)"
            : "Hub Transhipment Manifest Slips"
        }
        totalCount={currentList.length}
        showSwipeHint={true}
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[720px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">PDC Number</th>
              <th className="py-3 px-3.5">Date</th>
              <th className="py-3 px-3.5">Vehicle No</th>
              <th className="py-3 px-3.5">Driver</th>
              <th className="py-3 px-3.5">Corridor Route</th>
              <th className="py-3 px-3.5">Load Details</th>
              <th className="py-3 px-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {currentList.map((p) => (
              <tr key={p.pdcNo} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">{p.pdcNo}</td>
                <td className="py-2.5 px-3.5 text-slate-500">{p.date}</td>
                <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800">{p.vehicleNo}</td>
                <td className="py-2.5 px-3.5 text-slate-700">{p.driverName}</td>
                <td className="py-2.5 px-3.5 text-slate-600">
                  <span className="font-semibold">{p.origin}</span>{" "}
                  <ArrowRight className="w-3 h-3 inline mx-1 text-slate-400" />{" "}
                  <span className="font-semibold">{p.destination}</span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-600">
                  {p.packages} pkgs ({p.weight} kg)
                </td>
                <td className="py-2.5 px-3.5">
                  <StatusBadge status={p.status} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTableWrapper>

      {/* Real Create PDC Modal Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Create New {activeTab} PDC
                </h2>
                <p className="text-xs text-slate-500">
                  Generate local dispatch sheet and assign corridor vehicle
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePDC} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={formVehicleNo}
                    onChange={(e) => setFormVehicleNo(e.target.value.toUpperCase())}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg uppercase font-mono font-bold focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={formDriverName}
                    onChange={(e) => setFormDriverName(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Origin Hub / Branch</label>
                  <input
                    type="text"
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value.toUpperCase())}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg uppercase font-medium focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Destination Location</label>
                  <input
                    type="text"
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value.toUpperCase())}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg uppercase font-medium focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">No. of Packages</label>
                  <input
                    type="number"
                    value={formPackages}
                    onChange={(e) => setFormPackages(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-bold focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Total Weight (KG)</label>
                  <input
                    type="number"
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-bold focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Generate {activeTab} PDC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
