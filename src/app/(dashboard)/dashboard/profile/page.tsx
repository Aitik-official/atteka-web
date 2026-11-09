"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, RotateCcw, Save } from "lucide-react";
import { toast } from "@/lib/toastBus";

type ProfileForm = {
  _id?: string;
  employeeCode: string;
  employeePref: string;
  employeeName: string;
  gender: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  dateOfBirth: string;
  qualification: string;
  designation: string;
  activeFlag: string;
  empStatus: string;
  residentialAddress: string;
  personalEmailId: string;
  residentPhoneNo: string;
  mobileNo: string;
  additionalMobileNo: string;
  companyEmailId: string;
  emailPassword: string;
  defaultPage: string;
};

const PREFS = ["Mr", "Mrs", "Miss", "Ms", "Dr"];
const GENDERS = ["Male", "FeMale", "Female", "Other"];
const DEFAULT_PAGES = ["Accounts", "Operations", "CRM", "Finance", "Reports", "Admin", "Dashboard"];

function emptyForm(): ProfileForm {
  return {
    employeeCode: "",
    employeePref: "Miss",
    employeeName: "",
    gender: "FeMale",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    dateOfBirth: "",
    qualification: "",
    designation: "",
    activeFlag: "Y",
    empStatus: "",
    residentialAddress: "",
    personalEmailId: "",
    residentPhoneNo: "",
    mobileNo: "",
    additionalMobileNo: "",
    companyEmailId: "",
    emailPassword: "",
    defaultPage: "Accounts"
  };
}

