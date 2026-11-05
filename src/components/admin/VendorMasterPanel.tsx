"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Gavel,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Settings,
  X
} from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { exportToCsv, stampFilename } from "@/lib/exportCsv";

const VENDOR_TYPES = ["OWN Company vehicle", "MARKET", "OTHERS", "ATTACHED", "COURIER", "MAINTENANCE"];
const MSME_TYPES = ["Micro", "Small", "Medium"];

type VendorForm = {
  _id?: string;
  vendorCode: string;
  gstNo: string;
  pan: string;
  name: string;
  vendorType: string;
  address: string;
  password: string;
  vendorRating: string;
  smsAlert: boolean;
  whatsappAlert: boolean;
  emailAlert: boolean;
  locationName: string;
  contactPerson: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  accountNo: string;
  ifscCode: string;
  bankName: string;
  bankAccountName: string;
  bankBeneficiary: string;
  autoPay: boolean;
  sec194c6Received: boolean;
  tdsApplicable: boolean;
  cancelledChequeCopy: string;
  panDeclarationCopy: string;
  msmeApplicable: boolean;
  msmeNo: string;
  msmeType: string;
  remark: string;
  isActive: boolean;
};

const emptyForm = (): VendorForm => ({
  vendorCode: "AUTO",
  gstNo: "",
  pan: "",
  name: "",
  vendorType: "",
  address: "",
  password: "",
  vendorRating: "1",
  smsAlert: true,
  whatsappAlert: true,
  emailAlert: true,
  locationName: "",
  contactPerson: "",
  city: "",
  pincode: "",
  phone: "",
  email: "",
  accountNo: "",
  ifscCode: "",
  bankName: "",
  bankAccountName: "",
  bankBeneficiary: "",
  autoPay: true,
  sec194c6Received: true,
  tdsApplicable: true,
  cancelledChequeCopy: "",
  panDeclarationCopy: "",
  msmeApplicable: true,
  msmeNo: "",
  msmeType: "Micro",
  remark: "",
  isActive: true
});

type Props = {
  onBack: () => void;
};

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-300 text-blue-600"
      />
      {label} ({checked ? "Yes" : "No"})
    </label>
  );
}

