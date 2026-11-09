"use client";

import React, { useEffect, useState } from "react";
import { Hash, Plus, Save, RefreshCw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { StatusBadge } from "@/components/common/StatusBadge";

interface DocketRow {
  _id: string;
  docketNo: string;
  seriesPrefix: string;
  sequenceNo: number;
  branchCode?: string;
  status: string;
  assignedAt?: string;
  notes?: string;
}

export default function DocketNumberMasterPage() {
  const [dockets, setDockets] = useState<DocketRow[]>([]);
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("ALC126");
  const [padLength, setPadLength] = useState(4);
  const [nextSequence, setNextSequence] = useState(1);
  const [manualDocket, setManualDocket] = useState("");
  const [generateCount, setGenerateCount] = useState(5);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/docket-numbers?includeSeries=1");
      const data = await res.json();
      if (data.success) {
        setDockets(data.data || []);
        if (data.series) {
          setSeries(data.series);
          setPrefix(data.series.prefix || "ALC126");
          setPadLength(data.series.padLength || 4);
          setNextSequence(data.series.nextSequence || 1);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showMsg = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const saveSeries = async () => {
    const res = await fetch("/api/docket-numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateSeries", prefix, padLength, nextSequence })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showMsg("Docket series configuration saved");
      load();
    } else {
      showMsg(data.error || "Failed to save series");
    }
  };

  const generateBatch = async () => {
    const res = await fetch("/api/docket-numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate", count: generateCount })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showMsg(data.message || "Docket numbers generated");
      load();
    } else {
      showMsg(data.error || "Failed to generate");
    }
  };

  const addManual = async () => {
    if (!manualDocket.trim()) return;
    const res = await fetch("/api/docket-numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createManual", docketNo: manualDocket.trim() })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setManualDocket("");
      showMsg(`Docket ${data.data.docketNo} added to master`);
      load();
    } else {
      showMsg(data.error || "Failed to add docket");
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <PageHeader
        moduleCode="C066"
        title="Docket Number Master"
        subtitle="Admin / Masters • Stationery series & available CN / docket stock pool"
/>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
          {feedback}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-blue-700" />
          <h2 className="text-sm font-bold text-slate-900">Series Configuration</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Prefix</label>
            <input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pad Length</label>
            <input
              type="number"
              min={1}
              max={8}
              value={padLength}
              onChange={(e) => setPadLength(Number(e.target.value) || 4)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Next Sequence</label>
            <input
              type="number"
              min={1}
              value={nextSequence}
              onChange={(e) => setNextSequence(Number(e.target.value) || 1)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={saveSeries}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Series
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Preview next number:{" "}
          <span className="font-mono font-bold text-blue-700">
            {prefix}
            {String(nextSequence).padStart(padLength, "0")}
          </span>
          {series?.description ? ` • ${series.description}` : ""}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-3 sm:items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Generate Count</label>
            <input
              type="number"
              min={1}
              max={50}
              value={generateCount}
              onChange={(e) => setGenerateCount(Number(e.target.value) || 1)}
              className="w-24 h-9 px-3 border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <button
            type="button"
            onClick={generateBatch}
            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Generate from Series
          </button>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Manual Docket No</label>
            <input
              value={manualDocket}
              onChange={(e) => setManualDocket(e.target.value.toUpperCase())}
              placeholder="e.g. ALC1260100"
              className="w-44 h-9 px-3 border border-slate-200 rounded-lg font-mono font-bold"
            />
          </div>
          <button
            type="button"
            onClick={addManual}
            className="h-9 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Manual
          </button>
        </div>
        <button
          type="button"
          onClick={load}
          className="h-9 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <ResponsiveTableWrapper title="Docket Stock Pool" totalCount={dockets.length} showSwipeHint>
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Docket Number</th>
              <th className="py-3 px-3.5">Series</th>
              <th className="py-3 px-3.5">Sequence</th>
              <th className="py-3 px-3.5">Branch</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Loading docket master...
                </td>
              </tr>
            ) : dockets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No docket numbers in master. Generate from series to create stock.
                </td>
              </tr>
            ) : (
              dockets.map((d) => (
                <tr key={d._id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">{d.docketNo}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-600">{d.seriesPrefix}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-700">{d.sequenceNo}</td>
                  <td className="py-2.5 px-3.5 text-slate-600">{d.branchCode || "-"}</td>
                  <td className="py-2.5 px-3.5">
                    <StatusBadge status={d.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-500">{d.notes || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ResponsiveTableWrapper>
    </div>
  );
}
