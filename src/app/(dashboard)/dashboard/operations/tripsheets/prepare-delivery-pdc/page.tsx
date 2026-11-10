"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { toast } from "@/lib/toastBus";

type Row = {
  id: string;
  docketNo: string;
  docketDateLabel: string;
  bookingBranch: string;
  consigneeName: string;
  pkgsTotal: number;
  weightTotal: number;
  vehicleNo: string;
  ewayBillNo: string;
  loadPkgs: number;
  loadWeight: number;
  selected: boolean;
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function FloatField({
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
      <span className="absolute -top-2 left-2 px-1 bg-white text-[11px] font-semibold text-[#0171d3] z-[1]">
        {label}
      </span>
      {children}
    </label>
  );
}

const field =
  "w-full h-10 px-3 border border-[#7eb6e8] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#0171d3]";

export default function PrepareDeliveryPdcPage() {
  const [step, setStep] = useState<"filter" | "entry">("filter");
  const [fromDate, setFromDate] = useState(toInputDate(new Date()));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [docketNos, setDocketNos] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  const [pdcDate, setPdcDate] = useState(toInputDate(new Date()));
  const [pdcTime, setPdcTime] = useState(nowTime());
  const [manualPdcNo, setManualPdcNo] = useState("");
  const [tripSheetLocation, setTripSheetLocation] = useState("ALC1-");
  const [mode, setMode] = useState("Road");
  const [deliveryBy, setDeliveryBy] = useState("");
  const [vendorType, setVendorType] = useState("Market");
  const [vendor, setVendor] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [driverName, setDriverName] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [wayBillNo, setWayBillNo] = useState("");
  const [contractAmount, setContractAmount] = useState(0);
  const [financialBranch, setFinancialBranch] = useState("ALC1");
  const [financialType, setFinancialType] = useState("Financial");
  const [remark, setRemark] = useState("");

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadRows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        docketNos: docketNos.trim()
      });
      const res = await fetch(`/api/operations/prepare-delivery-pdc?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load dockets");
        return;
      }
      const list: Row[] = (data.data || []).map((r: any) => ({
        ...r,
        loadPkgs: Number(r.pkgsTotal || 0),
        loadWeight: Number(r.weightTotal || 0),
        selected: false
      }));
      setRows(list);
      setTableSearch("");
      setStep("entry");
    } catch {
      toast.error("Failed to load dockets");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.docketNo, r.docketDateLabel, r.bookingBranch, r.consigneeName, r.vehicleNo, r.ewayBillNo]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, tableSearch]);

  const selectedCount = rows.filter((r) => r.selected).length;

  const patchRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const submit = async () => {
    const selected = rows.filter((r) => r.selected);
    if (!selected.length) {
      toast.error("Select at least one docket");
      return;
    }
    if (!vendor.trim() && !vehicleNo.trim()) {
      toast.error("Enter Vendor or Vehicle No.");
      return;
    }
    if (!deliveryBy) {
      toast.error("Select Delivery By");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/operations/prepare-delivery-pdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdcDate,
          pdcTime,
          manualPdcNo,
          tripSheetLocation,
          mode,
          deliveryBy,
          vendorType,
          vendor,
          vehicleNo,
          vehicleType,
          pickupLocation,
          deliveryLocation,
          driverName,
          brokerName,
          wayBillNo,
          contractAmount,
          financialBranch,
          financialType,
          remark: remark.toUpperCase(),
          selected: selected.map((r) => ({
            docketNo: r.docketNo,
            loadPkgs: r.loadPkgs,
            loadWeight: r.loadWeight,
            vehicleNo: r.vehicleNo
          }))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submit failed");
        return;
      }
      toast.success(data.message || "Delivery PDC prepared");
    } catch {
      toast.error("Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#0171d3] px-4 py-2.5 flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-white/20 inline-flex items-center justify-center text-[10px] text-white font-bold">
              D
            </span>
            <h1 className="text-white text-sm font-bold">Prepare Delivery PDC</h1>
          </div>

          <div className="p-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <button
                type="button"
                onClick={() => setShowDates((v) => !v)}
                className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white text-left text-[13px] text-slate-600 inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="flex-1 truncate">{dateRangeLabel}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
              {showDates && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 shadow-lg rounded-md p-3 flex flex-wrap gap-3">
                  <label className="text-[11px] text-slate-600 flex-1 min-w-[120px]">
                    From
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="mt-1 w-full h-8 px-2 border border-slate-300 rounded-sm text-[12px]"
                    />
                  </label>
                  <label className="text-[11px] text-slate-600 flex-1 min-w-[120px]">
                    To
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="mt-1 w-full h-8 px-2 border border-slate-300 rounded-sm text-[12px]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDates(false)}
                    className="h-8 px-3 self-end rounded-full border border-[#0171d3] text-[#0171d3] text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            <input
              value={docketNos}
              onChange={(e) => setDocketNos(e.target.value.toUpperCase())}
              placeholder="Docket NO(s)."
              className="h-10 min-w-[220px] flex-1 max-w-sm px-3 border border-[#7eb6e8] rounded-md text-[13px] text-[#0171d3] placeholder:text-[#0171d3]/80 focus:outline-none focus:border-[#0171d3]"
            />

            <button
              type="button"
              disabled={loading}
              onClick={() => void loadRows()}
              className="h-9 min-w-[100px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {step === "entry" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] px-4 py-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("filter")}
                className="h-6 w-6 rounded-full bg-white text-[#0171d3] inline-flex items-center justify-center"
                title="Back"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <h2 className="text-white text-sm font-bold">Prepare Delivery PDC</h2>
              <span className="ml-auto text-[11px] text-white/80">{selectedCount} selected</span>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-[12px] text-slate-600">
                Select dockets in the table below, then complete delivery PDC details and submit.
              </p>

              <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  Search:
                  <input
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="h-8 px-2 border border-slate-200 rounded-md min-w-[180px]"
                  />
                </label>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="min-w-[1200px] w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700">
                      <th className="px-2 py-2 text-left border border-slate-200 font-semibold">SR No.</th>
                      <th className="px-2 py-2 text-center border border-slate-200 font-semibold">Select</th>
                      <th className="px-2 py-2 text-left border border-slate-200 font-semibold">Docket No.</th>
                      <th className="px-2 py-2 text-left border border-slate-200 font-semibold">Docket Date</th>
                      <th className="px-2 py-2 text-left border border-slate-200 font-semibold">Booking Branch</th>
                      <th className="px-2 py-2 text-left border border-slate-200 font-semibold">Consignee Name</th>
                      <th className="px-2 py-2 text-left border border-slate-200 font-semibold">
                        No. of Pkgs. (Load/Total)
                      </th>
                      <th className="px-2 py-2 text-left border border-slate-200 font-semibold">
                        Weight (Load/Total)
                      </th>
                      <th className="px-2 py-2 text-left border border-slate-200 font-semibold">Select</th>
                      <th className="px-2 py-2 text-left border border-slate-200 font-semibold">Eway Bill No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-slate-500 border border-slate-200">
                          No data available in table
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r, idx) => (
                        <tr key={r.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-[#eef5fc]">
                          <td className="px-2 py-1.5 border border-slate-200">{idx + 1}</td>
                          <td className="px-2 py-1.5 border border-slate-200 text-center">
                            <input
                              type="checkbox"
                              checked={r.selected}
                              onChange={(e) => patchRow(r.id, { selected: e.target.checked })}
                            />
                          </td>
                          <td className="px-2 py-1.5 border border-slate-200">
                            <button
                              type="button"
                              className="text-[#0171d3] font-semibold hover:underline"
                              onClick={() => toast.success(`Docket ${r.docketNo} (demo)`)}
                            >
                              {r.docketNo}
                            </button>
                          </td>
                          <td className="px-2 py-1.5 border border-slate-200 whitespace-nowrap">
                            {r.docketDateLabel}
                          </td>
                          <td className="px-2 py-1.5 border border-slate-200">{r.bookingBranch}</td>
                          <td className="px-2 py-1.5 border border-slate-200">{r.consigneeName}</td>
                          <td className="px-2 py-1.5 border border-slate-200">
                            <span className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={r.pkgsTotal}
                                value={r.loadPkgs}
                                onChange={(e) => patchRow(r.id, { loadPkgs: Number(e.target.value) })}
                                className="h-7 w-14 px-1 border border-slate-300 rounded-sm"
                              />
                              <span>/ {r.pkgsTotal}</span>
                            </span>
                          </td>
                          <td className="px-2 py-1.5 border border-slate-200">
                            <span className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={r.weightTotal || undefined}
                                value={r.loadWeight}
                                onChange={(e) => patchRow(r.id, { loadWeight: Number(e.target.value) })}
                                className="h-7 w-20 px-1 border border-slate-300 rounded-sm"
                              />
                              <span>/ {r.weightTotal}</span>
                            </span>
                          </td>
                          <td className="px-2 py-1.5 border border-slate-200">
                            <button
                              type="button"
                              className="text-[#0171d3] font-semibold hover:underline"
                              onClick={() => {
                                setVehicleNo(r.vehicleNo);
                                toast.success(`Vehicle ${r.vehicleNo} applied`);
                              }}
                            >
                              {r.vehicleNo}
                            </button>
                          </td>
                          <td className="px-2 py-1.5 border border-slate-200">{r.ewayBillNo}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Delivery PDC Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FloatField label="System Generated...">
                    <input value="" readOnly placeholder="" className={`${field} bg-slate-50`} />
                  </FloatField>
                  <FloatField label="PDC Date">
                    <input
                      type="date"
                      value={pdcDate}
                      onChange={(e) => setPdcDate(e.target.value)}
                      className={field}
                    />
                  </FloatField>
                  <FloatField label="PDC Time">
                    <input
                      type="time"
                      value={pdcTime}
                      onChange={(e) => setPdcTime(e.target.value)}
                      className={field}
                    />
                  </FloatField>
                  <FloatField label="Manual PDC No.">
                    <input
                      value={manualPdcNo}
                      onChange={(e) => setManualPdcNo(e.target.value.toUpperCase())}
                      className={field}
                    />
                  </FloatField>

                  <FloatField label="Trip Sheet Location">
                    <input
                      value={tripSheetLocation}
                      onChange={(e) => setTripSheetLocation(e.target.value.toUpperCase())}
                      className={field}
                    />
                  </FloatField>
                  <FloatField label="Mode">
                    <select value={mode} onChange={(e) => setMode(e.target.value)} className={field}>
                      <option value="Road">Road</option>
                      <option value="Rail">Rail</option>
                      <option value="Air">Air</option>
                    </select>
                  </FloatField>
                  <FloatField label="Delivery By">
                    <select
                      value={deliveryBy}
                      onChange={(e) => setDeliveryBy(e.target.value)}
                      className={field}
                    >
                      <option value="">---select---</option>
                      <option value="Godown">Godown</option>
                      <option value="Door">Door</option>
                      <option value="Self">Self</option>
                    </select>
                  </FloatField>
                  <FloatField label="Vendor Type">
                    <select
                      value={vendorType}
                      onChange={(e) => setVendorType(e.target.value)}
                      className={field}
                    >
                      <option value="Market">Market</option>
                      <option value="Own">Own</option>
                      <option value="Attached">Attached</option>
                    </select>
                  </FloatField>

                  <FloatField label="Vendor">
                    <input
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value.toUpperCase())}
                      className={field}
                    />
                  </FloatField>
                  <FloatField label="Vehicle No.">
                    <input
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                      className={`${field} font-mono`}
                    />
                  </FloatField>
                  <FloatField label="Type of vehicle">
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className={field}
                    >
                      <option value="">---select---</option>
                      <option value="20 MT CONTAINER">20 MT CONTAINER</option>
                      <option value="32 FT CONTAINER">32 FT CONTAINER</option>
                      <option value="TRAILER">TRAILER</option>
                      <option value="TEMPO">TEMPO</option>
                    </select>
                  </FloatField>
                  <FloatField label="Pickup Location">
                    <input
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value.toUpperCase())}
                      className={field}
                    />
                  </FloatField>

                  <FloatField label="Delivery Location">
                    <input
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value.toUpperCase())}
                      className={field}
                    />
                  </FloatField>
                  <FloatField label="Driver Name">
                    <input
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value.toUpperCase())}
                      className={field}
                    />
                  </FloatField>
                  <FloatField label="Broker Name">
                    <input
                      value={brokerName}
                      onChange={(e) => setBrokerName(e.target.value.toUpperCase())}
                      className={field}
                    />
                  </FloatField>
                  <FloatField label="Way Bill No">
                    <input
                      value={wayBillNo}
                      onChange={(e) => setWayBillNo(e.target.value.toUpperCase())}
                      className={field}
                    />
                  </FloatField>

                  <FloatField label="Contract Amount">
                    <input
                      type="number"
                      min={0}
                      value={contractAmount}
                      onChange={(e) => setContractAmount(Number(e.target.value))}
                      className={field}
                    />
                  </FloatField>
                  <FloatField label="Financial Completion Branch @">
                    <div className="relative">
                      <input
                        value={financialBranch}
                        onChange={(e) => setFinancialBranch(e.target.value.toUpperCase())}
                        className={`${field} pr-10`}
                      />
                      <button
                        type="button"
                        className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full border border-[#7eb6e8] text-[#0171d3] inline-flex items-center justify-center"
                        title="Lookup branch"
                        onClick={() => toast.success("Branch lookup (demo)")}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </FloatField>
                  <FloatField label="Financial / Non-Financial PDC">
                    <select
                      value={financialType}
                      onChange={(e) => setFinancialType(e.target.value)}
                      className={field}
                    >
                      <option value="Financial">Financial</option>
                      <option value="Non-Financial">Non-Financial</option>
                    </select>
                  </FloatField>
                  <FloatField label="Remark">
                    <input
                      value={remark}
                      onChange={(e) => setRemark(e.target.value.toUpperCase())}
                      className={field}
                    />
                  </FloatField>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submit()}
                  className="h-9 min-w-[140px] px-8 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Delivery PDC"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
