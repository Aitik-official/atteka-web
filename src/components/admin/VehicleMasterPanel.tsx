"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Settings,
  X
} from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";

type VehicleForm = {
  _id?: string;
  srNo?: number;
  vendorName: string;
  vehicleType: string;
  vehicleNumber: string;
  registrationDate: string;
  insurancePolicyNumber: string;
  insuranceUpto: string;
  puccNumber: string;
  puccUpto: string;
  nationalPermitNumber: string;
  nationalPermitUpto: string;
  fitnessUpto: string;
  engineNo: string;
  chassisNo: string;
  vehicleModel: string;
  noOfTyre: string;
  isActive: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): VehicleForm => ({
  vendorName: "",
  vehicleType: "",
  vehicleNumber: "",
  registrationDate: today(),
  insurancePolicyNumber: "",
  insuranceUpto: today(),
  puccNumber: "",
  puccUpto: today(),
  nationalPermitNumber: "",
  nationalPermitUpto: today(),
  fitnessUpto: today(),
  engineNo: "",
  chassisNo: "",
  vehicleModel: "",
  noOfTyre: "0",
  isActive: true
});

function formatDate(value?: string | Date) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toInputDate(value?: string | Date) {
  if (!value) return today();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return today();
  return d.toISOString().slice(0, 10);
}

type Props = {
  onBack: () => void;
};

