"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Calculator,
  Building,
  User,
  Package,
  CreditCard,
  ArrowLeft,
  Printer,
  FileCheck,
  Send,
  Sparkles,
  X,
  Search,
  ChevronDown,
  ShieldAlert,
  Calendar,
  Truck,
  Hash
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { printLaserA4Cn, printThermalCounterSlip, printDotMatrixSheet } from "@/lib/printEngine";

interface CustomerOption {
  _id?: string;
  customerCode?: string;
  name: string;
  gstin?: string;
  city?: string;
  phone?: string;
  address?: string;
}

export default function NewConsignmentPage() {
  const router = useRouter();

  // Helper to get today's date formatted as YYYY-MM-DD
  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getFutureDateStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  // Section 1: CN Summary (Matching original page initial fields)
  const [generationMode, setGenerationMode] = useState<"AUTOMATIC" | "MANUAL">("AUTOMATIC");
  const [cnNumber, setCnNumber] = useState("");
  const [cnDate, setCnDate] = useState(getTodayStr());
  const [billingParty, setBillingParty] = useState("");
  const [buDescription, setBuDescription] = useState("");
  const [paymentType, setPaymentType] = useState<"TBB" | "PAID" | "TO_PAY">("TBB");
  const [mode, setMode] = useState("Road");
  const [billedAt, setBilledAt] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(getTodayStr());
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [ewayBillExpiryDate, setEwayBillExpiryDate] = useState(getTodayStr());
  const [isLocalCn, setIsLocalCn] = useState("Yes");
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverNo, setDriverNo] = useState("");
  const [approxKm, setApproxKm] = useState("0");
  const [customerGstNo, setCustomerGstNo] = useState("");

  // Section 2: Consignor
  const [consignorGstin, setConsignorGstin] = useState("");
  const [consignorName, setConsignorName] = useState("");
  const [consignorAddress, setConsignorAddress] = useState("");
  const [consignorCity, setConsignorCity] = useState("");
  const [consignorPincode, setConsignorPincode] = useState("");
  const [consignorTelephone, setConsignorTelephone] = useState("");

  // Section 3: Consignee
  const [consigneeGstin, setConsigneeGstin] = useState("");
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [consigneeCity, setConsigneeCity] = useState("");
  const [consigneePincode, setConsigneePincode] = useState("");
  const [consigneeTelephone, setConsigneeTelephone] = useState("");

  // Section 4: Documentation Details
  const [riskType, setRiskType] = useState("Owner's Risk");
  const [policyNo, setPolicyNo] = useState("");
  const [policyDate, setPolicyDate] = useState(getTodayStr());
  const [shipment, setShipment] = useState("");
  const [poNo, setPoNo] = useState("");
  const [containerNumber, setContainerNumber] = useState("");
  const [containerSize, setContainerSize] = useState("");

  // Section 5: Invoice Details
  const [invoiceBeNo, setInvoiceBeNo] = useState("0");
  const [invoiceBeDate, setInvoiceBeDate] = useState(getTodayStr());
  const [declaredValue, setDeclaredValue] = useState("0");
  const [currency, setCurrency] = useState("INR");

  // Section 6: Consignment Details
  const [packagesCount, setPackagesCount] = useState<number | string>(0);
  const [packagingType, setPackagingType] = useState("");
  const [productSaidToContain, setProductSaidToContain] = useState("");
  const [actualWeight, setActualWeight] = useState<number | string>(0);
  const [chargedWeight, setChargedWeight] = useState<number | string>(0);
  const [freightAmount, setFreightAmount] = useState<number | string>(0);
  const [loadingCharge, setLoadingCharge] = useState<number | string>(0);
  const [sealNo, setSealNo] = useState("0");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Admin Master Directories
  const [lookupTarget, setLookupTarget] = useState<"billing" | "consignor" | "consignee" | null>(null);
  const [customerDirectory, setCustomerDirectory] = useState<CustomerOption[]>([]);
  const [branchesDirectory, setBranchesDirectory] = useState<any[]>([]);
  const [vehiclesDirectory, setVehiclesDirectory] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");

  // Status, draft allocation & pipeline
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [bookedCnPipeline, setBookedCnPipeline] = useState<any | null>(null);
  const [savedDraftDocket, setSavedDraftDocket] = useState<string | null>(null);
  const [allocatedDocketModal, setAllocatedDocketModal] = useState<{
    docketNo: string;
    details: any;
  } | null>(null);
  const [modalDocketInput, setModalDocketInput] = useState("");

  // Initialize automatic CN Number on client mount
  useEffect(() => {
    setCnNumber(`ALC126${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  // Fetch Master Data (Customers, Branches, Vehicles) from Admin
  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data)) {
          setCustomerDirectory(resData.data);
        }
      })
      .catch(() => {});

    fetch("/api/branches")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data)) {
          setBranchesDirectory(resData.data);
          if (resData.data.length > 0 && !billedAt) {
            setBilledAt(`${resData.data[0].branchCode} - ${resData.data[0].branchName}`);
          }
        }
      })
      .catch(() => {});

    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data)) {
          setVehiclesDirectory(resData.data);
        }
      })
      .catch(() => {});
  }, []);

  // Recalculate freight whenever weight or basic rate triggers
  const subTotal = Number(freightAmount || 0) + Number(loadingCharge || 0);
  const gstRate = 5;
  const gstAmount = Math.round((subTotal * gstRate) / 100);
  const grandTotal = subTotal + gstAmount;

  const handleSelectCustomer = (cust: CustomerOption) => {
    if (lookupTarget === "billing") {
      setBillingParty(cust.name);
      if (cust.gstin) setCustomerGstNo(cust.gstin);
    } else if (lookupTarget === "consignor") {
      setConsignorName(cust.name);
      if (cust.gstin) setConsignorGstin(cust.gstin);
      if (cust.address) setConsignorAddress(cust.address);
      if (cust.city) setConsignorCity(cust.city);
      if (cust.phone) setConsignorTelephone(cust.phone);
    } else if (lookupTarget === "consignee") {
      setConsigneeName(cust.name);
      if (cust.gstin) setConsigneeGstin(cust.gstin);
      if (cust.address) setConsigneeAddress(cust.address);
      if (cust.city) setConsigneeCity(cust.city);
      if (cust.phone) setConsigneeTelephone(cust.phone);
    }
    setLookupTarget(null);
  };

  const handleResetForm = () => {
    const generated = `ALC126${Math.floor(1000 + Math.random() * 9000)}`;
    setCnNumber(generated);
    setCnDate(getTodayStr());
    setBillingParty("");
    setBuDescription("");
    setPaymentType("TBB");
    setMode("Road");
    setBilledAt(branchesDirectory.length > 0 ? `${branchesDirectory[0].branchCode} - ${branchesDirectory[0].branchName}` : "");
    setExpectedDeliveryDate(getTodayStr());
    setEwayBillNo("");
    setEwayBillExpiryDate(getTodayStr());
    setIsLocalCn("Yes");
    setVehicleNo("");
    setDriverNo("");
    setApproxKm("0");
    setCustomerGstNo("");
    setConsignorName("");
    setConsignorGstin("");
    setConsignorAddress("");
    setConsignorCity("");
    setConsignorPincode("");
    setConsignorTelephone("");
    setConsigneeName("");
    setConsigneeGstin("");
    setConsigneeAddress("");
    setConsigneeCity("");
    setConsigneePincode("");
    setConsigneeTelephone("");
    setRiskType("Owner's Risk");
    setPolicyNo("");
    setPolicyDate(getTodayStr());
    setShipment("");
    setPoNo("");
    setContainerNumber("");
    setContainerSize("");
    setInvoiceBeNo("0");
    setInvoiceBeDate(getTodayStr());
    setDeclaredValue("0");
    setCurrency("INR");
    setPackagesCount(0);
    setPackagingType("");
    setProductSaidToContain("");
    setActualWeight(0);
    setChargedWeight(0);
    setFreightAmount(0);
    setLoadingCharge(0);
    setSealNo("0");
    setSpecialInstructions("");
    setSavedDraftDocket(null);
    setAllocatedDocketModal(null);
    setFeedback({ type: "success", message: "Form cleared. Initial fields ready." });
    setTimeout(() => setFeedback(null), 2500);
  };

  const buildPayload = (status: "DRAFT" | "BOOKED", targetDocketNo?: string) => {
    const finalDocketNo = (targetDocketNo || cnNumber || `ALC126${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
    return {
      docketNo: finalDocketNo,
      bookingDate: cnDate,
      bookingType: "NORMAL" as const,
      bookingBranch: billedAt.split("-")[0]?.trim() || "ALC1",
      billingParty: billingParty.trim(),
      paymentBasis: paymentType,
      serviceType: "FTL",
      fromLocation: consignorCity.trim() || "MUMBAI",
      toLocation: consigneeCity.trim() || "DELHI",
      buDescription,
      mode,
      billedAt,
      expectedDeliveryDate,
      isLocalCn,
      vehicleNo,
      driverNo,
      approxKm: Number(approxKm) || 0,
      customerGstNo,
      consignorName: consignorName.trim(),
      consignorGstin,
      consignorAddress,
      consignorCity,
      consignorPincode,
      consignorPhone: consignorTelephone,
      consigneeName: consigneeName.trim(),
      consigneeGstin,
      consigneeAddress,
      consigneeCity,
      consigneePincode,
      consigneePhone: consigneeTelephone,
      riskType,
      policyNo,
      policyDate,
      shipment,
      poNo,
      containerNumber,
      containerSize,
      invoiceBeNo,
      invoiceBeDate,
      declaredValue: Number(declaredValue) || 0,
      currency,
      packageType: packagingType,
      productDescription: productSaidToContain,
      packagesCount: Number(packagesCount) || 1,
      actualWeight: Number(actualWeight) || 1,
      chargedWeight: Number(chargedWeight) || 1,
      freightAmount: Number(freightAmount) || 0,
      loadingCharge: Number(loadingCharge) || 0,
      sealNo,
      ewayBillNo,
      ewayBillExpiry: ewayBillExpiryDate,
      specialInstructions,
      remark: specialInstructions,
      status
    };
  };

  // STEP 1: Generate a docket number, save all details in draft, and present allocation confirmation
  const handleGenerateDocketAndSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    // If automatic mode and not yet assigned, generate a fresh docket number
    const allocated = generationMode === "AUTOMATIC" && !savedDraftDocket
      ? `ALC126${Math.floor(1000 + Math.random() * 9000)}`
      : cnNumber.trim().toUpperCase();

    setCnNumber(allocated);
    setModalDocketInput(allocated);

    const payload = buildPayload("DRAFT", allocated);

    try {
      const res = await fetch("/api/consignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSavedDraftDocket(allocated);
        setAllocatedDocketModal({
          docketNo: allocated,
          details: payload
        });
        setFeedback({
          type: "success",
          message: `Docket Number ${allocated} generated! Details saved in draft. Confirm and insert docket to finalize.`
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to generate docket and save details."
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Network communication error." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Selected docket number is inserted and CN is published / finalised
  const handleFinalizeAndPublish = async (targetDocketNo?: string) => {
    setIsSubmitting(true);
    setFeedback(null);

    const finalDocket = (targetDocketNo || modalDocketInput || savedDraftDocket || cnNumber).trim().toUpperCase();
    setCnNumber(finalDocket);

    const payload = buildPayload("BOOKED", finalDocket);

    try {
      const res = await fetch("/api/consignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAllocatedDocketModal(null);
        setSavedDraftDocket(null);

        // Open post-booking print and dispatch pipeline
        setBookedCnPipeline({
          cnNumber: finalDocket,
          bookingDate: cnDate,
          consignor: { name: consignorName, address: `${consignorAddress}, ${consignorCity}` },
          consignee: { name: consigneeName, address: `${consigneeAddress}, ${consigneeCity}` },
          originBranch: consignorCity,
          destinationBranch: consigneeCity,
          packageCount: Number(packagesCount),
          packageType: packagingType,
          actualWeight: Number(actualWeight),
          chargedWeight: Number(chargedWeight),
          totalFreight: Number(freightAmount),
          freightCharges: {
            subtotal: subTotal,
            gst: gstAmount,
            grandTotal
          }
        });

        setFeedback({
          type: "success",
          message: `Consignment Note ${finalDocket} published and finalized successfully! Ready for printing.`
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to publish consignment note."
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Network communication error." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDirectory = customerDirectory.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.gstin?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.city?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <PageHeader
        moduleCode="C010"
        title="CN - INFORMATION"
        subtitle="Operations • ReliableDocketScr.aspx • Standard Consignment Note Information Hub"
        breadcrumbs={[
          { label: "Operations", href: "/dashboard" },
          { label: "Consignment Management", href: "/dashboard/operations/cn-operations" },
          { label: "CN - Information" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/operations/dockets")}
              className="px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dockets Register
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Form
            </button>
          </div>
        }
      />

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs animate-in fade-in ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleGenerateDocketAndSaveDraft} className="space-y-5">
        {/* ======================================================== */}
        {/* SECTION 1: CN SUMMARY                                    */}
        {/* ======================================================== */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                CN
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">CN Summary...</h2>
                <p className="text-[11px] text-blue-100">Primary consignment headers, mode, vehicle, and corridor routing</p>
              </div>
            </div>

            {/* Manual vs Automatically Radio */}
            <div className="flex items-center gap-4 bg-white/10 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="genMode"
                  value="MANUAL"
                  checked={generationMode === "MANUAL"}
                  onChange={() => setGenerationMode("MANUAL")}
                  className="text-blue-500 focus:ring-blue-400"
                />
                <span>Manual</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="genMode"
                  value="AUTOMATIC"
                  checked={generationMode === "AUTOMATIC"}
                  onChange={() => {
                    setGenerationMode("AUTOMATIC");
                    setCnNumber(`ALC126${Math.floor(1000 + Math.random() * 9000)}`);
                  }}
                  className="text-blue-500 focus:ring-blue-400"
                />
                <span>Automatically</span>
              </label>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* CN Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                CN Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                readOnly={generationMode === "AUTOMATIC"}
                value={cnNumber}
                onChange={(e) => setCnNumber(e.target.value)}
                placeholder="e.g. ALC126001"
                className={`w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-bold ${
                  generationMode === "AUTOMATIC" ? "bg-slate-100 text-slate-700 cursor-not-allowed" : "bg-white text-blue-700 focus:ring-2 focus:ring-blue-500"
                }`}
              />
            </div>

            {/* CN Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                CN Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={cnDate}
                onChange={(e) => setCnDate(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Billing Party */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Billing Party <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  required
                  value={billingParty}
                  onChange={(e) => setBillingParty(e.target.value)}
                  placeholder="Select or enter billing party"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLookupTarget("billing");
                    setCustomerSearch("");
                  }}
                  title="Lookup from Customer Master"
                  className="h-9 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs shrink-0 cursor-pointer transition-colors"
                >
                  ...
                </button>
              </div>
            </div>

            {/* Bu Description */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bu Description</label>
              <select
                value={buDescription}
                onChange={(e) => setBuDescription(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">---select---</option>
                <option value="FTL Division">FTL Division</option>
                <option value="Express Cargo">Express Cargo</option>
                <option value="Cold Chain">Cold Chain</option>
                <option value="Project Cargo">Project Cargo</option>
                <option value="General Logistics">General Logistics</option>
              </select>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="TBB">TBB (To Be Billed)</option>
                <option value="PAID">Paid</option>
                <option value="TO_PAY">To Pay</option>
              </select>
            </div>

            {/* Mode */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Road">Road</option>
                <option value="Air">Air</option>
                <option value="Train">Train</option>
                <option value="Sea">Sea</option>
              </select>
            </div>

            {/* Billed At (From Branch Master) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Billed At <span className="text-red-500">*</span>
              </label>
              {branchesDirectory.length > 0 ? (
                <select
                  required
                  value={billedAt}
                  onChange={(e) => setBilledAt(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {branchesDirectory.map((b) => (
                    <option key={b._id || b.branchCode} value={`${b.branchCode} - ${b.branchName}`}>
                      {b.branchCode} - {b.branchName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={billedAt}
                  onChange={(e) => setBilledAt(e.target.value)}
                  placeholder="e.g. ALC1 - Mumbai Central"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expected Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* E Waybill No */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">E Waybill No</label>
              <input
                type="text"
                value={ewayBillNo}
                onChange={(e) => setEwayBillNo(e.target.value)}
                placeholder="12-digit GST E-Way Bill"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* E - Way bill Expiry Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">E - Way bill Expiry Date</label>
              <input
                type="date"
                value={ewayBillExpiryDate}
                onChange={(e) => setEwayBillExpiryDate(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Local CN */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Local CN</label>
              <select
                value={isLocalCn}
                onChange={(e) => setIsLocalCn(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Vehicle No (From Vehicle Master) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vehicle No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                list="vehiclesList"
                value={vehicleNo}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setVehicleNo(val);
                  const match = vehiclesDirectory.find((v) => v.vehicleNumber === val);
                  if (match && match.driverMobile && !driverNo) {
                    setDriverNo(match.driverMobile);
                  }
                }}
                placeholder="e.g. MH04AB1234"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="vehiclesList">
                {vehiclesDirectory.map((v) => (
                  <option key={v._id || v.vehicleNumber} value={v.vehicleNumber}>
                    {v.vehicleType ? `${v.vehicleType} • ` : ""}{v.ownerName || ""}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Driver No */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Driver No</label>
              <input
                type="text"
                value={driverNo}
                onChange={(e) => setDriverNo(e.target.value)}
                placeholder="Driver Contact / License"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Approx KM */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Approx KM</label>
              <input
                type="number"
                value={approxKm}
                onChange={(e) => setApproxKm(e.target.value)}
                placeholder="0"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Customer GSTNo */}
            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Customer GSTNo</label>
              <input
                type="text"
                value={customerGstNo}
                onChange={(e) => setCustomerGstNo(e.target.value.toUpperCase())}
                placeholder="e.g. 27AAACT2727Q1ZB"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2 & 3: CONSIGNOR & CONSIGNEE                     */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Enter From Existing Consignor */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Enter From Existing Consignor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLookupTarget("consignor");
                  setCustomerSearch("");
                }}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Select Consignor</span>
                <span className="font-bold">...</span>
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={consignorGstin}
                    onChange={(e) => setConsignorGstin(e.target.value.toUpperCase())}
                    placeholder="Consignor GSTIN"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={consignorName}
                      onChange={(e) => setConsignorName(e.target.value)}
                      placeholder="Consignor firm or entity"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLookupTarget("consignor");
                        setCustomerSearch("");
                      }}
                      className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs shrink-0 cursor-pointer"
                    >
                      ...
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={consignorAddress}
                  onChange={(e) => setConsignorAddress(e.target.value)}
                  placeholder="Street / Warehouse / MIDC unit"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={consignorCity}
                    onChange={(e) => setConsignorCity(e.target.value.toUpperCase())}
                    placeholder="PUNE"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={consignorPincode}
                    onChange={(e) => setConsignorPincode(e.target.value)}
                    placeholder="411026"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Telephone</label>
                  <input
                    type="text"
                    value={consignorTelephone}
                    onChange={(e) => setConsignorTelephone(e.target.value)}
                    placeholder="020..."
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Select From Existing Consignee */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Select From Existing Consignee
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLookupTarget("consignee");
                  setCustomerSearch("");
                }}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Select Consignee</span>
                <span className="font-bold">...</span>
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={consigneeGstin}
                    onChange={(e) => setConsigneeGstin(e.target.value.toUpperCase())}
                    placeholder="Consignee GSTIN"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={consigneeName}
                      onChange={(e) => setConsigneeName(e.target.value)}
                      placeholder="Consignee destination recipient"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLookupTarget("consignee");
                        setCustomerSearch("");
                      }}
                      className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs shrink-0 cursor-pointer"
                    >
                      ...
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={consigneeAddress}
                  onChange={(e) => setConsigneeAddress(e.target.value)}
                  placeholder="Drop warehouse / delivery address"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={consigneeCity}
                    onChange={(e) => setConsigneeCity(e.target.value.toUpperCase())}
                    placeholder="GURUGRAM"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={consigneePincode}
                    onChange={(e) => setConsigneePincode(e.target.value)}
                    placeholder="122015"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Telephone</label>
                  <input
                    type="text"
                    value={consigneeTelephone}
                    onChange={(e) => setConsigneeTelephone(e.target.value)}
                    placeholder="0124..."
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 4: DOCUMENTATION DETAILS                         */}
        {/* ======================================================== */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Documentation Details
            </h3>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Risk Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Risk Type <span className="text-red-500">*</span>
              </label>
              <select
                value={riskType}
                onChange={(e) => setRiskType(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer font-medium"
              >
                <option value="Owner's Risk">Owner&apos;s Risk</option>
                <option value="Carrier's Risk">Carrier&apos;s Risk</option>
              </select>
            </div>

            {/* Policy No */}
            <div>
              <label className="block font-medium text-slate-600 mb-1">Policy No.</label>
              <input
                type="text"
                value={policyNo}
                onChange={(e) => setPolicyNo(e.target.value)}
                placeholder="Insurance Policy No."
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Policy Date */}
            <div>
              <label className="block font-medium text-slate-600 mb-1">Policy date</label>
              <input
                type="date"
                value={policyDate}
                onChange={(e) => setPolicyDate(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Shipment */}
            <div>
              <label className="block font-medium text-slate-600 mb-1">Shipment</label>
              <input
                type="text"
                value={shipment}
                onChange={(e) => setShipment(e.target.value)}
                placeholder="e.g. FCL Full Load"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* PO No */}
            <div>
              <label className="block font-medium text-slate-600 mb-1">PO No.</label>
              <input
                type="text"
                value={poNo}
                onChange={(e) => setPoNo(e.target.value)}
                placeholder="Purchase Order Reference"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            {/* Container Number */}
            <div>
              <label className="block font-medium text-slate-600 mb-1">Container Number</label>
              <input
                type="text"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                placeholder="e.g. MSKU-781920-1"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 font-mono uppercase"
              />
            </div>

            {/* Container Size */}
            <div className="lg:col-span-2">
              <label className="block font-medium text-slate-600 mb-1">Container Size</label>
              <input
                type="text"
                value={containerSize}
                onChange={(e) => setContainerSize(e.target.value)}
                placeholder="e.g. 20 FT / 40 FT / 32 FT SXL"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 5: INVOICE DETAILS                               */}
        {/* ======================================================== */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Invoice Details
            </h3>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Invoice / BE No */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invoice / BE No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={invoiceBeNo}
                onChange={(e) => setInvoiceBeNo(e.target.value)}
                placeholder="0"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-medium bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Invoice / BE Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice / BE Date</label>
              <input
                type="date"
                value={invoiceBeDate}
                onChange={(e) => setInvoiceBeDate(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Declared Value */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Declared Value</label>
              <input
                type="number"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                placeholder="0"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer font-bold font-mono"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 6: CONSIGNMENT DETAILS                           */}
        {/* ======================================================== */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Consignment Details
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Goods Classification & Cargo Weight Specs
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* No. of packages */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. of packages <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={packagesCount}
                onChange={(e) => setPackagesCount(Number(e.target.value))}
                placeholder="0"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Packaging Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Packaging Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">---select---</option>
                <option value="Carton">Carton</option>
                <option value="Wooden Box">Wooden Box</option>
                <option value="Pallet">Pallet</option>
                <option value="Drum">Drum</option>
                <option value="Bags">Bags</option>
                <option value="Rolls">Rolls</option>
                <option value="Loose">Loose</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Said to contain (Product) */}
            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Said to contain (Product) <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={productSaidToContain}
                onChange={(e) => setProductSaidToContain(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">---select---</option>
                <option value="Automobile Spare Parts">Automobile Spare Parts</option>
                <option value="Industrial Machinery">Industrial Machinery</option>
                <option value="Electronics & Components">Electronics & Components</option>
                <option value="Chemicals & Polymers">Chemicals & Polymers</option>
                <option value="Textiles & Garments">Textiles & Garments</option>
                <option value="FMCG & Food Products">FMCG & Food Products</option>
                <option value="Pharmaceutical Goods">Pharmaceutical Goods</option>
                <option value="General Merchandise">General Merchandise</option>
              </select>
            </div>

            {/* Actual weight (Kg.) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Actual weight (Kg.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0.1}
                step="any"
                value={actualWeight}
                onChange={(e) => setActualWeight(Number(e.target.value))}
                placeholder="0"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-medium bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Charged weight (Kg.) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Charged weight (Kg.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0.1}
                step="any"
                value={chargedWeight}
                onChange={(e) => setChargedWeight(Number(e.target.value))}
                placeholder="0"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-700 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Freight Amount */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Freight Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={freightAmount}
                onChange={(e) => setFreightAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Loading Charge */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Loading Charge</label>
              <input
                type="number"
                value={loadingCharge}
                onChange={(e) => setLoadingCharge(Number(e.target.value))}
                placeholder="0"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Seal No */}
            <div className="lg:col-span-4">
              <label className="block font-semibold text-slate-700 mb-1">Seal No</label>
              <input
                type="text"
                value={sealNo}
                onChange={(e) => setSealNo(e.target.value)}
                placeholder="0"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Special Instructions with character counter */}
            <div className="lg:col-span-4">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Special Instructions <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {Math.max(0, 200 - specialInstructions.length)} characters remaining
                </span>
              </div>
              <textarea
                required
                maxLength={200}
                rows={3}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Enter transit or delivery precautions (max 200 characters)..."
                className="w-full p-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FINANCIAL SUMMARY & SUBMISSION DOCK                      */}
        {/* ======================================================== */}
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
            <div className="border-r border-slate-800 pr-4">
              <span className="text-[11px] text-slate-400 block">Freight</span>
              <span className="text-base font-bold font-mono">₹{freightAmount.toLocaleString()}</span>
            </div>
            <div className="border-r border-slate-800 pr-4">
              <span className="text-[11px] text-slate-400 block">Loading</span>
              <span className="text-base font-bold font-mono">₹{loadingCharge.toLocaleString()}</span>
            </div>
            <div className="border-r border-slate-800 pr-4">
              <span className="text-[11px] text-slate-400 block">GST (5%)</span>
              <span className="text-base font-bold font-mono text-amber-400">₹{gstAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Grand Total</span>
              <span className="text-lg font-black font-mono text-emerald-400">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>{savedDraftDocket ? "Update Docket Details" : "Generate Docket No. & Save Details"}</span>
                </>
              )}
            </button>
            {savedDraftDocket && (
              <button
                type="button"
                onClick={() => handleFinalizeAndPublish(savedDraftDocket)}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0 animate-in fade-in"
              >
                <CheckCircle className="w-4 h-4 text-emerald-100" />
                <span>Insert Docket ({savedDraftDocket}) & Publish CN</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ======================================================== */}
      {/* DOCKET NUMBER ALLOCATION & CONFIRMATION MODAL            */}
      {/* ======================================================== */}
      {allocatedDocketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shadow-2xs">
                  <Hash className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Docket Number Allocated!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Details saved in draft state • Insert docket to finalize &amp; publish
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllocatedDocketModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Docket Display & Selection Box */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                Selected / Allocated Docket Number:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={modalDocketInput}
                  onChange={(e) => setModalDocketInput(e.target.value.toUpperCase())}
                  placeholder="Docket Number"
                  className="flex-1 h-11 px-3 text-base font-mono font-bold text-blue-800 bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider text-center shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Confirm this system docket number or adjust it to match your physical pre-printed stationary series before finalizing.
              </p>
            </div>

            {/* Quick summary verification */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Billing Party:</span>
                <span className="font-semibold text-slate-800">{billingParty || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Route Corridor:</span>
                <span className="font-semibold text-slate-800">{consignorCity || "Origin"} &rarr; {consigneeCity || "Destination"}</span>
              </div>
              <div className="flex justify-between">
                <span>Packages / Weight:</span>
                <span className="font-semibold text-slate-800">{packagesCount} pkgs ({chargedWeight} kg)</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span>Grand Total:</span>
                <span className="font-bold text-blue-700 font-mono">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={() => setAllocatedDocketModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Keep as Draft
              </button>
              <button
                type="button"
                disabled={!modalDocketInput.trim() || isSubmitting}
                onClick={() => handleFinalizeAndPublish(modalDocketInput)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm cursor-pointer transition-all shrink-0"
              >
                <CheckCircle className="w-4 h-4 text-emerald-100" />
                <span>Insert Docket &amp; Publish CN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LOOKUP POPUP MODAL (Billing, Consignor, Consignee)       */}
      {/* ======================================================== */}
      {lookupTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Select {lookupTarget === "billing" ? "Billing Party" : lookupTarget === "consignor" ? "Consignor" : "Consignee"}
                </h3>
                <p className="text-[11px] text-slate-500">Pick from customer directory or verified business partners</p>
              </div>
              <button
                type="button"
                onClick={() => setLookupTarget(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  autoFocus
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search by company name, GSTIN, or city..."
                  className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-2">
              {filteredDirectory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching customers found.
                </div>
              ) : (
                filteredDirectory.map((cust, idx) => (
                  <div
                    key={cust._id || idx}
                    onClick={() => handleSelectCustomer(cust)}
                    className="p-3 hover:bg-blue-50/70 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900">{cust.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cust.city ? `${cust.city} • ` : ""}GSTIN: {cust.gstin || "N/A"}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-100/60 px-2.5 py-1 rounded-md">
                      Select
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setLookupTarget(null)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* POST-BOOKING NEXT STEPS PIPELINE (Solves "The Flow")    */}
      {/* ======================================================== */}
      {bookedCnPipeline && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Consignment Note {bookedCnPipeline.cnNumber} Booked!
                  </h3>
                  <p className="text-xs text-slate-500">
                    General Ledger posted • Ready for dispatch & multi-format printing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookedCnPipeline(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Route Corridor:</span>
                <span className="font-bold text-slate-800">
                  {bookedCnPipeline.originBranch} &rarr; {bookedCnPipeline.destinationBranch}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Packages / Weight:</span>
                <span className="font-bold text-slate-800">
                  {bookedCnPipeline.packageCount} pkgs ({bookedCnPipeline.chargedWeight} kg)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Grand Total (inc. GST):</span>
                <span className="font-bold text-blue-700 font-mono">
                  ₹{bookedCnPipeline.freightCharges.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Next Steps Pipeline:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => printLaserA4Cn(bookedCnPipeline)}
                  className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 border border-blue-200 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Laser A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => printThermalCounterSlip(bookedCnPipeline)}
                  className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 border border-amber-200 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>3-Inch Thermal</span>
                </button>
                <button
                  type="button"
                  onClick={() => printDotMatrixSheet(bookedCnPipeline)}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Dot-Matrix</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setBookedCnPipeline(null);
                  handleResetForm();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                + Book Another CN
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/operations/dockets")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                View Consignments List &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
