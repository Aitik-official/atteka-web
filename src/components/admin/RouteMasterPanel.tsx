"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  X
} from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
  "Chandigarh", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
];

type RouteForm = {
  _id?: string;
  code?: string;
  stateName: string;
  destination: string;
  isActive: boolean;
  latitude: string;
  longitude: string;
  geofencingKm: string;
};

const emptyForm = (): RouteForm => ({
  stateName: "",
  destination: "",
  isActive: true,
  latitude: "",
  longitude: "",
  geofencingKm: "2"
});

type Props = {
  onBack: () => void;
};

export function RouteMasterPanel({ onBack }: Props) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RouteForm>(emptyForm());
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const loadRoutes = () => {
    setLoading(true);
    fetch("/api/routes")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRoutes(d.data || []);
      })
      .catch(() => setFeedback({ type: "error", message: "Failed to load routes." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((r) =>
      [r.stateName, r.destination, r.latitude, r.longitude, r.code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [routes, search]);

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
      code: r.code,
      stateName: r.stateName || "",
      destination: r.destination || "",
      isActive: r.isActive !== false,
      latitude: r.latitude || "",
      longitude: r.longitude || "",
      geofencingKm: String(r.geofencingKm ?? 2)
    });
    setFeedback(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...emptyForm(),
      _id: prev._id,
      code: prev.code
    }));
  };

  const fillSampleCoords = () => {
    // Lightweight map helper — sets coords for first city token when empty
    if (form.latitude && form.longitude) {
      setFeedback({ type: "success", message: `Map focus: ${form.latitude}, ${form.longitude}` });
      return;
    }
    setForm((prev) => ({
      ...prev,
      latitude: prev.latitude || "19.076090",
      longitude: prev.longitude || "72.877426"
    }));
    setFeedback({ type: "success", message: "Sample coordinates filled. Adjust as needed." });
  };

  const openMap = (r: any) => {
    const lat = r.latitude;
    const lng = r.longitude;
    if (!lat || !lng) {
      setFeedback({ type: "error", message: "No latitude/longitude set for this route." });
      return;
    }
    window.open(`https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`, "_blank");
  };

  const saveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destination.trim()) {
      setFeedback({ type: "error", message: "Destination is required." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const method = form._id ? "PUT" : "POST";
      const res = await fetch("/api/routes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: form._id,
          code: form.code,
          state: form.stateName,
          stateName: form.stateName,
          destination: form.destination,
          latitude: form.latitude,
          longitude: form.longitude,
          geofencingKm: Number(form.geofencingKm) || 2,
          isActive: form.isActive,
          active: form.isActive ? "Y" : "N"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: form._id ? "Route updated successfully." : "Route saved successfully."
        });
        setShowForm(false);
        setForm(emptyForm());
        loadRoutes();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to save route." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error while saving route." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Route Master" />
          <p className="text-xs text-slate-500 mt-1">Destination Master · Geofencing &amp; route destinations</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          ← Company Structure
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
        <form
          onSubmit={saveRoute}
          className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden max-w-xl mx-auto"
        >
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{form._id ? "Edit Route" : "Add Route"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <select
                value={form.stateName}
                onChange={(e) => setForm({ ...form, stateName: e.target.value })}
                className="w-full h-10 px-3 border border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-400"
              >
                <option value="">--Select--</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Destination</label>
              <input
                required
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value.toUpperCase() })}
                placeholder="e.g. NAGPUR+KOLKATA"
                className="w-full h-10 px-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">Use + to join multiple cities on one route</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active</label>
              <div className="flex items-center h-10 px-3 border border-blue-200 rounded-lg bg-white">
                <span className="flex-1 text-slate-700">{form.isActive ? "Yes" : "No"}</span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 w-4 h-4"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="w-full h-10 px-3 border border-blue-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="w-full h-10 px-3 border border-blue-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Geofencing KM</label>
              <div className="flex items-center gap-2">
                <input
                  value={form.geofencingKm}
                  onChange={(e) => setForm({ ...form, geofencingKm: e.target.value })}
                  className="flex-1 h-10 px-3 border border-blue-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={fillSampleCoords}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  title="Map / fill coordinates"
                >
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-slate-100 flex justify-center gap-4 bg-slate-50">
            <button
              type="submit"
              disabled={saving}
              className="min-w-[100px] px-5 py-2 text-xs font-bold rounded-full border-2 border-blue-500 text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="min-w-[100px] px-5 py-2 text-xs font-bold rounded-full border-2 border-blue-500 text-blue-600 bg-white hover:bg-blue-50"
            >
              Reset
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 text-white">
              Route Master
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={loadRoutes}
                className="p-1.5 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50"
                title="Refresh"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="p-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                title="Add Route"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50"
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
                  <th className="py-2.5 px-3">Sr No.</th>
                  <th className="py-2.5 px-3">State Name</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3">Latitude &amp; Longitude</th>
                  <th className="py-2.5 px-3">Geofencing KM</th>
                  <th className="py-2.5 px-3">Active</th>
                  <th className="py-2.5 px-3">Map</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      Loading routes...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No routes found. Click + to add one.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => {
                    const latLng =
                      r.latitude && r.longitude ? `${r.latitude},${r.longitude}` : "-";
                    return (
                      <tr key={r._id || r.code || idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{r.stateName || ""}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{r.destination}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{latLng}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{r.geofencingKm ?? 2}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {r.isActive !== false ? "Y" : "N"}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => openMap(r)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-600 hover:bg-blue-700 text-white"
                            title="Open map"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
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
