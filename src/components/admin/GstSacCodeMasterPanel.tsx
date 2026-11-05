"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Filter,
  RotateCcw,
  Square
} from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";

type Props = {
  onBack: () => void;
};

export function GstSacCodeMasterPanel({ onBack }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = () => {
    setLoading(true);
    fetch("/api/sac-codes")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRows(d.data || []);
      })
      .catch(() => setFeedback({ type: "error", message: "Failed to load SAC codes." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.sacCode || "").toLowerCase().includes(q) ||
        String(r.description || "").toLowerCase().includes(q) ||
        (r.used ? "y" : "n").includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "…")[] = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("…");
    pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

  const toggleSelect = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleSelectAllPage = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of paged) {
        if (checked) next.add(r.sacCode);
        else next.delete(r.sacCode);
      }
      return next;
    });
  };

  const markSelected = async (used: boolean) => {
    if (selected.size === 0) {
      setFeedback({ type: "error", message: "Select at least one SAC code using Update checkboxes." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/sac-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sacCodes: Array.from(selected), used })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: data.message });
        setSelected(new Set());
        load();
      } else {
        setFeedback({ type: "error", message: data.error || "Update failed." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error while updating." });
    } finally {
      setSaving(false);
    }
  };

  const allPageSelected = paged.length > 0 && paged.every((r) => selected.has(r.sacCode));

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="GST Sac Code Master" />
          <p className="text-xs text-slate-500 mt-1">Finance &amp; Accounts · Service Accounting Codes</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          ← Finance &amp; Accounts
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 text-white">
            GST Sac Code Master
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
              title="Filter"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
              title="Columns"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              title="Export"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
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
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>{" "}
            entries
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {selected.size > 0 && (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => markSelected(true)}
                  className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white font-semibold disabled:opacity-50"
                >
                  Mark Used ({selected.size})
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => markSelected(false)}
                  className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-semibold disabled:opacity-50"
                >
                  Mark Unused
                </button>
              </>
            )}
            <span className="text-slate-600">Search:</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 w-full sm:w-56 px-2.5 border border-slate-200 rounded-md"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Sac Code</th>
                <th className="py-2.5 px-3">Sac Code Description</th>
                <th className="py-2.5 px-3">Used</th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span>Update</span>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={(e) => toggleSelectAllPage(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                      title="Select all on page"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    Loading SAC codes...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    No SAC codes found.
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r._id || r.sacCode} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{r.sacCode}</td>
                    <td className="py-2.5 px-3 text-slate-700">{r.description}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{r.used ? "Y" : "N"}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selected.has(r.sacCode)}
                        onChange={() => toggleSelect(r.sacCode)}
                        className="rounded border-slate-300 text-blue-600"
                      />
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
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
            >
              Previous
            </button>
            {pageNumbers.map((p, i) =>
              p === "…" ? (
                <span key={`e-${i}`} className="px-1 text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`min-w-[28px] px-2 py-1 rounded border ${
                    page === p
                      ? "bg-blue-600 text-white border-blue-600 font-bold"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
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
    </div>
  );
}
