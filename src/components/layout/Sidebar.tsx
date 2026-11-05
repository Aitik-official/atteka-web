"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  X
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  user: {
    userId: string;
    name: string;
    branchCode?: string;
    operatingLocation?: string;
  };
  isMobile?: boolean;
}

export function Sidebar({ isOpen, onClose, user, isMobile }: SidebarProps) {
  const pathname = usePathname();
  // Start with all groups collapsed by default so menu isn't stuck open on refresh/login
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [filterQuery, setFilterQuery] = useState("");

  // Automatically expand only the group matching the current active route
  useEffect(() => {
    if (!pathname) return;
    const activeModule = menuModules.find((m) =>
      m.submodules.some(
        (sub) => pathname === sub.route || pathname.startsWith(sub.route + "/")
      )
    );
    if (activeModule) {
      setOpenGroups((prev) => ({
        ...prev,
        [activeModule.id]: true
      }));
    }
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose?.();
    }
  };

  const menuModules = [
    {
      id: "C001",
      name: "Operations",
      icon: Users2,
      submodules: [
        { label: "Freight Booking (C009)", route: "/dashboard/operations/freight-booking", code: "C009" },
        { label: "CN Operations [System]", route: "/dashboard/operations/cn-operations", code: "C019" },
        { label: "TripSheet Operations", route: "/dashboard/operations/tripsheets", code: "C035" },
        { label: "View Print Document", route: "/dashboard/operations/view-print", code: "C039" }
      ]
    },
    {
      id: "C002",
      name: "Finance",
      icon: Landmark,
      submodules: [
        { label: "Vendor Billing", route: "/dashboard/finance/vendor-billing", code: "C181" },
        { label: "Customer Billing", route: "/dashboard/finance/customer-billing", code: "C194" },
        { label: "Genrate E-Invoice (IRN)", route: "/dashboard/finance/e-invoice", code: "C655" },
        { label: "MR Entry", route: "/dashboard/finance/mr-entry", code: "C202" },
        { label: "Vouchers", route: "/dashboard/finance/vouchers", code: "C208" },
        { label: "Cheque Management", route: "/dashboard/finance/cheque-management", code: "C215" },
        { label: "Cash & Bank Statement", route: "/dashboard/finance/cash-bank-statement", code: "C223" },
        { label: "Print Document [Dot-Matrix ]", route: "/dashboard/finance/print-dot-matrix", code: "C225" }
      ]
    },
    {
      id: "C003",
      name: "CRM",
      icon: UserCheck,
      submodules: [
        { label: "Customer Master", route: "/dashboard/masters/customers", code: "C061" },
        { label: "Customer GST Registration", route: "/dashboard/masters/customer-gst", code: "C062" },
        { label: "Lead Details", route: "/dashboard/crm/lead-details", code: "C504" },
        { label: "Vist Details", route: "/dashboard/crm/visit-details", code: "C505" },
        { label: "Activity", route: "/dashboard/crm/activity", code: "C916" }
      ]
    },
    {
      id: "C158",
      name: "Fleet",
      icon: Truck,
      submodules: [
        { label: "Trip Management", route: "/dashboard/fleet/trip-management", code: "C749" },
        { label: "Fuel and Toll Management", route: "/dashboard/fleet/fuel-toll", code: "C750" }
      ]
    },
    {
      id: "C004",
      name: "Tracking",
      icon: MapPin,
      submodules: [
        { label: "Tracking Douments", route: "/dashboard/tracking/documents", code: "C111" },
        { label: "Track Customer/Vendor", route: "/dashboard/tracking/party", code: "C485" }
      ]
    },
    {
      id: "C136",
      name: "Exceptional",
      icon: ClipboardCheck,
      submodules: [
        { label: "Operation", route: "/dashboard/operations/dockets", code: "C117" },
        { label: "Finance", route: "/dashboard/exceptional/finance", code: "C132" },
        { label: "Bank Reconciliation Statment", route: "/dashboard/exceptional/brs", code: "C520" },
        { label: "Company Vechicle Exceptional", route: "/dashboard/exceptional/vehicle", code: "C588" }
      ]
    },
    {
      id: "C006",
      name: "Reports",
      icon: BarChart2,
      submodules: [
        { label: "Operation Report", route: "/dashboard/reports/operations", code: "C084" },
        { label: "Finance", route: "/dashboard/reports/finance", code: "C085" },
        { label: "Accounts", route: "/dashboard/reports/accounts", code: "C086" },
        { label: "Purchase Report", route: "/dashboard/reports/purchase", code: "C840" },
        { label: "ERP Tracking", route: "/dashboard/reports/erp-tracking", code: "C088" },
        { label: "Final Accounts", route: "/dashboard/reports/final-accounts", code: "C486" },
        { label: "Company Vechicle Reports", route: "/dashboard/reports/company-vehicles", code: "C576" }
      ]
    },
    {
      id: "C007",
      name: "Admin",
      icon: Settings,
      submodules: [
        { label: "Company Structure", route: "/dashboard/admin/company-structure", code: "C052" },
        { label: "Business Partners", route: "/dashboard/admin/business-partners", code: "C060" },
        { label: "Operations", route: "/dashboard/admin/operations", code: "C065" },
        { label: "Docket Number Master", route: "/dashboard/masters/docket-numbers", code: "C066" },
        { label: "Finance & Accounts", route: "/dashboard/admin/finance-accounts", code: "C077" },
        { label: "APIs", route: "/dashboard/admin/apis", code: "C686" }
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
      className={`fixed z-50 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between select-none shadow-md ${
        /* Mobile: off-canvas drawer */
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } ${
        /* On mobile: full height drawer with top-0; On desktop: top-14 under header */
        "top-0 md:top-14 bottom-0 md:bottom-8 h-full md:h-[calc(100vh-3.5rem-2rem)]"
      } ${
        /* Mobile width is 72 (288px) max 85vw. Desktop width toggles between w-64 and w-16 */
        isOpen ? "w-72 max-w-[85vw] md:w-64" : "w-72 max-w-[85vw] md:w-16"
      }`}
    >
      {/* Mobile Top Header with Brand & Close Button */}
      <div className="md:hidden flex items-center justify-between p-3.5 border-b border-slate-200 bg-slate-50/90">
        <div className="flex items-center gap-2">
          <Image
            src="/images/atteka_logo-removebg-preview.png"
            alt="Ateka"
            width={32}
            height={26}
            className="object-contain"
            unoptimized
          />
          <span className="font-bold text-slate-800 text-sm">Ateka Logistics</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          title="Close Navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Top Profile / Filter Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {isOpen ? (
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
            {/* User Brief */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#10b981] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {user?.name || "ANISHA OZARKAR"}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
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
                className="w-full h-8 pl-8 pr-7 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder-slate-400 font-medium"
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
          <div className="py-3 hidden md:flex justify-center border-b border-slate-100">
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
              // Collapsed state (desktop only)
              return (
                <div key={mod.id} className="relative group flex justify-center py-1">
                  <Link
                    href={mod.submodules[0]?.route || "/dashboard"}
                    onClick={handleLinkClick}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      hasActiveChild
                        ? "bg-emerald-50 text-emerald-700 font-bold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                    title={mod.name}
                  >
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </Link>
                </div>
              );
            }

            // Expanded state
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
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        hasActiveChild ? "text-emerald-600" : "text-slate-400"
                      }`}
                    />
                    <span className="truncate">{mod.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
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
                          onClick={handleLinkClick}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                            isSubActive
                              ? "bg-emerald-100/60 text-emerald-900 font-semibold shadow-2xs"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span className="truncate">{sub.label}</span>
                          <span
                            className={`text-[9px] font-mono px-1 py-0.5 rounded shrink-0 ml-1.5 ${
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
