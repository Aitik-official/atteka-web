"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users2,
  Landmark,
  UserCheck,
  Truck,
  MapPin,
  ClipboardCheck,
  BarChart2,
  Settings,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  X
} from "lucide-react";

interface ModuleCard {
  id: string;
  name: string;
  icon: any;
  image: string;
  primaryRoute: string;
  submodules: { label: string; route: string; code: string }[];
}

export default function DashboardHome() {
  const router = useRouter();
  const [selectedModule, setSelectedModule] = useState<ModuleCard | null>(null);

  const modules: ModuleCard[] = [
    {
      id: "C001",
      name: "Operations",
      icon: Users2,
      image: "/images/cards/operations.jpg",
      primaryRoute: "/dashboard/operations/dockets",
      submodules: [
        { label: "New Consignment Note", route: "/dashboard/operations/new-cn", code: "C010" },
        { label: "Consignment Register & Edit", route: "/dashboard/operations/dockets", code: "C011" },
        { label: "TripSheet & PDCs Dispatch", route: "/dashboard/operations/tripsheets", code: "C035" },
        { label: "Multi-Document Live Tracking", route: "/dashboard/operations/tracking", code: "C111" }
      ]
    },
    {
      id: "C002",
      name: "Finance",
      icon: Landmark,
      image: "/images/cards/finance.jpg",
      primaryRoute: "/dashboard/finance/billing",
      submodules: [
        { label: "Customer Transport Billing", route: "/dashboard/finance/billing", code: "C194" },
        { label: "E-Invoice (IRN) Engine", route: "/dashboard/finance/e-invoice", code: "C655" },
        { label: "IndusInd Bank Online Payment", route: "/dashboard/finance/bank-payment", code: "C782" },
        { label: "Bank Statement & Reconciliation", route: "/dashboard/finance/bank-statement", code: "C850" },
        { label: "Money Receipt (MR) Entry", route: "/dashboard/finance/mr-entry", code: "C202" }
      ]
    },
    {
      id: "C003",
      name: "CRM",
      icon: UserCheck,
      image: "/images/cards/crm.jpg",
      primaryRoute: "/dashboard/masters/customers",
      submodules: [
        { label: "Customer Master & Billing Profile", route: "/dashboard/masters/customers", code: "C061" },
        { label: "Vendor Master & TDS Setup", route: "/dashboard/masters/vendors", code: "C063" },
        { label: "Client Rate Matrix Registry", route: "/dashboard/masters/customers", code: "C065" }
      ]
    },
    {
      id: "C748",
      name: "Fleet",
      icon: Truck,
      image: "/images/cards/fleet.jpg",
      primaryRoute: "/dashboard/masters/vehicles",
      submodules: [
        { label: "Vehicle Registry & Compliance", route: "/dashboard/masters/vehicles", code: "C648" },
        { label: "Driver & Route Allocation", route: "/dashboard/masters/vehicles", code: "C649" }
      ]
    },
    {
      id: "C004",
      name: "Tracking",
      icon: MapPin,
      image: "/images/cards/tracking.jpg",
      primaryRoute: "/dashboard/operations/tracking",
      submodules: [
        { label: "Live Multi-Document Tracking", route: "/dashboard/operations/tracking", code: "C111" },
        { label: "Electronic Proof of Delivery (POD)", route: "/dashboard/operations/tracking", code: "C112" }
      ]
    },
    {
      id: "C116",
      name: "Exceptional",
      icon: ClipboardCheck,
      image: "/images/cards/exceptional.jpg",
      primaryRoute: "/dashboard/operations/dockets",
      submodules: [
        { label: "Claim & Damage Docket Audit", route: "/dashboard/operations/dockets", code: "C117" },
        { label: "Unbilled Consignments Review", route: "/dashboard/operations/dockets", code: "C118" }
      ]
    },
    {
      id: "C006",
      name: "Reports",
      icon: BarChart2,
      image: "/images/cards/reports.jpg",
      primaryRoute: "/dashboard/reports",
      submodules: [
        { label: "General Ledger Trial Balance", route: "/dashboard/reports", code: "C086" },
        { label: "Outstanding Freight Ledger", route: "/dashboard/reports", code: "C087" },
        { label: "GST Monthly Tax Register", route: "/dashboard/reports", code: "C088" }
      ]
    },
    {
      id: "C007",
      name: "Admin",
      icon: Settings,
      image: "/images/cards/admin.jpg",
      primaryRoute: "/dashboard/masters/branches",
      submodules: [
        { label: "Branch Master & Locations", route: "/dashboard/masters/branches", code: "C054" },
        { label: "User Roles & Permissions", route: "/dashboard/masters/branches", code: "C055" },
        { label: "Security & Transaction Audit", route: "/dashboard/masters/branches", code: "C056" }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* 3-Column Responsive Grid matching Home.aspx */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          return (
            <div
              key={mod.id}
              onClick={() => setSelectedModule(mod)}
              className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200/80 bg-white flex flex-col h-[200px]"
            >
              {/* Card Image Filling Area */}
              <div className="relative w-full h-full overflow-hidden bg-slate-900">
                <Image
                  src={mod.image}
                  alt={mod.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                  unoptimized
                />

                {/* Subtle Hover Overlay with Direct Action */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                  <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span>Open {mod.name} Menu</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submodule Modal Dialog when a card is clicked */}
      {selectedModule && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header with Card Banner */}
            <div className="relative h-28 bg-slate-900 flex items-end p-4 text-white overflow-hidden">
              <Image
                src={selectedModule.image}
                alt={selectedModule.name}
                fill
                className="object-cover opacity-60"
                unoptimized
              />
              <div className="relative z-10 flex items-center justify-between w-full">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block">
                    Module Code: {selectedModule.id}
                  </span>
                  <h3 className="text-xl font-bold">{selectedModule.name} Workflows</h3>
                </div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="p-1 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Submodule List */}
            <div className="p-4 space-y-2">
              <p className="text-xs text-slate-500 font-medium mb-3">
                Select a workflow or registry page to open:
              </p>
              {selectedModule.submodules.map((sub, idx) => (
                <Link
                  key={idx}
                  href={sub.route}
                  onClick={() => setSelectedModule(null)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
                >
                  <div>
                    <span className="font-semibold text-xs text-slate-800 group-hover:text-emerald-900">
                      {sub.label}
                    </span>
                    <span className="ml-2 text-[10px] font-mono text-slate-400 group-hover:text-emerald-700">
                      ({sub.code})
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Press Esc or Close</span>
              <button
                onClick={() => setSelectedModule(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
