"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Settings,
  X
} from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";

type EmployeeForm = {
  _id?: string;
  employeeCode: string;
  employeePref: string;
  employeeName: string;
  password: string;
  gender: string;
  dateOfBirth: string;
  empStatus: string;
  qualification: string;
  designation: string;
  isActive: boolean;
  languageKnown: string;
  managerId: string;
  currentLocationCode: string;
  dateStartingCurrentLocation: string;
  dateOfJoining: string;
  dateOfLeaving: string;
  accessLocationCodes: string[];
  residentialAddress: string;
  email: string;
  residentPhoneNo: string;
  mobileNo: string;
  additionalMobileNo: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): EmployeeForm => ({
  employeeCode: "",
  employeePref: "",
  employeeName: "",
  password: "",
  gender: "",
  dateOfBirth: today(),
  empStatus: "",
  qualification: "",
  designation: "",
  isActive: true,
  languageKnown: "English",
  managerId: "",
  currentLocationCode: "",
  dateStartingCurrentLocation: today(),
  dateOfJoining: today(),
  dateOfLeaving: "",
  accessLocationCodes: [],
  residentialAddress: "",
  email: "",
  residentPhoneNo: "",
  mobileNo: "",
  additionalMobileNo: ""
});

function formatDob(value?: string | Date) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toInputDate(value?: string | Date) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

const PREFS = ["Mr", "Ms", "Mrs", "Dr"];
const GENDERS = ["Male", "Female", "Other"];
const EMP_STATUSES = ["ACTIVE", "PROBATION", "ON_LEAVE", "RESIGNED", "TERMINATED"];
const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu", "Kannada", "Bengali"];

type Props = {
  onBack: () => void;
};

