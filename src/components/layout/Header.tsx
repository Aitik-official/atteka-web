"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  Search,
  Maximize2,
  Settings,
  ChevronDown,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  FileText
} from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: {
    userId: string;
    name: string;
    branchCode?: string;
    operatingLocation?: string;
    financialYear?: string;
  };
}

export function Header({ sidebarOpen, setSidebarOpen, user }: HeaderProps) {
  const router = useRouter();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    if (q.includes("cn") || q.includes("docket") || q.includes("c010")) {
      router.push("/dashboard/operations/new-cn");
    } else if (q.includes("track") || q.includes("c111")) {
      router.push("/dashboard/operations/tracking");
    } else if (q.includes("bill") || q.includes("c194")) {
      router.push("/dashboard/finance/billing");
    } else if (q.includes("bank") || q.includes("indus") || q.includes("c782")) {
      router.push("/dashboard/finance/bank-payment");
    } else if (q.includes("irn") || q.includes("einvoice") || q.includes("c655")) {
      router.push("/dashboard/finance/e-invoice");
    } else if (q.includes("cust") || q.includes("c061")) {
      router.push("/dashboard/masters/customers");
    } else if (q.includes("trial") || q.includes("report") || q.includes("c086")) {
      router.push("/dashboard/reports");
    } else {
      router.push("/dashboard/operations/dockets");
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-30 px-3 md:px-5 flex items-center justify-between shadow-sm">
      {/* Left: Brand Logo & Sidebar Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative w-8 h-7 flex items-center justify-center">
            <Image
              src="/images/ateka_logo.jpg"
              alt="Ateka Logistics"
              width={36}
              height={28}
              className="object-contain"
              unoptimized
            />
          </div>
          <span className="font-bold text-slate-800 text-sm hidden lg:inline tracking-tight">
            Ateka Logistics
          </span>
        </Link>
      </div>

      {/* Center: Search Bar (Exact Replica of original Home.aspx) */}
      <div className="flex-1 max-w-xl mx-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules, reports, masters..."
            className="w-full h-9 pl-10 pr-4 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder-slate-400 transition-colors"
          />
        </form>
      </div>

      {/* Right Controls: Fullscreen, Settings, Active Count, Profile */}
      <div className="flex items-center gap-3">
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors hidden sm:flex items-center justify-center"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Settings Gear */}
        <button
          onClick={() => router.push("/dashboard/reports")}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors hidden sm:flex items-center justify-center"
          title="Settings & System Configurations"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Green Circular Badge: '04' */}
        <div
          title="Active Sessions: 04"
          className="w-7 h-7 rounded-full bg-[#10b981] text-white font-bold text-xs flex items-center justify-center shadow-sm select-none"
        >
          04
        </div>

        {/* Green Profile Pill Dropdown: 'A ANISHA OZARKAR v' */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdown(!profileDropdown)}
            className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-full transition-colors shadow-sm text-xs font-semibold tracking-wide select-none"
          >
            <div className="w-5 h-5 rounded-full bg-white/25 text-white font-bold text-[11px] flex items-center justify-center">
              {user.name?.charAt(0) || "A"}
            </div>
            <span className="hidden sm:inline uppercase">
              {user.name || "ANISHA OZARKAR"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-white/80" />
          </button>

          {profileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-800">{user.name || "ANISHA OZARKAR"}</p>
                <p className="text-slate-500 text-[11px] font-mono">{user.userId || "AL002"} • Operator</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Location: Ateka Logistics - ALC1</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileDropdown(false);
                    router.push("/dashboard/operations/new-cn");
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-emerald-50 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  New CN Booking (C010)
                </button>
                <button
                  onClick={() => {
                    setProfileDropdown(false);
                    router.push("/dashboard/finance/bank-payment");
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-emerald-50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Bank & IRN Operations
                </button>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
