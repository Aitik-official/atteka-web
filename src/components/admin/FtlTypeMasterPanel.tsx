"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Settings,
  X
} from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";

type FtlForm = {
  _id?: string;
  srNo?: number;
  ftlType: string;
  maxWeight: string;
  approxMileage: string;
  length: string;
  breadth: string;
  height: string;
  isActive: boolean;
};

const emptyForm = (): FtlForm => ({
  ftlType: "",
  maxWeight: "0",
  approxMileage: "0",
  length: "0",
  breadth: "0",
  height: "0",
  isActive: false
});

type Props = {
  onBack: () => void;
};

export function FtlTypeMasterPanel({ onBack }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FtlForm>(emptyForm());
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [nextSrPreview, setNextSrPreview] = useState("—");

  const load = () => {
    setLoading(true);
    fetch("/api/ftl-types")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const list = d.data || [];
          setRows(list);
          const max = list.reduce((m: number, x: any) => Math.max(m, Number(x.srNo) || 0), 1000);
          setNextSrPreview(String(max + 1));
        }
      })
      .catch(() => setFeedback({ type: "error", message: "Failed to load FTL types." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.srNo, r.ftlType, r.maxWeight, r.approxMileage]
        .filter((v) => v != null)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setForm(emptyForm());
    setFeedback(null);
    setShowForm(true);
  };

  const openEdit = (r: any) => {
    setForm({
      _id: r._id,
      srNo: r.srNo,
      ftlType: r.ftlType || "",
      maxWeight: String(r.maxWeight ?? 0),
      approxMileage: String(r.approxMileage ?? 0),
      length: String(r.length ?? 0),
      breadth: String(r.breadth ?? 0),
      height: String(r.height ?? 0),
      isActive: r.isActive !== false
    });
    setFeedback(null);
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ftlType.trim()) {
      setFeedback({ type: "error", message: "FTL Type is required." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const method = form._id ? "PUT" : "POST";
      const res = await fetch("/api/ftl-types", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: form._id,
          srNo: form.srNo,
          ftlType: form.ftlType,
          maxWeight: Number(form.maxWeight) || 0,
          approxMileage: Number(form.approxMileage) || 0,
          length: Number(form.length) || 0,
          breadth: Number(form.breadth) || 0,
          height: Number(form.height) || 0,
          isActive: form.isActive,
          activeFlag: form.isActive
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: form._id ? "Vehicle type updated." : "Vehicle type saved."
        });
        setShowForm(false);
        setForm(emptyForm());
        load();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to save." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error while saving." });
    } finally {
      setSaving(false);
    }
  };

  const dimLabel = (r: any) => `${r.length ?? 0}*${r.breadth ?? 0}*${r.height ?? 0}`;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="FTL Type" />
          <p className="text-xs text-slate-500 mt-1">Vehicle Type Master · Full Truck Load classifications</p>
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
        <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden max-w-xl mx-auto">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {form._id ? "Edit Vehicle Type Master" : "ADD Vehicle Type Master"}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                System Generated… {form.srNo != null ? form.srNo : nextSrPreview}
              </p>
            </div>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">FTL Type</label>
              <input
                required
                value={form.ftlType}
                onChange={(e) => setForm({ ...form, ftlType: e.target.value.toUpperCase() })}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maximum Weight</label>
                <input
                  type="number"
                  value={form.maxWeight}
                  onChange={(e) => setForm({ ...form, maxWeight: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approx Mileage</label>
                <input
                  type="number"
                  value={form.approxMileage}
                  onChange={(e) => setForm({ ...form, approxMileage: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-2">Dimension [L-B-H]</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Lengith</label>
                  <input
                    type="number"
                    value={form.length}
                    onChange={(e) => setForm({ ...form, length: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Breadth</label>
                  <input
                    type="number"
                    value={form.breadth}
                    onChange={(e) => setForm({ ...form, breadth: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Height</label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              Active Flag ({form.isActive ? "Yes" : "No"})
            </label>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 flex justify-end bg-slate-50">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "save"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 text-white">
              FTL Type
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
                title="Add Vehicle Type"
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
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Sr.no</th>
                  <th className="py-2.5 px-3">Vehicle Type</th>
                  <th className="py-2.5 px-3">Max Weight</th>
                  <th className="py-2.5 px-3">Milage</th>
                  <th className="py-2.5 px-3">Dimensions(L*B*H)</th>
                  <th className="py-2.5 px-3">Active</th>
                  <th className="py-2.5 px-3">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Loading FTL types...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No FTL types found. Click + to add one.
                    </td>
                  </tr>
                ) : (
                  paged.map((r) => (
                    <tr key={r._id || r.srNo} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{r.srNo}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{r.ftlType}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{r.maxWeight}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{r.approxMileage}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{dimLabel(r)}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {r.isActive !== false ? "Yes" : "No"}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-600 hover:bg-blue-700 text-white"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
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
