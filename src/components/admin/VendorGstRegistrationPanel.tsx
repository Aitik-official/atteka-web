"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  X
} from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { exportToCsv, stampFilename } from "@/lib/exportCsv";

const GST_STATE_MAP: Record<string, string> = {
  "01": "JAMMU AND KASHMIR",
  "02": "HIMACHAL PRADESH",
  "03": "PUNJAB",
  "04": "CHANDIGARH",
  "05": "UTTARAKHAND",
  "06": "HARYANA",
  "07": "DELHI",
  "08": "RAJASTHAN",
  "09": "UTTAR PRADESH",
  "10": "BIHAR",
  "11": "SIKKIM",
  "12": "ARUNACHAL PRADESH",
  "13": "NAGALAND",
  "14": "MANIPUR",
  "15": "MIZORAM",
  "16": "TRIPURA",
  "17": "MEGHALAYA",
  "18": "ASSAM",
  "19": "WEST BENGAL",
  "20": "JHARKHAND",
  "21": "ODISHA",
  "22": "CHHATTISGARH",
  "23": "MADHYA PRADESH",
  "24": "GUJARAT",
  "26": "DADRA AND NAGAR HAVELI AND DAMAN AND DIU",
  "27": "MAHARASHTRA",
  "29": "KARNATAKA",
  "30": "GOA",
  "32": "KERALA",
  "33": "TAMIL NADU",
  "34": "PUDUCHERRY",
  "36": "TELANGANA",
  "37": "ANDHRA PRADESH"
};

interface VendorGstRecord {
  _id?: string;
  partyCode: string;
  partyName: string;
  gstNo: string;
  panNo: string;
  stateCode?: string;
  stateName?: string;
  city: string;
  pinCode: string;
  contactPerson: string;
  mobNo: string;
  address: string;
}

const INITIAL_FORM: VendorGstRecord = {
  partyCode: "",
  partyName: "",
  gstNo: "",
  panNo: "",
  stateCode: "",
  stateName: "",
  city: "",
  pinCode: "",
  contactPerson: "",
  mobNo: "",
  address: ""
};

type Props = {
  onBack: () => void;
};

