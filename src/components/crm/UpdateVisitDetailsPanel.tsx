"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, RotateCcw, Save, Search, X } from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { exportToCsv, stampFilename } from "@/lib/exportCsv";
import { toast } from "@/lib/toastBus";

const PROSPECT_STATUSES = [
  "Hot",
  "Warm",
  "Cold",
  "Interested",
  "Follow-up",
  "Not Interested",
  "Converted",
  "Closed"
];

type VisitRow = {
  _id?: string;
  leadCode: string;
  customerName: string;
  contactPerson: string;
  prospectStatus: string;
  visitDateTime: string;
  visitRemark: string;
  nextVisitDateTime: string;
  conveyanceExpenses: number;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Display format used in legacy screens: DD/MM/YYYY HH:mm */
function formatDisplayDate(d = new Date()) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Value for <input type="datetime-local"> */
function toLocalInputValue(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(val: string) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return formatDisplayDate(d);
}

function emptyForm(): Omit<VisitRow, "_id"> & { visitDateLocal: string; nextVisitDateLocal: string } {
  const now = new Date();
  return {
    leadCode: "",
    customerName: "",
    contactPerson: "",
    prospectStatus: "",
    visitDateTime: formatDisplayDate(now),
    visitDateLocal: toLocalInputValue(now),
    visitRemark: "",
    nextVisitDateTime: formatDisplayDate(now),
    nextVisitDateLocal: toLocalInputValue(now),
    conveyanceExpenses: 0
  };
}

type Props = {
  onBack: () => void;
};

export function UpdateVisitDetailsPanel({ onBack }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showLeadLookup, setShowLeadLookup] = useState(false);
  const [lookupSearch, setLookupSearch] = useState("");

  const loadVisits = async (leadCode?: string) => {
    setLoading(true);
    try {
      const q = leadCode ? `?leadCode=${encodeURIComponent(leadCode)}` : "";
      const res = await fetch(`/api/crm/visits${q}`);
      const data = await res.json();
      if (data.success) setVisits(data.data || []);
    } catch {
      setFeedback({ type: "error", message: "Failed to load visit history." });
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const res = await fetch("/api/crm/visits?leads=1");
      const data = await res.json();
      if (data.success) setLeads(data.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadVisits();
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const s = lookupSearch.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter(
      (l) =>
        String(l.leadCode || "").toLowerCase().includes(s) ||
        String(l.customerName || "").toLowerCase().includes(s) ||
        String(l.contactPerson || "").toLowerCase().includes(s)
    );
  }, [leads, lookupSearch]);

  const historyRows = useMemo(() => {
    if (!form.leadCode) return visits;
    return visits.filter((v) => v.leadCode?.toUpperCase() === form.leadCode.toUpperCase());
  }, [visits, form.leadCode]);

  const selectLead = (l: any) => {
    setForm((prev) => ({
      ...prev,
      leadCode: l.leadCode || "",
      customerName: l.customerName || "",
      contactPerson: l.contactPerson || prev.contactPerson
    }));
    setShowLeadLookup(false);
    loadVisits(l.leadCode);
  };

  const resetForm = () => {
    setForm(emptyForm());
    setFeedback(null);
    loadVisits();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!form.leadCode.trim()) {
      setFeedback({ type: "error", message: "Lead Code is required." });
      return;
    }
    if (!form.customerName.trim()) {
      setFeedback({ type: "error", message: "Customer Name is required." });
      return;
    }
    if (!form.visitRemark.trim()) {
      setFeedback({ type: "error", message: "Visit Remark is required." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        leadCode: form.leadCode.trim().toUpperCase(),
        customerName: form.customerName.trim(),
        contactPerson: form.contactPerson.trim(),
        prospectStatus: form.prospectStatus,
        visitDateTime: form.visitDateTime || fromLocalInputValue(form.visitDateLocal),
        visitRemark: form.visitRemark.trim(),
        nextVisitDateTime: form.nextVisitDateTime || fromLocalInputValue(form.nextVisitDateLocal),
        conveyanceExpenses: Number(form.conveyanceExpenses) || 0
      };

      const res = await fetch("/api/crm/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const msg = data.message || "Visit details saved.";
        setFeedback({ type: "success", message: msg });
        toast.success(msg);
        const keepLead = {
          ...emptyForm(),
          leadCode: payload.leadCode,
          customerName: payload.customerName,
          contactPerson: payload.contactPerson,
          prospectStatus: payload.prospectStatus
        };
        setForm(keepLead);
        loadVisits(payload.leadCode);
      } else {
        const msg = data.error || "Failed to save visit.";
        setFeedback({ type: "error", message: msg });
        toast.error(msg);
      }
    } catch {
      const msg = "Network error while saving visit.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Update Visit Details" />
          <p className="text-xs text-slate-500 mt-1">Log customer visits, next follow-up &amp; conveyance</p>
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

      <form onSubmit={save} className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-[#0070d2] px-4 py-2.5 text-white">
          <h2 className="text-xs font-bold tracking-wide">Customer Visit Details</h2>
        </div>

        <div className="p-4 space-y-3 text-xs">
          <div className="border border-slate-300 rounded-lg overflow-hidden divide-y divide-slate-200">
            {/* Lead Code */}
            <div className="grid grid-cols-1 md:grid-cols-6 items-center bg-slate-50/50">
              <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                Lead Code
              </div>
              <div className="md:col-span-5 p-2.5 flex items-center gap-2">
                <input
                  type="text"
                  value={form.leadCode}
                  onChange={(e) => setForm({ ...form, leadCode: e.target.value.toUpperCase() })}
                  onBlur={() => form.leadCode && loadVisits(form.leadCode)}
                  placeholder="Lead Code"
                  className="w-44 h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none font-mono font-bold uppercase bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowLeadLookup(true)}
                  className="h-8 w-8 rounded-full bg-[#0070d2] hover:bg-blue-700 text-white font-bold"
                  title="Lookup Lead"
                >
                  ...
                </button>
              </div>
            </div>

            {/* Customer Name */}
            <div className="grid grid-cols-1 md:grid-cols-6 items-center">
              <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                Customer Name
              </div>
              <div className="md:col-span-5 p-2.5">
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Customer Name"
                  className="w-full max-w-xl h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Visit Date & time */}
            <div className="grid grid-cols-1 md:grid-cols-6 items-center">
              <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                Visit Date &amp; time
              </div>
              <div className="md:col-span-5 p-2.5">
                <input
                  type="datetime-local"
                  value={form.visitDateLocal}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      visitDateLocal: e.target.value,
                      visitDateTime: fromLocalInputValue(e.target.value)
                    })
                  }
                  className="w-56 h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none bg-white font-mono"
                />
                <span className="ml-2 text-slate-500 font-mono">{form.visitDateTime}</span>
              </div>
            </div>

            {/* Prospect Status */}
            <div className="grid grid-cols-1 md:grid-cols-6 items-center">
              <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                Prospect Status
              </div>
              <div className="md:col-span-5 p-2.5">
                <select
                  value={form.prospectStatus}
                  onChange={(e) => setForm({ ...form, prospectStatus: e.target.value })}
                  className="w-56 h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none bg-white"
                >
                  <option value="">--Select--</option>
                  {PROSPECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Person */}
            <div className="grid grid-cols-1 md:grid-cols-6 items-center">
              <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                Contact Person
              </div>
              <div className="md:col-span-5 p-2.5">
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="Contact Person"
                  className="w-full max-w-md h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Visit Remark */}
            <div className="grid grid-cols-1 md:grid-cols-6 items-start">
              <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50 self-stretch flex items-center">
                Visit Remark
              </div>
              <div className="md:col-span-5 p-2.5">
                <textarea
                  rows={2}
                  value={form.visitRemark}
                  onChange={(e) => setForm({ ...form, visitRemark: e.target.value })}
                  placeholder="Visit Remark"
                  className="w-full p-2 border border-[#0070d2] rounded focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Next Visit Date / Time */}
            <div className="grid grid-cols-1 md:grid-cols-6 items-center">
              <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                Next Visit Date / Time
              </div>
              <div className="md:col-span-5 p-2.5">
                <input
                  type="datetime-local"
                  value={form.nextVisitDateLocal}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nextVisitDateLocal: e.target.value,
                      nextVisitDateTime: fromLocalInputValue(e.target.value)
                    })
                  }
                  className="w-56 h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none bg-white font-mono"
                />
                <span className="ml-2 text-slate-500 font-mono">{form.nextVisitDateTime}</span>
              </div>
            </div>

            {/* Conveyance expenses */}
            <div className="grid grid-cols-1 md:grid-cols-6 items-center">
              <div className="md:col-span-1 p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                Conveyance expenses
              </div>
              <div className="md:col-span-5 p-2.5">
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={form.conveyanceExpenses}
                  onChange={(e) => setForm({ ...form, conveyanceExpenses: Number(e.target.value) || 0 })}
                  className="w-32 h-8 px-2.5 border border-[#0070d2] rounded focus:outline-none bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
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

      {/* History table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-800">Visit History</h3>
          <button
            type="button"
            onClick={() => {
              if (historyRows.length === 0) {
                setFeedback({ type: "error", message: "No visit records to export." });
                return;
              }
              exportToCsv(
                stampFilename(form.leadCode ? `VisitDetails_${form.leadCode}` : "VisitDetails"),
                [
                  "Sr No",
                  "Lead Code",
                  "Customer Name",
                  "Visit Date",
                  "Visit Remark",
                  "Next Visit Date & Time",
                  "Conveyance expenses",
                  "Prospect Status",
                  "Contact Person"
                ],
                historyRows.map((v, idx) => [
                  idx + 1,
                  v.leadCode || "",
                  v.customerName || "",
                  v.visitDateTime || "",
                  v.visitRemark || "",
                  v.nextVisitDateTime || "",
                  v.conveyanceExpenses || 0,
                  v.prospectStatus || "",
                  v.contactPerson || ""
                ])
              );
              setFeedback({
                type: "success",
                message: `Exported ${historyRows.length} visit record(s) to Excel/CSV.`
              });
            }}
            className="h-8 px-2.5 rounded bg-[#0070d2] text-white inline-flex items-center gap-1.5 hover:bg-blue-700 text-[11px] font-semibold"
            title="Export Excel"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-16">Sr No</th>
                <th className="py-2.5 px-3">Visit Date</th>
                <th className="py-2.5 px-3">Visit Remark</th>
                <th className="py-2.5 px-3">Next Visit Date &amp; Time</th>
                <th className="py-2.5 px-3 text-right">Conveyance expenses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    {loading ? "Loading visit history..." : "No visit records."}
                  </td>
                </tr>
              ) : (
                historyRows.map((v, idx) => (
                  <tr key={v._id || idx} className="hover:bg-blue-50/40">
                    <td className="py-2 px-3 font-mono text-slate-600">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono text-slate-800">{v.visitDateTime}</td>
                    <td className="py-2 px-3 text-slate-700 max-w-[320px] truncate" title={v.visitRemark}>
                      {v.visitRemark}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-700">{v.nextVisitDateTime || "-"}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-800">
                      {Number(v.conveyanceExpenses || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showLeadLookup && (
        <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#0070d2] px-4 py-3 text-white flex items-center justify-between">
              <h3 className="font-bold text-xs tracking-wide">Select Lead</h3>
              <button
                type="button"
                onClick={() => setShowLeadLookup(false)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={lookupSearch}
                  onChange={(e) => setLookupSearch(e.target.value)}
                  placeholder="Search lead code, customer..."
                  className="w-full h-9 pl-9 pr-3 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
                {filteredLeads.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No leads found.</div>
                ) : (
                  filteredLeads.map((l) => (
                    <button
                      key={l.leadCode}
                      type="button"
                      onClick={() => selectLead(l)}
                      className="w-full text-left p-2.5 hover:bg-blue-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{l.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {l.leadCode} • {l.contactPerson || "No contact"}
                        </div>
                      </div>
                      <span className="text-[11px] text-blue-600 font-semibold px-2 py-1 bg-blue-50 rounded">
                        Select
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
