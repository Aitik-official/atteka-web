"use client";

import React, { useEffect, useMemo, useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Download,
  MapPin,
  Mail,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Users2,
  X
} from "lucide-react";
import { EmployeeMasterPanel } from "@/components/admin/EmployeeMasterPanel";
import { RouteMasterPanel } from "@/components/admin/RouteMasterPanel";
import { EmailConfigPanel } from "@/components/admin/EmailConfigPanel";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
  "Chandigarh", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
];

const HIERARCHY_OPTIONS = ["CORPORATE", "REGION", "HUB", "BRANCH", "WAREHOUSE", "TRANSHIPMENT"];

type BranchForm = {
  _id?: string;
  locationHierarchy: string;
  branchCode: string;
  branchName: string;
  state: string;
  city: string;
  pincode: string;
  gstin: string;
  gstRegistrationDate: string;
  address: string;
  latitude: string;
  longitude: string;
  stdCode: string;
  telNo: string;
  faxNo: string;
  phone: string;
  email: string;
  regionBranch: string;
  esicCode: string;
  isActive: boolean;
  branchSealName: string;
};

const emptyBranchForm = (): BranchForm => ({
  locationHierarchy: "",
  branchCode: "",
  branchName: "",
  state: "",
  city: "",
  pincode: "",
  gstin: "",
  gstRegistrationDate: new Date().toISOString().slice(0, 10),
  address: "",
  latitude: "",
  longitude: "",
  stdCode: "",
  telNo: "",
  faxNo: "",
  phone: "",
  email: "",
  regionBranch: "",
  esicCode: "",
  isActive: true,
  branchSealName: ""
});

function locationLabel(b: any) {
  const name = b.branchName || "Location";
  const code = b.branchCode || "";
  return code ? `${name} - ${code}` : name;
}

