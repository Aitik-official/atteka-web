"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users2,
  Landmark,
  UserCheck,
  Truck,
  MapPin,
  ClipboardCheck,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  Printer,
  CreditCard,
  Building,
  ShieldCheck,
  RotateCcw
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  user: {
    userId: string;
    name: string;
    branchCode?: string;
    operatingLocation?: string;
  };
}

export function Sidebar({ isOpen, user }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    C001: true, // Operations open by default
    C002: true  // Finance open by default
  });
  const [filterQuery, setFilterQuery] = useState("");

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const menuModules = [
    {
      id: "C001",
      name: "Operations",
      icon: Users2,
      submodules: [
        { label: "New Consignment Note", route: "/dashboard/operations/new-cn", code: "C010" },
        { label: "Consignments Register & Edit", route: "/dashboard/operations/dockets", code: "C011" },
        { label: "TripSheet & PDCs Dispatch", route: "/dashboard/operations/tripsheets", code: "C035" },
        { label: "Live Multi-Doc Tracking", route: "/dashboard/operations/tracking", code: "C111" }
      ]
    },
    {
      id: "C002",
      name: "Finance",
      icon: Landmark,
      submodules: [
        { label: "Customer Transport Billing", route: "/dashboard/finance/billing", code: "C194" },
        { label: "E-Invoice (IRN) Engine", route: "/dashboard/finance/e-invoice", code: "C655" },
        { label: "IndusInd Bank Online Payment", route: "/dashboard/finance/bank-payment", code: "C782" },
        { label: "Bank Statement & BRS", route: "/dashboard/finance/bank-statement", code: "C850" },
        { label: "Money Receipt (MR) Entry", route: "/dashboard/finance/mr-entry", code: "C202" }
      ]
    },
    {
      id: "C003",
      name: "CRM & Parties",
      icon: UserCheck,
      submodules: [
        { label: "Customer Master", route: "/dashboard/masters/customers", code: "C061" },
        { label: "Vendor Master & TDS", route: "/dashboard/masters/vendors", code: "C063" }
      ]
    },
    {
      id: "C748",
      name: "Fleet & Vehicles",
      icon: Truck,
      submodules: [
        { label: "Vehicle Registry & Spec", route: "/dashboard/masters/vehicles", code: "C648" }
      ]
    },
    {
      id: "C004",
      name: "Tracking & POD",
      icon: MapPin,
      submodules: [
        { label: "Multi-Document Tracking", route: "/dashboard/operations/tracking", code: "C111" }
      ]
    },
    {
      id: "C116",
      name: "Exceptional Dockets",
      icon: ClipboardCheck,
      submodules: [
        { label: "Claim & Damage Audit", route: "/dashboard/operations/dockets", code: "C117" }
      ]
    },
    {
      id: "C006",
      name: "Reports & Accounts",
      icon: BarChart2,
      submodules: [
        { label: "General Ledger Trial Balance", route: "/dashboard/reports", code: "C086" }
      ]
    },
    {
      id: "C007",
      name: "Admin & Masters",
      icon: Settings,
      submodules: [
        { label: "Branch Master Setup", route: "/dashboard/masters/branches", code: "C054" }
      ]
    }
  ];

  const q = filterQuery.trim().toLowerCase();
  const filteredModules = menuModules
    .map((mod) => {
      const matchingSubs = mod.submodules.filter(
        (sub) =>
          sub.label.toLowerCase().includes(q) ||
          sub.code.toLowerCase().includes(q) ||
          mod.name.toLowerCase().includes(q)
      );
      return {
        ...mod,
        submodules: q ? matchingSubs : mod.submodules,
        matched: q ? matchingSubs.length > 0 : true
      };
    })
    .filter((mod) => (q ? mod.matched : true));

  return (
    <aside
      className={`fixed top-14 left-0 h-[calc(100vh-3.5rem-2rem)] bg-white border-r border-slate-200 transition-all duration-300 z-20 flex flex-col justify-between select-none shadow-sm ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      {/* Top Header / Profile / Search */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {isOpen ? (
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
            {/* User Brief */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#10b981] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {user?.name || "ANISHA OZARKAR"}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {user?.userId || "AL002"} • {user?.operatingLocation || "MUMBAI CENTRAL"}
                </p>
              </div>
            </div>

            {/* Submenu Quick Filter */}
            <div className="relative">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter menu & codes (e.g. C010)..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder-slate-400 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery("")}
                  className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-3 flex justify-center border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-[#10b981] text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {user?.name?.charAt(0) || "A"}
            </div>
          </div>
        )}

        {/* Navigation Modules Tree */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
          {filteredModules.map((mod) => {
            const Icon = mod.icon;
            const isExpanded = q ? true : !!openGroups[mod.id];
            const hasActiveChild = mod.submodules.some((s) => pathname === s.route);

            if (!isOpen) {
              // Collapsed state: icon only
              return (
                <div key={mod.id} className="relative group flex justify-center py-1">
                  <Link
                    href={mod.submodules[0]?.route || "/dashboard"}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      hasActiveChild
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                    title={mod.name}
                  >
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </Link>
                </div>
              );
            }

            // Expanded state: full module name, accordion dropdown & submodule links
            return (
              <div key={mod.id} className="rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGroup(mod.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                    hasActiveChild
                      ? "bg-emerald-50/70 text-emerald-900"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        hasActiveChild ? "text-emerald-600" : "text-slate-400"
                      }`}
                    />
                    <span>{mod.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-slate-400 font-normal">
                      {mod.id}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Submodules Accordion */}
                {isExpanded && (
                  <div className="ml-4 pl-3 border-l-2 border-slate-100 py-1 space-y-0.5">
                    {mod.submodules.map((sub, idx) => {
                      const isSubActive = pathname === sub.route;
                      return (
                        <Link
                          key={idx}
                          href={sub.route}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                            isSubActive
                              ? "bg-emerald-100/60 text-emerald-900 font-semibold shadow-2xs"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span className="truncate">{sub.label}</span>
                          <span
                            className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                              isSubActive
                                ? "bg-emerald-200 text-emerald-800 font-bold"
                                : "text-slate-400 bg-slate-100"
                            }`}
                          >
                            {sub.code}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer Stamp */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400 font-bold px-3">
        {isOpen ? (
          <>
            <span className="text-[10px] font-semibold text-slate-500">WebCoreVision TMS</span>
            <span className="font-mono text-emerald-600 font-bold text-xs">WCV</span>
          </>
        ) : (
          <span className="mx-auto font-mono text-emerald-600 font-bold text-xs">WCV</span>
        )}
      </div>
    </aside>
  );
}
