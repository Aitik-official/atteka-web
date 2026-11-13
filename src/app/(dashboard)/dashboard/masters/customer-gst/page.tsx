"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  Search,
  X,
  AlertCircle,
  Edit3,
  Save,
  RotateCcw,
  Check,
  Building2,
  ExternalLink
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";

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

interface CustomerGstRecord {
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

const INITIAL_FORM: CustomerGstRecord = {
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

export default function CustomerGstPage() {
  const [records, setRecords] = useState<CustomerGstRecord[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [lookupSearch, setLookupSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<CustomerGstRecord>(INITIAL_FORM);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [gstValidated, setGstValidated] = useState<boolean | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer-gst?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadRecords();
  }, [search]);

  useEffect(() => {
    loadCustomers();
  }, []);

  // Handle GST change and auto PAN / State extraction
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
      setErrorMsg(`Invalid GST format. Expected 15 characters (e.g. 27AAAAA0000A1Z5).`);
    }
  };

  const handleSelectCustomer = (cust: any) => {
    const gst = cust.gstin || "";
    let stCode = "";
    let stName = "";
    let pan = cust.pan || "";

    if (gst.length >= 2) {
      stCode = gst.substring(0, 2);
      stName = GST_STATE_MAP[stCode] ? `${stCode} - ${GST_STATE_MAP[stCode]}` : stCode;
    }
    if (gst.length >= 12 && !pan) {
      pan = gst.substring(2, 12);
    }

    setFormData({
      ...formData,
      partyCode: cust.customerCode || "",
      partyName: cust.name || "",
      gstNo: gst,
      panNo: pan,
      stateCode: stCode,
      stateName: stName,
      city: cust.city || formData.city || "",
      pinCode: cust.pinCode || cust.pincode || formData.pinCode || "",
      contactPerson: cust.contactPerson || formData.contactPerson || "",
      mobNo: cust.mobileNo || cust.phone || formData.mobNo || "",
      address: cust.address || formData.address || ""
    });

    setShowCustomerLookup(false);
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
      setErrorMsg("Please select or enter Customer Party Code");
      return;
    }
    if (!formData.partyName) {
      setErrorMsg("Customer Name is required");
      return;
    }
    if (!formData.gstNo || formData.gstNo.length !== 15) {
      setErrorMsg("Please enter a valid 15-digit GST No");
      return;
    }

