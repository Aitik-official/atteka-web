"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  CheckCircle2,
  Search,
  X,
  AlertCircle,
  Edit3,
  Save,
  RotateCcw,
  Building2,
  CreditCard,
  Mail,
  ShieldCheck,
  UserCheck,
  LayoutDashboard,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Check,
  FileText
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { StatusBadge } from "@/components/common/StatusBadge";

interface CustomerFormData {
  _id?: string;
  customerCode: string;
  gstin: string;
  name: string;
  customerPassword: string;
  customerCategory: string;
  tanNo: string;
  customerType: string;
  industry: string;
  vendorCode: string;
  serviceType: string;
  creditLimit: number;
  creditPeriod: number;
  contract: string;
  skipPod: boolean;
  billFormat: string;
  address: string;
  city: string;
  pinCode: string;
  contactPerson: string;
  mobileNo: string;
  location: string;
  emailAlertEnabled: boolean;
  emailId1: string;
  emailId2: string;
  salesPerson: string;
  salesPersonEmail: string;
  kamPerson: string;
  activeFlag: boolean;
}

const INITIAL_FORM: CustomerFormData = {
  customerCode: "AUTO",
  gstin: "",
  name: "",
  customerPassword: "",
  customerCategory: "Corporate",
  tanNo: "",
  customerType: "CORPORATE",
  industry: "",
  vendorCode: "",
  serviceType: "FTL",
  creditLimit: 0,
  creditPeriod: 30,
  contract: "Standard",
  skipPod: false,
  billFormat: "E-Invoice Bill Formate",
  address: "",
  city: "",
  pinCode: "",
  contactPerson: "",
  mobileNo: "",
  location: "MUMBAI",
  emailAlertEnabled: true,
  emailId1: "",
  emailId2: "",
  salesPerson: "",
  salesPersonEmail: "",
  kamPerson: "",
  activeFlag: true
};

