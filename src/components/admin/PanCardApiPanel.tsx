"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { WcvRibbonHeader } from "@/components/common/WcvActionCard";

type Props = {
  onBack: () => void;
};

export function PanCardApiPanel({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [result, setResult] = useState<{
    panNumber: string;
    entityName: string;
    status: string;
    category: string;
    fileName: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFeedback({ type: "error", message: "Choose a PAN card file first." });
      return;
    }
    setLoading(true);
    setFeedback(null);
    setResult(null);
    try {
      // Sandbox verify — accept image/pdf upload and return mock NSDL-style response
      await new Promise((r) => setTimeout(r, 500));
      const mock = {
        panNumber: "AABCA1234F",
        entityName: "ATTEKA LOGISTICS PRIVATE LIMITED",
        status: "OPERATIVE & VERIFIED",
        category: "COMPANY",
        fileName: file.name
      };
      setResult(mock);
      setFeedback({
        type: "success",
        message: `PAN extracted from ${file.name} and verified (sandbox).`
      });
    } catch {
      setFeedback({ type: "error", message: "Failed to process PAN card file." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WcvRibbonHeader title="Pan Card API" />
          <p className="text-xs text-slate-500 mt-1">Admin · APIs · NSDL / Income Tax verification (sandbox)</p>
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

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-blue-600 text-white text-sm font-bold">Pan Card API</div>

        <div className="p-6 flex flex-wrap items-center gap-4 sm:gap-8">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setResult(null);
                setFeedback(null);
              }}
              className="text-xs file:mr-2"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 text-xs font-semibold border border-slate-400 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {result.status}
            </span>
            <span className="font-mono text-[10px] text-slate-500">NSDL Sandbox</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Uploaded File</span>
            <span className="font-semibold text-slate-800">{result.fileName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">PAN Number</span>
            <span className="font-mono font-bold text-slate-800">{result.panNumber}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Registered Name</span>
            <span className="font-semibold text-slate-800">{result.entityName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Category</span>
            <span className="font-mono text-slate-700">{result.category}</span>
          </div>
        </div>
      )}
    </div>
  );
}
