"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MapPin, Calendar, Clock } from "lucide-react";

export function DashboardClientShell({
  user,
  children
}: {
  user: any;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [footerFy, setFooterFy] = useState("2026-2027");
  const [footerLocation, setFooterLocation] = useState("Ateka Logistics - ALC1");

  // Detect mobile screen width on client
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Manage initial closed state on home, and persistent open state once a module is opened
  useEffect(() => {
    const isModulePage = pathname !== "/dashboard" && pathname !== "/";
    const userPref = typeof window !== "undefined" ? localStorage.getItem("sidebar_user_pref") : null;

    if (window.innerWidth < 768) {
      // Always start with sidebar closed on mobile viewports
      setSidebarOpen(false);
    } else if (userPref === "closed") {
      setSidebarOpen(false);
    } else if (userPref === "open") {
      setSidebarOpen(true);
    } else if (isModulePage) {
      // First time entering any module on desktop: open the sidebar and keep it on
      setSidebarOpen(true);
      localStorage.setItem("sidebar_user_pref", "open");
    } else {
      // Initially keep sidebar closed on the root dashboard
      setSidebarOpen(false);
    }
  }, [pathname]);

  const handleToggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      localStorage.setItem("sidebar_user_pref", open ? "open" : "closed");
    }
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, "0");
      setCurrentTime(`${strHours}:${minutes}:${seconds} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncSessionPrefs = () => {
      try {
        const fy = localStorage.getItem("atteka_fy");
        const loc = localStorage.getItem("atteka_location");
        if (fy) setFooterFy(fy);
        if (loc) setFooterLocation(loc);
      } catch {
        // ignore
      }
    };
    syncSessionPrefs();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "atteka_fy" || e.key === "atteka_location") syncSessionPrefs();
    };
    window.addEventListener("storage", onStorage);
    const poll = setInterval(syncSessionPrefs, 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(poll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={handleToggleSidebar}
        user={user}
      />

      {/* Center Layout: Sidebar + Main Area */}
      <div className="flex flex-1 relative mb-8">
        {/* Mobile Dim Backdrop */}
        {sidebarOpen && isMobile && (
          <div
            onClick={handleCloseSidebar}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity md:hidden animate-in fade-in"
          />
        )}

        {/* Sidebar Component */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          user={user}
          isMobile={isMobile}
        />

        {/* Main Content: ml-0 on mobile, md:ml-64 or md:ml-16 on desktop */}
        <main
          className={`flex-1 transition-all duration-300 p-3 sm:p-4 md:p-6 overflow-x-hidden min-h-[calc(100vh-3.5rem-2rem)] ml-0 ${
            sidebarOpen ? "md:ml-64" : "md:ml-16"
          }`}
        >
          {children}
        </main>
      </div>

      {/* Bottom Fixed Status Bar (Exact Replica of original Home.aspx footer, fully responsive) */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-white border-t border-slate-200 px-3 sm:px-4 flex items-center justify-between text-xs text-slate-600 z-30 select-none shadow-xs overflow-x-auto scrollbar-none whitespace-nowrap">
        {/* Left: Location Pin */}
        <div className="flex items-center gap-1.5 text-slate-700 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium text-[10px] sm:text-xs">
            Location: {footerLocation}
          </span>
        </div>

        {/* Center / Right Status Indicators */}
        <div className="flex items-center gap-3 sm:gap-4 text-slate-600 text-[10px] sm:text-xs shrink-0 pl-2">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            <span>Online</span>
          </div>

          <div className="flex items-center gap-1 font-medium hidden xs:flex">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>F.Y: {footerFy}</span>
          </div>

          <div className="flex items-center gap-1 font-medium font-mono text-[10px] sm:text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime || "08:08:41 pm"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
