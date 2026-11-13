"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  Truck
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { toast } from "@/lib/toastBus";

interface DocketLine {
  id: string;
  selected: boolean;
  docketNo: string;
  ewayBillNo: string;
  refDate: string;
  consignorName: string;
  consigneeName: string;
  pkgsLoad: number | string;
  pkgsTotal: number | string;
  weightLoad: number | string;
  weightTotal: number | string;
  customerDockNo: string;
  deliveryAddress: string;
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function formatRefDate(value?: string | Date) {
  if (!value) return todayInput();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayInput();
  return d.toISOString().slice(0, 10);
}

export default function PrepareLoadingSlipPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [bookedCns, setBookedCns] = useState<any[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [tripSheetNo] = useState(`TS${Date.now().toString().slice(-8)}`);
  const [tripDate, setTripDate] = useState(todayInput());
  const [tripTime, setTripTime] = useState("12:00");
  const [manualTripSheetNo, setManualTripSheetNo] = useState("");
  const [location, setLocation] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorCode, setVendorCode] = useState("Auto");
  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");
  const [freight, setFreight] = useState<number | string>(0);
  const [advanceAmt, setAdvanceAmt] = useState<number | string>(0);
  const [balanceAmt, setBalanceAmt] = useState<number | string>(0);
  const [startKm, setStartKm] = useState<number | string>(0);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [showDockets, setShowDockets] = useState(true);

