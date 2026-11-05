"use client";

import React, { useEffect, useRef, useState } from "react";
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
  Moon,
  Sun,
  X,
  Bell,
  AlertTriangle,
  User,
  Home,
  MapPin,
  Calendar,
  Crosshair
} from "lucide-react";
import { computeVehicleCompliance, generateWhatsAppExpiryMessage } from "@/lib/complianceEngine";
import { searchModules, type ModuleSearchItem } from "@/lib/moduleCatalog";

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

const FY_OPTIONS = ["2024-2025", "2025-2026", "2026-2027", "2027-2028"];
const LOCATION_OPTIONS = [
  { code: "ALC1", label: "Atteka Logistics - ALC1" },
  { code: "MUM", label: "Mumbai Central - MUM" },
  { code: "PUN", label: "Pune Hub - PUN" },
  { code: "DEL", label: "Delhi Regional - DEL" },
  { code: "BLR", label: "Bengaluru - BLR" }
];

export function Header({ sidebarOpen, setSidebarOpen, user }: HeaderProps) {
  const router = useRouter();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ModuleSearchItem[]>([]);
  const [activeResult, setActiveResult] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [alertsDropdown, setAlertsDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [financialYear, setFinancialYear] = useState(user.financialYear || "2026-2027");
  const [operatingLocation, setOperatingLocation] = useState(
    user.operatingLocation || "Atteka Logistics - ALC1"
  );
  const [fyModal, setFyModal] = useState(false);
  const [locModal, setLocModal] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const fleetAlerts = [
    computeVehicleCompliance({
      registrationNumber: "MH-04-GP-1928",
      vehicleType: "32 FT Multi-Axle",
      fitnessExpiryDate: "2026-11-18",
      insuranceExpiryDate: "2026-11-09",
      nationalPermitExpiryDate: "2027-04-30",
      driverName: "Ram Singh Yadav",
      driverPhone: "9820112345"
    }),
    computeVehicleCompliance({
      registrationNumber: "MH-04-AB-3841",
      vehicleType: "20 FT Container",
      fitnessExpiryDate: "2026-10-30",
      insuranceExpiryDate: "2027-01-15",
      nationalPermitExpiryDate: "2027-02-28",
      driverName: "Dilip Kumar",
      driverPhone: "9833019283"
    })
  ];

  const criticalAlertsCount = fleetAlerts.reduce(
    (acc, v) => acc + v.items.filter((i) => i.status === "EXPIRED" || i.status === "EXPIRING_SOON").length,
    0
  );

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const results = searchModules(searchQuery, 14);
    setSearchResults(results);
    setActiveResult(0);
    setSearchOpen(searchQuery.trim().length > 0 && results.length > 0);
  }, [searchQuery]);

  useEffect(() => {
    try {
      const storedFy = localStorage.getItem("atteka_fy");
      const storedLoc = localStorage.getItem("atteka_location");
      const storedDark = localStorage.getItem("atteka_dark");
      if (storedFy) setFinancialYear(storedFy);
      if (storedLoc) setOperatingLocation(storedLoc);
      if (storedDark === "1") {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    } catch {
      // ignore
    }
  }, []);

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

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      localStorage.setItem("atteka_dark", next ? "1" : "0");
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle("dark", next);
  };

  const saveFy = (fy: string) => {
    setFinancialYear(fy);
    try {
      localStorage.setItem("atteka_fy", fy);
    } catch {
      // ignore
    }
    setFyModal(false);
    setProfileDropdown(false);
  };

  const saveLocation = (label: string) => {
    setOperatingLocation(label);
    try {
      localStorage.setItem("atteka_location", label);
    } catch {
      // ignore
    }
    setLocModal(false);
    setProfileDropdown(false);
  };

  const goToResult = (item: ModuleSearchItem) => {
    setSearchQuery("");
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchResults([]);
    router.push(item.route);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults[activeResult]) {
      goToResult(searchResults[activeResult]);
      return;
    }
    const fallback = searchModules(searchQuery, 1)[0];
    if (fallback) goToResult(fallback);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen || searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveResult((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveResult((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setSearchOpen(false);
    }
  };

  const renderSearchDropdown = (compact = false) => {
    if (!searchOpen || searchResults.length === 0) return null;
    return (
      <div
        className={`absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 ${
          compact ? "max-h-64" : "max-h-80"
        }`}
      >
        <ul className={`overflow-y-auto py-1 text-xs ${compact ? "max-h-60" : "max-h-72"}`}>
          {searchResults.map((item, idx) => {
            const active = idx === activeResult;
            return (
              <li key={`${item.id}-${item.route}-${idx}`}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveResult(idx)}
                  onClick={() => goToResult(item)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                    active ? "bg-[#0070d2] text-white" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate font-medium">{item.label}</span>
                  <span className={`shrink-0 text-[10px] font-mono ${active ? "text-blue-100" : "text-slate-400"}`}>
                    {item.group}
                    {item.code ? ` · ${item.code}` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-40 px-2.5 sm:px-4 md:px-5 flex items-center justify-between shadow-2xs">
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

      <div className="hidden sm:flex flex-1 max-w-md md:max-w-xl mx-3 md:mx-6" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="w-4 h-4 text-blue-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim() && searchResults.length > 0) setSearchOpen(true);
            }}
            onKeyDown={onSearchKeyDown}
            placeholder="Search modules, reports, masters..."
            className="w-full h-9 pl-9 pr-4 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#0070d2] focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder-slate-400 transition-colors"
            autoComplete="off"
            role="combobox"
            aria-expanded={searchOpen}
            aria-autocomplete="list"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchOpen(false);
              }}
              className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {renderSearchDropdown()}
        </form>
      </div>

      {mobileSearchOpen && (
        <div className="sm:hidden absolute inset-x-0 top-0 min-h-14 bg-white z-50 px-3 pt-2.5 pb-3 border-b border-slate-200 shadow-sm animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="w-4 h-4 text-blue-500 absolute left-3 top-2.5" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Search modules..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-[#0070d2] focus:ring-2 focus:ring-blue-100 text-slate-800"
                autoComplete="off"
              />
              {renderSearchDropdown(true)}
            </form>
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors hidden md:flex items-center justify-center"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors hidden md:flex items-center justify-center"
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => router.push("/dashboard/reports")}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors hidden md:flex items-center justify-center"
          title="Settings & System Configurations"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setAlertsDropdown(!alertsDropdown)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors relative flex items-center justify-center"
            title="Fleet Compliance & Document Expiry Watchdog"
          >
            <Bell className="w-4 h-4" />
            {criticalAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full font-bold text-[9px] flex items-center justify-center shadow-xs animate-pulse">
                {criticalAlertsCount}
              </span>
            )}
          </button>

          {alertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Fleet Compliance Watchdog
                </span>
                <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                  {criticalAlertsCount} Actions Due
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {fleetAlerts.map((v) => (
                  <div key={v.vehicleRegNo} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-blue-600">{v.vehicleRegNo}</span>
                      <a
                        href={`https://wa.me/91${v.driverPhone}?text=${generateWhatsAppExpiryMessage(v)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-md flex items-center gap-1 shadow-2xs"
                      >
                        WhatsApp Alert ➔
                      </a>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Driver: {v.driverName} ({v.driverPhone})
                    </div>
                    <div className="space-y-1 pt-1 border-t border-slate-200/60 text-[10px]">
                      {v.items.map((i) => (
                        <div key={i.name} className="flex justify-between">
                          <span className="text-slate-500">{i.name}:</span>
                          <span
                            className={`font-mono font-bold ${
                              i.status === "EXPIRED" ? "text-red-600" : "text-amber-600"
                            }`}
                          >
                            {i.status === "EXPIRED" ? "EXPIRED" : `${i.daysRemaining} days left`} ({i.expiryDate})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 mt-2 flex justify-between items-center text-[11px]">
                <button
                  onClick={() => {
                    setAlertsDropdown(false);
                    router.push("/dashboard/masters/vehicles");
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  View Vehicle Master
                </button>
                <button onClick={() => setAlertsDropdown(false)} className="text-slate-400 hover:text-slate-600">
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          title="Active Sessions: 04"
          className="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-[#10b981] text-white font-bold text-[11px] sm:text-xs flex items-center justify-center shadow-xs select-none"
        >
          04
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdown(!profileDropdown)}
            className="flex items-center gap-1.5 sm:gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors shadow-xs text-xs font-semibold tracking-wide select-none"
          >
            <div className="w-5 h-5 rounded-full bg-white/25 text-white font-bold text-[11px] flex items-center justify-center">
              <User className="w-3 h-3" />
            </div>
            <span className="hidden sm:inline uppercase text-[11px]">{user.name || "ANISHA OZARKAR"}</span>
            <ChevronDown className="w-3 h-3 text-white/80" />
          </button>

          {profileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-[#2f3542] rounded-md shadow-2xl border border-slate-700/60 py-1.5 z-50 text-[12px] animate-in fade-in slide-in-from-top-1 text-slate-100">
              <button
                type="button"
                onClick={() => {
                  setProfileDropdown(false);
                  router.push("/dashboard/profile");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/60 flex items-center gap-2.5 transition-colors"
              >
                <User className="w-4 h-4 text-slate-300" />
                <span>My Profile</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileDropdown(false);
                  router.push("/dashboard");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/60 flex items-center gap-2.5 transition-colors"
              >
                <Home className="w-4 h-4 text-slate-300" />
                <span>Home</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileDropdown(false);
                  router.push("/dashboard/operations/tracking");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/60 flex items-center gap-2.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-slate-300" />
                <span>Live Tracking</span>
              </button>

              <div className="my-1 border-t border-slate-600/70" />

              <button
                type="button"
                onClick={() => {
                  setProfileDropdown(false);
                  setFyModal(true);
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/60 flex items-center gap-2.5 transition-colors"
              >
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Change Financial Year</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileDropdown(false);
                  setLocModal(true);
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/60 flex items-center gap-2.5 transition-colors"
              >
                <Crosshair className="w-4 h-4 text-emerald-400" />
                <span>Change Operating Location</span>
              </button>

              <div className="my-1 border-t border-slate-600/70" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/60 flex items-center gap-2.5 transition-colors text-[#f07178]"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Financial Year */}
      {fyModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#0070d2] px-4 py-3 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold">Change Financial Year</h3>
              <button type="button" onClick={() => setFyModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 text-xs">
              <p className="text-slate-500 mb-2">
                Current: <span className="font-mono font-bold text-slate-800">{financialYear}</span>
              </p>
              {FY_OPTIONS.map((fy) => (
                <button
                  key={fy}
                  type="button"
                  onClick={() => saveFy(fy)}
                  className={`w-full text-left px-3 py-2 rounded-lg border font-semibold ${
                    fy === financialYear
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {fy}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Change Operating Location */}
      {locModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#0070d2] px-4 py-3 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold">Change Operating Location</h3>
              <button type="button" onClick={() => setLocModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 text-xs">
              <p className="text-slate-500 mb-2">
                Current: <span className="font-semibold text-slate-800">{operatingLocation}</span>
              </p>
              {LOCATION_OPTIONS.map((loc) => (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => saveLocation(loc.label)}
                  className={`w-full text-left px-3 py-2 rounded-lg border font-semibold ${
                    loc.label === operatingLocation
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
