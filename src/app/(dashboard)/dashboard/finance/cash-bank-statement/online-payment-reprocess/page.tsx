"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, Search } from "lucide-react";
import { toast } from "@/lib/toastBus";

type ReprocessFile = {
  id: string;
  fileName: string;
  displayLabel: string;
  generatedOn: string;
  voucherCount: number;
  totalAmount: number;
  bank: string;
};

type ResultLine = {
  srNo: number;
  voucherNo: string;
  paidTo: string;
  amount: number;
  utrRef: string;
  status: string;
  remark: string;
};

type ResultMeta = {
  fileName: string;
  displayLabel: string;
  bank: string;
  generatedOn: string;
  remarks: string;
  submittedAt: string;
  batchRef: string;
};

type ResultSummary = {
  totalLines: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  processedAmount: number;
};

function inr(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function statusCls(status: string) {
  if (status === "Success") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (status === "Pending") return "text-amber-700 bg-amber-50 border-amber-200";
  if (status === "Failed") return "text-red-700 bg-red-50 border-red-200";
  return "text-slate-700 bg-slate-100 border-slate-200";
}

export default function OnlinePaymentReprocessPage() {
  const [files, setFiles] = useState<ReprocessFile[]>([]);
  const [selected, setSelected] = useState<ReprocessFile | null>(null);
  const [remarks, setRemarks] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "result">("form");
  const [rows, setRows] = useState<ResultLine[]>([]);
  const [meta, setMeta] = useState<ResultMeta | null>(null);
  const [summary, setSummary] = useState<ResultSummary | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/bank/online-payment-reprocess")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const list: ReprocessFile[] = d.data || [];
          setFiles(list);
          const preferred =
            list.find((f) => f.fileName === "ateka_6_19012026_003") || list[0] || null;
          setSelected(preferred);
        }
      })
      .catch(() => toast.error("Failed to load re-process files"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    setTimeout(() => searchRef.current?.focus(), 0);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter(
      (f) =>
        f.fileName.toLowerCase().includes(q) ||
        f.displayLabel.toLowerCase().includes(q)
    );
  }, [files, query]);

  const submit = async () => {
    if (!selected) {
      toast.error("Select a re-process file");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bank/online-payment-reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selected.fileName,
          displayLabel: selected.displayLabel,
          remarks
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Re-process failed");
        return;
      }
      setRows(data.data || []);
      setMeta(data.meta || null);
      setSummary(data.summary || null);
      setStep("result");
      toast.success(data.message || "Re-process submitted");
    } catch {
      toast.error("Re-process failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10 font-sans">
      {step === "form" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2.5 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 rounded-full bg-white/90" />
            Online Payment Re-Process
          </div>

          <div className="px-4 py-5 space-y-4">
            <div className="relative max-w-md" ref={dropdownRef}>
              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen((v) => !v)}
                className="w-full h-10 px-3 border border-[#7eb6e8] rounded-md bg-white text-left text-[13px] text-[#0171d3] font-semibold inline-flex items-center justify-between gap-2 hover:bg-[#f5f9fd] disabled:opacity-60"
              >
                <span className="truncate">
                  {selected?.displayLabel || "Select Re-Process file"}
                </span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>

              {open && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-slate-300 shadow-lg rounded-md overflow-hidden">
                  <div className="p-2 border-b border-slate-200">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                      <input
                        ref={searchRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search file"
                        className="w-full h-9 pl-7 pr-2 border-2 border-slate-800 rounded-sm text-[12px] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto text-[12px]">
                    {filtered.map((f) => {
                      const active = selected?.fileName === f.fileName;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setSelected(f);
                            setOpen(false);
                            setQuery("");
                          }}
                          className={`w-full text-left px-3 py-2 border-b border-slate-100 ${
                            active
                              ? "bg-[#0171d3] text-white font-semibold"
                              : "text-slate-800 hover:bg-[#e8f1fb]"
                          }`}
                        >
                          {f.fileName}
                        </button>
                      );
                    })}
                    {filtered.length === 0 && (
                      <p className="px-3 py-4 text-slate-500 text-center">No matching files</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selected && (
              <p className="text-[11px] text-slate-500">
                File: <span className="font-mono text-slate-700">{selected.fileName}</span>
                {" · "}
                {selected.voucherCount} voucher(s) · {inr(selected.totalAmount)}
              </p>
            )}

            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={8}
              placeholder=""
              className="w-full min-h-[160px] px-3 py-2 border border-[#9bb8d4] rounded-sm text-[13px] text-slate-800 resize-y focus:outline-none focus:border-[#0171d3]"
            />

            <div className="flex justify-center pt-1">
              <button
                type="button"
                disabled={submitting || !selected}
                onClick={() => void submit()}
                className="h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="h-8 px-3 rounded-full border border-[#7eb6e8] bg-[#e8f1fb] text-[#0171d3] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#d7e8f8]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2.5 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 rounded-full bg-white/90" />
              Online Payment Re-Process Result
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 px-3 py-2 text-[12px] border-b border-slate-200 bg-[#e8f1fb]">
              <div>
                <span className="font-semibold text-slate-700">Batch : </span>
                <span className="font-mono">{meta?.batchRef}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">File : </span>
                <span className="font-mono">{meta?.fileName}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Bank : </span>
                <span>{meta?.bank}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Submitted : </span>
                <span>{meta?.submittedAt}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 py-3 text-[12px] border-b border-slate-200">
              <div className="bg-white border border-slate-200 rounded-sm px-2.5 py-2">
                <p className="text-slate-500 text-[10px]">Total Lines</p>
                <p className="font-bold text-slate-800">{summary?.totalLines || 0}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-sm px-2.5 py-2">
                <p className="text-slate-500 text-[10px]">Success</p>
                <p className="font-bold text-emerald-700">{summary?.successCount || 0}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-sm px-2.5 py-2">
                <p className="text-slate-500 text-[10px]">Failed / Pending</p>
                <p className="font-bold text-slate-800">
                  {summary?.failedCount || 0} / {summary?.pendingCount || 0}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-sm px-2.5 py-2">
                <p className="text-slate-500 text-[10px]">Amount</p>
                <p className="font-bold text-[#0171d3]">{inr(summary?.processedAmount || 0)}</p>
              </div>
            </div>

            {meta?.remarks ? (
              <div className="px-3 py-2 text-[12px] border-b border-slate-200">
                <span className="font-semibold text-slate-700">Remarks : </span>
                <span className="text-slate-700">{meta.remarks}</span>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[900px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    {["Sr.No", "Voucher No", "Paid To", "Amount", "UTR / Ref", "Status", "Remark"].map(
                      (h) => (
                        <th
                          key={h}
                          className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                            h === "Amount" ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.voucherNo}-${r.srNo}`} className="odd:bg-white even:bg-slate-50/70">
                      <td className="border border-slate-200 px-2 py-1.5 text-center">{r.srNo}</td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-semibold">
                        {r.voucherNo}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.paidTo}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap font-semibold">
                        {inr(r.amount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap font-mono text-[10px]">
                        {r.utrRef}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${statusCls(r.status)}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5">{r.remark || "—"}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No lines returned for this batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