export function EmployeeMasterPanel({ onBack }: Props) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(emptyForm());
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const loadEmployees = () => {
    setLoading(true);
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEmployees(d.data || []);
      })
      .catch(() => setFeedback({ type: "error", message: "Failed to load employees." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmployees();
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBranches(d.data || []);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [
        e.employeeCode,
        e.employeeName,
        e.currentLocationCode,
        e.managerName,
        e.email,
        e.designation,
        e.mobileNo
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [employees, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const nextCodeSuggestion = useMemo(() => {
    const nums = employees
      .map((e) => String(e.employeeCode || "").match(/^AL(\d+)$/i)?.[1])
      .filter(Boolean)
      .map((n) => Number(n));
    const next = (nums.length ? Math.max(...nums) : 1) + 1;
    return `AL${String(next).padStart(3, "0")}`;
  }, [employees]);

  const openAdd = () => {
    setForm({ ...emptyForm(), employeeCode: nextCodeSuggestion });
    setFeedback(null);
    setShowForm(true);
  };

  const openEdit = (e: any) => {
    setForm({
      _id: e._id,
      employeeCode: e.employeeCode || "",
      employeePref: e.employeePref || "",
      employeeName: e.employeeName || "",
      password: "",
      gender: e.gender || "",
      dateOfBirth: toInputDate(e.dateOfBirth) || today(),
      empStatus: e.empStatus || "ACTIVE",
      qualification: e.qualification || "",
      designation: e.designation || "",
      isActive: e.isActive !== false,
      languageKnown: e.languageKnown || "English",
      managerId: e.managerId || "",
      currentLocationCode: e.currentLocationCode || "",
      dateStartingCurrentLocation: toInputDate(e.dateStartingCurrentLocation) || today(),
      dateOfJoining: toInputDate(e.dateOfJoining) || today(),
      dateOfLeaving: toInputDate(e.dateOfLeaving),
      accessLocationCodes: Array.isArray(e.accessLocationCodes)
        ? e.accessLocationCodes
        : e.currentLocationCode
          ? [e.currentLocationCode]
          : [],
      residentialAddress: e.residentialAddress || "",
      email: e.email || "",
      residentPhoneNo: e.residentPhoneNo || "",
      mobileNo: e.mobileNo || "",
      additionalMobileNo: e.additionalMobileNo || ""
    });
    setFeedback(null);
    setShowForm(true);
  };

  const toggleAccess = (code: string) => {
    setForm((prev) => {
      const has = prev.accessLocationCodes.includes(code);
      return {
        ...prev,
        accessLocationCodes: has
          ? prev.accessLocationCodes.filter((c) => c !== code)
          : [...prev.accessLocationCodes, code]
      };
    });
  };

  const saveEmployee = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.employeeCode.trim() || !form.employeeName.trim()) {
      setFeedback({ type: "error", message: "Employee Code and Employee Name are required." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const manager = employees.find((e) => e.employeeCode === form.managerId);
      const method = form._id ? "PUT" : "POST";
      const res = await fetch("/api/employees", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          managerName: manager?.employeeName || "",
          emailId: form.email,
          locationAccess: form.accessLocationCodes,
          employeeActive: form.isActive
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: form._id ? "Employee updated successfully." : "Employee saved successfully."
        });
        setShowForm(false);
        setForm(emptyForm());
        loadEmployees();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to save employee." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error while saving employee." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Employee Master" />
          <p className="text-xs text-slate-500 mt-1">Manage staff directory, access locations &amp; reporting</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          ← Company Structure
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {showForm ? (
        <form onSubmit={saveEmployee} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {form._id ? "Edit Employee" : "Add New Employee"}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-6 text-xs">
            <section className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Employee Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Code</label>
                  <input
                    required
                    value={form.employeeCode}
                    onChange={(e) =>
                      setForm({ ...form, employeeCode: e.target.value.toUpperCase().replace(/\s/g, "") })
                    }
                    disabled={!!form._id}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Pref</label>
                  <select
                    value={form.employeePref}
                    onChange={(e) => setForm({ ...form, employeePref: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">-Select-</option>
                    {PREFS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Name</label>
                  <input
                    required
                    value={form.employeeName}
                    onChange={(e) => setForm({ ...form, employeeName: e.target.value.toUpperCase() })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={form._id ? "Leave blank to keep" : ""}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">--select--</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emp. Status</label>
                  <select
                    value={form.empStatus}
                    onChange={(e) => setForm({ ...form, empStatus: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">-Select-</option>
                    {EMP_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value.toUpperCase() })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 h-9 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    Employee Active (Yes)
                  </label>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Language known</label>
                  <select
                    value={form.languageKnown}
                    onChange={(e) => setForm({ ...form, languageKnown: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manager ID</label>
                  <select
                    value={form.managerId}
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">-Select-</option>
                    {employees
                      .filter((e) => e.employeeCode !== form.employeeCode)
                      .map((e) => (
                        <option key={e.employeeCode} value={e.employeeCode}>
                          {e.employeeCode} — {e.employeeName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Employee Location Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Location Code</label>
                  <select
                    value={form.currentLocationCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        currentLocationCode: code,
                        accessLocationCodes: prev.accessLocationCodes.includes(code)
                          ? prev.accessLocationCodes
                          : code
                            ? [...prev.accessLocationCodes, code]
                            : prev.accessLocationCodes
                      }));
                    }}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">--Select--</option>
                    {branches.map((b) => (
                      <option key={b._id || b.branchCode} value={b.branchCode}>
                        {b.branchCode} — {b.branchName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date of starting at Current Location
                  </label>
                  <input
                    type="date"
                    value={form.dateStartingCurrentLocation}
                    onChange={(e) => setForm({ ...form, dateStartingCurrentLocation: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Joining the organization</label>
                  <input
                    type="date"
                    value={form.dateOfJoining}
                    onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of leaving organization</label>
                  <input
                    type="date"
                    value={form.dateOfLeaving}
                    onChange={(e) => setForm({ ...form, dateOfLeaving: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Location Access</label>
                  <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
                    {branches.length === 0 ? (
                      <span className="text-slate-400">No branches in master — add locations first.</span>
                    ) : (
                      branches.map((b) => {
                        const checked = form.accessLocationCodes.includes(b.branchCode);
                        return (
                          <label
                            key={b.branchCode}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer ${
                              checked
                                ? "bg-blue-50 border-blue-300 text-blue-800 font-semibold"
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAccess(b.branchCode)}
                              className="rounded border-slate-300 text-blue-600"
                            />
                            {b.branchCode}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Employee Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                  <textarea
                    rows={2}
                    value={form.residentialAddress}
                    onChange={(e) => setForm({ ...form, residentialAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email ID</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Resident Phone No.</label>
                  <input
                    value={form.residentPhoneNo}
                    onChange={(e) => setForm({ ...form, residentPhoneNo: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile No</label>
                  <input
                    value={form.mobileNo}
                    onChange={(e) =>
                      setForm({ ...form, mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10) })
                    }
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Additional Mobile No</label>
                  <input
                    value={form.additionalMobileNo}
                    onChange={(e) =>
                      setForm({ ...form, additionalMobileNo: e.target.value.replace(/\D/g, "").slice(0, 10) })
                    }
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Employee"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 text-white">
              Employee Master
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={loadEmployees}
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
                onClick={openAdd}
                className="p-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                title="Add Employee"
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
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
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
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-full sm:w-52 px-2.5 border border-slate-200 rounded-md"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Employee Code</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Current Location</th>
                  <th className="py-2.5 px-3">Access Location</th>
                  <th className="py-2.5 px-3">Reporting</th>
                  <th className="py-2.5 px-3">Dob</th>
                  <th className="py-2.5 px-3">Mob No</th>
                  <th className="py-2.5 px-3">Email ID</th>
                  <th className="py-2.5 px-3">Degination</th>
                  <th className="py-2.5 px-3">Active</th>
                  <th className="py-2.5 px-3">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400">
                      Loading employees...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400">
                      No employees found. Click + to add one.
                    </td>
                  </tr>
                ) : (
                  paged.map((e) => (
                    <tr key={e._id || e.employeeCode} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{e.employeeCode}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{e.employeeName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{e.currentLocationCode || "-"}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {(e.accessLocationCodes || []).join(", ") || e.currentLocationCode || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{e.managerName || "-"}</td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{formatDob(e.dateOfBirth)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{e.mobileNo || ""}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate" title={e.email || ""}>
                        {e.email || ""}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{e.designation || ""}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-semibold ${e.isActive !== false ? "text-emerald-700" : "text-rose-600"}`}>
                          {e.isActive !== false ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => openEdit(e)}
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
              Showing {(page - 1) * pageSize + (filtered.length ? 1 : 0)} to{" "}
              {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold">{page}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
