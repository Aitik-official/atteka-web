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
  ShieldCheck,
  FileText,
  X
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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
    setMobileSearchOpen(false);

    if (q.includes("cn") || q.includes("docket") || q.includes("c010") || q.includes("c009")) {
      router.push("/dashboard/operations/new-cn");
    } else if (q.includes("track") || q.includes("c111") || q.includes("c004")) {
      router.push("/dashboard/operations/tracking");
    } else if (q.includes("bill") || q.includes("c194") || q.includes("c181")) {
      router.push("/dashboard/finance/billing");
    } else if (q.includes("bank") || q.includes("indus") || q.includes("c782") || q.includes("c208")) {
      router.push("/dashboard/finance/bank-payment");
    } else if (q.includes("irn") || q.includes("einvoice") || q.includes("c655")) {
      router.push("/dashboard/finance/e-invoice");
    } else if (q.includes("cust") || q.includes("c061") || q.includes("c003")) {
      router.push("/dashboard/masters/customers");
    } else if (q.includes("fleet") || q.includes("veh") || q.includes("c158") || q.includes("c749")) {
      router.push("/dashboard/masters/vehicles");
    } else if (q.includes("trial") || q.includes("report") || q.includes("c086") || q.includes("c006")) {
      router.push("/dashboard/reports");
    } else {
      router.push("/dashboard/operations/dockets");
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-40 px-2.5 sm:px-4 md:px-5 flex items-center justify-between shadow-2xs">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative w-8 sm:w-9 h-7 sm:h-8 flex items-center justify-center">
            <Image
              src="/images/atteka_logo-removebg-preview.png"
              alt="Ateka Logistics"
              width={36}
              height={28}
              className="object-contain"
              unoptimized
            />
          </div>
          <span className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight">
            Ateka <span className="hidden xs:inline">Logistics</span>
          </span>
        </Link>
      </div>

      {/* Center: Search Bar (Desktop) */}
      <div className="hidden sm:flex flex-1 max-w-md md:max-w-xl mx-3 md:mx-6">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules, dockets, reports (e.g. C010)..."
            className="w-full h-9 pl-9 pr-4 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder-slate-400 transition-colors"
          />
        </form>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="sm:hidden absolute inset-x-0 top-0 h-14 bg-white z-50 px-3 flex items-center gap-2 border-b border-slate-200 shadow-sm animate-in slide-in-from-top-1">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dockets, modules..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </form>
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Right Controls: Mobile Search Toggle, Fullscreen, Settings, Active Badge, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Mobile Search Icon Button */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Fullscreen Button (Desktop) */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors hidden md:flex items-center justify-center"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Settings Gear (Desktop) */}
        <button
          onClick={() => router.push("/dashboard/reports")}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors hidden md:flex items-center justify-center"
          title="Settings & System Configurations"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Green Circular Badge: '04' */}
        <div
          title="Active Sessions: 04"
          className="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-[#10b981] text-white font-bold text-[11px] sm:text-xs flex items-center justify-center shadow-xs select-none"
        >
          04
        </div>

        {/* Green Profile Pill Dropdown: 'A ANISHA OZARKAR v' */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdown(!profileDropdown)}
            className="flex items-center gap-1.5 sm:gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors shadow-xs text-xs font-semibold tracking-wide select-none"
          >
            <div className="w-5 h-5 rounded-full bg-white/25 text-white font-bold text-[11px] flex items-center justify-center">
              {user.name?.charAt(0) || "A"}
            </div>
            <span className="hidden sm:inline uppercase text-[11px]">
              {user.name || "ANISHA OZARKAR"}
            </span>
            <ChevronDown className="w-3 h-3 text-white/80" />
          </button>

          {profileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <p className="font-bold text-slate-800 truncate">{user.name || "ANISHA OZARKAR"}</p>
                <p className="text-slate-500 text-[10px] font-mono">{user.userId || "AL002"} • Operator</p>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Location: Ateka Logistics - ALC1</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileDropdown(false);
                    router.push("/dashboard/operations/new-cn");
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>New CN Booking (C009/C010)</span>
                </button>
                <button
                  onClick={() => {
                    setProfileDropdown(false);
                    router.push("/dashboard/finance/bank-payment");
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bank & IRN Operations</span>
                </button>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
