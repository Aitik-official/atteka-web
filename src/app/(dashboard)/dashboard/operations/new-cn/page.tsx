"use client";

import React, { useState, useEffect, useMemo } from "react";
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

  // Section 1: CN Summary (original field set — masters linked in the background)
  const [generationMode, setGenerationMode] = useState<"AUTOMATIC" | "MANUAL">("MANUAL");
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
  const [serviceType, setServiceType] = useState("FTL");
  const [typeOfFtl, setTypeOfFtl] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
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
  const [routesDirectory, setRoutesDirectory] = useState<any[]>([]);
  const [fromOptions, setFromOptions] = useState<string[]>([]);
  const [toOptions, setToOptions] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");

  // Status, draft allocation & pipeline
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [bookedCnPipeline, setBookedCnPipeline] = useState<any | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [savedTempDocket, setSavedTempDocket] = useState<string | null>(null);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [availableDockets, setAvailableDockets] = useState<any[]>([]);
  const [docketSeries, setDocketSeries] = useState<any>(null);
  const [selectedMasterDocket, setSelectedMasterDocket] = useState<string | null>(null);
  const [loadingDockets, setLoadingDockets] = useState(false);
  const [docketPage, setDocketPage] = useState(1);
  const [docketPageSize, setDocketPageSize] = useState(10);
  const [docketStatusFilter, setDocketStatusFilter] = useState<"ALL" | "AVAILABLE" | "USED">("ALL");

  // Fetch Master Data (Customers, Branches, Vehicles, Docket Numbers) from Admin / Masters
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
            setBilledAt(`${resData.data[0].branchName || "Ateka Logistics"}-${resData.data[0].branchCode}`);
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

    fetch("/api/routes")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data)) {
          setRoutesDirectory(resData.data);
          setFromOptions(resData.locations?.origins || []);
          setToOptions(resData.locations?.destinations || []);
        }
      })
      .catch(() => {});
  }, []);

  const applyRouteDistance = (from: string, to: string, routes = routesDirectory) => {
    if (!from || !to) return;
    const normalize = (s: string) => s.toUpperCase().trim();
    const match = routes.find(
      (r) =>
        normalize(r.origin) === normalize(from) &&
        normalize(r.destination) === normalize(to)
    );
    if (match && match.distanceKm != null) {
      setApproxKm(String(match.distanceKm));
    }
  };

  // If From/To already selected when routes finish loading, fill Approx KM
  useEffect(() => {
    if (routesDirectory.length > 0 && fromLocation && toLocation) {
      applyRouteDistance(fromLocation, toLocation, routesDirectory);
    }
  }, [routesDirectory]);

  const isDocketUsed = (status?: string) => {
    const s = String(status || "").toUpperCase();
    return s === "ASSIGNED" || s === "USED" || s === "CANCELLED";
  };

  const displayDocketStatus = (status?: string) => {
    if (isDocketUsed(status)) return "USED";
    if (String(status || "").toUpperCase() === "RESERVED") return "RESERVED";
    return "AVAILABLE";
  };

  const loadAvailableDockets = async () => {
    setLoadingDockets(true);
    try {
      // Load full master pool (available + used) so used numbers stay visible
      const res = await fetch("/api/docket-numbers?includeSeries=1");
      const data = await res.json();
      if (data.success) {
        const list = [...(data.data || [])].sort(
          (a: any, b: any) => Number(a.sequenceNo || 0) - Number(b.sequenceNo || 0)
        );
        setAvailableDockets(list);
        if (data.series) setDocketSeries(data.series);
        setDocketPage(1);
        // Clear selection if previously selected docket is no longer available
        setSelectedMasterDocket((prev) => {
          if (!prev) return null;
          const row = list.find((d: any) => d.docketNo === prev);
          return row && !isDocketUsed(row.status) ? prev : null;
        });
      }
    } catch {
      setAvailableDockets([]);
    } finally {
      setLoadingDockets(false);
    }
  };

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
      if (cust.city) {
        setConsignorCity(cust.city);
        if (!fromLocation) {
          const nextFrom = cust.city.toUpperCase();
          setFromLocation(nextFrom);
          applyRouteDistance(nextFrom, toLocation);
        }
      }
      if (cust.phone) setConsignorTelephone(cust.phone);
    } else if (lookupTarget === "consignee") {
      setConsigneeName(cust.name);
      if (cust.gstin) setConsigneeGstin(cust.gstin);
      if (cust.address) setConsigneeAddress(cust.address);
      if (cust.city) {
        setConsigneeCity(cust.city);
        if (!toLocation) {
          const nextTo = cust.city.toUpperCase();
          setToLocation(nextTo);
          applyRouteDistance(fromLocation, nextTo);
        }
      }
      if (cust.phone) setConsigneeTelephone(cust.phone);
    }
    setLookupTarget(null);
  };

  const handleResetForm = () => {
    setCnNumber("");
    setGenerationMode("MANUAL");
    setCnDate(getTodayStr());
    setBillingParty("");
    setBuDescription("");
    setPaymentType("TBB");
    setMode("Road");
    setBilledAt(
      branchesDirectory.length > 0
        ? `${branchesDirectory[0].branchName || "Ateka Logistics"}-${branchesDirectory[0].branchCode}`
        : ""
    );
    setExpectedDeliveryDate(getTodayStr());
    setEwayBillNo("");
    setEwayBillExpiryDate(getTodayStr());
    setIsLocalCn("Yes");
    setServiceType("FTL");
    setTypeOfFtl("");
    setFromLocation("");
    setToLocation("");
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
    setSavedDraftId(null);
    setSavedTempDocket(null);
    setDetailsSaved(false);
    setSelectedMasterDocket(null);
    setAvailableDockets([]);
    setFeedback({ type: "success", message: "Form cleared. Save CN details first, then assign a docket from master." });
    setTimeout(() => setFeedback(null), 2500);
  };

  const buildPayload = (status: "DRAFT" | "DOCKET_ALLOCATED" | "BOOKED", targetDocketNo?: string) => {
    // Manual CN number is kept if typed; Automatic stays empty until linked from master table
    const finalDocketNo =
      targetDocketNo?.trim().toUpperCase() ||
      (generationMode === "MANUAL" && cnNumber.trim() ? cnNumber.trim().toUpperCase() : undefined);
    return {
      docketNo: finalDocketNo,
      draftId: savedDraftId || undefined,
      previousDocketNo: savedTempDocket || undefined,
      bookingDate: cnDate,
      bookingType: "NORMAL" as const,
      bookingBranch: (billedAt.split("-").pop() || billedAt.split("-")[0] || "ALC1").trim(),
      billingParty: billingParty.trim(),
      paymentBasis: paymentType,
      serviceType: serviceType || "FTL",
      serviceFtl: typeOfFtl || undefined,
      fromLocation: fromLocation.trim() || consignorCity.trim() || "MUMBAI",
      toLocation: toLocation.trim() || consigneeCity.trim() || "DELHI",
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

  // STEP 1: Save CN details only (no docket / CN number yet)
  const handleSaveCnDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const payload = buildPayload("DRAFT");

    try {
      const res = await fetch("/api/consignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const draftId = data.data?._id || null;
        const tempDocket = data.data?.docketNo || null;
        setSavedDraftId(draftId);
        setSavedTempDocket(tempDocket);
        setDetailsSaved(true);
        setCnNumber("");
        setSelectedMasterDocket(null);
        await loadAvailableDockets();
        setFeedback({
          type: "success",
          message: "CN details saved. Select or generate a docket number from master below to link and finalize."
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to save CN details."
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Network communication error." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateMasterDocket = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/docket-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", count: 1 })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const created = Array.isArray(data.data) ? data.data[0] : data.data;
        await loadAvailableDockets();
        if (created?.docketNo) {
          setSelectedMasterDocket(created.docketNo);
        }
        setFeedback({
          type: "success",
          message: `Docket ${created?.docketNo || ""} generated from master series. Select it below to link & finalize.`
        });
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to generate docket from master." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network communication error." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Link selected master docket to CN and publish / finalize
  const handleLinkDocketAndFinalize = async (targetDocketNo?: string) => {
    const finalDocket = (targetDocketNo || selectedMasterDocket || "").trim().toUpperCase();
    if (!finalDocket) {
      setFeedback({ type: "error", message: "Select a docket number from the master table first." });
      return;
    }
    const poolRow = availableDockets.find((d) => d.docketNo === finalDocket);
    if (poolRow && isDocketUsed(poolRow.status)) {
      setFeedback({ type: "error", message: `Docket ${finalDocket} is already USED and cannot be linked.` });
      return;
    }
    if (!detailsSaved || !savedDraftId) {
      setFeedback({ type: "error", message: "Save CN details before assigning a docket number." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      // Mark docket as assigned in master stock pool
      const assignRes = await fetch("/api/docket-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", docketNo: finalDocket, cnId: savedDraftId })
      });
      const assignData = await assignRes.json();
      if (!assignRes.ok || !assignData.success) {
        setFeedback({ type: "error", message: assignData.error || "Could not assign docket from master." });
        setIsSubmitting(false);
        return;
      }

      setCnNumber(finalDocket);
      const payload = buildPayload("BOOKED", finalDocket);

      const res = await fetch("/api/consignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSelectedMasterDocket(null);
        setDetailsSaved(false);
        setSavedDraftId(null);
        setSavedTempDocket(null);
        setAvailableDockets([]);

        setBookedCnPipeline({
          cnNumber: finalDocket,
          bookingDate: cnDate,
          consignor: { name: consignorName, address: `${consignorAddress}, ${consignorCity}` },
          consignee: { name: consigneeName, address: `${consigneeAddress}, ${consigneeCity}` },
          originBranch: fromLocation || consignorCity,
          destinationBranch: toLocation || consigneeCity,
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
          message: `Docket ${finalDocket} linked from master. Consignment Note finalized successfully!`
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

  const filteredMasterDockets = useMemo(() => {
    return availableDockets.filter((d) => {
      const used = isDocketUsed(d.status);
      if (docketStatusFilter === "AVAILABLE") return !used;
      if (docketStatusFilter === "USED") return used;
      return true;
    });
  }, [availableDockets, docketStatusFilter]);

  const docketTotalPages = Math.max(1, Math.ceil(filteredMasterDockets.length / docketPageSize));
  const pagedMasterDockets = filteredMasterDockets.slice(
    (docketPage - 1) * docketPageSize,
    docketPage * docketPageSize
  );
  const availableCount = availableDockets.filter((d) => !isDocketUsed(d.status)).length;
  const usedCount = availableDockets.length - availableCount;

  return (
    <div className="space-y-5 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <PageHeader
        moduleCode="C010"
        title="CN - INFORMATION"
        subtitle="Operations • ReliableDocketScr.aspx • Standard Consignment Note Information Hub"
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
      <form onSubmit={handleSaveCnDetails} className="space-y-5">
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

            {/* Manual vs Automatically */}
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
                    setCnNumber("");
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
                required={generationMode === "MANUAL" && !detailsSaved}
                readOnly={generationMode === "AUTOMATIC"}
                value={cnNumber}
                onChange={(e) => setCnNumber(e.target.value.toUpperCase())}
                placeholder={generationMode === "AUTOMATIC" ? "Assigned from Docket Master after save" : "e.g. ALC126"}
                className={`w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-bold ${
                  generationMode === "AUTOMATIC"
                    ? "bg-slate-100 text-slate-700 cursor-not-allowed"
                    : "bg-white text-blue-700 focus:ring-2 focus:ring-blue-500"
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
                <option value="TBB">TBB</option>
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

            {/* Billed At (Branch Master) */}
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
                  {branchesDirectory.map((b) => {
                    const label = `${b.branchName || "Ateka Logistics"}-${b.branchCode}`;
                    return (
                      <option key={b._id || b.branchCode} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={billedAt}
                  onChange={(e) => setBilledAt(e.target.value)}
                  placeholder="Ateka Logistics-ALC1"
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

            {/* Service Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="FTL">FTL</option>
                <option value="LTL">LTL</option>
                <option value="EXPRESS">EXPRESS</option>
                <option value="PART_LOAD">PART LOAD</option>
              </select>
            </div>

            {/* Type of FTL */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Type of FTL <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={typeOfFtl}
                onChange={(e) => {
                  const val = e.target.value;
                  setTypeOfFtl(val);
                  // Link Type of FTL to matching vehicle type from master when possible
                  const match = vehiclesDirectory.find(
                    (v) =>
                      String(v.vehicleType || "").toUpperCase() === val.toUpperCase() ||
                      String(v.vehicleType || "").toUpperCase().includes(val.toUpperCase().split(" ")[0])
                  );
                  if (match) {
                    setVehicleNo(match.vehicleNumber);
                    if (match.driverPhone) setDriverNo(match.driverPhone);
                  }
                }}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">---select---</option>
                <option value="32 FT CONTAINER VEHICLE">32 FT CONTAINER VEHICLE</option>
                <option value="32 FT SXL">32 FT SXL</option>
                <option value="32 FT MULTI AXLE">32 FT MULTI AXLE</option>
                <option value="20 FT CONTAINER">20 FT CONTAINER</option>
                <option value="TAURUS 10 TYRE">TAURUS 10 TYRE</option>
                {Array.from(new Set(vehiclesDirectory.map((v) => v.vehicleType).filter(Boolean))).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* From — Route Master */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                From <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={fromLocation}
                onChange={(e) => {
                  const val = e.target.value;
                  setFromLocation(val);
                  applyRouteDistance(val, toLocation);
                }}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">---select---</option>
                {fromOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                {fromLocation && !fromOptions.includes(fromLocation) && (
                  <option value={fromLocation}>{fromLocation}</option>
                )}
              </select>
            </div>

            {/* To — Route Master */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                To <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={toLocation}
                onChange={(e) => {
                  const val = e.target.value;
                  setToLocation(val);
                  applyRouteDistance(fromLocation, val);
                }}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">---select---</option>
                {toOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                {toLocation && !toOptions.includes(toLocation) && (
                  <option value={toLocation}>{toLocation}</option>
                )}
              </select>
            </div>

            {/* Vehicle No — dropdown linked to Vehicle Master */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vehicle No <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={vehicleNo}
                onChange={(e) => {
                  const val = e.target.value;
                  setVehicleNo(val);
                  const match = vehiclesDirectory.find((v) => v.vehicleNumber === val);
                  if (match) {
                    if (match.driverPhone) setDriverNo(match.driverPhone);
                    if (match.vehicleType) setTypeOfFtl(match.vehicleType);
                  }
                }}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">---select---</option>
                {vehiclesDirectory.map((v) => (
                  <option key={v._id || v.vehicleNumber} value={v.vehicleNumber}>
                    {v.vehicleNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver No — dropdown linked to Vehicle Master drivers */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Driver No</label>
              <select
                value={driverNo}
                onChange={(e) => {
                  const phone = e.target.value;
                  setDriverNo(phone);
                  // Keep Type of FTL unchanged — driver pick must not overwrite FTL.
                  const match = vehiclesDirectory.find((v) => v.driverPhone === phone);
                  if (match?.vehicleNumber) setVehicleNo(match.vehicleNumber);
                }}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">---select---</option>
                {Array.from(
                  new Map(
                    vehiclesDirectory
                      .filter((v) => v.driverPhone)
                      .map((v) => [v.driverPhone, v])
                  ).values()
                ).map((v) => (
                  <option key={v.driverPhone} value={v.driverPhone}>
                    {v.driverName ? `${v.driverName} - ${v.driverPhone}` : v.driverPhone}
                  </option>
                ))}
              </select>
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
                placeholder="e.g. 27AAACE1795K2ZC - MUMBAI"
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-blue-200" />
                  <span>{detailsSaved ? "Update CN Details" : "Save CN Details"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ======================================================== */}
      {/* DOCKET NUMBER TABLE (shown after CN details are saved)   */}
      {/* ======================================================== */}
      {detailsSaved && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden animate-in fade-in">
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">Assign Docket Number</h2>
                <p className="text-[11px] text-emerald-100">
                  Stock from Admin / Masters • Generate or select a number, then link to finalize this CN
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={loadAvailableDockets}
                disabled={loadingDockets}
                className="px-3 py-1.5 text-xs bg-white/15 hover:bg-white/25 rounded-lg font-semibold cursor-pointer"
              >
                Refresh Pool
              </button>
              <button
                type="button"
                onClick={handleGenerateMasterDocket}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Docket
              </button>
              <button
                type="button"
                disabled={!selectedMasterDocket || isSubmitting}
                onClick={() => handleLinkDocketAndFinalize()}
                className="px-3 py-1.5 text-xs bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Link &amp; Finalize
                {selectedMasterDocket ? ` (${selectedMasterDocket})` : ""}
              </button>
            </div>
          </div>

          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 text-xs text-slate-600 flex flex-wrap items-center gap-4">
            <span>
              Billing: <strong className="text-slate-800">{billingParty || "N/A"}</strong>
            </span>
            <span>
              Route:{" "}
              <strong className="text-slate-800">
                {fromLocation || consignorCity || "Origin"} → {toLocation || consigneeCity || "Destination"}
              </strong>
            </span>
            <span>
              Total: <strong className="text-blue-700 font-mono">₹{grandTotal.toLocaleString()}</strong>
            </span>
            <span>
              Pool:{" "}
              <strong className="text-slate-800">
                {availableDockets.length}
              </strong>{" "}
              (<span className="text-emerald-700 font-semibold">{availableCount} available</span>
              {" · "}
              <span className="text-slate-500 font-semibold">{usedCount} used</span>)
            </span>
            {docketSeries && (
              <span>
                Series:{" "}
                <strong className="font-mono text-slate-800">
                  {docketSeries.prefix}
                  {String(docketSeries.nextSequence).padStart(docketSeries.padLength || 4, "0")}
                </strong>{" "}
                (next)
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <label className="text-slate-600">
                Show{" "}
                <select
                  value={docketStatusFilter}
                  onChange={(e) => {
                    setDocketStatusFilter(e.target.value as any);
                    setDocketPage(1);
                  }}
                  className="h-7 px-2 border border-slate-200 rounded-md bg-white text-xs"
                >
                  <option value="ALL">All</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="USED">Used</option>
                </select>
              </label>
              <label className="text-slate-600">
                <select
                  value={docketPageSize}
                  onChange={(e) => {
                    setDocketPageSize(Number(e.target.value));
                    setDocketPage(1);
                  }}
                  className="h-7 px-2 border border-slate-200 rounded-md bg-white text-xs"
                >
                  {[5, 10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5 w-10"></th>
                  <th className="py-2.5 px-3.5">Docket Number</th>
                  <th className="py-2.5 px-3.5">Series</th>
                  <th className="py-2.5 px-3.5">Sequence</th>
                  <th className="py-2.5 px-3.5">Branch</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingDockets ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading docket numbers from master...
                    </td>
                  </tr>
                ) : filteredMasterDockets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No docket numbers in master. Click{" "}
                      <strong>Generate Docket</strong> or add stock in{" "}
                      <a href="/dashboard/masters/docket-numbers" className="text-blue-700 font-semibold underline">
                        Docket Number Master
                      </a>
                      .
                    </td>
                  </tr>
                ) : (
                  pagedMasterDockets.map((d) => {
                    const used = isDocketUsed(d.status);
                    const statusLabel = displayDocketStatus(d.status);
                    const selected = !used && selectedMasterDocket === d.docketNo;
                    return (
                      <tr
                        key={d._id || d.docketNo}
                        onClick={() => {
                          if (!used) setSelectedMasterDocket(d.docketNo);
                        }}
                        className={`transition-colors ${
                          used
                            ? "bg-slate-50/60 text-slate-400 cursor-default"
                            : selected
                              ? "bg-emerald-50/80 cursor-pointer"
                              : "hover:bg-slate-50/80 cursor-pointer"
                        }`}
                      >
                        <td className="py-2.5 px-3.5">
                          <input
                            type="radio"
                            name="masterDocket"
                            disabled={used}
                            checked={selected}
                            onChange={() => {
                              if (!used) setSelectedMasterDocket(d.docketNo);
                            }}
                            className="text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                          />
                        </td>
                        <td className={`py-2.5 px-3.5 font-bold font-mono ${used ? "text-slate-400" : "text-blue-700"}`}>
                          {d.docketNo}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-600">{d.seriesPrefix}</td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-700">{d.sequenceNo}</td>
                        <td className="py-2.5 px-3.5 text-slate-600">{d.branchCode || "-"}</td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                              statusLabel === "USED"
                                ? "bg-slate-200 text-slate-600"
                                : statusLabel === "RESERVED"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          {used ? (
                            <span className="text-[10px] font-semibold text-slate-400">—</span>
                          ) : (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setSelectedMasterDocket(d.docketNo);
                                handleLinkDocketAndFinalize(d.docketNo);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold cursor-pointer disabled:opacity-50"
                            >
                              Link &amp; Finalize
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
            <div>
              Showing{" "}
              {(docketPage - 1) * docketPageSize + (filteredMasterDockets.length ? 1 : 0)} to{" "}
              {Math.min(docketPage * docketPageSize, filteredMasterDockets.length)} of{" "}
              {filteredMasterDockets.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={docketPage <= 1}
                onClick={() => setDocketPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded bg-white disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(docketTotalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (docketTotalPages > 5) {
                  const start = Math.max(1, Math.min(docketPage - 2, docketTotalPages - 4));
                  pageNum = start + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setDocketPage(pageNum)}
                    className={`px-2.5 py-1 rounded font-bold ${
                      docketPage === pageNum
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={docketPage >= docketTotalPages}
                onClick={() => setDocketPage((p) => Math.min(docketTotalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-200 rounded bg-white disabled:opacity-40 hover:bg-slate-50"
              >
                Next
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