export function VendorGstRegistrationPanel({ onBack }: Props) {
  const [records, setRecords] = useState<VendorGstRecord[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showVendorLookup, setShowVendorLookup] = useState(false);
  const [lookupSearch, setLookupSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<VendorGstRecord>(INITIAL_FORM);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [gstValidated, setGstValidated] = useState<boolean | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor-gst?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) setRecords(data.data || []);
    } catch {
      setErrorMsg("Failed to load vendor GST records.");
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      const res = await fetch("/api/vendors");
      const data = await res.json();
      if (data.success) setVendors(data.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadRecords();
  }, [search]);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const handleGstChange = (val: string) => {
    const clean = val.trim().toUpperCase();
    const updated = { ...formData, gstNo: clean };

    if (clean.length >= 2) {
      const stCode = clean.substring(0, 2);
      updated.stateCode = stCode;
      updated.stateName = GST_STATE_MAP[stCode] ? `${stCode} - ${GST_STATE_MAP[stCode]}` : stCode;
    }

    if (clean.length >= 12) {
      updated.panNo = clean.substring(2, 12);
    }

    setFormData(updated);
    setGstValidated(null);
  };

  const handleValidateGst = () => {
    const clean = formData.gstNo.trim().toUpperCase();
    if (!clean) {
      setErrorMsg("Please enter a GSTIN first");
      setGstValidated(false);
      return;
    }
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (gstRegex.test(clean)) {
      setGstValidated(true);
      setErrorMsg("");
      setSuccessMsg(`GST No ${clean} is syntactically valid.`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      setGstValidated(false);
      setErrorMsg("Invalid GST format. Expected 15 characters (e.g. 27AAAAA0000A1Z5).");
    }
  };

  const handleSelectVendor = (v: any) => {
    const gst = v.gstNo || "";
    let stCode = "";
    let stName = "";
    let pan = v.pan || v.panNo || "";

    if (gst.length >= 2) {
      stCode = gst.substring(0, 2);
      stName = GST_STATE_MAP[stCode] ? `${stCode} - ${GST_STATE_MAP[stCode]}` : stCode;
    }
    if (gst.length >= 12 && !pan) {
      pan = gst.substring(2, 12);
    }

    setFormData({
      ...formData,
      partyCode: v.vendorCode || "",
      partyName: v.name || "",
      gstNo: gst,
      panNo: pan,
      stateCode: stCode,
      stateName: stName,
      city: v.city || formData.city || "",
      pinCode: v.pincode || v.pinCode || formData.pinCode || "",
      contactPerson: v.contactPerson || formData.contactPerson || "",
      mobNo: v.phone || v.mobile || formData.mobNo || "",
      address: v.address || formData.address || ""
    });
    setShowVendorLookup(false);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setGstValidated(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.partyCode) {
      setErrorMsg("Please select or enter Vendor Party Code");
      return;
    }
    if (!formData.partyName) {
      setErrorMsg("Vendor Name is required");
      return;
    }
    if (!formData.gstNo || formData.gstNo.length !== 15) {
      setErrorMsg("Please enter a valid 15-digit GST No");
      return;
    }

    try {
      const isUpdate = isEditing && formData._id;
      const res = await fetch("/api/vendor-gst", {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(
          isUpdate
            ? `Vendor GST record for ${formData.partyName} updated successfully!`
            : `Vendor GST record for ${formData.partyName} (${formData.gstNo}) saved successfully!`
        );
        handleReset();
        setShowAddForm(false);
        loadRecords();
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setErrorMsg(data.error || "Failed to save GST details");
      }
    } catch {
      setErrorMsg("Network error saving GST details");
    }
  };

  const handleEdit = (rec: VendorGstRecord) => {
    setIsEditing(true);
    setShowAddForm(true);
    setFormData({ ...rec });
    setGstValidated(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredLookupVendors = vendors.filter(
    (v) =>
      v.name?.toLowerCase().includes(lookupSearch.toLowerCase()) ||
      v.vendorCode?.toLowerCase().includes(lookupSearch.toLowerCase()) ||
      v.gstNo?.toLowerCase().includes(lookupSearch.toLowerCase())
  );

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return records.slice(start, start + pageSize);
  }, [records, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Vendor GST Registration" />
          <p className="text-xs text-slate-500 mt-1">Multi-state GSTIN profiles linked to Vendor Master</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          ← Business Partners
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-[#0070d2] px-4 py-2.5 text-white flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wide">Vendor GST Registration Information</h2>
            {isEditing && (
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded font-semibold">
                Editing: {formData.partyCode}
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="p-4 space-y-3 text-xs">
            <div className="border border-slate-300 rounded-lg overflow-hidden divide-y divide-slate-200 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-6 items-center bg-slate-50/50">
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                  Vendor
                </div>
                <div className="md:col-span-5 p-2.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.partyCode}
                    onChange={(e) => setFormData({ ...formData, partyCode: e.target.value.toUpperCase() })}
                    placeholder="Party Code"
                    required
                    className="w-44 h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none focus:border-blue-600 font-mono font-bold uppercase bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVendorLookup(true)}
                    className="h-8 w-8 rounded-full bg-[#0070d2] hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer"
                    title="Lookup Vendor from Master"
                  >
                    ...
                  </button>
                  {formData.partyName && (
                    <span className="text-slate-600 font-medium ml-2">({formData.partyName})</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 items-center">
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  GST No.
                </div>
                <div className="md:col-span-2 p-2.5 border-r border-slate-200">
                  <input
                    type="text"
                    value={formData.gstNo}
                    maxLength={15}
                    onChange={(e) => handleGstChange(e.target.value)}
                    placeholder="15-digit GSTIN"
                    required
                    className="w-full h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none focus:border-blue-600 font-mono uppercase bg-white"
                  />
                </div>
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  Vendor Name
                </div>
                <div className="md:col-span-2 p-2.5">
                  <input
                    type="text"
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                    placeholder="Vendor Name"
                    required
                    className="w-full h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none focus:border-blue-600 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 items-center">
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  PAN No.
                </div>
                <div className="md:col-span-2 p-2.5 border-r border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.panNo}
                    maxLength={10}
                    onChange={(e) => setFormData({ ...formData, panNo: e.target.value.toUpperCase() })}
                    placeholder="10-digit PAN"
                    className="w-36 h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none focus:border-blue-600 font-mono uppercase bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleValidateGst}
                    className="text-blue-600 hover:text-blue-800 underline font-medium text-xs cursor-pointer whitespace-nowrap"
                  >
                    Validate GST No
                  </button>
                  {gstValidated === true && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  State Code / Name
                </div>
                <div className="md:col-span-2 p-2.5">
                  <input
                    type="text"
                    value={formData.stateName || ""}
                    onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                    placeholder="State Code & Name"
                    className="w-full h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none focus:border-blue-600 bg-slate-50 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 items-center">
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  City
                </div>
                <div className="md:col-span-2 p-2.5 border-r border-slate-200">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City name"
                    className="w-full h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  Pin
                </div>
                <div className="md:col-span-2 p-2.5">
                  <input
                    type="text"
                    value={formData.pinCode}
                    maxLength={6}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    placeholder="Postal code"
                    className="w-40 h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none focus:border-blue-600 font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 items-center">
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  Contact Person
                </div>
                <div className="md:col-span-2 p-2.5 border-r border-slate-200">
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Contact person"
                    className="w-full h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  Contact No
                </div>
                <div className="md:col-span-2 p-2.5">
                  <input
                    type="text"
                    value={formData.mobNo}
                    maxLength={15}
                    onChange={(e) => setFormData({ ...formData, mobNo: e.target.value })}
                    placeholder="Phone / Mobile No"
                    className="w-full h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none focus:border-blue-600 font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 items-start">
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50 self-stretch flex items-center">
                  Address
                </div>
                <div className="md:col-span-5 p-2.5">
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Complete billing address"
                    className="w-full p-2 border border-[#0070d2] rounded focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="submit"
                className="px-6 py-1.5 bg-white hover:bg-blue-50 text-[#0070d2] border border-[#0070d2] font-semibold text-xs rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isEditing ? "Update" : "Save"}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-1.5 bg-white hover:bg-slate-50 text-[#0070d2] border border-[#0070d2] font-semibold text-xs rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">Vendor GST Registration</h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="h-8 w-8 rounded bg-[#0070d2] text-white flex items-center justify-center hover:bg-blue-700"
              title="Filter"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="h-8 w-8 rounded bg-[#0070d2] text-white flex items-center justify-center hover:bg-blue-700"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (showAddForm && isEditing) handleReset();
                setShowAddForm(!showAddForm);
                if (!showAddForm) handleReset();
              }}
              className="h-8 w-8 rounded bg-[#0070d2] text-white flex items-center justify-center hover:bg-blue-700"
              title="Add Vendor GST"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (records.length === 0) {
                  setErrorMsg("No vendor GST records to export.");
                  return;
                }
                exportToCsv(
                  stampFilename("VendorGSTRegistration"),
                  [
                    "Party Code",
                    "Party Name",
                    "GSTNO",
                    "Pan no",
                    "City",
                    "Pin Code",
                    "Contact Person",
                    "Mob No",
                    "Address"
                  ],
                  records.map((r) => [
                    r.partyCode,
                    r.partyName,
                    r.gstNo,
                    r.panNo || "",
                    r.city || "",
                    r.pinCode || "",
                    r.contactPerson || "",
                    r.mobNo || "",
                    r.address || ""
                  ])
                );
                setSuccessMsg(`Exported ${records.length} vendor GST record(s) to Excel/CSV.`);
                setTimeout(() => setSuccessMsg(""), 4000);
              }}
              className="h-8 px-2.5 rounded bg-[#0070d2] text-white flex items-center gap-1 hover:bg-blue-700 text-[11px] font-semibold"
              title="Export Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>▼</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-8 px-2 border border-slate-200 rounded bg-white"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-slate-600">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Search:</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 px-2.5 border border-slate-200 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[1100px]">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Party Code</th>
                <th className="py-2.5 px-3">Party Name</th>
                <th className="py-2.5 px-3">GSTNO</th>
                <th className="py-2.5 px-3">Pan no</th>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3">Pin Code</th>
                <th className="py-2.5 px-3">Contact Person</th>
                <th className="py-2.5 px-3">Mob No</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3 text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {loading ? "Loading vendor GST records..." : "No vendor GST registrations found."}
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r._id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2 px-3 font-bold text-blue-700 font-mono">{r.partyCode}</td>
                    <td className="py-2 px-3 text-slate-900 font-semibold max-w-[220px] truncate" title={r.partyName}>
                      {r.partyName}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-800">{r.gstNo}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{r.panNo || "-"}</td>
                    <td className="py-2 px-3 text-slate-700">{r.city || "-"}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{r.pinCode || "-"}</td>
                    <td className="py-2 px-3 text-slate-700">{r.contactPerson || "-"}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{r.mobNo || "-"}</td>
                    <td className="py-2 px-3 text-slate-600 max-w-[240px] truncate" title={r.address}>
                      {r.address || "-"}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleEdit(r)}
                        className="h-7 w-7 rounded bg-[#0070d2] text-white inline-flex items-center justify-center hover:bg-blue-700"
                        title="Edit GST Registration"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 border-t border-slate-100">
          <span>
            Showing {records.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, records.length)} of {records.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="px-2.5 py-1 bg-[#0070d2] text-white rounded font-semibold">{page}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showVendorLookup && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#0070d2] px-4 py-3 text-white flex items-center justify-between">
              <h3 className="font-bold text-xs tracking-wide">Select Vendor from Master</h3>
              <button
                type="button"
                onClick={() => setShowVendorLookup(false)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={lookupSearch}
                  onChange={(e) => setLookupSearch(e.target.value)}
                  placeholder="Search code, vendor name or GST..."
                  className="w-full h-9 pl-9 pr-3 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
                {filteredLookupVendors.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No vendors found.</div>
                ) : (
                  filteredLookupVendors.map((v) => (
                    <div
                      key={v._id || v.vendorCode}
                      onClick={() => handleSelectVendor(v)}
                      className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{v.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {v.vendorCode} • {v.gstNo || "No GST"}
                        </div>
                      </div>
                      <span className="text-[11px] text-blue-600 font-semibold px-2 py-1 bg-blue-50 rounded">
                        Select
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
