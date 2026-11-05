"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Search,
  UserRound
} from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";

type DlRecord = {
  id?: string;
  fullName: string;
  licence: string;
  licenceValidFrom: string;
  licenceValidTo: string;
  dateOfBirth: string;
  address1: string;
  address2: string;
  address3: string;
  profilePicture?: string;
  status?: string;
  vehicleClasses?: string;
  rto?: string;
};

const emptyDetail: DlRecord = {
  fullName: "",
  licence: "",
  licenceValidFrom: "",
  licenceValidTo: "",
  dateOfBirth: "",
  address1: "",
  address2: "",
  address3: "",
  profilePicture: ""
};

type Props = {
  onBack: () => void;
};

function toDisplayDob(isoOrDmy: string) {
  if (!isoOrDmy) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDmy)) {
    const [y, m, d] = isoOrDmy.split("-");
    return `${d}-${m}-${y}`;
  }
  return isoOrDmy;
}

export function DrivingLicenceApiPanel({ onBack }: Props) {
  const [dob, setDob] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [matches, setMatches] = useState<DlRecord[]>([]);
  const [selected, setSelected] = useState<DlRecord | null>(null);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const params = new URLSearchParams();
      if (dob) params.set("dob", dob);
      if (searchText.trim()) params.set("q", searchText.trim());
      const res = await fetch(`/api/driving-licence?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const list: DlRecord[] = data.data || [];
        setMatches(list);
        if (list.length === 0) {
          setSelected(null);
          setFeedback({ type: "error", message: "No driving licence record found for the given criteria." });
        } else {
          setSelected(list[0]);
          setFeedback({
            type: "success",
            message: list.length === 1 ? "Licence record found." : `${list.length} matching users found. Showing first profile.`
          });
        }
      } else {
        setFeedback({ type: "error", message: data.error || "Search failed." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error while searching." });
    } finally {
      setLoading(false);
    }
  };

  const detail = selected || emptyDetail;

  const rows: { field: string; detail: string }[] = [
    { field: "Full Name", detail: detail.fullName || "—" },
    { field: "Licence", detail: detail.licence || "—" },
    { field: "Licence Valide From", detail: detail.licenceValidFrom || "—" },
    { field: "Licence Valide To", detail: detail.licenceValidTo || "—" },
    { field: "Addres 1", detail: detail.address1 || "—" },
    { field: "Addres 2", detail: detail.address2 || "—" },
    { field: "Addres 3", detail: detail.address3 || "—" }
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Driving Licence API" />
          <p className="text-xs text-slate-500 mt-1">Admin · APIs · MoRTH Sarathi verification (sandbox)</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          ← APIs
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

      <form
        onSubmit={runSearch}
        className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
      >
        <div className="px-4 py-3 bg-blue-600 text-white text-sm font-bold">Driving Licence API</div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 items-center max-w-xl">
            <label className="font-semibold text-slate-700">Date of Birth</label>
            <div>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">dd-mm-yyyy</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2 sm:gap-3 items-center max-w-2xl">
            <label className="font-semibold text-slate-700">Search users...</label>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Name / Licence / Address"
              className="w-full h-10 px-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">Profile Picture</div>
            <div className="w-40 h-44 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
              {detail.profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-400">
                  <UserRound className="w-12 h-12 mx-auto mb-1" />
                  <div className="text-[10px]">No photo</div>
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-600">
              <span className="font-semibold">Date of Birth:</span>{" "}
              {selected ? selected.dateOfBirth || toDisplayDob(dob) : toDisplayDob(dob) || "—"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-44">Field</th>
                  <th className="py-2.5 px-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.field} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{r.field}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-mono sm:font-sans">{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {matches.length > 1 && (
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-slate-600 mb-1.5">Matching users</div>
                <div className="flex flex-wrap gap-2">
                  {matches.map((m) => (
                    <button
                      key={m.id || m.licence}
                      type="button"
                      onClick={() => setSelected(m)}
                      className={`px-2.5 py-1.5 rounded-md border text-[11px] font-semibold ${
                        selected?.licence === m.licence
                          ? "bg-blue-50 border-blue-300 text-blue-800"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {m.fullName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
