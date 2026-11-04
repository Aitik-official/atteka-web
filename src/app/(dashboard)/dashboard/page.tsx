"use client";

import React from "react";
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
  ChevronRight
} from "lucide-react";

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
  const modules: ModuleCard[] = [
    {
      id: "C001",
      name: "Operations",
      icon: Users2,
      image: "/images/cards/operations.jpg",
      subcategories: [
        { title: "Freight Booking", code: "C009", route: "/dashboard/operations/new-cn" },
        { title: "CN Operations [System]", code: "C019", route: "/dashboard/operations/dockets" },
        { title: "TripSheet Operations", code: "C035", route: "/dashboard/operations/tripsheets" },
        { title: "View Print Document", code: "C039", route: "/dashboard/operations/dockets" }
      ]
    },
    {
      id: "C002",
      name: "Finance",
      icon: Landmark,
      image: "/images/cards/finance.jpg",
      subcategories: [
        { title: "Vendor Billing", code: "C181", route: "/dashboard/finance/billing" },
        { title: "Customer Billing", code: "C194", route: "/dashboard/finance/billing" },
        { title: "Genrate E-Invoice (IRN)", code: "C655", route: "/dashboard/finance/e-invoice" },
        { title: "MR Entry", code: "C202", route: "/dashboard/finance/mr-entry" },
        { title: "Vouchers", code: "C208", route: "/dashboard/finance/bank-payment" },
        { title: "Cheque Management", code: "C215", route: "/dashboard/finance/bank-statement" },
        { title: "Cash & Bank Statement", code: "C223", route: "/dashboard/finance/bank-statement" },
        { title: "Print Document [Dot-Matrix ]", code: "C225", route: "/dashboard/finance/billing" }
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
      id: "C748",
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
      id: "C116",
      name: "Exceptional",
      icon: ClipboardCheck,
      image: "/images/cards/exceptional.jpg",
      subcategories: [
        { title: "Operation", code: "C117", route: "/dashboard/operations/dockets" },
        { title: "Finance", code: "C132", route: "/dashboard/finance/billing" },
        { title: "Bank Reconciliation Statment", code: "C520", route: "/dashboard/finance/bank-statement" },
        { title: "Company Vehicle Exceptional", code: "C588", route: "/dashboard/masters/vehicles" }
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
    <div className="max-w-7xl mx-auto pb-10">
      {/* 3-Column Grid Exactly Matching Home.aspx Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              className="bg-white rounded-xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Dark Brown / Charcoal Top Header Bar */}
              <div className="bg-[#2e2621] px-4 py-2.5 flex items-center justify-between text-white select-none">
                <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
                  <Icon className="w-4 h-4 text-slate-300" />
                  <span>{mod.name}</span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-400">
                  {mod.id}
                </span>
              </div>

              {/* Photographic Banner Image */}
              <div className="relative w-full h-44 bg-slate-900 overflow-hidden">
                <Image
                  src={mod.image}
                  alt={mod.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Subcategories List Below Image (Identical to reference screenshot) */}
              <div className="p-4 space-y-2 bg-white">
                {mod.subcategories.map((sub, idx) => (
                  <Link
                    key={idx}
                    href={sub.route}
                    className="group flex items-center justify-between text-[13px] text-slate-700 hover:text-blue-700 transition-colors py-1 px-1.5 rounded hover:bg-slate-50"
                  >
                    <span className="font-medium group-hover:translate-x-0.5 transition-transform">
                      {sub.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
