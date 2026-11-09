"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Search } from "lucide-react";
import { toast } from "@/lib/toastBus";

type CustomerOpt = { code: string; name: string; label: string };

const BRANCHES = ["ALC1", "ALC2", "PUNE", "NASHIK", "THANE"];

const FALLBACK_CUSTOMERS: CustomerOpt[] = [
  { code: "CUS0001", name: "NORTHBOUND FREIGHT PVT LTD", label: "CUS0001 - NORTHBOUND FREIGHT PVT LTD" },
  { code: "CUS0002", name: "COASTAL CARGO SOLUTIONS", label: "CUS0002 - COASTAL CARGO SOLUTIONS" },
  { code: "CUS0003", name: "METRO LOGISTICS PARTNERS", label: "CUS0003 - METRO LOGISTICS PARTNERS" },
  { code: "CUS0004", name: "GATEWAY DISTRIBUTION CO", label: "CUS0004 - GATEWAY DISTRIBUTION CO" }
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function OnAccountChequeReceiptPage() {
  const [chequeUtrNo, setChequeUtrNo] = useState("");
  const [chequeUtrDate, setChequeUtrDate] = useState(toInputDate(new Date()));
  const [amount, setAmount] = useState(0);
  const [bankName, setBankName] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [narration, setNarration] = useState("");
  const [chequeReceivedAt, setChequeReceivedAt] = useState("");
  const [customers, setCustomers] = useState<CustomerOpt[]>(FALLBACK_CUSTOMERS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !Array.isArray(d.data) || !d.data.length) return;
        setCustomers(
          d.data.slice(0, 80).map((c: any) => {
            const code = String(c.customerCode || c.code || "").trim();
            const name = String(c.name || c.customerName || "Customer").trim();
            return {
              code: code || name.slice(0, 8).toUpperCase(),
              name,
              label: code ? `${code} - ${name}` : name
            };
          })
        );
      })
      .catch(() => {});
  }, []);

  const partyHint = useMemo(
    () => (!receivedFrom.trim() && customerName.trim() ? "other" : receivedFrom.trim() ? "master" : "none"),
    [receivedFrom, customerName]
  );

  const submit = async () => {
    if (!chequeUtrNo.trim()) {
      toast.error("Enter Cheque / UTR number");
      return;
    }
    if (!Number(amount) || Number(amount) <= 0) {
      toast.error("Enter Amount");
      return;
    }
    if (partyHint === "none") {
      toast.error("Select Received From or enter Customer Name");
      return;
    }
    setSaving(true);
    try {
      // Demo-only — no ledger / cheque register posting.
      await new Promise((r) => setTimeout(r, 350));
      toast.success(`On Account cheque ${chequeUtrNo.trim().toUpperCase()} saved (demo)`);
      setChequeUtrNo("");
      setAmount(0);
      setBankName("");
      setBankBranch("");
      setReceivedFrom("");
      setCustomerName("");
      setNarration("");
      setChequeReceivedAt("");
      setChequeUtrDate(toInputDate(new Date()));
    } catch {
      toast.error("Failed to save cheque receipt");
    } finally {
      setSaving(false);
    }
  };

  const labelCls = "text-[12px] font-semibold text-[#0171d3] whitespace-nowrap";
  const fieldCls =
    "w-full h-9 px-2.5 border border-blue-300 rounded-md text-xs bg-white focus:outline-none focus:border-[#0171d3]";

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 text-center">
          On Account Cheque Entry
        </div>

        <div className="p-4 sm:p-5 space-y-0 text-[12px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 py-3 border-b border-slate-200">
            <label className="grid grid-cols-[150px_1fr] items-center gap-2">
              <span className={labelCls}>Cheque / UTR number</span>
              <input
                value={chequeUtrNo}
                onChange={(e) => setChequeUtrNo(e.target.value.toUpperCase())}
                className={`${fieldCls} font-mono`}
              />
            </label>
            <label className="grid grid-cols-[150px_1fr] items-center gap-2">
              <span className={labelCls}>Cheque / UTR Date</span>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={chequeUtrDate}
                  onChange={(e) => setChequeUtrDate(e.target.value)}
                  className={`${fieldCls} pl-8`}
                />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 py-3 border-b border-slate-200">
            <label className="grid grid-cols-[150px_1fr] items-center gap-2">
              <span className={labelCls}>Amount</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className={fieldCls}
              />
            </label>
            <label className="grid grid-cols-[150px_1fr] items-center gap-2">
              <span className={labelCls}>Bank Name</span>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className={fieldCls}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 py-3 border-b border-slate-200">
            <label className="grid grid-cols-[150px_1fr] items-center gap-2">
              <span className={labelCls}>Received From</span>
              <div className="relative">
                <input
                  value={receivedFrom}
                  onChange={(e) => {
                    setReceivedFrom(e.target.value);
                    if (e.target.value.trim()) setCustomerName("");
                  }}
                  list="on-ac-customers"
                  className={`${fieldCls} pr-8`}
                />
                <Search className="w-3.5 h-3.5 text-blue-500 absolute right-2.5 top-2.5 pointer-events-none" />
                <datalist id="on-ac-customers">
                  {customers.map((c) => (
                    <option key={c.code} value={c.label} />
                  ))}
                </datalist>
              </div>
            </label>
            <label className="grid grid-cols-[150px_1fr] items-center gap-2">
              <span className={labelCls}>Bank Branch</span>
              <input
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                className={fieldCls}
              />
            </label>
          </div>

          <div className="py-2 text-center font-bold text-[#0171d3] border-b border-slate-200">
            OR
          </div>

          <div className="py-3 border-b border-slate-200">
            <label className="grid grid-cols-1 sm:grid-cols-[150px_1fr] items-start sm:items-center gap-2">
              <span className={labelCls}>Customer Name</span>
              <div className="space-y-1">
                <input
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (e.target.value.trim()) setReceivedFrom("");
                  }}
                  className={fieldCls}
                />
                <p className="text-[11px] text-[#0171d3]">
                  **Enter Party name here for Other Customer
                </p>
              </div>
            </label>
          </div>

          <div className="py-3 border-b border-slate-200">
            <label className="grid grid-cols-1 sm:grid-cols-[150px_1fr] items-start gap-2">
              <span className={`${labelCls} pt-1.5`}>Narration</span>
              <textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                rows={3}
                className="w-full px-2.5 py-2 border border-blue-300 rounded-md text-xs bg-white focus:outline-none focus:border-[#0171d3] resize-y min-h-[72px]"
              />
            </label>
          </div>

          <div className="py-3">
            <label className="grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <span className={labelCls}>Cheque Received at</span>
              <div className="relative max-w-md">
                <input
                  value={chequeReceivedAt}
                  onChange={(e) => setChequeReceivedAt(e.target.value)}
                  list="on-ac-branches"
                  className={`${fieldCls} pr-8`}
                />
                <Search className="w-3.5 h-3.5 text-blue-500 absolute right-2.5 top-2.5 pointer-events-none" />
                <datalist id="on-ac-branches">
                  {BRANCHES.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="min-w-[120px] h-9 px-6 rounded-full border border-[#0171d3] text-[#0171d3] bg-white text-[12px] font-semibold hover:bg-blue-50 disabled:opacity-50"
        >
          {saving ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