export default function CustomerMasterPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<CustomerFormData>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [dashboardCustomer, setDashboardCustomer] = useState<any | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [gstValidationStatus, setGstValidationStatus] = useState<"IDLE" | "VALID" | "INVALID">("IDLE");

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  // Handle GSTIN live validation
  const validateGst = (gst: string) => {
    const clean = gst.trim().toUpperCase();
    if (!clean) {
      setGstValidationStatus("IDLE");
      return;
    }
    // Standard 15-character Indian GSTIN Regex
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (gstRegex.test(clean)) {
      setGstValidationStatus("VALID");
    } else {
      setGstValidationStatus("INVALID");
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "gstin") {
        validateGst(value);
      }
      return updated;
    });
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setGstValidationStatus("IDLE");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Customer Name is required.");
      return;
    }

    try {
      const isUpdate = isEditing && formData._id;
      const method = isUpdate ? "PUT" : "POST";
      const payload = {
        ...formData,
        customerCode: formData.customerCode.trim(),
        gstin: formData.gstin.trim().toUpperCase(),
        tanNo: formData.tanNo.trim().toUpperCase(),
        creditLimit: Number(formData.creditLimit) || 0,
        creditPeriod: Number(formData.creditPeriod) || 30
      };

      const res = await fetch("/api/customers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        setSuccessMsg(
          isUpdate
            ? `Customer "${formData.name}" updated successfully!`
            : `Customer "${formData.name}" added successfully with Code: ${result.data?.customerCode || formData.customerCode}`
        );
        handleReset();
        loadCustomers();
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setErrorMsg(result.error || "Failed to save customer");
      }
    } catch {
      setErrorMsg("A network error occurred while saving the customer.");
    }
  };

  const handleEditClick = (cust: any) => {
    setIsEditing(true);
    setIsFormOpen(true);
    setFormData({
      _id: cust._id,
      customerCode: cust.customerCode || "AUTO",
      gstin: cust.gstin || "",
      name: cust.name || "",
      customerPassword: cust.customerPassword || "",
      customerCategory: cust.customerCategory || "Corporate",
      tanNo: cust.tanNo || "",
      customerType: cust.customerType || "CORPORATE",
      industry: cust.industry || "",
      vendorCode: cust.vendorCode || "",
      serviceType: cust.serviceType || "FTL",
      creditLimit: cust.creditLimit || 0,
      creditPeriod: cust.creditPeriod || 30,
      contract: cust.contract || "Standard",
      skipPod: Boolean(cust.skipPod),
      billFormat: cust.billFormat || "E-Invoice Bill Formate",
      address: cust.address || "",
      city: cust.city || "",
      pinCode: cust.pinCode || cust.pincode || "",
      contactPerson: cust.contactPerson || "",
      mobileNo: cust.mobileNo || cust.phone || "",
      location: cust.location || "MUMBAI",
      emailAlertEnabled: cust.emailAlertEnabled !== undefined ? cust.emailAlertEnabled : true,
      emailId1: cust.emailId1 || cust.email || "",
      emailId2: cust.emailId2 || "",
      salesPerson: cust.salesPerson || "",
      salesPersonEmail: cust.salesPersonEmail || "",
      kamPerson: cust.kamPerson || "",
      activeFlag: cust.activeFlag !== undefined ? cust.activeFlag : (cust.isActive !== undefined ? cust.isActive : true)
    });
    if (cust.gstin) {
      validateGst(cust.gstin);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        moduleCode="C061"
        title="Customer Master"
        subtitle="Manage customer details, GST, credit & contact information • Digital Signature & Billing Profile"
actions={
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/masters/customer-gst"
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer GST Details</span>
            </a>
            <button
              onClick={() => {
                setIsFormOpen(!isFormOpen);
                if (!isFormOpen && isEditing) handleReset();
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFormOpen ? "Hide Form" : "Add Customer"}</span>
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

      {/* Add / Edit Customer Form */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">
                  {isEditing ? `Edit Customer: ${formData.customerCode}` : "Add Customer Master"}
                </h2>
                <p className="text-[11px] text-slate-300">
                  Manage customer details, GST, credit & contact information
                </p>
              </div>
            </div>
            {isEditing && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-md text-[11px] font-semibold">
                  Editing Mode
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md text-[11px] font-medium transition-colors"
                >
                  Cancel Edit
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveCustomer} className="p-6 space-y-6">
            {/* 1. Basic Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                {/* Customer Code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.customerCode}
                      onChange={(e) => handleInputChange("customerCode", e.target.value.toUpperCase())}
                      placeholder="AUTO"
                      disabled={isEditing}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono font-bold uppercase bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75"
                    />
                    {!isEditing && (
                      <span className="absolute right-2.5 top-2 text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        AUTO
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer GST No */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Customer GST No</label>
                    {gstValidationStatus === "VALID" && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Valid GST
                      </span>
                    )}
                    {gstValidationStatus === "INVALID" && (
                      <span className="text-[10px] text-red-500 font-semibold">Invalid Format</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.gstin}
                    maxLength={15}
                    onChange={(e) => handleInputChange("gstin", e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    className={`w-full h-9 px-3 border rounded-lg font-mono uppercase focus:outline-none focus:ring-1 ${
                      gstValidationStatus === "VALID"
                        ? "border-emerald-400 bg-emerald-50/20 focus:ring-emerald-500"
                        : gstValidationStatus === "INVALID"
                        ? "border-red-300 bg-red-50/20 focus:ring-red-400"
                        : "border-slate-200 focus:ring-blue-500"
                    }`}
                  />
                </div>

                {/* Customer Name */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Full customer name"
                    required
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Customer Password */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.customerPassword}
                      onChange={(e) => handleInputChange("customerPassword", e.target.value)}
                      placeholder="Optional password"
                      className="w-full h-9 pl-3 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Customer Category */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Category</label>
                  <select
                    value={formData.customerCategory}
                    onChange={(e) => handleInputChange("customerCategory", e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="Corporate">Corporate</option>
                    <option value="Retail">Retail</option>
                    <option value="Ecommerce">Ecommerce</option>
                    <option value="Government">Government</option>
                    <option value="SME">SME</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>

                {/* TAN No */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">TAN No</label>
                  <input
                    type="text"
                    value={formData.tanNo}
                    onChange={(e) => handleInputChange("tanNo", e.target.value.toUpperCase())}
                    placeholder="TAN registration"
                    maxLength={10}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Customer Type */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Type</label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => handleInputChange("customerType", e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="CORPORATE">Corporate</option>
                    <option value="REGULAR">Regular</option>
                    <option value="WALK_IN">Walk In</option>
                    <option value="CONTRACT">Contract Account</option>
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                    placeholder="e.g., Manufacturing, IT"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Vendor Code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor Code</label>
                  <input
                    type="text"
                    value={formData.vendorCode}
                    onChange={(e) => handleInputChange("vendorCode", e.target.value.toUpperCase())}
                    placeholder="Associated vendor code"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Service type */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service type</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => handleInputChange("serviceType", e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="FTL">Full Truck Load (FTL)</option>
                    <option value="LTL">Less Than Truck Load (LTL)</option>
                    <option value="Express">Express Cargo</option>
                    <option value="Cold Chain">Cold Chain</option>
                    <option value="Air Freight">Air Freight</option>
                    <option value="Standard">Standard Logistics</option>
                  </select>
                </div>

                {/* Credit Limit */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => handleInputChange("creditLimit", Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Credit Period (Days) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.creditPeriod}
                    onChange={(e) => handleInputChange("creditPeriod", Number(e.target.value))}
                    placeholder="30"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Contract */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contract</label>
                  <select
                    value={formData.contract}
                    onChange={(e) => handleInputChange("contract", e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Annual">Annual MSA</option>
                    <option value="Project-Based">Project-Based</option>
                    <option value="Pending">Pending Review</option>
                    <option value="No Contract">No Contract</option>
                  </select>
                </div>

                {/* Skip POD */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Skip POD</label>
                  <select
                    value={formData.skipPod ? "Yes" : "No"}
                    onChange={(e) => handleInputChange("skipPod", e.target.value === "Yes")}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="No">No (Strict POD Required)</option>
                    <option value="Yes">Yes (Skip POD for Billing)</option>
                  </select>
                </div>

                {/* Bill Formate */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bill Format</label>
                  <select
                    value={formData.billFormat}
                    onChange={(e) => handleInputChange("billFormat", e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="E-Invoice Bill Formate">E-Invoice Bill Formate</option>
                    <option value="Standard Bill Format">Standard Bill Format</option>
                    <option value="Thermal Format">Thermal Format</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Contact Details */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Contact Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                {/* Customer Address */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Customer Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Street, area, landmark"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City name"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Pin Code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pin Code</label>
                  <input
                    type="text"
                    value={formData.pinCode}
                    maxLength={6}
                    onChange={(e) => handleInputChange("pinCode", e.target.value)}
                    placeholder="Postal code"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                    placeholder="Primary contact"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Mobile No */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile No</label>
                  <input
                    type="text"
                    value={formData.mobileNo}
                    maxLength={12}
                    onChange={(e) => handleInputChange("mobileNo", e.target.value)}
                    placeholder="9876543210"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Location / Regional Branch</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Location"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Email Configuration */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Mail className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Email Configuration</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-center">
                {/* Email Alert Enabled */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <input
                    type="checkbox"
                    id="emailAlert"
                    checked={formData.emailAlertEnabled}
                    onChange={(e) => handleInputChange("emailAlertEnabled", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="emailAlert" className="font-semibold text-slate-700 cursor-pointer">
                    Email Alert Enabled
                  </label>
                </div>

                {/* Email Id 1 */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Id 1</label>
                  <input
                    type="email"
                    value={formData.emailId1}
                    onChange={(e) => handleInputChange("emailId1", e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Email Id 2 */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Id 2</label>
                  <input
                    type="email"
                    value={formData.emailId2}
                    onChange={(e) => handleInputChange("emailId2", e.target.value)}
                    placeholder="alternate@example.com"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Sales & Approval */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Sales & Approval</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Sales Person */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sales Person</label>
                  <input
                    type="text"
                    value={formData.salesPerson}
                    onChange={(e) => handleInputChange("salesPerson", e.target.value)}
                    placeholder="Sales Person"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Sales Person Email Id */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sales Person Email Id</label>
                  <input
                    type="email"
                    value={formData.salesPersonEmail}
                    onChange={(e) => handleInputChange("salesPersonEmail", e.target.value)}
                    placeholder="sales@company.com"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* KAM Person */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">KAM Person</label>
                  <input
                    type="text"
                    value={formData.kamPerson}
                    onChange={(e) => handleInputChange("kamPerson", e.target.value)}
                    placeholder="KAM Person"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. Status & Submission Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* Active Flag */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Status:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activeFlag}
                      onChange={(e) => handleInputChange("activeFlag", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-700">
                      Active Flag ({formData.activeFlag ? "Yes" : "No"})
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Fields marked with <span className="text-red-500">*</span> are required. GST validation triggers on change.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Update Customer" : "Save Customer"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Customer Registry Header & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Customer Directory</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded-md">
              {customers.length} Accounts
            </span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, name, GST, mobile, KAM..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Responsive Table Wrapper with Excel Columns */}
      <ResponsiveTableWrapper
        title="Customer Master Records"
        totalCount={customers.length}
        showSwipeHint={true}
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[1300px]">
          <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3.5">Customer Code</th>
              <th className="py-3 px-3.5">Customer Name</th>
              <th className="py-3 px-3.5">E-mail ID</th>
              <th className="py-3 px-3.5">Credit Period</th>
              <th className="py-3 px-3.5">Credit Limit</th>
              <th className="py-3 px-3.5">GST No</th>
              <th className="py-3 px-3.5">Customer Password</th>
              <th className="py-3 px-3.5">Sales Person</th>
              <th className="py-3 px-3.5">KAM Person</th>
              <th className="py-3 px-3.5">Contract</th>
              <th className="py-3 px-3.5">Skip POD</th>
              <th className="py-3 px-3.5">Bill Format</th>
              <th className="py-3 px-3.5 text-center">Active</th>
              <th className="py-3 px-3.5 text-center">Dashboard</th>
              <th className="py-3 px-3.5 text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-8 text-center text-slate-400">
                  {loading ? "Loading customer master data..." : "No customer records found matching query."}
                </td>
              </tr>
            ) : (
              customers.map((c) => {
                const isPasswordRevealed = Boolean(revealedPasswords[c._id]);
                return (
                  <tr key={c._id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Customer Code */}
                    <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">
                      {c.customerCode}
                    </td>

                    {/* Customer Name */}
                    <td className="py-2.5 px-3.5 text-slate-900 font-semibold max-w-[200px] truncate" title={c.name}>
                      {c.name}
                    </td>

                    {/* E-mail ID */}
                    <td className="py-2.5 px-3.5 text-slate-600 font-mono text-[11px]">
                      {c.emailId1 || c.email || "-"}
                    </td>

                    {/* Credit Period */}
                    <td className="py-2.5 px-3.5 font-semibold text-slate-700">
                      {c.creditPeriod || 30} Days
                    </td>

                    {/* Credit Limit */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800">
                      ₹{(c.creditLimit || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Gst No */}
                    <td className="py-2.5 px-3.5 font-mono text-slate-700 text-[11px]">
                      {c.gstin ? (
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-bold">
                          {c.gstin}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unregistered</span>
                      )}
                    </td>

                    {/* Customer Password */}
                    <td className="py-2.5 px-3.5 font-mono text-slate-600">
                      {c.customerPassword ? (
                        <div className="flex items-center gap-1.5">
                          <span>{isPasswordRevealed ? c.customerPassword : "••••••••"}</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(c._id)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {isPasswordRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Sales Person */}
                    <td className="py-2.5 px-3.5 text-slate-700">
                      {c.salesPerson || "-"}
                    </td>

                    {/* KAM Person */}
                    <td className="py-2.5 px-3.5 text-slate-700">
                      {c.kamPerson || "-"}
                    </td>

                    {/* Contract */}
                    <td className="py-2.5 px-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200">
                        {c.contract || "Standard"}
                      </span>
                    </td>

                    {/* Skip POD */}
                    <td className="py-2.5 px-3.5">
                      {c.skipPod ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200">
                          YES (Skip)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md">
                          NO (Required)
                        </span>
                      )}
                    </td>

                    {/* Bill Format */}
                    <td className="py-2.5 px-3.5 text-slate-700 text-[11px]">
                      {c.billFormat || "E-Invoice Bill Formate"}
                    </td>

                    {/* Active */}
                    <td className="py-2.5 px-3.5 text-center">
                      {c.activeFlag !== false && c.isActive !== false ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Dashboard */}
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        onClick={() => setDashboardCustomer(c)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="View Customer Dashboard"
                      >
                        <LayoutDashboard className="w-3 h-3" />
                        <span>Dashboard</span>
                      </button>
                    </td>

                    {/* Edit */}
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        onClick={() => handleEditClick(c)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Edit Customer Details"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ResponsiveTableWrapper>

      {/* Customer 360 Dashboard Modal */}
      {dashboardCustomer && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">Customer 360: {dashboardCustomer.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Code: {dashboardCustomer.customerCode}</p>
                </div>
              </div>
              <button
                onClick={() => setDashboardCustomer(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Credit Limit</span>
                  <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    ₹{(dashboardCustomer.creditLimit || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-slate-500">Period: {dashboardCustomer.creditPeriod || 30} Days</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500">GST Registration</span>
                  <p className="text-sm font-bold font-mono text-blue-700 mt-1">
                    {dashboardCustomer.gstin || "Unregistered"}
                  </p>
                  <p className="text-[11px] text-slate-500">TAN: {dashboardCustomer.tanNo || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Category & Type:</span>
                  <span className="font-semibold text-slate-800">
                    {dashboardCustomer.customerCategory || "Corporate"} • {dashboardCustomer.customerType || "Regular"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Sales Person:</span>
                  <span className="font-semibold text-slate-800">{dashboardCustomer.salesPerson || "Unassigned"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">KAM (Key Account Manager):</span>
                  <span className="font-semibold text-slate-800">{dashboardCustomer.kamPerson || "Unassigned"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Contract & POD Rule:</span>
                  <span className="font-semibold text-slate-800">
                    {dashboardCustomer.contract || "Standard"} • Skip POD: {dashboardCustomer.skipPod ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Bill Format:</span>
                  <span className="font-semibold text-slate-800">{dashboardCustomer.billFormat || "E-Invoice Bill Formate"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Primary Contact & Phone:</span>
                  <span className="font-semibold text-slate-800">
                    {dashboardCustomer.contactPerson || "-"} ({dashboardCustomer.mobileNo || dashboardCustomer.phone || "-"})
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Address / City:</span>
                  <span className="font-semibold text-slate-800">
                    {dashboardCustomer.address ? `${dashboardCustomer.address}, ` : ""}
                    {dashboardCustomer.city || "-"} {dashboardCustomer.pinCode ? `- ${dashboardCustomer.pinCode}` : ""}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleEditClick(dashboardCustomer);
                    setDashboardCustomer(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit in Master Form</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
