"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toastBus";

type PrintMeta = {
  location: string;
  branchCode: string;
  from: number;
  to: number;
  count: number;
  printedAt: string;
  jobRef: string;
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function DocketPrintCnPage() {
  const [locations, setLocations] = useState<{ code: string; label: string }[]>([]);
  const [location, setLocation] = useState("Ateka Logistics-ALC1");
  const [fromCn, setFromCn] = useState("0");
  const [toCn, setToCn] = useState("0");
  const [loading, setLoading] = useState(false);
  const [cnList, setCnList] = useState<string[]>([]);
  const [meta, setMeta] = useState<PrintMeta | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((b) => {
        if (b.success) {
          const list = (b.data || [])
            .map((x: any) => {
              const code = String(x.branchCode || x.code || "").trim().toUpperCase();
              const name = String(x.branchName || x.name || code).trim();
              return code ? { code, label: `${name}-${code}` } : null;
            })
            .filter(Boolean) as { code: string; label: string }[];
          if (!list.some((x) => x.code === "ALC1")) {
            list.unshift({ code: "ALC1", label: "Ateka Logistics-ALC1" });
          }
          setLocations(list);
          if (!list.some((x) => x.label === location) && list[0]) {
            setLocation(list[0].label);
          }
        }
      })
      .catch(() => {
        setLocations([{ code: "ALC1", label: "Ateka Logistics-ALC1" }]);
      });
  }, []);

  const runPrint = (list: string[], info: PrintMeta) => {
    setCnList(list);
    setMeta(info);
    // Allow React to paint the print sheet, then open the browser print dialog.
    setTimeout(() => {
      window.print();
      toast.success(`${info.count} CN number(s) sent to Dot-Matrix printer (demo)`);
    }, 120);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/docket-print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          from: fromCn,
          to: toCn
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Unable to print CN range");
        return;
      }
      runPrint(data.data || [], data.meta);
    } catch {
      toast.error("Unable to print CN range");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10 font-sans">
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-2xl mx-auto print:hidden">
        <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
          CN Number Print [Dot-Matrx]
        </div>

        <div className="px-4 py-5 space-y-4 text-[12px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-800 w-[120px] shrink-0">Location</span>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-8 min-w-[240px] px-2 border border-slate-300 rounded-sm bg-white"
            >
              {locations.map((l) => (
                <option key={l.code} value={l.label}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-800 w-[120px] shrink-0">Enter CN Range</span>
            <label className="inline-flex items-center gap-2">
              <span className="text-slate-700">From</span>
              <input
                type="number"
                min={0}
                value={fromCn}
                onChange={(e) => setFromCn(e.target.value)}
                className="h-8 w-[100px] px-2 border border-slate-300 rounded-sm"
              />
            </label>
            <label className="inline-flex items-center gap-2">
              <span className="text-slate-700">To</span>
              <input
                type="number"
                min={0}
                value={toCn}
                onChange={(e) => setToCn(e.target.value)}
                className="h-8 w-[100px] px-2 border border-slate-300 rounded-sm"
              />
            </label>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit()}
              className="h-9 min-w-[110px] px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] text-sm font-semibold hover:bg-[#e8f1fb] disabled:opacity-50"
            >
              {loading ? "Printing..." : "Submit"}
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            Submit sends the CN range directly to Dot-Matrix print (browser print dialog).
          </p>
        </div>
      </div>

      {/* Printable sheet — shown only in print media */}
      <div ref={printRef} className="docket-print-sheet">
        <div style={{ borderBottom: "1px solid #000", paddingBottom: 8, marginBottom: 16 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>CN Number Print [Dot-Matrix]</h1>
          <p style={{ fontSize: 12, margin: "6px 0 0" }}>
            Location: {meta?.location || location} · Job: {meta?.jobRef || "—"} ·{" "}
            {meta?.printedAt || toInputDate(new Date())}
          </p>
          <p style={{ fontSize: 12, margin: "4px 0 0" }}>
            Range: {meta?.from ?? fromCn} — {meta?.to ?? toCn} ({meta?.count || cnList.length} CN)
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 8,
            fontFamily: "ui-monospace, monospace",
            fontSize: 12
          }}
        >
          {(cnList.length ? cnList : ["—"]).map((cn) => (
            <div
              key={cn}
              style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "center" }}
            >
              {cn}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, marginTop: 24, textAlign: "center" }}>
          *** End of Dot-Matrix Print Job ***
        </p>
      </div>

      <style jsx global>{`
        .docket-print-sheet {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          .docket-print-sheet,
          .docket-print-sheet * {
            visibility: visible !important;
          }
          .docket-print-sheet {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #fff !important;
            color: #000 !important;
            padding: 24px !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