  const [docketLines, setDocketLines] = useState<DocketLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()).catch(() => ({})),
      fetch("/api/branches").then((r) => r.json()).catch(() => ({})),
      fetch("/api/vehicles").then((r) => r.json()).catch(() => ({})),
      fetch("/api/vendors").then((r) => r.json()).catch(() => ({})),
      fetch("/api/routes").then((r) => r.json()).catch(() => ({})),
      fetch("/api/consignments").then((r) => r.json()).catch(() => ({}))
    ]).then(([custRes, branchRes, vehRes, vendorRes, routeRes, cnRes]) => {
      if (custRes.success) setCustomers(custRes.data || []);
      if (branchRes.success) {
        const list = branchRes.data || [];
        setBranches(list);
        if (list[0]) {
          setLocation(`${list[0].branchCode}-${list[0].branchName || "Ateka Logistics"}`);
        }
      }
      if (vehRes.success) setVehicles(vehRes.data || []);
      if (vendorRes.success) setVendors(vendorRes.data || []);
      if (routeRes.success) {
        const loc = routeRes.locations || {};
        const o = loc.origins || [];
        const d = loc.destinations || [];
        setOrigins(o);
        setDestinations(d);
        if (!pickupLocation && o[0]) setPickupLocation(o[0]);
        if (!deliveryLocation && d[0]) setDeliveryLocation(d[0]);
      }
      if (cnRes.success) {
        const eligible = (cnRes.data || []).filter(
          (c: any) =>
            !["DRAFT", "BILLED", "CANCELLED"].includes(c.status) &&
            !c.tripSheetNo
        );
        setBookedCns(eligible);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const f = Number(freight) || 0;
    const a = Number(advanceAmt) || 0;
    setBalanceAmt(Math.max(0, f - a));
  }, [freight, advanceAmt]);

  const handleCustomerChange = (name: string) => {
    setCustomerName(name);
    // Consignor / Consignee on docket lines follow Trip Sheet Customer Name
    if (name) {
      setDocketLines((prev) =>
        prev.map((d) => ({
          ...d,
          consignorName: name,
          consigneeName: name
        }))
      );
    }
  };

  const handleVendorSelect = (name: string) => {
    setVendorName(name);
    const match = vendors.find((v) => v.name === name);
    setVendorCode(match?.vendorCode || "Auto");
  };

  const availableToAdd = useMemo(() => {
    const used = new Set(docketLines.map((d) => d.docketNo));
    return bookedCns.filter((c) => !used.has(c.docketNo));
  }, [bookedCns, docketLines]);

  const addDocketFromMaster = (docketNo?: string) => {
    const source =
      (docketNo && bookedCns.find((c) => c.docketNo === docketNo)) || availableToAdd[0];
    if (!source) {
      setFeedback({ type: "error", message: "No eligible booked CNs available to add." });
      return;
    }
    if (!customerName.trim()) {
      setFeedback({ type: "error", message: "Select Customer Name first — consignor/consignee use that name." });
      return;
    }
    const pkgs = Number(source.packageDetails?.packagesCount) || 1;
    const wt = Number(source.packageDetails?.chargedWeight) || 0;
    const party = customerName.trim();
    setDocketLines((prev) => [
      ...prev,
      {
        id: `${source.docketNo}-${Date.now()}`,
        selected: true,
        docketNo: source.docketNo,
        ewayBillNo: source.ewayBillNo || "",
        refDate: formatRefDate(source.bookingDate || tripDate),
        consignorName: party,
        consigneeName: party,
        pkgsLoad: pkgs,
        pkgsTotal: pkgs,
        weightLoad: wt,
        weightTotal: wt,
        customerDockNo: "",
        deliveryAddress: source.consignee?.address || ""
      }
    ]);
    setShowDockets(true);
    if (!pickupLocation && source.fromLocation) setPickupLocation(source.fromLocation);
    if (!deliveryLocation && source.toLocation) setDeliveryLocation(source.toLocation);
  };

  const updateLine = (id: string, patch: Partial<DocketLine>) => {
    setDocketLines((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const removeLine = (id: string) => {
    setDocketLines((prev) => prev.filter((d) => d.id !== id));
  };

  const handleVehicleSelect = (val: string) => {
    setVehicleNo(val);
    const match = vehicles.find((v) => v.vehicleNumber === val);
    if (match) {
      if (match.vehicleType) setVehicleType(match.vehicleType);
      if (match.driverName) setDriverName(match.driverName);
      if (match.driverPhone) setDriverMobile(match.driverPhone);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selected = docketLines.filter((d) => d.selected && d.docketNo);
    if (!customerName.trim()) {
      setFeedback({ type: "error", message: "Customer Name is required." });
      return;
    }
    if (!vehicleNo.trim()) {
      setFeedback({ type: "error", message: "Vehicle No is required." });
      return;
    }
    if (selected.length === 0) {
      setFeedback({ type: "error", message: "Select/add at least one docket in Docket / Consignment Details." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/tripsheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripSheetNo,
          manualTripSheetNo,
          customerName,
          tripDate,
          tripTime,
          location,
          vendorName,
          vendorCode,
          vehicleNo,
          vehicleType,
          pickupLocation,
          deliveryLocation,
          driverName,
          driverMobile,
          freight: Number(freight) || 0,
          advanceAmt: Number(advanceAmt) || 0,
          balanceAmt: Number(balanceAmt) || 0,
          startKm: Number(startKm) || 0,
          specialInstructions,
          dockets: selected
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const tripNo = data.data?.tripSheetNo || tripSheetNo || "";
        setFeedback({
          type: "success",
          message: `${data.message}. They now appear on Bill Generation — upload POD before confirming the bill.`
        });
        toast.document(
          `${data.message}. Dockets are ready on Bill Generation — upload POD before confirming the bill.`,
          { title: "Trip Sheet No", code: tripNo }
        );
        // Remove assigned from local pools
        const assigned = new Set(selected.map((d) => d.docketNo));
        setBookedCns((prev) => prev.filter((c) => !assigned.has(c.docketNo)));
        setDocketLines([]);
      } else {
        const msg = data.error || "Failed to prepare loading slip.";
        setFeedback({ type: "error", message: msg });
        toast.error(msg);
      }
    } catch {
      const msg = "Network error while saving trip sheet.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-16 max-w-7xl mx-auto">
      <PageHeader
        moduleCode="C709"
        title="Prepare Trip Sheet"
        subtitle="Operations · Freight & Vehicle Management · Prepare Loading Slip"
actions={
          <Link
            href="/dashboard/operations/tripsheets/prepare"
            className="px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 font-medium inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        }
      />

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
          {feedback.type === "success" && (
            <Link
              href="/dashboard/finance/customer-billing/transport-bill"
              className="ml-auto underline text-green-800"
            >
              Go to Bill Generation →
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Customer Name <span className="text-red-500">*</span>
            </label>
            {customers.length > 0 ? (
              <select
                required
                value={customerName}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">-- Select --</option>
                {customers.map((c) => (
                  <option key={c._id || c.customerCode} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                value={customerName}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trip Sheet No.</label>
            <input
              readOnly
              value={tripSheetNo}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-slate-100 font-mono text-slate-600"
              title="<System Generated>"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">&lt;System Generated&gt;</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Date &amp; Time <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Time</label>
            <input
              type="time"
              value={tripTime}
              onChange={(e) => setTripTime(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Manual Trip Sheet No.</label>
            <input
              value={manualTripSheetNo}
              onChange={(e) => setManualTripSheetNo(e.target.value.toUpperCase())}
              placeholder="Optional reference"
              className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trip Sheet Location</label>
            {branches.length > 0 ? (
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
              >
                {branches.map((b) => {
                  const label = `${b.branchCode}-${b.branchName || "Ateka Logistics"}`;
                  return (
                    <option key={b._id || b.branchCode} value={label}>
                      {label}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ALC1-Ateka Logistics"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vendor Name</label>
            {vendors.length > 0 ? (
              <select
                value={vendorName}
                onChange={(e) => handleVendorSelect(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v._id || v.vendorCode} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vendor Code</label>
            <input
              readOnly
              value={vendorCode}
              placeholder="Auto"
              className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              title="Filled from Vendor Master"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Vehicle No. <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={vehicleNo}
              onChange={(e) => handleVehicleSelect(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white font-mono font-semibold"
            >
              <option value="">--select--</option>
              {vehicles.map((v) => (
                <option key={v._id || v.vehicleNumber} value={v.vehicleNumber}>
                  {v.vehicleNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Type of Vehicle</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
            >
              <option value="">--select--</option>
              <option value="32 FT CONTAINER VEHICLE">32 FT CONTAINER VEHICLE</option>
              <option value="32 FT SXL">32 FT SXL</option>
              <option value="20 FT CONTAINER">20 FT CONTAINER</option>
              <option value="TAURUS 10 TYRE">TAURUS 10 TYRE</option>
              {Array.from(new Set(vehicles.map((v) => v.vehicleType).filter(Boolean))).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pickup Location</label>
            {origins.length > 0 ? (
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">-- Select --</option>
                {origins.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Delivery Location</label>
            {destinations.length > 0 ? (
              <select
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">-- Select --</option>
                {destinations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Driver Name</label>
            <input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Driver Mobile No.</label>
            <input
              value={driverMobile}
              onChange={(e) => setDriverMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10 digits"
              className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Freight (₹)</label>
            <input
              type="number"
              value={freight}
              onChange={(e) => setFreight(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Advance Amt (₹)</label>
            <input
              type="number"
              value={advanceAmt}
              onChange={(e) => setAdvanceAmt(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Balance Amt (₹)</label>
            <input
              type="number"
              readOnly
              value={balanceAmt}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono bg-slate-50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Start Km</label>
            <input
              type="number"
              value={startKm}
              onChange={(e) => setStartKm(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setShowDockets(true);
                if (docketLines.length === 0) addDocketFromMaster();
              }}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold inline-flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" /> Show Dockets
            </button>
          </div>
        </div>

        {/* Docket / Consignment Details */}
        {showDockets && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Docket / Consignment Details</h3>
              <button
                type="button"
                onClick={() => addDocketFromMaster()}
                disabled={availableToAdd.length === 0}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add More Dockets
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1100px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">SR No.</th>
                    <th className="py-2.5 px-3">Select</th>
                    <th className="py-2.5 px-3">Ref No. / EwayBillno</th>
                    <th className="py-2.5 px-3">Ref Date</th>
                    <th className="py-2.5 px-3">Consignor Name</th>
                    <th className="py-2.5 px-3">Consignee Name</th>
                    <th className="py-2.5 px-3">No. of Pkgs. (Load/Total)</th>
                    <th className="py-2.5 px-3">Weight (Load/Total)</th>
                    <th className="py-2.5 px-3">Customer Dockno</th>
                    <th className="py-2.5 px-3">Delivery Address</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docketLines.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        No dockets added. Click <strong>Show Dockets</strong> or <strong>Add More Dockets</strong> to assign booked CNs.
                      </td>
                    </tr>
                  ) : (
                    docketLines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-semibold">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={line.selected}
                            onChange={(e) => updateLine(line.id, { selected: e.target.checked })}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-mono font-bold text-blue-700">{line.docketNo}</div>
                          <input
                            value={line.ewayBillNo}
                            onChange={(e) => updateLine(line.id, { ewayBillNo: e.target.value })}
                            placeholder="EwayBillno"
                            className="mt-1 w-full h-7 px-2 border border-slate-200 rounded text-[10px]"
                          />
                        </td>
                        <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="date"
                            value={line.refDate || ""}
                            onChange={(e) => updateLine(line.id, { refDate: e.target.value })}
                            className="h-8 min-w-[9.5rem] px-2 border border-slate-200 rounded bg-white cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            value={line.consignorName}
                            onChange={(e) => updateLine(line.id, { consignorName: e.target.value })}
                            title="Defaults to Trip Sheet Customer Name"
                            className="w-40 h-8 px-2 border border-slate-200 rounded"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            value={line.consigneeName}
                            onChange={(e) => updateLine(line.id, { consigneeName: e.target.value })}
                            title="Defaults to Trip Sheet Customer Name"
                            className="w-40 h-8 px-2 border border-slate-200 rounded"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={line.pkgsLoad}
                            onChange={(e) => updateLine(line.id, { pkgsLoad: e.target.value })}
                            className="w-16 h-8 px-2 border border-slate-200 rounded font-mono"
                          />
                          <div className="text-[10px] text-slate-400 mt-0.5">/{line.pkgsTotal}</div>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={line.weightLoad}
                            onChange={(e) => updateLine(line.id, { weightLoad: e.target.value })}
                            className="w-20 h-8 px-2 border border-slate-200 rounded font-mono"
                          />
                          <div className="text-[10px] text-slate-400 mt-0.5">/{line.weightTotal}</div>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            value={line.customerDockNo}
                            onChange={(e) => updateLine(line.id, { customerDockNo: e.target.value.toUpperCase() })}
                            className="w-28 h-8 px-2 border border-slate-200 rounded font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            value={line.deliveryAddress}
                            onChange={(e) => updateLine(line.id, { deliveryAddress: e.target.value })}
                            className="w-40 h-8 px-2 border border-slate-200 rounded"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="text-rose-600 font-bold text-[10px] hover:underline inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> DELETE
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => addDocketFromMaster()}
                disabled={availableToAdd.length === 0}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                + Add More Dockets
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700">Special Instructions / Remarks</label>
            <span className="text-[11px] text-slate-400 font-mono">
              {Math.max(0, 200 - specialInstructions.length)} characters remaining
            </span>
          </div>
          <textarea
            maxLength={200}
            rows={3}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any additional notes, loading instructions, etc."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Link
            href="/dashboard/operations/tripsheets"
            className="px-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Loading Slip & Assign Dockets"}
          </button>
        </div>
      </form>
    </div>
  );
}
