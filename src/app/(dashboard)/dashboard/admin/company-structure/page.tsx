"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Building2, Users2, MapPin, Mail, CheckCircle2, X, Plus, Save } from "lucide-react";

export default function CompanyStructureAdminHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Mock initial data for tools
  const [employees, setEmployees] = useState([
    { id: "AL001", name: "Anil Sharma", role: "Branch Admin", branch: "ALC1 - Mumbai Central", email: "anil@atteka.com" },
    { id: "AL002", name: "Anisha Ozarkar", role: "Accounts & Billing", branch: "ALC1 - Mumbai Central", email: "anisha@atteka.com" },
    { id: "AL003", name: "Ramesh Patel", role: "Fleet Coordinator", branch: "ALC2 - Bhiwandi Hub", email: "ramesh@atteka.com" }
  ]);

  const [routes, setRoutes] = useState([
    { code: "BOM-DEL", origin: "Mumbai (ALC1)", destination: "Delhi (DEL1)", distanceKm: 1420, transitHours: 48 },
    { code: "BOM-BLR", origin: "Mumbai (ALC1)", destination: "Bangalore (BLR1)", distanceKm: 980, transitHours: 36 },
    { code: "BOM-AMD", origin: "Mumbai (ALC1)", destination: "Ahmedabad (AMD1)", distanceKm: 530, transitHours: 18 }
  ]);

  const [mailConfig, setMailConfig] = useState({
    smtpHost: "smtp.office365.com",
    smtpPort: "587",
    smtpUser: "notifications@atteka.com",
    senderName: "Atteka Logistics ERP",
    ssl: true,
    notifyDockets: true,
    notifyBills: true
  });

  const handleSave = (type: string) => {
    setSuccessMsg(`${type} configuration updated successfully.`);
    setTimeout(() => {
      setSuccessMsg(null);
      setActiveModal(null);
    }, 1500);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header */}
      <WcvRibbonHeader title="Company Structure" />

      {/* 4 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Branch Master"
          description="Branch Master"
          href="/dashboard/masters/branches"
          icon={Building2}
        />
        <WcvActionCard
          title="Employee Master"
          description="Employee Master"
          onClick={() => setActiveModal("Employee Master")}
          icon={Users2}
        />
        <WcvActionCard
          title="Route Master"
          description="Destination Master"
          onClick={() => setActiveModal("Route Master")}
          icon={MapPin}
        />
        <WcvActionCard
          title="E-Mail Configuration"
          description="E-Mail Configuration"
          onClick={() => setActiveModal("E-Mail Configuration")}
          icon={Mail}
        />
      </div>

      {/* Interactive Functional Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">{activeModal}</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                ✓ {successMsg}
              </div>
            )}

            {/* Employee Master View */}
            {activeModal === "Employee Master" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Manage active ERP users, operational branches, and module access permissions.
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2.5">User ID</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Assigned Branch</th>
                        <th className="p-2.5">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-mono font-bold text-blue-600">{emp.id}</td>
                          <td className="p-2.5 font-medium text-slate-800">{emp.name}</td>
                          <td className="p-2.5 text-slate-600">{emp.role}</td>
                          <td className="p-2.5 text-slate-600">{emp.branch}</td>
                          <td className="p-2.5 text-slate-500 font-mono">{emp.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => {
                      const newId = `AL00${employees.length + 1}`;
                      setEmployees([...employees, { id: newId, name: "New User", role: "Staff", branch: "ALC1 - Mumbai Central", email: `${newId.toLowerCase()}@atteka.com` }]);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Staff Member
                  </button>
                  <button
                    onClick={() => handleSave("Staff Directory")}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Route Master View */}
            {activeModal === "Route Master" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Standard transit corridors, highway distance allowances, and expected delivery turnaround times.
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2.5">Corridor Code</th>
                        <th className="p-2.5">Origin Branch</th>
                        <th className="p-2.5">Destination</th>
                        <th className="p-2.5">Distance (KM)</th>
                        <th className="p-2.5">Transit Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {routes.map((rt) => (
                        <tr key={rt.code} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-mono font-bold text-emerald-700">{rt.code}</td>
                          <td className="p-2.5 text-slate-700">{rt.origin}</td>
                          <td className="p-2.5 text-slate-700">{rt.destination}</td>
                          <td className="p-2.5 font-mono text-slate-600">{rt.distanceKm} km</td>
                          <td className="p-2.5 font-mono text-slate-600">{rt.transitHours} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleSave("Transit Corridors")}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Routes
                  </button>
                </div>
              </div>
            )}

            {/* E-Mail Configuration View */}
            {activeModal === "E-Mail Configuration" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  SMTP mail server dispatch settings for automatic e-invoices, consignment booking confirmations, and delivery alerts.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={mailConfig.smtpHost}
                      onChange={(e) => setMailConfig({ ...mailConfig, smtpHost: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">SMTP Port</label>
                    <input
                      type="text"
                      value={mailConfig.smtpPort}
                      onChange={(e) => setMailConfig({ ...mailConfig, smtpPort: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">System Mailbox Username</label>
                    <input
                      type="text"
                      value={mailConfig.smtpUser}
                      onChange={(e) => setMailConfig({ ...mailConfig, smtpUser: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Display Sender Name</label>
                    <input
                      type="text"
                      value={mailConfig.senderName}
                      onChange={(e) => setMailConfig({ ...mailConfig, senderName: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={mailConfig.notifyDockets}
                      onChange={(e) => setMailConfig({ ...mailConfig, notifyDockets: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Send Email on Docket Booking
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={mailConfig.notifyBills}
                      onChange={(e) => setMailConfig({ ...mailConfig, notifyBills: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Send Email on Customer Invoice
                  </label>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleSave("SMTP Mail Server")}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Mail Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