export default function CompanyStructureAdminHubPage() {
  const [activeModule, setActiveModule] = useState<"hub" | "branch" | "employee" | "route" | "email">("hub");

  const [branches, setBranches] = useState<any[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchFeedback, setBranchFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState<BranchForm>(emptyBranchForm());
  const [branchSearch, setBranchSearch] = useState("");
  const [branchPageSize, setBranchPageSize] = useState(10);
  const [branchPage, setBranchPage] = useState(1);

  const loadBranches = () => {
    setBranchLoading(true);
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBranches(d.data || []);
      })
      .catch(() => setBranchFeedback({ type: "error", message: "Failed to load branches." }))
      .finally(() => setBranchLoading(false));
  };

  useEffect(() => {
    if (activeModule === "branch") loadBranches();
  }, [activeModule]);

  const filteredBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) =>
      [locationLabel(b), b.state, b.gstin, b.address, b.city, b.branchCode]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [branches, branchSearch]);

  const totalBranchPages = Math.max(1, Math.ceil(filteredBranches.length / branchPageSize));
  const pagedBranches = filteredBranches.slice(
    (branchPage - 1) * branchPageSize,
    branchPage * branchPageSize
  );

  const openAddBranch = () => {
    setBranchForm(emptyBranchForm());
    setBranchFeedback(null);
    setShowBranchForm(true);
  };

  const openEditBranch = (b: any) => {
    setBranchForm({
      _id: b._id,
      locationHierarchy: b.locationHierarchy || (b.isHub ? "HUB" : "BRANCH"),
      branchCode: b.branchCode || "",
      branchName: b.branchName || "",
      state: b.state || "",
      city: b.city || "",
      pincode: b.pincode || "",
      gstin: b.gstin || "",
      gstRegistrationDate: b.gstRegistrationDate
        ? new Date(b.gstRegistrationDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      address: b.address || "",
      latitude: b.latitude || "",
      longitude: b.longitude || "",
      stdCode: b.stdCode || "",
      telNo: b.telNo || "",
      faxNo: b.faxNo || "",
      phone: b.phone || "",
      email: b.email || "",
      regionBranch: b.regionBranch || "",
      esicCode: b.esicCode || "",
      isActive: b.isActive !== false,
      branchSealName: b.branchSealUrl ? "Current seal on file" : ""
    });
    setBranchFeedback(null);
    setShowBranchForm(true);
  };

  const saveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.locationHierarchy) {
      setBranchFeedback({ type: "error", message: "Location Hierarchy is required." });
      return;
    }
    if (!branchForm.branchCode.trim() || !branchForm.branchName.trim()) {
      setBranchFeedback({ type: "error", message: "Location Code and Location Name are required." });
      return;
    }
    setBranchSaving(true);
    setBranchFeedback(null);
    try {
      const method = branchForm._id ? "PUT" : "POST";
      const res = await fetch("/api/branches", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...branchForm,
          locationName: branchForm.branchName,
          gstNo: branchForm.gstin,
          pinCode: branchForm.pincode,
          mobileNo: branchForm.phone,
          emailId: branchForm.email,
          branchActive: branchForm.isActive
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBranchFeedback({
          type: "success",
          message: branchForm._id ? "Location updated successfully." : "Location saved successfully."
        });
        setShowBranchForm(false);
        setBranchForm(emptyBranchForm());
        loadBranches();
      } else {
        setBranchFeedback({ type: "error", message: data.error || "Failed to save location." });
      }
    } catch {
      setBranchFeedback({ type: "error", message: "Network error while saving location." });
    } finally {
      setBranchSaving(false);
    }
  };

  if (activeModule === "employee") {
    return <EmployeeMasterPanel onBack={() => setActiveModule("hub")} />;
  }

  if (activeModule === "route") {
    return <RouteMasterPanel onBack={() => setActiveModule("hub")} />;
  }

  if (activeModule === "email") {
    return <EmailConfigPanel onBack={() => setActiveModule("hub")} />;
  }

  if (activeModule === "branch") {
    return (
      <div className="space-y-4 max-w-7xl mx-auto pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <WcvRibbonHeader title="Branch Master" />
            <p className="text-xs text-slate-500 mt-1">Location Master · Manage office, branch &amp; corporate location details</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveModule("hub");
              setShowBranchForm(false);
              setBranchFeedback(null);
            }}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
          >
            ← Company Structure
          </button>
        </div>

        {branchFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              branchFeedback.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {branchFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {branchFeedback.message}
          </div>
        )}

        {showBranchForm ? (
          <form onSubmit={saveBranch} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {branchForm._id ? "Edit Location" : "Add Location"}
                </h3>
                <p className="text-[11px] text-slate-500">Fields marked with * are recommended.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBranchForm(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6 text-xs">
              <section className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Location Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Location Hierarchy <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={branchForm.locationHierarchy}
                      onChange={(e) => setBranchForm({ ...branchForm, locationHierarchy: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">--Select--</option>
                      {HIERARCHY_OPTIONS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Location Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={branchForm.branchCode}
                      onChange={(e) =>
                        setBranchForm({ ...branchForm, branchCode: e.target.value.toUpperCase().replace(/\s/g, "") })
                      }
                      placeholder="e.g., BR01"
                      disabled={!!branchForm._id}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Location Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={branchForm.branchName}
                      onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })}
                      placeholder="Full location name"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State</label>
                    <select
                      value={branchForm.state}
                      onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">--Select--</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      value={branchForm.city}
                      onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                      placeholder="City name"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pin Code</label>
                    <input
                      value={branchForm.pincode}
                      onChange={(e) =>
                        setBranchForm({ ...branchForm, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })
                      }
                      placeholder="Postal code"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">GST No</label>
                    <input
                      value={branchForm.gstin}
                      onChange={(e) => setBranchForm({ ...branchForm, gstin: e.target.value.toUpperCase() })}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">GST Registration Date</label>
                    <input
                      type="date"
                      value={branchForm.gstRegistrationDate}
                      onChange={(e) => setBranchForm({ ...branchForm, gstRegistrationDate: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block font-semibold text-slate-700 mb-1">Address</label>
                    <textarea
                      rows={2}
                      value={branchForm.address}
                      onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                      placeholder="Street, area, landmark"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
                    <input
                      value={branchForm.latitude}
                      onChange={(e) => setBranchForm({ ...branchForm, latitude: e.target.value })}
                      placeholder="e.g., 28.6139"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
                    <input
                      value={branchForm.longitude}
                      onChange={(e) => setBranchForm({ ...branchForm, longitude: e.target.value })}
                      placeholder="e.g., 77.2090"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="h-9 px-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg font-semibold"
                      onClick={() =>
                        setBranchFeedback({
                          type: "success",
                          message: "Polygon map drawing is available once map integration is configured."
                        })
                      }
                    >
                      Draw Polygon Map
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">STD Code</label>
                    <input
                      value={branchForm.stdCode}
                      onChange={(e) => setBranchForm({ ...branchForm, stdCode: e.target.value })}
                      placeholder="STD code"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tel. No.</label>
                    <input
                      value={branchForm.telNo}
                      onChange={(e) => setBranchForm({ ...branchForm, telNo: e.target.value })}
                      placeholder="Landline number"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fax No.</label>
                    <input
                      value={branchForm.faxNo}
                      onChange={(e) => setBranchForm({ ...branchForm, faxNo: e.target.value })}
                      placeholder="Fax"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile No.</label>
                    <input
                      value={branchForm.phone}
                      onChange={(e) =>
                        setBranchForm({ ...branchForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                      }
                      placeholder="Mobile number"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Id</label>
                    <input
                      type="email"
                      value={branchForm.email}
                      onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                      placeholder="branch@company.com"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Branch Seal</label>
                    <label className="flex items-center gap-2 h-9 px-3 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                      <span className="text-slate-500 truncate flex-1">
                        {branchForm.branchSealName || "No file chosen"}
                      </span>
                      <span className="font-semibold text-blue-700 shrink-0">Choose Seal</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) =>
                          setBranchForm({
                            ...branchForm,
                            branchSealName: e.target.files?.[0]?.name || ""
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Other Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Region Branch</label>
                    <select
                      value={branchForm.regionBranch}
                      onChange={(e) => setBranchForm({ ...branchForm, regionBranch: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">--Select--</option>
                      {branches.map((b) => (
                        <option key={b._id || b.branchCode} value={b.branchCode}>
                          {locationLabel(b)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ESIC Code</label>
                    <input
                      value={branchForm.esicCode}
                      onChange={(e) => setBranchForm({ ...branchForm, esicCode: e.target.value })}
                      placeholder="ESIC registration number"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 h-9 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={branchForm.isActive}
                        onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      Branch Active (Yes)
                    </label>
                  </div>
                </div>
              </section>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowBranchForm(false)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={branchSaving}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {branchSaving ? "Saving..." : "Save Location"}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 text-white"
              >
                Branch Master
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={loadBranches}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  title="Refresh"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  title="Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={openAddBranch}
                  className="p-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  title="Add Location"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  title="Export"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <label className="text-slate-600">
                Show{" "}
                <select
                  value={branchPageSize}
                  onChange={(e) => {
                    setBranchPageSize(Number(e.target.value));
                    setBranchPage(1);
                  }}
                  className="mx-1 h-8 px-2 border border-slate-200 rounded-md"
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>{" "}
                entries
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Search:</span>
                <input
                  value={branchSearch}
                  onChange={(e) => {
                    setBranchSearch(e.target.value);
                    setBranchPage(1);
                  }}
                  className="h-8 w-full sm:w-52 px-2.5 border border-slate-200 rounded-md"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">State Name</th>
                    <th className="py-2.5 px-3">Gst No</th>
                    <th className="py-2.5 px-3">Address</th>
                    <th className="py-2.5 px-3">Active</th>
                    <th className="py-2.5 px-3">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branchLoading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Loading locations...
                      </td>
                    </tr>
                  ) : pagedBranches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No locations found. Click + to add one.
                      </td>
                    </tr>
                  ) : (
                    pagedBranches.map((b) => (
                      <tr key={b._id || b.branchCode} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{locationLabel(b)}</td>
                        <td className="py-2.5 px-3 text-slate-600">{b.state || "-"}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{b.gstin || "-"}</td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={b.address || ""}>
                          {b.address || "-"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-semibold ${
                              b.isActive !== false ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            {b.isActive !== false ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => openEditBranch(b)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-600 hover:bg-blue-700 text-white"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing{" "}
                {(branchPage - 1) * branchPageSize + (filteredBranches.length ? 1 : 0)} to{" "}
                {Math.min(branchPage * branchPageSize, filteredBranches.length)} of {filteredBranches.length} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={branchPage <= 1}
                  onClick={() => setBranchPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold">{branchPage}</span>
                <button
                  type="button"
                  disabled={branchPage >= totalBranchPages}
                  onClick={() => setBranchPage((p) => Math.min(totalBranchPages, p + 1))}
                  className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Company Structure" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Branch Master"
          description="Branch Master"
          onClick={() => setActiveModule("branch")}
          icon={Building2}
        />
        <WcvActionCard
          title="Employee Master"
          description="Employee Master"
          onClick={() => setActiveModule("employee")}
          icon={Users2}
        />
        <WcvActionCard
          title="Route Master"
          description="Destination Master"
          onClick={() => setActiveModule("route")}
          icon={MapPin}
        />
        <WcvActionCard
          title="E-Mail Configuration"
          description="E-Mail Configuration"
          onClick={() => setActiveModule("email")}
          icon={Mail}
        />
      </div>
    </div>
  );
}
