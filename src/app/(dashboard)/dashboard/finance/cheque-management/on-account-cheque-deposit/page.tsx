"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { toast } from "@/lib/toastBus";

type ChequeRow = {
  srNo: number;
  chequeNo: string;
  chequeDate: string;
  entryLocation: string;
  customerCode: string;
  customerName: string;
  bankName: string;
  amount: number;
  status: string;
};

type CustomerOpt = { code: string; name: string; label: string };

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtAmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function OnAccountChequeDepositPage() {
  const today = useMemo(() => toInputDate(new Date()), []);
  const [step, setStep] = useState<"filter" | "report">("filter");
  const [searchMode, setSearchMode] = useState<"date" | "cheque">("date");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [location, setLocation] = useState("--Show All--");
  const [customerCode, setCustomerCode] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [locations, setLocations] = useState<string[]>(["--Show All--"]);
  const [customers, setCustomers] = useState<CustomerOpt[]>([
    { code: "", name: "--Show All--", label: "--Show All--" }
  ]);
  const [rows, setRows] = useState<ChequeRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/finance/on-account-cheque-deposit?lists=1")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setLocations(d.data?.locations || ["--Show All--"]);
        setCustomers(d.data?.customers || customers);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRows = async () => {
    if (searchMode === "cheque" && !chequeNumber.trim()) {
      toast.error("Enter Cheque Number");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        location: searchMode === "date" ? location : "",
        customerCode: searchMode === "date" ? customerCode : "",
        chequeNumber: searchMode === "cheque" ? chequeNumber.trim() : ""
      });
      const res = await fetch(`/api/finance/on-account-cheque-deposit?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load cheques");
        return;
      }
      setRows(data.data || []);
      setSelected({});
      setStep("report");
      if (!(data.data || []).length) toast.warning("No cheques found");
    } catch {
      toast.error("Failed to load cheques");
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = rows.length > 0 && rows.every((r) => selected[r.chequeNo]);

  const deposit = async () => {
    const chequeNos = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!chequeNos.length) {
      toast.error("Select at least one cheque");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/finance/on-account-cheque-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chequeNos })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Deposit failed");
        return;
      }
      toast.success(data.message || "Deposited (demo)");
      setRows((prev) => prev.filter((r) => !chequeNos.includes(r.chequeNo)));
      setSelected({});
    } catch {
      toast.error("Deposit failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {step === "filter" && (
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
            Select Cheque Entry Date
          </div>

          <table className="w-full text-[12px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-[28%] px-3 py-3 font-semibold text-slate-800 align-top">
                  Cheque Entry Date
                </td>
                <td className="px-3 py-3 space-y-2">
                  <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      checked={searchMode === "date"}
                      onChange={() => setSearchMode("date")}
                      className="accent-[#0171d3]"
                    />
                    <span>From :</span>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 absolute left-2 top-2 pointer-events-none" />
                      <input
                        type="date"
                        value={fromDate}
                        disabled={searchMode !== "date"}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="h-8 pl-7 pr-2 border border-slate-300 rounded-sm w-[145px] disabled:bg-slate-100"
                      />
                    </div>
                    <span>To :</span>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 absolute left-2 top-2 pointer-events-none" />
                      <input
                        type="date"
                        value={toDate}
                        disabled={searchMode !== "date"}
                        onChange={(e) => setToDate(e.target.value)}
                        className="h-8 pl-7 pr-2 border border-slate-300 rounded-sm w-[145px] disabled:bg-slate-100"
                      />
                    </div>
                  </label>
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td className="px-3 py-3 font-semibold text-slate-800">Entry Location :</td>
                <td className="px-3 py-3">
                  <select
                    value={location}
                    disabled={searchMode !== "date"}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setSearchMode("date");
                    }}
                    className="h-8 min-w-[180px] px-2 border border-slate-300 rounded-sm disabled:bg-slate-100"
                  >
                    {locations.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td className="px-3 py-3 font-semibold text-slate-800">Enter customer code :</td>
                <td className="px-3 py-3">
                  <select
                    value={customerCode}
                    disabled={searchMode !== "date"}
                    onChange={(e) => {
                      setCustomerCode(e.target.value);
                      setSearchMode("date");
                    }}
                    className="h-8 min-w-[240px] px-2 border border-slate-300 rounded-sm disabled:bg-slate-100"
                  >
                    {customers.map((c) => (
                      <option key={c.code || "all"} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td colSpan={2} className="px-3 py-2 text-center font-bold text-[#0171d3]">
                  OR
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td className="px-3 py-3 font-semibold text-slate-800">Chque Number</td>
                <td className="px-3 py-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      checked={searchMode === "cheque"}
                      onChange={() => setSearchMode("cheque")}
                      className="accent-[#0171d3]"
                    />
                    <input
                      value={chequeNumber}
                      onChange={(e) => {
                        setChequeNumber(e.target.value.toUpperCase());
                        setSearchMode("cheque");
                      }}
                      onFocus={() => setSearchMode("cheque")}
                      className="h-8 w-44 px-2 border border-slate-300 rounded-sm font-mono uppercase"
                    />
                  </label>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-center py-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadRows()}
              className="min-w-[110px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("filter")}
                className="h-8 w-8 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-sm font-bold text-[#0171d3]">On A/C Cheque Deposit</h1>
            </div>
            <button
              type="button"
              disabled={saving || !selectedCount}
              onClick={() => void deposit()}
              className="h-8 px-4 rounded-md bg-[#0171d3] text-white text-xs font-semibold disabled:opacity-50"
            >
              {saving ? "Depositing..." : `Deposit Selected (${selectedCount})`}
            </button>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1000px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#015fae] px-2 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => {
                          const next: Record<string, boolean> = {};
                          rows.forEach((r) => {
                            next[r.chequeNo] = e.target.checked;
                          });
                          setSelected(next);
                        }}
                      />
                    </th>
                    {[
                      "Sr No",
                      "Cheque No",
                      "Cheque Date",
                      "Location",
                      "Customer",
                      "Bank",
                      "Amount"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-2 font-semibold whitespace-nowrap ${
                          h === "Amount" ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No cheques to display.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.chequeNo} className="odd:bg-white even:bg-slate-50">
                        <td className="border border-slate-200 px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={!!selected[r.chequeNo]}
                            onChange={(e) =>
                              setSelected((prev) => ({ ...prev, [r.chequeNo]: e.target.checked }))
                            }
                          />
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 font-mono">{r.srNo}</td>
                        <td className="border border-slate-200 px-2 py-1.5 font-mono font-semibold text-blue-700">
                          {r.chequeNo}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          {r.chequeDate}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 font-mono">
                          {r.entryLocation}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5">
                          {r.customerCode} - {r.customerName}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5">{r.bankName}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                          {fmtAmt(r.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Deposit is demo-only — no bank posting.</p>
        </div>
      )}
    </div>
  );
}
