"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Search } from "lucide-react";
import { toast } from "@/lib/toastBus";
import type { ExceptionalOpModule } from "@/lib/exceptionalOperationModules";

export function ExceptionalOperationEditor({ module }: { module: ExceptionalOpModule }) {
  const [docNo, setDocNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string> | null>(null);

  const load = async () => {
    if (!docNo.trim()) {
      toast.error(`Enter ${module.docLabel}`);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        slug: module.slug,
        documentNo: docNo.trim()
      });
      const res = await fetch(`/api/exceptional/operation?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Document not found");
        setValues(null);
        return;
      }
      setValues(data.data || null);
      toast.success(`Loaded ${data.data.documentNo}`);
    } catch {
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!values) return;
    setSaving(true);
    try {
      const res = await fetch("/api/exceptional/operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: module.slug,
          documentNo: values.documentNo,
          values
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Save failed");
        return;
      }
      setValues(data.data);
      toast.success(data.message || "Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: string, value: string) => {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const inputCls =
    "w-full h-9 px-3 border border-slate-300 rounded-sm text-[13px] text-slate-800 focus:outline-none focus:border-[#0171d3]";

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10 font-sans">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/exceptional/operation"
          className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#0171d3] px-4 py-2.5">
          <h1 className="text-white text-sm font-bold tracking-wide">{module.title}</h1>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              {module.docLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                value={docNo}
                onChange={(e) => setDocNo(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void load();
                }}
                placeholder={module.docPlaceholder}
                className={`${inputCls} flex-1 min-w-[200px]`}
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => void load()}
                className="h-9 px-4 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#e8f1fb] disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? "Loading..." : "Show"}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Demo lookup — try sample nos. from list (e.g. ALC12660615 / DSALC12600532).
            </p>
          </div>

          {values && (
            <div className="border border-slate-200 rounded-sm overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700 border-b border-slate-200">
                Document details
              </div>
              <div className="p-4 space-y-3">
                {module.fields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {f.label}
                    </span>
                    {f.type === "textarea" ? (
                      <textarea
                        value={values[f.key] || ""}
                        readOnly={f.readonly}
                        onChange={(e) => setField(f.key, e.target.value)}
                        rows={3}
                        className={`${inputCls} h-auto py-2 ${f.readonly ? "bg-slate-50 text-slate-500" : ""}`}
                      />
                    ) : f.type === "select" ? (
                      <select
                        value={values[f.key] || ""}
                        disabled={f.readonly}
                        onChange={(e) => setField(f.key, e.target.value)}
                        className={`${inputCls} ${f.readonly ? "bg-slate-50 text-slate-500" : ""}`}
                      >
                        {(f.options || []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type === "date" ? "date" : "text"}
                        value={values[f.key] || ""}
                        readOnly={f.readonly}
                        onChange={(e) =>
                          setField(
                            f.key,
                            f.type === "date" ? e.target.value : e.target.value.toUpperCase()
                          )
                        }
                        className={`${inputCls} ${f.readonly ? "bg-slate-50 text-slate-500" : ""}`}
                      />
                    )}
                  </label>
                ))}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setValues(null)}
                    className="h-9 px-4 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void save()}
                    className="h-9 px-5 rounded-full bg-[#0171d3] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#0159a8] disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
