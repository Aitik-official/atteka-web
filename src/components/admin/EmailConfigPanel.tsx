"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";

type Props = {
  onBack: () => void;
};

export function EmailConfigPanel({ onBack }: Props) {
  const [hostName, setHostName] = useState("");
  const [portNo, setPortNo] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/email-config")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setHostName(d.data.hostName || "");
          setPortNo(d.data.portNo || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName, portNo })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: "E-Mail configuration saved successfully." });
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to save configuration." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error while saving." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="E-Mail Configuration" />
          <p className="text-xs text-slate-500 mt-1">Admin · Company Structure · E-Mail Configuration</p>
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

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-blue-600 text-white text-sm font-bold tracking-wide">
          E Mail Configuration
        </div>

        <div className="p-6 sm:p-8 space-y-5 max-w-md mx-auto text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Host Name</label>
            <input
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g. smtp.office365.com"
              className="w-full h-10 px-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Port No</label>
            <input
              value={portNo}
              onChange={(e) => setPortNo(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="e.g. 587"
              className="w-40 h-10 px-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={saving}
              className="min-w-[120px] px-6 py-2 text-sm font-bold rounded-full border-2 border-blue-500 text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
