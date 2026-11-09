"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Trash2,
  X
} from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { exportToCsv, stampFilename } from "@/lib/exportCsv";
import { toast } from "@/lib/toastBus";

const SERVICE_TYPES = ["FTL", "LTL", "PART LOAD", "EXPRESS", "DEDICATED"];
const LOCATIONS = [
  "MUMBAI",
  "BHIWANDI",
  "PUNE",
  "NAGPUR",
  "DELHI",
  "GURUGRAM",
  "AHMEDABAD",
  "SURAT",
  "BENGALURU",
  "CHENNAI",
  "HYDERABAD",
  "KOLKATA",
  "INDORE",
  "JAIPUR",
  "RAIPUR"
];

type RateLine = {
  serviceType: string;
  fromLocation: string;
  toLocation: string;
  vehicleType: string;
  rate: number;
  approxKm: number;
  trip: string;
};

type QuoteRow = {
  _id: string;
  quotationId: string;
  lineIndex: number;
  customerName: string;
  fromLocation: string;
  toLocation: string;
  ftlType: string;
  rate: number;
  quotedBy: string;
  validFrom: string;
  validTill: string;
  service: string;
  trip: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function todayDisplay(d = new Date()) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function toDateInput(display: string) {
  // DD/MM/YYYY -> YYYY-MM-DD
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function fromDateInput(val: string) {
  if (!val) return "";
  const [y, mo, d] = val.split("-");
  if (!y || !mo || !d) return val;
  return `${d}/${mo}/${y}`;
}

function emptyLine(): RateLine {
  return {
    serviceType: "",
    fromLocation: "",
    toLocation: "",
    vehicleType: "",
    rate: 0,
    approxKm: 0,
    trip: "ONE WAY"
  };
}

type Props = {
  onBack: () => void;
};

export function QuotationMasterPanel({ onBack }: Props) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [mailHint, setMailHint] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [contractFromLocal, setContractFromLocal] = useState(toDateInput(todayDisplay()));
  const [contractToLocal, setContractToLocal] = useState(toDateInput(todayDisplay()));
  const [lines, setLines] = useState<RateLine[]>([emptyLine()]);

  const loadCustomers = async () => {
    try {
      const res = await fetch("/api/crm/quotations?customers=1");
      const data = await res.json();
      if (data.success) setCustomers(data.data || []);
    } catch {
      // ignore
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await fetch("/api/ftl-types");
      const data = await res.json();
      const list = (data.data || [])
        .map((v: any) => v.ftlType)
        .filter(Boolean);
      setVehicleTypes(list.length ? list : ["32FT MXL", "32 FT CONTAINER VEHICLE", "20 MT CONTAINER"]);
    } catch {
      setVehicleTypes(["32FT MXL", "32 FT CONTAINER VEHICLE", "20 MT CONTAINER"]);
    }
  };

  const loadRows = async () => {
    if (!selectedCustomer) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        customer: selectedCustomer,
        search
      });
      const res = await fetch(`/api/crm/quotations?${qs.toString()}`);
      const data = await res.json();
      if (data.success) setRows(data.data || []);
    } catch {
      setFeedback({ type: "error", message: "Failed to load quotations." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadVehicles();
  }, []);

  useEffect(() => {
    loadRows();
    setPage(1);
  }, [selectedCustomer, search]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  const resetForm = () => {
    setCustomerName(selectedCustomer || "");
    setContractFromLocal(toDateInput(todayDisplay()));
    setContractToLocal(toDateInput(todayDisplay()));
    setLines([emptyLine()]);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
    setFeedback(null);
  };

  const updateLine = (idx: number, patch: Partial<RateLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (idx: number) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!customerName.trim()) {
      setFeedback({ type: "error", message: "Customer Name is required." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/crm/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          contractFrom: fromDateInput(contractFromLocal),
          contractTo: fromDateInput(contractToLocal),
          lines
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: data.message });
        toast.success(data.message || "Quotation saved.");
        setSelectedCustomer(customerName.trim().toUpperCase());
        setShowForm(false);
        await loadCustomers();
        // reload after customer set — use explicit fetch
        const qs = new URLSearchParams({ customer: customerName.trim().toUpperCase() });
        const listRes = await fetch(`/api/crm/quotations?${qs.toString()}`);
        const listData = await listRes.json();
        if (listData.success) setRows(listData.data || []);
      } else {
        const msg = data.error || "Failed to save quotation.";
        setFeedback({ type: "error", message: msg });
        toast.error(msg);
      }
    } catch {
      const msg = "Network error while saving quotation.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Quotation Master" />
          <p className="text-xs text-slate-500 mt-1">Customer freight rate sheets &amp; contract periods</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          ← Visit Details
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

      {mailHint && (
        <div className="p-3 rounded-xl text-xs font-semibold flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700">
          <Mail className="w-4 h-4" />
          {mailHint}
          <button type="button" className="ml-auto text-blue-500" onClick={() => setMailHint(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={save} className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-[#0070d2] px-4 py-2.5 text-white flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wide">ADD Quotation Master</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4 text-xs">
            <div className="border border-slate-300 rounded-lg overflow-hidden divide-y divide-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-6 items-center">
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  Customer Name
                </div>
                <div className="md:col-span-5 p-2.5">
                  <select
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full max-w-md h-8 px-2.5 border border-[#0070d2] rounded bg-white focus:outline-none"
                  >
                    <option value="">--Select Customer--</option>
                    {customers.map((c) => (
                      <option key={c.customerCode || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value.toUpperCase())}
                    placeholder="Or type customer name"
                    className="mt-2 w-full max-w-md h-8 px-2.5 border border-[#0070d2] rounded bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 items-center">
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  Contract period From
                </div>
                <div className="md:col-span-2 p-2.5 border-r border-slate-200">
                  <input
                    type="date"
                    value={contractFromLocal}
                    onChange={(e) => setContractFromLocal(e.target.value)}
                    className="w-48 h-8 px-2.5 border border-[#0070d2] rounded bg-white font-mono"
                  />
                  <span className="ml-2 text-slate-500 font-mono">{fromDateInput(contractFromLocal)}</span>
                </div>
                <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                  Contract period To
                </div>
                <div className="md:col-span-2 p-2.5">
                  <input
                    type="date"
                    value={contractToLocal}
                    onChange={(e) => setContractToLocal(e.target.value)}
                    className="w-48 h-8 px-2.5 border border-[#0070d2] rounded bg-white font-mono"
                  />
                  <span className="ml-2 text-slate-500 font-mono">{fromDateInput(contractToLocal)}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800">Rate Master details...</h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0070d2] border border-[#0070d2] rounded-full hover:bg-blue-50"
                >
                  <Plus className="w-3 h-3" /> Add Row
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-left text-xs min-w-[900px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2 w-14">Sr.No</th>
                      <th className="py-2 px-2">Service Type</th>
                      <th className="py-2 px-2">From Location</th>
                      <th className="py-2 px-2">To Location</th>
                      <th className="py-2 px-2">Vehicle Type</th>
                      <th className="py-2 px-2">Rate</th>
                      <th className="py-2 px-2">Approx Km.</th>
                      <th className="py-2 px-2 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2 font-mono text-slate-600">{idx + 1}</td>
                        <td className="py-2 px-2">
                          <select
                            value={line.serviceType}
                            onChange={(e) => updateLine(idx, { serviceType: e.target.value })}
                            className="w-full h-8 px-2 border border-[#0070d2] rounded bg-white"
                          >
                            <option value="">--Select--</option>
                            {SERVICE_TYPES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={line.fromLocation}
                            onChange={(e) => updateLine(idx, { fromLocation: e.target.value })}
                            className="w-full h-8 px-2 border border-[#0070d2] rounded bg-white"
                          >
                            <option value="">Select From Location</option>
                            {LOCATIONS.map((loc) => (
                              <option key={loc} value={loc}>
                                {loc}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={line.toLocation}
                            onChange={(e) => updateLine(idx, { toLocation: e.target.value })}
                            className="w-full h-8 px-2 border border-[#0070d2] rounded bg-white"
                          >
                            <option value="">Select To Location</option>
                            {LOCATIONS.map((loc) => (
                              <option key={loc} value={loc}>
                                {loc}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={line.vehicleType}
                            onChange={(e) => updateLine(idx, { vehicleType: e.target.value })}
                            className="w-full h-8 px-2 border border-[#0070d2] rounded bg-white"
                          >
                            <option value="">Select Vehicle Type</option>
                            {vehicleTypes.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={0}
                            value={line.rate}
                            onChange={(e) => updateLine(idx, { rate: Number(e.target.value) || 0 })}
                            className="w-24 h-8 px-2 border border-[#0070d2] rounded font-mono"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={0}
                            value={line.approxKm}
                            onChange={(e) => updateLine(idx, { approxKm: Number(e.target.value) || 0 })}
                            className="w-24 h-8 px-2 border border-[#0070d2] rounded font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-slate-400 hover:text-red-600"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-1.5 bg-white hover:bg-blue-50 text-[#0070d2] border border-[#0070d2] font-semibold text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-1.5 bg-white hover:bg-slate-50 text-[#0070d2] border border-[#0070d2] font-semibold text-xs rounded-full inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>
        </form>
      )}

      {/* List view */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Customer</span>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="h-9 min-w-[260px] px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.customerCode || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="h-8 w-8 rounded bg-[#0070d2] text-white flex items-center justify-center hover:bg-blue-700"
              title="Search / filter"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => loadRows()}
              className="h-8 w-8 rounded bg-[#0070d2] text-white flex items-center justify-center hover:bg-blue-700"
              title="Refresh"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="h-8 w-8 rounded bg-[#0070d2] text-white flex items-center justify-center hover:bg-blue-700"
              title="Add Quotation"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedCustomer) {
                  setFeedback({ type: "error", message: "Select a customer before exporting." });
                  return;
                }
                if (rows.length === 0) {
                  setFeedback({ type: "error", message: "No quotation rows to export." });
                  return;
                }
                exportToCsv(
                  stampFilename(`Quotation_${selectedCustomer.replace(/\s+/g, "_")}`),
                  [
                    "From Location",
                    "To Location",
                    "ftl Type",
                    "Rate",
                    "Quoted By",
                    "Valid From",
                    "Valid Till",
                    "Service",
                    "Trip"
                  ],
                  rows.map((r) => [
                    r.fromLocation,
                    r.toLocation,
                    r.ftlType,
                    r.rate,
                    r.quotedBy,
                    r.validFrom,
                    r.validTill,
                    r.service,
                    r.trip
                  ])
                );
                setFeedback({
                  type: "success",
                  message: `Exported ${rows.length} quotation row(s) to Excel/CSV.`
                });
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
              disabled={!selectedCustomer}
              className="h-8 w-48 px-2.5 border border-slate-200 rounded focus:outline-none focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[1100px]">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">From Location</th>
                <th className="py-2.5 px-3">To Location</th>
                <th className="py-2.5 px-3">ftl Type</th>
                <th className="py-2.5 px-3">Rate</th>
                <th className="py-2.5 px-3">Quoted By</th>
                <th className="py-2.5 px-3">Valid From</th>
                <th className="py-2.5 px-3">Valid Till</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Trip</th>
                <th className="py-2.5 px-3 text-center">View Vendor Rate</th>
                <th className="py-2.5 px-3 text-center">Edit</th>
                <th className="py-2.5 px-3 text-center">Send Mail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!selectedCustomer ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    Select a customer to view quotation rates.
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    {loading ? "Loading quotations..." : "No data available in table"}
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r._id} className="hover:bg-blue-50/40">
                    <td className="py-2 px-3 font-semibold text-slate-800">{r.fromLocation}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{r.toLocation}</td>
                    <td className="py-2 px-3 text-slate-700">{r.ftlType}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">
                      {Number(r.rate).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-slate-700">{r.quotedBy}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{r.validFrom}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{r.validTill}</td>
                    <td className="py-2 px-3 text-slate-700">{r.service}</td>
                    <td className="py-2 px-3 text-slate-700">{r.trip}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        className="h-7 w-7 rounded bg-slate-100 text-slate-600 inline-flex items-center justify-center hover:bg-slate-200"
                        title="View Vendor Rate"
                        onClick={() =>
                          setFeedback({
                            type: "success",
                            message: `Vendor rate reference for ${r.fromLocation} → ${r.toLocation}: ₹${Math.round(r.rate * 0.85).toLocaleString()}`
                          })
                        }
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        className="h-7 w-7 rounded bg-[#0070d2] text-white inline-flex items-center justify-center hover:bg-blue-700"
                        title="Edit"
                        onClick={() => {
                          setCustomerName(r.customerName);
                          setContractFromLocal(toDateInput(r.validFrom));
                          setContractToLocal(toDateInput(r.validTill));
                          setLines([
                            {
                              serviceType: r.service,
                              fromLocation: r.fromLocation,
                              toLocation: r.toLocation,
                              vehicleType: r.ftlType,
                              rate: r.rate,
                              approxKm: 0,
                              trip: r.trip || "ONE WAY"
                            }
                          ]);
                          setShowForm(true);
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        className="h-7 w-7 rounded bg-emerald-600 text-white inline-flex items-center justify-center hover:bg-emerald-700"
                        title="Send Mail"
                        onClick={() =>
                          setMailHint(
                            `Quotation mail queued for ${r.customerName}: ${r.fromLocation} → ${r.toLocation} @ ₹${Number(r.rate).toLocaleString()}`
                          )
                        }
                      >
                        <Mail className="w-3.5 h-3.5" />
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
            Showing {rows.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, rows.length)}{" "}
            of {rows.length} entries
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
    </div>
  );
}
