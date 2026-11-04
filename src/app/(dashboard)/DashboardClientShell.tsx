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

  // Manage initial closed state on home, and persistent open state once a module is opened
  useEffect(() => {
    const isModulePage = pathname !== "/dashboard" && pathname !== "/";
    const userPref = typeof window !== "undefined" ? localStorage.getItem("sidebar_user_pref") : null;

    if (userPref === "closed") {
      setSidebarOpen(false);
    } else if (userPref === "open") {
      setSidebarOpen(true);
    } else if (isModulePage) {
      // First time entering any module: open the sidebar and keep it on
      setSidebarOpen(true);
      localStorage.setItem("sidebar_user_pref", "open");
    } else {
      // Initially keep sidebar closed on the root dashboard
      setSidebarOpen(false);
    }
  }, [pathname]);

  const handleToggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_user_pref", open ? "open" : "closed");
    }
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

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={handleToggleSidebar}
        user={user}
      />

      {/* Center Layout: Sidebar + Main Area */}
      <div className="flex flex-1 relative mb-8">
        <Sidebar isOpen={sidebarOpen} user={user} />
        <main
          className={`flex-1 transition-all duration-300 p-4 md:p-6 overflow-x-hidden min-h-[calc(100vh-3.5rem-2rem)] ${
            sidebarOpen ? "ml-64" : "ml-16"
          }`}
        >
          {children}
        </main>
      </div>

      {/* Bottom Fixed Status Bar (Exact Replica of original Home.aspx footer) */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-xs text-slate-600 z-30 select-none shadow-sm">
        {/* Left: Location Pin */}
        <div className="flex items-center gap-1.5 text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium text-[11px] sm:text-xs">Location: [Ateka Logistics - ALC1]</span>
        </div>

        {/* Center / Right Status Indicators */}
        <div className="flex items-center gap-4 text-slate-600 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            <span>Online</span>
          </div>

          <div className="flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>F.Y: 2026-2027</span>
          </div>

          <div className="flex items-center gap-1 font-medium font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime || "08:08:41 pm"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
