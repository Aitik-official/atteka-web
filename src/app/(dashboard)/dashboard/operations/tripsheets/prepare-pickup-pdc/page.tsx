"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { toast } from "@/lib/toastBus";

type Vendor = { code: string; name: string; label: string };

type CnRow = {
  id: string;
  cnNo: string;
  cnDateLabel: string;
  payBasis: string;
  consignorName: string;
  consignorAddress: string;
  phoneNo: string;
  destination: string;
  pkgs: number;
  totalWt: number;
};

type FilterMode = "date" | "docket";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function displayDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB");
}

export default function PreparePickupPdcPage() {
  const [step, setStep] = useState<"filter" | "entry">("filter");
  const [filterMode, setFilterMode] = useState<FilterMode>("date");
  const [fromDate, setFromDate] = useState(toInputDate(new Date()));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [docketNos, setDocketNos] = useState("");
  const [vendorQuery, setVendorQuery] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorLookupOpen, setVendorLookupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [rows, setRows] = useState<CnRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [manualPdcNo, setManualPdcNo] = useState("PSALC126");
  const [vendor, setVendor] = useState("");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [contractAmount, setContractAmount] = useState(0);
  const [remark, setRemark] = useState("");
  const [pdcDate, setPdcDate] = useState(toInputDate(new Date()));
  const [vehicleNo, setVehicleNo] = useState("");
  const [financialAt, setFinancialAt] = useState("");
  const [financialType, setFinancialType] = useState("Financial");
  const enterDate = toInputDate(new Date());

  useEffect(() => {
    fetch("/api/operations/prepare-pickup-pdc?vendors=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVendors(d.data || []);
      })
      .catch(() => {});
  }, []);

  const filteredVendors = useMemo(() => {
    const q = vendorQuery.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.code.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q)
    );
  }, [vendors, vendorQuery]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.destination) set.add(r.destination);
    });
    ["BHIWANDI", "PUNE", "MUMBAI", "NASHIK", "HYDERABAD", "NHAVASHEVA"].forEach((l) => set.add(l));
    return Array.from(set).sort();
  }, [rows]);

  const loadCns = async () => {
    if (filterMode === "docket" && !docketNos.trim()) {
      toast.error("Enter Docket NO(s)");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: filterMode,
        from: fromDate,
        to: toDate,
        docketNos: docketNos.trim(),
        vendor: vendorQuery.trim()
      });
      const res = await fetch(`/api/operations/prepare-pickup-pdc?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load CNs");
        return;
      }
      const list: CnRow[] = data.data || [];
      setRows(list);
      setSelected(new Set());
      if (vendorQuery.trim()) {
        const match = vendors.find(
          (v) =>
            v.label.toLowerCase().includes(vendorQuery.trim().toLowerCase()) ||
            v.name.toLowerCase().includes(vendorQuery.trim().toLowerCase())
        );
        setVendor(match?.label || vendorQuery.trim().toUpperCase());
      }
      setStep("entry");
    } catch {
      toast.error("Failed to load CNs");
    } finally {
      setLoading(false);
    }
  };

  const allSelected = rows.length > 0 && selected.size === rows.length;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.cnNo)));
  };

  const toggleOne = (cnNo: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cnNo)) next.delete(cnNo);
      else next.add(cnNo);
      return next;
    });
  };

  const submitPdc = async () => {
    if (!vendor.trim()) {
      toast.error("Select Vendor");
      return;
    }
    if (!selected.size) {
      toast.error("Select at least one CN");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/operations/prepare-pickup-pdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualPdcNo,
          vendor,
          pickup,
          drop,
          distanceTraveled,
          contractAmount,
          remark,
          pdcDate,
          vehicleNo,
          financialAt,
          financialType,
          selectedCnNos: Array.from(selected)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submit failed");
        return;
      }
      toast.success(data.message || "Pickup PDC prepared");
    } catch {
      toast.error("Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const label = "text-[12px] font-semibold text-slate-700 w-[160px] shrink-0";
  const input =
    "h-8 px-2 border border-slate-300 rounded-sm text-[12px] bg-white focus:outline-none focus:border-[#0171d3]";
  const radio = "accent-[#0171d3] w-3.5 h-3.5";

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans">
      {step === "filter" && (
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#0171d3] px-4 py-2.5">
            <h1 className="text-white text-sm font-bold">Select CN criteria By Arrival Date</h1>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="radio"
                className={`${radio} mt-2`}
                checked={filterMode === "date"}
                onChange={() => setFilterMode("date")}
              />
              <span className={`${label} mt-1.5`}>CN Date</span>
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <span className="text-[12px] text-slate-600">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setFilterMode("date");
                  }}
                  className={input}
                />
                <span className="text-[12px] text-slate-600">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setFilterMode("date");
                  }}
                  className={input}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="radio"
                className={radio}
                checked={filterMode === "docket"}
                onChange={() => setFilterMode("docket")}
              />
              <span className={label}>Docket NO(s).</span>
              <input
                value={docketNos}
                onChange={(e) => {
                  setDocketNos(e.target.value.toUpperCase());
                  setFilterMode("docket");
                }}
                onFocus={() => setFilterMode("docket")}
                className={`${input} flex-1`}
              />
              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                (Seperated by Comma if multiple.)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-3.5" />
              <span className={label}>Enter Vendor Name</span>
              <div className="relative flex-1">
                <input
                  value={vendorQuery}
                  onChange={(e) => setVendorQuery(e.target.value)}
                  className={`${input} w-full pr-9`}
                  placeholder="Search vendor"
                />
                <button
                  type="button"
                  onClick={() => setVendorLookupOpen(true)}
                  className="absolute right-1.5 top-1 h-6 w-6 inline-flex items-center justify-center text-[#0171d3]"
                  title="Lookup vendor"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadCns()}
                className="h-9 min-w-[100px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "entry" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("filter")}
                className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <h2 className="text-sm font-bold text-slate-800">Prepare Pickup PDC</h2>
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3 text-[12px]">
              <div className="flex items-center gap-2">
                <span className={label}>PDC Number</span>
                <span className="text-red-600 font-semibold">&lt;System Generated&gt;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={label}>PDC Enter Date</span>
                <span className="text-slate-800">{displayDate(enterDate)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={label}>Manual PDC No.</span>
                <input
                  value={manualPdcNo}
                  onChange={(e) => setManualPdcNo(e.target.value.toUpperCase())}
                  className={`${input} flex-1`}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className={label}>PDC Date</span>
                <input
                  type="date"
                  value={pdcDate}
                  onChange={(e) => setPdcDate(e.target.value)}
                  className={input}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className={label}>PDC Branch</span>
                <span className="text-slate-800 font-semibold">ALC1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={label}>PDC Type</span>
                <span className="text-slate-800 font-semibold">Pickup PDC</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={label}>Vendor</span>
                <select
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className={`${input} flex-1`}
                >
                  <option value="">--Select--</option>
                  {vendors.map((v) => (
                    <option key={v.code} value={v.label}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className={label}>Vehicle No.</span>
                <input
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  className={`${input} flex-1 font-mono`}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className={label}>Pickup</span>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className={`${input} flex-1`}
                >
                  <option value="">--Select--</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className={label}>Drop</span>
                <select value={drop} onChange={(e) => setDrop(e.target.value)} className={`${input} flex-1`}>
                  <option value="">--Select--</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className={label}>Distance Traveled</span>
                <input
                  type="number"
                  min={0}
                  value={distanceTraveled}
                  onChange={(e) => setDistanceTraveled(Number(e.target.value))}
                  className={`${input} w-28`}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className={label}>Financial Completion at</span>
                <div className="relative flex-1">
                  <input
                    value={financialAt}
                    onChange={(e) => setFinancialAt(e.target.value.toUpperCase())}
                    className={`${input} w-full pr-8`}
                    placeholder="Branch"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={label}>Contract Amount</span>
                <input
                  type="number"
                  min={0}
                  value={contractAmount}
                  onChange={(e) => setContractAmount(Number(e.target.value))}
                  className={`${input} w-28`}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className={label}>Financial / Non-Financial PDC</span>
                <select
                  value={financialType}
                  onChange={(e) => setFinancialType(e.target.value)}
                  className={input}
                >
                  <option value="Financial">Financial</option>
                  <option value="Non-Financial">Non-Financial</option>
                </select>
              </div>

              <div className="flex items-start gap-2 lg:col-span-2">
                <span className={`${label} mt-1`}>Remark</span>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value.toUpperCase())}
                  rows={3}
                  className="flex-1 px-2 py-1.5 border border-slate-300 rounded-sm text-[12px] focus:outline-none focus:border-[#0171d3]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1200px] w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="px-2 py-2 text-left font-semibold border border-[#0a5fad]">SR No.</th>
                    <th className="px-2 py-2 text-center font-semibold border border-[#0a5fad]">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                    </th>
                    <th className="px-2 py-2 text-left font-semibold border border-[#0a5fad]">CN No.</th>
                    <th className="px-2 py-2 text-left font-semibold border border-[#0a5fad]">CN Date</th>
                    <th className="px-2 py-2 text-left font-semibold border border-[#0a5fad]">Paybasis</th>
                    <th className="px-2 py-2 text-left font-semibold border border-[#0a5fad]">
                      Consignor Name
                    </th>
                    <th className="px-2 py-2 text-left font-semibold border border-[#0a5fad]">
                      Consignor Address
                    </th>
                    <th className="px-2 py-2 text-left font-semibold border border-[#0a5fad]">Phone No</th>
                    <th className="px-2 py-2 text-left font-semibold border border-[#0a5fad]">Destination</th>
                    <th className="px-2 py-2 text-right font-semibold border border-[#0a5fad]">No. of Pkgs</th>
                    <th className="px-2 py-2 text-right font-semibold border border-[#0a5fad]">Total Wt.</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-slate-500 border border-slate-200">
                        No CNs found
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={r.id} className="odd:bg-white even:bg-slate-50 hover:bg-[#eef5fc]">
                        <td className="px-2 py-1.5 border border-slate-200">{idx + 1}</td>
                        <td className="px-2 py-1.5 border border-slate-200 text-center">
                          <input
                            type="checkbox"
                            checked={selected.has(r.cnNo)}
                            onChange={() => toggleOne(r.cnNo)}
                          />
                        </td>
                        <td className="px-2 py-1.5 border border-slate-200 font-semibold text-[#0171d3]">
                          {r.cnNo}
                        </td>
                        <td className="px-2 py-1.5 border border-slate-200 whitespace-nowrap">
                          {r.cnDateLabel}
                        </td>
                        <td className="px-2 py-1.5 border border-slate-200">{r.payBasis}</td>
                        <td className="px-2 py-1.5 border border-slate-200">{r.consignorName}</td>
                        <td className="px-2 py-1.5 border border-slate-200">{r.consignorAddress}</td>
                        <td className="px-2 py-1.5 border border-slate-200">{r.phoneNo}</td>
                        <td className="px-2 py-1.5 border border-slate-200">{r.destination}</td>
                        <td className="px-2 py-1.5 border border-slate-200 text-right">{r.pkgs}</td>
                        <td className="px-2 py-1.5 border border-slate-200 text-right">{r.totalWt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-4 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitPdc()}
                className="h-9 min-w-[120px] px-8 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {vendorLookupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Select Vendor</h3>
              <button type="button" onClick={() => setVendorLookupOpen(false)}>
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-3">
              <input
                value={vendorQuery}
                onChange={(e) => setVendorQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm mb-2"
              />
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {filteredVendors.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#eef5fc]"
                    onClick={() => {
                      setVendorQuery(v.label);
                      setVendor(v.label);
                      setVendorLookupOpen(false);
                    }}
                  >
                    {v.label}
                  </button>
                ))}
                {filteredVendors.length === 0 && (
                  <p className="text-xs text-slate-500 px-3 py-6 text-center">No vendors</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
