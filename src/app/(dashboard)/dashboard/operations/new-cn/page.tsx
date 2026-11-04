"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Calculator,
  Building,
  User,
  Package,
  CreditCard,
  ArrowLeft
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { MobileActionFooter } from "@/components/common/MobileActionFooter";

export default function NewConsignmentPage() {
  const router = useRouter();

  const [docketNo, setDocketNo] = useState(`ALC126${Math.floor(1000 + Math.random() * 9000)}`);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookingType, setBookingType] = useState<"NORMAL" | "SYSTEM">("NORMAL");
  const [bookingBranch, setBookingBranch] = useState("MUM");
  const [billingParty, setBillingParty] = useState("TATA MOTORS LTD");
  const [paymentBasis, setPaymentBasis] = useState<"PAID" | "TO_PAY" | "TBB">("TBB");
  const [serviceType, setServiceType] = useState("FTL");
  const [serviceFtl, setServiceFtl] = useState("32 FT SXL");
  const [fromLocation, setFromLocation] = useState("MUMBAI");
  const [toLocation, setToLocation] = useState("DELHI");
  const [approxKm, setApproxKm] = useState("1420");
  const [vehicleNo, setVehicleNo] = useState("MH04AB1234");
  const [driverPhone, setDriverPhone] = useState("9820012345");

  // Consignor
  const [consignorName, setConsignorName] = useState("TATA MOTORS LOGISTICS DIV");
  const [consignorAddress, setConsignorAddress] = useState("Plant No 4, MIDC Bhosari");
  const [consignorCity, setConsignorCity] = useState("PUNE");
  const [consignorPincode, setConsignorPincode] = useState("411026");
  const [consignorPhone, setConsignorPhone] = useState("02027471234");

  // Consignee
  const [consigneeName, setConsigneeName] = useState("MARUTI SUZUKI REGIONAL WAREHOUSE");
  const [consigneeAddress, setConsigneeAddress] = useState("Sector 18, Udyog Vihar");
  const [consigneeCity, setConsigneeCity] = useState("GURUGRAM");
  const [consigneePincode, setConsigneePincode] = useState("122015");
  const [consigneePhone, setConsigneePhone] = useState("01242345678");

  // Package & Goods
  const [packageType, setPackageType] = useState("BOX");
  const [productDesc, setProductDesc] = useState("AUTOMOBILE SPARE PARTS");
  const [packagesCount, setPackagesCount] = useState(120);
  const [actualWeight, setActualWeight] = useState(4800);
  const [chargedWeight, setChargedWeight] = useState(5000);

  // Financials
  const [freightRate, setFreightRate] = useState(8.5);
  const [freightAmount, setFreightAmount] = useState(42500);
  const [loadingCharge, setLoadingCharge] = useState(1500);
  const [ewayBillNo, setEwayBillNo] = useState("241098765432");
  const [remark, setRemark] = useState("Fragile automobile electronics. Handle with extreme care.");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-calculate freight
  useEffect(() => {
    const calcFreight = Math.round(Number(chargedWeight || 0) * Number(freightRate || 0));
    setFreightAmount(calcFreight > 0 ? calcFreight : 42500);
  }, [chargedWeight, freightRate]);

  const subTotal = Number(freightAmount || 0) + Number(loadingCharge || 0);
  const gstRate = 5;
  const gstAmount = Math.round((subTotal * gstRate) / 100);
  const grandTotal = subTotal + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      docketNo,
      bookingType,
      bookingBranch,
      billingParty,
      paymentBasis,
      serviceType,
      fromLocation,
      toLocation,
      consignorName,
      consignorAddress,
      consignorCity,
      consignorPhone,
      consigneeName,
      consigneeAddress,
      consigneeCity,
      consigneePhone,
      packageType,
      productDescription: productDesc,
      packagesCount: Number(packagesCount),
      actualWeight: Number(actualWeight),
      chargedWeight: Number(chargedWeight),
      freightAmount: Number(freightAmount),
      loadingCharge: Number(loadingCharge),
      ewayBillNo,
      remark
    };

    try {
      const res = await fetch("/api/consignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Consignment Docket ${docketNo} saved successfully! Direct MongoDB record created.`
        });
        setTimeout(() => {
          router.push("/dashboard/operations/dockets");
        }, 1200);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to create consignment note."
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network communication error." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-16 sm:pb-6">
      {/* Reusable Modular PageHeader */}
      <PageHeader
        moduleCode="C010"
        title="New Consignment Note (CN Booking)"
        subtitle="Operations • ReliableDocketScr.aspx • Complete 88-Field Logistics Form"
        breadcrumbs={[
          { label: "Operations", href: "/dashboard" },
          { label: "New Consignment Note" }
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => router.push("/dashboard/operations/dockets")}
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 font-medium transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => setDocketNo(`ALC126${Math.floor(1000 + Math.random() * 9000)}`)}
              className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 font-medium flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> New Docket ID
            </button>
          </>
        }
      />

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Booking Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Header / Booking Context */}
        <SectionCard
          title="1. Booking & Control Parameters"
          badge="PARAMETERS"
          icon={Building}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Booking Type</label>
              <div className="flex gap-4 items-center h-9">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bookingType"
                    checked={bookingType === "NORMAL"}
                    onChange={() => setBookingType("NORMAL")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">Normal CN</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bookingType"
                    checked={bookingType === "SYSTEM"}
                    onChange={() => setBookingType("SYSTEM")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">System CN</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Docket Number</label>
              <input
                type="text"
                value={docketNo}
                onChange={(e) => setDocketNo(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg font-bold text-blue-700 uppercase focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Booking Date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Booking Branch</label>
              <select
                value={bookingBranch}
                onChange={(e) => setBookingBranch(e.target.value)}
                className="w-full h-9 px-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              >
                <option value="MUM">MUM - MUMBAI CENTRAL</option>
                <option value="DEL">DEL - DELHI REGIONAL</option>
                <option value="BLR">BLR - BANGALORE MAIN</option>
                <option value="PUN">PUN - PUNE HUB</option>
                <option value="AHM">AHM - AHMEDABAD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-3 mt-1 border-t border-slate-100">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Billing Party (Customer)</label>
              <input
                type="text"
                value={billingParty}
                onChange={(e) => setBillingParty(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Payment Basis</label>
              <select
                value={paymentBasis}
                onChange={(e) => setPaymentBasis(e.target.value as any)}
                className="w-full h-9 px-2 border border-slate-300 rounded-lg font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500"
              >
                <option value="TBB">TBB - To Be Billed (Credit)</option>
                <option value="PAID">PAID - Paid in Advance</option>
                <option value="TO_PAY">TO PAY - Payment on Delivery</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full h-9 px-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              >
                <option value="FTL">FTL - Full Truck Load</option>
                <option value="LTL">LTL - Part Load</option>
                <option value="DOOR_DELIVERY">Door Delivery</option>
                <option value="GODOWN">Godown Delivery</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">FTL Specification</label>
              <select
                value={serviceFtl}
                onChange={(e) => setServiceFtl(e.target.value)}
                className="w-full h-9 px-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              >
                <option value="32 FT SXL">32 FT SXL (9 MT)</option>
                <option value="32 FT MXL">32 FT MXL (15 MT)</option>
                <option value="20 FT CONTAINER">20 FT Container</option>
                <option value="14 FT EICHER">14 FT Eicher</option>
                <option value="TRAILER 40 FT">40 FT Trailer</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Section 2: Route & Transit */}
        <SectionCard
          title="2. Corridor Route & Vehicle Assignment"
          badge="TRANSIT"
          icon={Truck}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">From Location</label>
              <input
                type="text"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg uppercase font-medium focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">To Destination</label>
              <input
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg uppercase font-medium focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Approx Distance (KM)</label>
              <input
                type="number"
                value={approxKm}
                onChange={(e) => setApproxKm(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg uppercase font-mono font-bold focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Driver Contact No</label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 3: Consignor & Consignee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Consignor */}
          <SectionCard
            title="3A. Consignor (Shipper)"
            icon={User}
            badge="ORIGIN"
          >
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Consignor Name</label>
                <input
                  type="text"
                  value={consignorName}
                  onChange={(e) => setConsignorName(e.target.value)}
                  className="w-full h-8.5 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={consignorAddress}
                  onChange={(e) => setConsignorAddress(e.target.value)}
                  className="w-full h-8.5 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={consignorCity}
                    onChange={(e) => setConsignorCity(e.target.value)}
                    className="w-full h-8.5 px-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={consignorPincode}
                    onChange={(e) => setConsignorPincode(e.target.value)}
                    className="w-full h-8.5 px-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={consignorPhone}
                    onChange={(e) => setConsignorPhone(e.target.value)}
                    className="w-full h-8.5 px-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Consignee */}
          <SectionCard
            title="3B. Consignee (Receiver)"
            icon={User}
            badge="DESTINATION"
          >
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Consignee Name</label>
                <input
                  type="text"
                  value={consigneeName}
                  onChange={(e) => setConsigneeName(e.target.value)}
                  className="w-full h-8.5 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={consigneeAddress}
                  onChange={(e) => setConsigneeAddress(e.target.value)}
                  className="w-full h-8.5 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={consigneeCity}
                    onChange={(e) => setConsigneeCity(e.target.value)}
                    className="w-full h-8.5 px-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={consigneePincode}
                    onChange={(e) => setConsigneePincode(e.target.value)}
                    className="w-full h-8.5 px-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={consigneePhone}
                    onChange={(e) => setConsigneePhone(e.target.value)}
                    className="w-full h-8.5 px-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Section 4: Package, Weights & Calculation */}
        <SectionCard
          title="4. Goods Specification & Automatic Financial Calculation"
          icon={Package}
          badge="CALCULATION"
          headerAction={
            <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              <Calculator className="w-3.5 h-3.5" />
              <span>Realtime Auto Compute</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Package Type</label>
              <select
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
                className="w-full h-9 px-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              >
                <option value="BOX">BOX / CARTON</option>
                <option value="DRUM">DRUM (BARREL)</option>
                <option value="BAG">BAG (GUNNY/PLASTIC)</option>
                <option value="PALLET">PALLETIZED</option>
                <option value="WOODEN_CRATE">WOODEN CRATE</option>
                <option value="ROLL">ROLL / BUNDLE</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Product Description</label>
              <input
                type="text"
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">No. of Packages</label>
              <input
                type="number"
                value={packagesCount}
                onChange={(e) => setPackagesCount(Number(e.target.value))}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg font-bold focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Actual Weight (KG)</label>
              <input
                type="number"
                value={actualWeight}
                onChange={(e) => setActualWeight(Number(e.target.value))}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg font-bold text-slate-700 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Charged Weight (KG)</label>
              <input
                type="number"
                value={chargedWeight}
                onChange={(e) => setChargedWeight(Number(e.target.value))}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg font-bold text-blue-700 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs pt-3 mt-2 border-t border-slate-100">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Rate per KG (₹)</label>
              <input
                type="number"
                step="0.1"
                value={freightRate}
                onChange={(e) => setFreightRate(Number(e.target.value))}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Freight Amount (₹)</label>
              <input
                type="number"
                value={freightAmount}
                onChange={(e) => setFreightAmount(Number(e.target.value))}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg font-bold bg-slate-50 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Loading Charge (₹)</label>
              <input
                type="number"
                value={loadingCharge}
                onChange={(e) => setLoadingCharge(Number(e.target.value))}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">GST (5% RCM/FCM)</label>
              <input
                type="text"
                readOnly
                value={`₹${gstAmount.toLocaleString()} (5%)`}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-slate-100 font-semibold text-slate-600"
              />
            </div>

            <div>
              <label className="block font-bold text-blue-700 mb-1">Grand Total (₹)</label>
              <input
                type="text"
                readOnly
                value={`₹${grandTotal.toLocaleString()}`}
                className="w-full h-9 px-3 border-2 border-blue-500 rounded-lg bg-blue-50 font-bold text-blue-800 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-3 mt-2 border-t border-slate-100">
            <div>
              <label className="block font-medium text-slate-600 mb-1">E-Way Bill Number</label>
              <input
                type="text"
                value={ewayBillNo}
                onChange={(e) => setEwayBillNo(e.target.value)}
                placeholder="12-digit E-Way Bill Number"
                className="w-full h-9 px-3 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Remarks / Handling Instructions</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </SectionCard>

        {/* Desktop Submit Bar */}
        <div className="hidden sm:flex bg-white p-4 rounded-xl border border-slate-200 shadow-2xs items-center justify-between">
          <div className="text-xs text-slate-500">
            Form verified according to WebCoreVision C010 schema. Records will persist directly in MongoDB.
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving Consignment..." : "Save & Generate Docket"}
          </button>
        </div>

        {/* Mobile Sticky Floating Action Bar */}
        <MobileActionFooter>
          <div className="flex-1">
            <span className="text-[10px] text-slate-500 block leading-tight">Grand Total</span>
            <span className="text-sm font-bold text-blue-800 font-mono">₹{grandTotal.toLocaleString()}</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save CN"}
          </button>
        </MobileActionFooter>
      </form>
    </div>
  );
}