function toDateInput(value?: string | Date) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    // already DD/MM/YYYY or YYYY-MM-DD
    const m = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) return String(value).slice(0, 10);
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Field({
  label,
  children,
  className = ""
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`relative block ${className}`}>
      <span className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-slate-600 z-10">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full h-10 px-3 pt-1 text-xs border border-[#7aa7d9] rounded-md focus:outline-none focus:border-[#5b7cfa] focus:ring-1 focus:ring-blue-200 bg-white text-slate-800";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(emptyForm());
  const [initial, setInitial] = useState<ProfileForm>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      const list = data.data || [];
      const me =
        list.find((e: any) => String(e.employeeCode || "").toUpperCase() === "AL002") || list[0];
      if (!me) {
        setFeedback({ type: "error", message: "Employee profile not found." });
        return;
      }
      const next: ProfileForm = {
        _id: me._id,
        employeeCode: me.employeeCode || "AL002",
        employeePref: me.employeePref || "Miss",
        employeeName: me.employeeName || "",
        gender: me.gender || "FeMale",
        oldPassword: me.password ? "********" : "",
        newPassword: "",
        confirmPassword: "",
        dateOfBirth: toDateInput(me.dateOfBirth),
        qualification: me.qualification || "",
        designation: me.designation || "",
        activeFlag: me.isActive === false ? "N" : "Y",
        empStatus: me.empStatus || "",
        residentialAddress: me.residentialAddress || "",
        personalEmailId: me.email || "",
        residentPhoneNo: me.residentPhoneNo || "",
        mobileNo: me.mobileNo || "",
        additionalMobileNo: me.additionalMobileNo || "",
        companyEmailId: me.companyEmailId || "",
        emailPassword: me.emailPassword || "",
        defaultPage: me.defaultPage || "Accounts"
      };
      setForm(next);
      setInitial(next);
    } catch {
      setFeedback({ type: "error", message: "Failed to load profile." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (patch: Partial<ProfileForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const canSubmit = useMemo(() => {
    if (!form.employeeCode || !form.employeeName) return false;
    if (form.newPassword && form.newPassword !== form.confirmPassword) return false;
    return true;
  }, [form]);

  const reset = () => {
    setForm({ ...initial, newPassword: "", confirmPassword: "" });
    setFeedback(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setFeedback({ type: "error", message: "New Password and Confirm Password do not match." });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        _id: form._id,
        employeeCode: form.employeeCode,
        employeePref: form.employeePref,
        employeeName: form.employeeName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        qualification: form.qualification,
        designation: form.designation,
        isActive: form.activeFlag.toUpperCase() !== "N",
        empStatus: form.empStatus,
        residentialAddress: form.residentialAddress,
        email: form.personalEmailId,
        residentPhoneNo: form.residentPhoneNo,
        mobileNo: form.mobileNo,
        additionalMobileNo: form.additionalMobileNo,
        companyEmailId: form.companyEmailId,
        emailPassword: form.emailPassword || undefined,
        defaultPage: form.defaultPage
      };
      if (form.newPassword.trim()) {
        payload.password = form.newPassword.trim();
      }

      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: "Employee profile updated successfully." });
        toast.success("Employee profile updated successfully.");
        await load();
      } else {
        const msg = data.error || "Failed to update profile.";
        setFeedback({ type: "error", message: msg });
        toast.error(msg);
      }
    } catch {
      const msg = "Network error while saving profile.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-4">
      <div className="rounded-xl overflow-hidden shadow-sm border border-indigo-200/60">
        <div className="bg-gradient-to-r from-[#6b4ce6] via-[#5b6bf0] to-[#4f7cf5] px-4 py-3 flex items-center gap-3 text-white">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm sm:text-base font-bold tracking-wide">Employee Profile Information</h1>
        </div>

        <form onSubmit={submit} className="bg-white p-4 sm:p-6 space-y-6">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {feedback.message}
            </div>
          )}

          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">Loading profile...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Employee Code">
                  <input
                    readOnly
                    value={form.employeeCode}
                    className={`${inputCls} bg-slate-50 font-mono font-bold`}
                  />
                </Field>
                <Field label="Employee Pref">
                  <select
                    value={form.employeePref}
                    onChange={(e) => set({ employeePref: e.target.value })}
                    className={inputCls}
                  >
                    {PREFS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Employee Name">
                  <input
                    value={form.employeeName}
                    onChange={(e) => set({ employeeName: e.target.value.toUpperCase() })}
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="Gender">
                  <select
                    value={form.gender}
                    onChange={(e) => set({ gender: e.target.value })}
                    className={inputCls}
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Old Password">
                  <input
                    type="password"
                    value={form.oldPassword}
                    readOnly
                    className={`${inputCls} bg-slate-50`}
                  />
                </Field>
                <Field label="New Password">
                  <input
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => set({ newPassword: e.target.value })}
                    className={inputCls}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm Password">
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => set({ confirmPassword: e.target.value })}
                    className={inputCls}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Date of Birth">
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => set({ dateOfBirth: e.target.value })}
                    className={inputCls}
                  />
                </Field>

                <Field label="Qualification">
                  <input
                    value={form.qualification}
                    onChange={(e) => set({ qualification: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Designation">
                  <input
                    value={form.designation}
                    onChange={(e) => set({ designation: e.target.value.toUpperCase() })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Active Flag">
                  <input
                    value={form.activeFlag}
                    onChange={(e) => set({ activeFlag: e.target.value.toUpperCase().slice(0, 1) })}
                    className={inputCls}
                    maxLength={1}
                  />
                </Field>
                <Field label="Employee Status">
                  <input
                    value={form.empStatus}
                    onChange={(e) => set({ empStatus: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h2 className="text-sm font-bold">Personal Contact Information...</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label="Residential Address">
                    <input
                      value={form.residentialAddress}
                      onChange={(e) => set({ residentialAddress: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Personal Email ID">
                    <input
                      type="email"
                      value={form.personalEmailId}
                      onChange={(e) => set({ personalEmailId: e.target.value.toUpperCase() })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Resident Phone No.">
                    <input
                      value={form.residentPhoneNo}
                      onChange={(e) => set({ residentPhoneNo: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Mobile No">
                    <input
                      value={form.mobileNo}
                      onChange={(e) => set({ mobileNo: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Additional Mobile No">
                    <input
                      value={form.additionalMobileNo}
                      onChange={(e) => set({ additionalMobileNo: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Company Email ID">
                    <input
                      type="email"
                      value={form.companyEmailId}
                      onChange={(e) => set({ companyEmailId: e.target.value.toUpperCase() })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email Password">
                    <input
                      type="password"
                      value={form.emailPassword}
                      onChange={(e) => set({ emailPassword: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Default Page">
                    <select
                      value={form.defaultPage}
                      onChange={(e) => set({ defaultPage: e.target.value })}
                      className={inputCls}
                    >
                      {DEFAULT_PAGES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving || !canSubmit}
                  className="min-w-[110px] px-6 py-2 rounded-full border-2 border-[#5b7cfa] text-[#5b7cfa] font-bold text-sm hover:bg-blue-50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="min-w-[110px] px-6 py-2 rounded-full border-2 border-[#5b7cfa] text-[#5b7cfa] font-bold text-sm hover:bg-blue-50 inline-flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
