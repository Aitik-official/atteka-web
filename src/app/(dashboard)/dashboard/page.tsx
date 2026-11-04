"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  TrendingUp,
  FileText,
  DollarSign,
  ShieldCheck
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";

interface SubCategory {
  title: string;
  code: string;
  route: string;
}

interface ModuleCard {
  id: string;
  name: string;
  icon: any;
  image: string;
  subcategories: SubCategory[];
}

export default function DashboardHome() {
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    C001: true // Operations open by default for immediate usability
  });

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const modules: ModuleCard[] = [
    {
      id: "C001",
      name: "Operations",
      icon: Users2,
      image: "/images/cards/operations.jpg",
      subcategories: [
        { title: "Freight Booking", code: "C009", route: "/dashboard/operations/freight-booking" },
        { title: "CN Operations [System]", code: "C019", route: "/dashboard/operations/cn-operations" },
        { title: "TripSheet Operations", code: "C035", route: "/dashboard/operations/tripsheets" },
        { title: "View Print Document", code: "C039", route: "/dashboard/operations/view-print" }
      ]
    },
    {
      id: "C002",
      name: "Finance",
      icon: Landmark,
      image: "/images/cards/finance.jpg",
      subcategories: [
        { title: "Vendor Billing", code: "C181", route: "/dashboard/finance/vendor-billing" },
        { title: "Customer Billing", code: "C194", route: "/dashboard/finance/customer-billing" },
        { title: "Genrate E-Invoice (IRN)", code: "C655", route: "/dashboard/finance/e-invoice" },
        { title: "MR Entry", code: "C202", route: "/dashboard/finance/mr-entry" },
        { title: "Vouchers", code: "C208", route: "/dashboard/finance/vouchers" },
        { title: "Cheque Management", code: "C215", route: "/dashboard/finance/cheque-management" },
        { title: "Cash & Bank Statement", code: "C223", route: "/dashboard/finance/cash-bank-statement" },
        { title: "Print Document [Dot-Matrix ]", code: "C225", route: "/dashboard/finance/print-dot-matrix" }
      ]
    },
    {
      id: "C003",
      name: "CRM",
      icon: UserCheck,
      image: "/images/cards/crm.jpg",
      subcategories: [
        { title: "Lead Details", code: "C504", route: "/dashboard/masters/customers" },
        { title: "Vist Details", code: "C505", route: "/dashboard/masters/customers" },
        { title: "Activity", code: "C916", route: "/dashboard/masters/customers" }
      ]
    },
    {
      id: "C158",
      name: "Fleet",
      icon: Truck,
      image: "/images/cards/fleet.jpg",
      subcategories: [
        { title: "Trip Management", code: "C749", route: "/dashboard/masters/vehicles" },
        { title: "Fuel and Toll Management", code: "C750", route: "/dashboard/masters/vehicles" }
      ]
    },
    {
      id: "C004",
      name: "Tracking",
      icon: MapPin,
      image: "/images/cards/tracking.jpg",
      subcategories: [
        { title: "Tracking Douments", code: "C111", route: "/dashboard/operations/tracking" },
        { title: "Track Customer/Vendor", code: "C485", route: "/dashboard/operations/tracking" }
      ]
    },
    {
      id: "C136",
      name: "Exceptional",
      icon: ClipboardCheck,
      image: "/images/cards/exceptional.jpg",
      subcategories: [
        { title: "Operation", code: "C117", route: "/dashboard/operations/dockets" },
        { title: "Finance", code: "C132", route: "/dashboard/finance/billing" },
        { title: "Bank Reconciliation Statment", code: "C520", route: "/dashboard/finance/bank-statement" },
        { title: "Company Vechicle Exceptional", code: "C588", route: "/dashboard/masters/vehicles" }
      ]
    },
    {
      id: "C006",
      name: "Reports",
      icon: BarChart2,
      image: "/images/cards/reports.jpg",
      subcategories: [
        { title: "Operation Report", code: "C084", route: "/dashboard/operations/dockets" },
        { title: "Finance", code: "C085", route: "/dashboard/reports" },
        { title: "Accounts", code: "C086", route: "/dashboard/reports" },
        { title: "Purchase Report", code: "C840", route: "/dashboard/reports" },
        { title: "ERP Tracking", code: "C088", route: "/dashboard/operations/tracking" },
        { title: "Final Accounts", code: "C486", route: "/dashboard/reports" },
        { title: "Company Vechicle Reports", code: "C576", route: "/dashboard/masters/vehicles" }
      ]
    },
    {
      id: "C007",
      name: "Admin",
      icon: Settings,
      image: "/images/cards/admin.jpg",
      subcategories: [
        { title: "Company Structure", code: "C052", route: "/dashboard/masters/branches" },
        { title: "Business Partners", code: "C060", route: "/dashboard/masters/customers" },
        { title: "Operations", code: "C065", route: "/dashboard/masters/branches" },
        { title: "Finance & Accounts", code: "C077", route: "/dashboard/reports" },
        { title: "APIs", code: "C686", route: "/dashboard/finance/e-invoice" }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10">
      {/* Top Quick KPI Row (Modular & Responsive) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Active Consignments"
          value="1,428"
          subtitle="All corridors active"
          icon={FileText}
          trend="+8.4%"
          trendDirection="up"
          color="blue"
        />
        <StatCard
          title="Fleet in Transit"
          value="42"
          subtitle="GPS tracking live"
          icon={Truck}
          trend="+3 new"
          trendDirection="up"
          color="emerald"
        />
        <StatCard
          title="Pending Billing"
          value="₹ 14.8 L"
          subtitle="24 dockets to bill"
          icon={DollarSign}
          color="amber"
        />
        <StatCard
          title="IRP / NIC Engine"
          value="Online"
          subtitle="Sandbox connected"
          icon={ShieldCheck}
          trend="99.9%"
          color="indigo"
        />
      </div>

      {/* Main 3-Column / Responsive Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 items-start">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isOpen = !!openDropdowns[mod.id];

          return (
            <div
              key={mod.id}
              className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col"
            >
              {/* Clickable Header Bar: Dark umber matching authentic Home.aspx */}
              <div
                onClick={() => toggleDropdown(mod.id)}
                className="bg-[#383028] hover:bg-[#453c33] px-4 py-2.5 flex items-center justify-between text-white select-none cursor-pointer transition-colors active:scale-[0.99]"
                title={`Click to ${isOpen ? "collapse" : "expand"} subcategories`}
              >
                <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
                  <Icon className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>{mod.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold text-slate-300/80">
                    {mod.id}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Clickable Photographic Banner Image */}
              <div
                onClick={() => toggleDropdown(mod.id)}
                className="relative w-full h-40 sm:h-44 bg-slate-900 overflow-hidden cursor-pointer group select-none"
                title={`Click to ${isOpen ? "collapse" : "expand"} ${mod.name} subcategories`}
              >
                <Image
                  src={mod.image}
                  alt={mod.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors flex items-end p-2.5">
                  <span className="text-[11px] font-semibold text-white/95 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-2xs">
                    {isOpen ? "Click to close" : "Click to view subcategories"}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </span>
                </div>
              </div>

              {/* Subcategories Dropdown Area: Toggled by clicking banner or image */}
              {isOpen ? (
                <div className="p-3 sm:p-4 space-y-1.5 bg-white border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                  {mod.subcategories.map((sub, idx) => (
                    <Link
                      key={idx}
                      href={sub.route}
                      className="group flex items-center justify-between text-xs sm:text-[13px] text-slate-700 hover:text-blue-700 transition-colors py-2 px-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 active:bg-slate-100"
                    >
                      <span className="font-medium group-hover:translate-x-0.5 transition-transform truncate pr-2">
                        {sub.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-0.5 shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => toggleDropdown(mod.id)}
                  className="py-2.5 px-4 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-t border-slate-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View {mod.subcategories.length} submodules</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