    try {
      const isUpdate = isEditing && formData._id;
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch("/api/customer-gst", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(
          isUpdate
            ? `Customer GST record for ${formData.partyName} updated successfully!`
            : `Customer GST record for ${formData.partyName} (${formData.gstNo}) saved successfully!`
        );
        handleReset();
        loadRecords();
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setErrorMsg(data.error || "Failed to save GST details");
      }
    } catch {
      setErrorMsg("Network error saving GST details");
    }
  };

  const handleEdit = (rec: CustomerGstRecord) => {
    setIsEditing(true);
    setShowAddForm(true);
    setFormData({ ...rec });
    setGstValidated(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredLookupCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(lookupSearch.toLowerCase()) ||
      c.customerCode?.toLowerCase().includes(lookupSearch.toLowerCase()) ||
      c.gstin?.toLowerCase().includes(lookupSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        moduleCode="C062"
        title="Customer GST Registration"
        subtitle="Masters • CustGSTRegsList.aspx & CustGSTRegsAdd.aspx • Multi-State GSTIN & Branch Profiles"
actions={
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/masters/customers"
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer Master</span>
            </a>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (!showAddForm && isEditing) handleReset();
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "Hide Form" : "Add"}</span>
            </button>
          </div>
        }
      />

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Section matching user's exact uploaded image */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          {/* Header Bar matching screenshot: "Customer GST Registration Information" */}
          <div className="bg-[#0070d2] px-4 py-2.5 text-white flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wide">Customer GST Registration Information</h2>
            {isEditing && (
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded font-semibold">
                Editing: {formData.partyCode}
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="p-4 space-y-3 text-xs">
            {/* Table-like Form Grid matching uploaded screenshot */}
            <div className="border border-slate-300 rounded-lg overflow-hidden divide-y divide-slate-200 bg-white">
              {/* Row 1: Customer */}
              <div className="grid grid-cols-1 md:grid-cols-6 items-center bg-slate-50/50">
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                  Customer
                </div>
                <div className="md:col-span-5 p-2.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.partyCode}
                    onChange={(e) => setFormData({ ...formData, partyCode: e.target.value.toUpperCase() })}
                    placeholder="Party Code"
                    required
                    className="w-44 h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-mono font-bold uppercase bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomerLookup(true)}
                    className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-300 rounded font-bold transition-colors cursor-pointer"
                    title="Lookup Customer from Master"
                  >
                    ...
                  </button>
                  {formData.partyName && (
                    <span className="text-slate-600 font-medium ml-2">
                      ({formData.partyName})
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: GST No. | Customer Name */}
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
                    className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-mono uppercase bg-white"
                  />
                </div>
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  Customer Name
                </div>
                <div className="md:col-span-2 p-2.5">
                  <input
                    type="text"
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                    placeholder="Customer Name"
                    required
                    className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-white font-medium"
                  />
                </div>
              </div>

              {/* Row 3: PAN No. [Validate GST No] | State Code / Name */}
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
                    className="w-36 h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-mono uppercase bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleValidateGst}
                    className="text-blue-600 hover:text-blue-800 underline font-medium text-xs cursor-pointer whitespace-nowrap"
                  >
                    Validate GST No
                  </button>
                  {gstValidated === true && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
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
                    className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-slate-50 text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Row 4: City | Pin */}
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
                    className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-white"
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
                    className="w-40 h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-mono bg-white"
                  />
                </div>
              </div>

              {/* Row 5: Contact Person | Contact No */}
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
                    className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-white"
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
                    className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-mono bg-white"
                  />
                </div>
              </div>

              {/* Row 6: Address */}
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
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions matching uploaded image: (Save) (Reset) */}
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="submit"
                className="px-6 py-1.5 bg-[#0070d2] hover:bg-blue-700 text-white font-semibold text-xs rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isEditing ? "Update" : "Save"}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Section: Exact Columns Requested:
          Party Code | Party Name | GSTNO | Pan no | City | Pin Code | Contact Person | Mob No | Address | Edit */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Customer GST Records</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded-md">
              {records.length} Registrations
            </span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search party code, name, GSTNO, city..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            />
          </div>
        </div>
      </div>

      <ResponsiveTableWrapper
        title="Customer GST Registration Directory"
        totalCount={records.length}
        showSwipeHint={true}
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[1100px]">
          <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3.5">Party Code</th>
              <th className="py-3 px-3.5">Party Name</th>
              <th className="py-3 px-3.5">GSTNO</th>
              <th className="py-3 px-3.5">Pan no</th>
              <th className="py-3 px-3.5">City</th>
              <th className="py-3 px-3.5">Pin Code</th>
              <th className="py-3 px-3.5">Contact Person</th>
              <th className="py-3 px-3.5">Mob No</th>
              <th className="py-3 px-3.5">Address</th>
              <th className="py-3 px-3.5 text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {records.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  {loading ? "Loading customer GST records..." : "No customer GST registrations found."}
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r._id} className="hover:bg-blue-50/40 transition-colors">
                  {/* Party Code */}
                  <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">
                    {r.partyCode}
                  </td>

                  {/* Party Name */}
                  <td className="py-2.5 px-3.5 text-slate-900 font-semibold max-w-[200px] truncate" title={r.partyName}>
                    {r.partyName}
                  </td>

                  {/* GSTNO */}
                  <td className="py-2.5 px-3.5 font-mono text-slate-800 font-bold">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-900 border border-slate-200">
                      {r.gstNo}
                    </span>
                  </td>

                  {/* Pan no */}
                  <td className="py-2.5 px-3.5 font-mono text-slate-700">
                    {r.panNo || "-"}
                  </td>

                  {/* City */}
                  <td className="py-2.5 px-3.5 text-slate-700">
                    {r.city || "-"}
                  </td>

                  {/* Pin Code */}
                  <td className="py-2.5 px-3.5 font-mono text-slate-700">
                    {r.pinCode || "-"}
                  </td>

                  {/* Contact Person */}
                  <td className="py-2.5 px-3.5 text-slate-700">
                    {r.contactPerson || "-"}
                  </td>

                  {/* Mob No */}
                  <td className="py-2.5 px-3.5 font-mono text-slate-700">
                    {r.mobNo || "-"}
                  </td>

                  {/* Address */}
                  <td className="py-2.5 px-3.5 text-slate-600 max-w-[250px] truncate" title={r.address}>
                    {r.address || "-"}
                  </td>

                  {/* Edit */}
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      onClick={() => handleEdit(r)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Edit GST Registration"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ResponsiveTableWrapper>

      {/* Customer Lookup Modal */}
      {showCustomerLookup && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0070d2] px-4 py-3 text-white flex items-center justify-between">
              <h3 className="font-bold text-xs tracking-wide">Select Customer from Master</h3>
              <button
                onClick={() => setShowCustomerLookup(false)}
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
                  placeholder="Search code, customer name or GST..."
                  className="w-full h-9 pl-9 pr-3 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
                {filteredLookupCustomers.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No customers found.</div>
                ) : (
                  filteredLookupCustomers.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {c.customerCode} • {c.gstin || "No GST"}
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