export function VendorMasterPanel({ onBack }: Props) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<VendorForm>(emptyForm());
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [accountHint, setAccountHint] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/vendors").then((r) => r.json()).catch(() => ({})),
      fetch("/api/branches").then((r) => r.json()).catch(() => ({}))
    ])
      .then(([vRes, bRes]) => {
        if (vRes.success) setVendors(vRes.data || []);
        if (bRes.success) setBranches(bRes.data || []);
      })
      .catch(() => setFeedback({ type: "error", message: "Failed to load vendors." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const acc = form.accountNo.replace(/\s/g, "");
    if (!acc) {
      setAccountHint("");
      return;
    }
    if (!/^\d{9,18}$/.test(acc)) {
      setAccountHint("Account number should be 9–18 digits");
    } else {
      setAccountHint("Account number looks valid");
    }
  }, [form.accountNo]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) =>
      [v.vendorCode, v.name, v.pan, v.gstNo, v.bankName, v.phone, v.vendorType]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [vendors, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setForm(emptyForm());
    setFeedback(null);
    setShowForm(true);
  };

  const openEdit = (v: any) => {
    setForm({
      _id: v._id,
      vendorCode: v.vendorCode || "AUTO",
      gstNo: v.gstNo || "",
      pan: v.pan || "",
      name: v.name || "",
      vendorType: v.vendorType || "",
      address: v.address || "",
      password: "",
      vendorRating: String(v.vendorRating ?? 1),
      smsAlert: v.smsAlert !== false,
      whatsappAlert: v.whatsappAlert !== false,
      emailAlert: v.emailAlert !== false,
      locationName: v.locationName || "",
      contactPerson: v.contactPerson || "",
      city: v.city || "",
      pincode: v.pincode || "",
      phone: v.phone || "",
      email: v.email || "",
      accountNo: v.accountNo || "",
      ifscCode: v.ifscCode || "",
      bankName: v.bankName || "",
      bankAccountName: v.bankAccountName || "",
      bankBeneficiary: v.bankBeneficiary || "",
      autoPay: v.autoPay !== false,
      sec194c6Received: v.sec194c6Received !== false,
      tdsApplicable: v.tdsApplicable !== false,
      cancelledChequeCopy: v.cancelledChequeCopy || "",
      panDeclarationCopy: v.panDeclarationCopy || "",
      msmeApplicable: v.msmeApplicable !== false,
      msmeNo: v.msmeNo || "",
      msmeType: v.msmeType || "Micro",
      remark: v.remark || "",
      isActive: v.isActive !== false
    });
    setFeedback(null);
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFeedback({ type: "error", message: "Vendor Name is required." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const method = form._id ? "PUT" : "POST";
      const res = await fetch("/api/vendors", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vendorName: form.name,
          panNo: form.pan,
          mobile: form.phone,
          emailId: form.email,
          pinCode: form.pincode,
          vendorNameBank: form.bankAccountName,
          beneficiary: form.bankBeneficiary,
          vendorRating: Number(form.vendorRating) || 1,
          active: form.isActive
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: form._id ? "Vendor updated successfully." : "Vendor saved successfully."
        });
        setShowForm(false);
        setForm(emptyForm());
        load();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to save vendor." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error while saving vendor." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Vendor Master" />
          <p className="text-xs text-slate-500 mt-1">Manage vendor details, GST, bank &amp; TDS declarations</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          ← Business Partners
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
        <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{form._id ? "Edit Vendor" : "Add Vendor"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-6 text-xs">
            <section className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Vendor Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor Code</label>
                  <input
                    readOnly
                    value={form._id ? form.vendorCode : "AUTO"}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST No</label>
                  <input
                    value={form.gstNo}
                    onChange={(e) => setForm({ ...form, gstNo: e.target.value.toUpperCase() })}
                    placeholder="27AAACR1234R1Z6"
                    maxLength={15}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PAN No.</label>
                  <input
                    value={form.pan}
                    onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                    placeholder="AAAAA1234A"
                    maxLength={10}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                    placeholder="Enter registered vendor name"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor Type</label>
                  <select
                    value={form.vendorType}
                    onChange={(e) => setForm({ ...form, vendorType: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Select Vendor Type</option>
                    {VENDOR_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street, area, city, landmark"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="********"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor Rating</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.vendorRating}
                    onChange={(e) => setForm({ ...form, vendorRating: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                  <div className="font-semibold text-slate-700">Alert Preferences</div>
                  <div className="flex flex-wrap gap-4">
                    <Toggle checked={form.smsAlert} onChange={(v) => setForm({ ...form, smsAlert: v })} label="SMS Alert" />
                    <Toggle
                      checked={form.whatsappAlert}
                      onChange={(v) => setForm({ ...form, whatsappAlert: v })}
                      label="WhatsApp Alert"
                    />
                    <Toggle checked={form.emailAlert} onChange={(v) => setForm({ ...form, emailAlert: v })} label="Email Alert" />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Location &amp; Contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location Name</label>
                  <select
                    value={form.locationName}
                    onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Select Location</option>
                    {branches.map((b) => (
                      <option key={b._id || b.branchCode} value={`${b.branchName || ""} - ${b.branchCode}`}>
                        {b.branchName || "Location"} - {b.branchCode}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Full name"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pin Code</label>
                  <input
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="6-digit"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    placeholder="9876543210"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Id</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="vendor@example.com"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Bank Details &amp; TDS Declaration
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account No</label>
                  <input
                    value={form.accountNo}
                    onChange={(e) => setForm({ ...form, accountNo: e.target.value })}
                    placeholder="XXXXXXXXXX1234"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                  {accountHint && (
                    <p className={`text-[10px] mt-0.5 ${accountHint.includes("valid") ? "text-emerald-600" : "text-amber-600"}`}>
                      {accountHint}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    value={form.ifscCode}
                    onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="SBIN0001234"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value.toUpperCase() })}
                    placeholder="State Bank of India"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor Name (Bank Account)</label>
                  <input
                    value={form.bankAccountName}
                    onChange={(e) => setForm({ ...form, bankAccountName: e.target.value.toUpperCase() })}
                    placeholder="As per bank records"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Beneficiary</label>
                  <input
                    value={form.bankBeneficiary}
                    onChange={(e) => setForm({ ...form, bankBeneficiary: e.target.value })}
                    placeholder="Beneficiary"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-4">
                  <Toggle checked={form.autoPay} onChange={(v) => setForm({ ...form, autoPay: v })} label="Auto Pay" />
                  <Toggle
                    checked={form.sec194c6Received}
                    onChange={(v) => setForm({ ...form, sec194c6Received: v })}
                    label="Sec 194C(6) Received"
                  />
                  <Toggle
                    checked={form.tdsApplicable}
                    onChange={(v) => setForm({ ...form, tdsApplicable: v })}
                    label="TDS Applicable"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cancelled Cheque Copy</label>
                  <input
                    value={form.cancelledChequeCopy}
                    onChange={(e) => setForm({ ...form, cancelledChequeCopy: e.target.value })}
                    placeholder="File reference"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pan Declaration Copy</label>
                  <input
                    value={form.panDeclarationCopy}
                    onChange={(e) => setForm({ ...form, panDeclarationCopy: e.target.value })}
                    placeholder="Upload reference"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="flex items-end">
                  <Toggle
                    checked={form.msmeApplicable}
                    onChange={(v) => setForm({ ...form, msmeApplicable: v })}
                    label="MSME Applicable"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MSME No</label>
                  <input
                    value={form.msmeNo}
                    onChange={(e) => setForm({ ...form, msmeNo: e.target.value.toUpperCase() })}
                    placeholder="UDYAM-XX-00-0000000"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MSME Type</label>
                  <select
                    value={form.msmeType}
                    onChange={(e) => setForm({ ...form, msmeType: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                  >
                    {MSME_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Remark</label>
                  <textarea
                    rows={2}
                    value={form.remark}
                    onChange={(e) => setForm({ ...form, remark: e.target.value })}
                    placeholder="Additional notes, internal remarks"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                GST and PAN fields auto-uppercase. Bank account validation triggers on change. All toggle switches update
                hidden flags.
              </p>
            </section>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Vendor"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 text-white">
              Vendor Master
            </button>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={load} className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50" title="Refresh">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50" title="Settings">
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="p-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                title="Add Vendor"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (filtered.length === 0) {
                    setFeedback({ type: "error", message: "No vendors to export." });
                    return;
                  }
                  exportToCsv(
                    stampFilename("VendorMaster"),
                    [
                      "Vendor Code",
                      "Vendor Name",
                      "Vendor Type",
                      "GST No",
                      "PAN",
                      "City",
                      "Phone",
                      "Account No",
                      "IFSC",
                      "Bank Name",
                      "Approval Status",
                      "Active"
                    ],
                    filtered.map((v) => [
                      v.vendorCode || "",
                      v.name || "",
                      v.vendorType || "",
                      v.gstNo || "",
                      v.pan || "",
                      v.city || "",
                      v.phone || "",
                      v.accountNo || "",
                      v.ifscCode || "",
                      v.bankName || "",
                      v.approvalStatus || "",
                      v.isActive === false ? "No" : "Yes"
                    ])
                  );
                  setFeedback({
                    type: "success",
                    message: `Exported ${filtered.length} vendor(s) to Excel/CSV.`
                  });
                }}
                className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                title="Export Excel"
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
            <table className="w-full text-left text-xs min-w-[1200px]">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Vendor Name</th>
                  <th className="py-2.5 px-3">Pan No</th>
                  <th className="py-2.5 px-3">Gst No</th>
                  <th className="py-2.5 px-3">Bank Account No</th>
                  <th className="py-2.5 px-3">IFSC</th>
                  <th className="py-2.5 px-3">Bank Name</th>
                  <th className="py-2.5 px-3">Account Holder Name</th>
                  <th className="py-2.5 px-3">Vendor Type</th>
                  <th className="py-2.5 px-3">Email ID</th>
                  <th className="py-2.5 px-3">Contact No</th>
                  <th className="py-2.5 px-3">Active</th>
                  <th className="py-2.5 px-3">Edit</th>
                  <th className="py-2.5 px-3">RFQ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="py-10 text-center text-slate-400">
                      Loading vendors...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-10 text-center text-slate-400">
                      No vendors found. Click + to add one.
                    </td>
                  </tr>
                ) : (
                  paged.map((v, idx) => (
                    <tr key={v._id || v.vendorCode} className={idx % 2 ? "bg-slate-50/50" : "hover:bg-slate-50/80"}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {v.name} - {v.vendorCode}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{v.pan || ""}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{v.gstNo || ""}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{v.accountNo || ""}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{v.ifscCode || ""}</td>
                      <td className="py-2.5 px-3 text-slate-700">{v.bankName || ""}</td>
                      <td className="py-2.5 px-3 text-slate-700">{v.bankAccountName || ""}</td>
                      <td className="py-2.5 px-3 text-slate-700">{v.vendorType || ""}</td>
                      <td className="py-2.5 px-3 text-slate-500">{v.email || "-"}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{v.phone || ""}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {v.isActive !== false ? "Yes" : "No"}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-600 hover:bg-blue-700 text-white"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-600 hover:bg-blue-700 text-white"
                          title="RFQ"
                          onClick={() =>
                            setFeedback({
                              type: "success",
                              message: `RFQ action opened for ${v.name} (${v.vendorCode}).`
                            })
                          }
                        >
                          <Gavel className="w-3.5 h-3.5" />
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