export function VehicleMasterPanel({ onBack }: Props) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [ftlTypes, setFtlTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<VehicleForm>(emptyForm());
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [nextSr, setNextSr] = useState("—");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/vehicles").then((r) => r.json()).catch(() => ({})),
      fetch("/api/vendors").then((r) => r.json()).catch(() => ({})),
      fetch("/api/ftl-types").then((r) => r.json()).catch(() => ({}))
    ])
      .then(([vehRes, vendorRes, ftlRes]) => {
        if (vehRes.success) {
          const list = vehRes.data || [];
          setVehicles(list);
          const max = list.reduce((m: number, x: any) => Math.max(m, Number(x.srNo) || 0), 0);
          setNextSr(String(max + 1));
        }
        if (vendorRes.success) setVendors(vendorRes.data || []);
        if (ftlRes.success) setFtlTypes((ftlRes.data || []).filter((t: any) => t.isActive !== false));
      })
      .catch(() => setFeedback({ type: "error", message: "Failed to load vehicles." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const vendorOptions = useMemo(() => {
    const fromApi = vendors.map((v) => v.name).filter(Boolean);
    const defaults = ["COMPANY VEHICLE", "ATTACHED FLEET", "MARKET VEHICLE"];
    return Array.from(new Set([...defaults, ...fromApi]));
  }, [vendors]);

  const typeOptions = useMemo(() => {
    const fromFtl = ftlTypes.map((t) => t.ftlType).filter(Boolean);
    const fromVeh = vehicles.map((v) => v.vehicleType).filter(Boolean);
    return Array.from(new Set([...fromFtl, ...fromVeh]));
  }, [ftlTypes, vehicles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      [
        v.srNo,
        v.vendorName,
        v.vehicleNumber,
        v.vehicleType,
        v.insurancePolicyNumber,
        v.puccNumber,
        v.nationalPermitNumber,
        v.chassisNo,
        v.engineNo
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [vehicles, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setForm(emptyForm());
    setFeedback(null);
    setShowForm(true);
  };

  const openEdit = (v: any) => {
    setForm({
      _id: v._id,
      srNo: v.srNo,
      vendorName: v.vendorName || "",
      vehicleType: v.vehicleType || "",
      vehicleNumber: v.vehicleNumber || "",
      registrationDate: toInputDate(v.registrationDate),
      insurancePolicyNumber: v.insurancePolicyNumber || "",
      insuranceUpto: toInputDate(v.insuranceUpto),
      puccNumber: v.puccNumber || "",
      puccUpto: toInputDate(v.puccUpto),
      nationalPermitNumber: v.nationalPermitNumber || "",
      nationalPermitUpto: toInputDate(v.nationalPermitUpto),
      fitnessUpto: toInputDate(v.fitnessUpto),
      engineNo: v.engineNo || "",
      chassisNo: v.chassisNo || "",
      vehicleModel: v.vehicleModel || "",
      noOfTyre: String(v.noOfTyre ?? 0),
      isActive: v.isActive !== false
    });
    setFeedback(null);
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleNumber.trim()) {
      setFeedback({ type: "error", message: "Vehicle No is required." });
      return;
    }
    if (!form.vendorName.trim()) {
      setFeedback({ type: "error", message: "Vendor Name is required." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const method = form._id ? "PUT" : "POST";
      const res = await fetch("/api/vehicles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vehicleNo: form.vehicleNumber,
          chasisNo: form.chassisNo,
          puccUptoDate: form.puccUpto,
          fitnessUpTo: form.fitnessUpto,
          noOfTyre: Number(form.noOfTyre) || 0
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: form._id ? "Vehicle updated successfully." : "Vehicle saved successfully."
        });
        setShowForm(false);
        setForm(emptyForm());
        load();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to save vehicle." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error while saving vehicle." });
    } finally {
      setSaving(false);
    }
  };

  const rowKey = (v: any, idx: number) => String(v._id || v.vehicleNumber || idx);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Vehicle Master" />
          <p className="text-xs text-slate-500 mt-1">Fleet registry · Insurance, PUCC &amp; permit compliance</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          ← Operations
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

      {showForm ? (
        <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden max-w-3xl mx-auto">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Vehicle Master...</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                System Generated… {form.srNo != null ? form.srNo : nextSr}
              </p>
            </div>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vendor Name</label>
              <select
                required
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">---select---</option>
                {vendorOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
              {typeOptions.length > 0 ? (
                <select
                  value={form.vehicleType}
                  onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">---select---</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.vehicleType}
                  onChange={(e) => setForm({ ...form, vehicleType: e.target.value.toUpperCase() })}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle No</label>
              <input
                required
                value={form.vehicleNumber}
                onChange={(e) =>
                  setForm({ ...form, vehicleNumber: e.target.value.toUpperCase().replace(/\s/g, "") })
                }
                disabled={!!form._id}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle Registration Date</label>
              <input
                type="date"
                value={form.registrationDate}
                onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Insurance Policy Number</label>
              <input
                value={form.insurancePolicyNumber}
                onChange={(e) => setForm({ ...form, insurancePolicyNumber: e.target.value.toUpperCase() })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">insurance upto</label>
              <input
                type="date"
                value={form.insuranceUpto}
                onChange={(e) => setForm({ ...form, insuranceUpto: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">pucc number</label>
              <input
                value={form.puccNumber}
                onChange={(e) => setForm({ ...form, puccNumber: e.target.value.toUpperCase() })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pucc upto Date</label>
              <input
                type="date"
                value={form.puccUpto}
                onChange={(e) => setForm({ ...form, puccUpto: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">National permit number</label>
              <input
                value={form.nationalPermitNumber}
                onChange={(e) => setForm({ ...form, nationalPermitNumber: e.target.value.toUpperCase() })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">National permit upto</label>
              <input
                type="date"
                value={form.nationalPermitUpto}
                onChange={(e) => setForm({ ...form, nationalPermitUpto: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fitness up to</label>
              <input
                type="date"
                value={form.fitnessUpto}
                onChange={(e) => setForm({ ...form, fitnessUpto: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Engine No</label>
              <input
                value={form.engineNo}
                onChange={(e) => setForm({ ...form, engineNo: e.target.value.toUpperCase() })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chasis No</label>
              <input
                value={form.chassisNo}
                onChange={(e) => setForm({ ...form, chassisNo: e.target.value.toUpperCase() })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle Model</label>
              <input
                value={form.vehicleModel}
                onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">No of Tyre</label>
              <input
                type="number"
                value={form.noOfTyre}
                onChange={(e) => setForm({ ...form, noOfTyre: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div className="sm:col-span-2 flex items-center">
              <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                Active ({form.isActive ? "Yes" : "No"})
              </label>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 flex justify-end bg-slate-50">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 text-white">
              Vehicle Master
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={load}
                className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                title="Refresh"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="p-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                title="Add Vehicle"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                title="Export"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <label className="text-slate-600">
              Show{" "}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="mx-1 h-8 px-2 border border-slate-200 rounded-md"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>{" "}
              entries
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Search:</span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-full sm:w-52 px-2.5 border border-slate-200 rounded-md"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1200px]">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Sr.no</th>
                  <th className="py-2.5 px-3">Vendor Name</th>
                  <th className="py-2.5 px-3">Vehicle No.</th>
                  <th className="py-2.5 px-3">Vehicle Type</th>
                  <th className="py-2.5 px-3">insurance policy number</th>
                  <th className="py-2.5 px-3">pucc number</th>
                  <th className="py-2.5 px-3">Permit Number</th>
                  <th className="py-2.5 px-3">Vehicle registration Dt.</th>
                  <th className="py-2.5 px-3">Vehicle CHASIS NO</th>
                  <th className="py-2.5 px-3">Vehicle ENGINE NO</th>
                  <th className="py-2.5 px-3">Vehicle Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400">
                      Loading vehicles...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400">
                      No vehicles found. Click + to add one.
                    </td>
                  </tr>
                ) : (
                  paged.map((v, idx) => {
                    const key = rowKey(v, idx);
                    const isOpen = !!expanded[key];
                    return (
                      <React.Fragment key={key}>
                        <tr className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => setExpanded((p) => ({ ...p, [key]: !p[key] }))}
                              className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-700"
                            >
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-300 text-blue-600">
                                {isOpen ? <ChevronDown className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              </span>
                              {v.srNo || (page - 1) * pageSize + idx + 1}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{v.vendorName || "COMPANY VEHICLE"}</td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => openEdit(v)}
                              className="font-mono font-bold text-blue-700 hover:underline"
                            >
                              {v.vehicleNumber}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{v.vehicleType}</td>
                          <td className="py-2.5 px-3 font-mono text-blue-700">{v.insurancePolicyNumber || ""}</td>
                          <td className="py-2.5 px-3 font-mono text-blue-700">{v.puccNumber || ""}</td>
                          <td className="py-2.5 px-3 font-mono text-blue-700">{v.nationalPermitNumber || ""}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            {formatDate(v.registrationDate)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{v.chassisNo || ""}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{v.engineNo || ""}</td>
                          <td className="py-2.5 px-3 text-slate-600">{v.vehicleSpeed || "Kmph"}</td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={11} className="px-5 py-3 text-[11px] text-slate-600">
                              <div className="flex flex-wrap gap-x-6 gap-y-1">
                                <span>
                                  Insurance upto: <strong>{formatDate(v.insuranceUpto) || "-"}</strong>
                                </span>
                                <span>
                                  PUCC upto: <strong>{formatDate(v.puccUpto) || "-"}</strong>
                                </span>
                                <span>
                                  Permit upto: <strong>{formatDate(v.nationalPermitUpto) || "-"}</strong>
                                </span>
                                <span>
                                  Fitness upto: <strong>{formatDate(v.fitnessUpto) || "-"}</strong>
                                </span>
                                <span>
                                  Model: <strong>{v.vehicleModel || "-"}</strong>
                                </span>
                                <span>
                                  Tyres: <strong>{v.noOfTyre || "-"}</strong>
                                </span>
                                <span>
                                  Active: <strong>{v.isActive !== false ? "Yes" : "No"}</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openEdit(v)}
                                  className="inline-flex items-center gap-1 text-blue-700 font-semibold"
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing {(page - 1) * pageSize + (filtered.length ? 1 : 0)} to{" "}
              {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold">{page}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
