"use client";

import React, { useMemo, useState } from "react";
import { toast } from "@/lib/toastBus";
import { useMasterOptions } from "@/hooks/useMasterOptions";
import { WcvFormCard, WcvSelect } from "@/components/common/WcvFormPrimitives";

type EntityType = "Vendor" | "Customer" | "Staff" | "";

const TDS_OPTIONS = ["--Select--", "194C", "194H", "194I", "194J", "194Q", "No TDS"];
const MODES = ["--Select--", "Cash", "Cheque", "NEFT", "RTGS", "UPI"];
const CASH_BANK = [
  "--Select--",
  "Cash in Hand - ALC1",
  "HDFC Bank - Ops",
  "ICICI Bank - Current"
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtAmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function CreditVoucherPage() {
  const { options } = useMasterOptions();
  const [voucherDate, setVoucherDate] = useState(toInputDate(new Date()));
  const [location, setLocation] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [partyCode, setPartyCode] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("");
  const [gstNo, setGstNo] = useState("");
  const [panNo, setPanNo] = useState("");
  const [refNo, setRefNo] = useState("");
  const [narration, setNarration] = useState("");

  const [acDescription, setAcDescription] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [amount, setAmount] = useState(0);
  const [taxableAmount, setTaxableAmount] = useState(0);
  const [tds, setTds] = useState("--Select--");
  const [tdsRate, setTdsRate] = useState(0);
  const [tdsAmountManual, setTdsAmountManual] = useState(0);

  const [mode, setMode] = useState("--Select--");
  const [cashBankAccount, setCashBankAccount] = useState("--Select--");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState(toInputDate(new Date()));
  const [saving, setSaving] = useState(false);

  const charsRemaining = Math.max(0, 500 - narration.length);

  const tdsAmount = useMemo(() => {
    if (tds === "--Select--" || tds === "No TDS" || !tdsRate) {
      return Number(tdsAmountManual || 0);
    }
    return Number(((Number(taxableAmount || 0) * Number(tdsRate || 0)) / 100).toFixed(2));
  }, [tds, tdsRate, taxableAmount, tdsAmountManual]);

  const netPayable = useMemo(() => {
    return Number((Number(taxableAmount || 0) - tdsAmount).toFixed(2));
  }, [taxableAmount, tdsAmount]);

  const syncAmountToTaxable = (value: number) => {
    setAmount(value);
    setTaxableAmount(value);
  };

  const [accountLookupOpen, setAccountLookupOpen] = useState(false);
  const [accountOptions, setAccountOptions] = useState<
    { code: string; name: string; group: string }[]
  >([]);

  const openAccountLookup = async () => {
    try {
      const res = await fetch("/api/finance/credit-voucher?accounts=1");
      const data = await res.json();
      setAccountOptions(data.data?.accounts || []);
      setAccountLookupOpen(true);
    } catch {
      toast.error("Failed to load accounts");
    }
  };

  const submitVoucher = async () => {
    if (!receivedFrom.trim()) {
      toast.error("Enter Received From");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/finance/credit-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucherDate,
          location,
          receivedFrom,
          partyCode,
          entityType,
          gstNo,
          panNo,
          refNo,
          narration,
          acDescription,
          accountCode,
          amount,
          taxableAmount,
          tds,
          tdsRate,
          tdsAmount,
          netPayable,
          mode,
          cashBankAccount,
          chequeNo,
          chequeDate
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit credit voucher");
        return;
      }
      toast.success(data.message || `Credit voucher ${data.data?.voucherNumber} submitted`);
    } catch {
      toast.error("Failed to submit credit voucher");
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    "w-full h-9 px-2.5 border border-blue-200 rounded-md text-xs bg-white focus:outline-none focus:border-[#0171d3]";
  const labelCls = "block text-[11px] font-semibold text-slate-600 mb-1";

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      <WcvFormCard title="Credit Voucher" className="max-w-5xl mx-auto">
        {/* Voucher Information */}
        <div className="space-y-4 border-b border-slate-100 pb-4">
          <p className="text-xs font-semibold text-slate-700 italic">
            Please Enter Voucher Information...
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Voucher Number</label>
              <input
                readOnly
                value="System Generated..."
                className={`${fieldCls} bg-slate-50 text-slate-500 italic`}
              />
            </div>
            <div>
              <label className={labelCls}>Voucher Date</label>
              <input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Locations</label>
              <WcvSelect
                value={location}
                onChange={setLocation}
                options={options.branches}
                includeEmpty
                placeholder="---select---"
                className="w-full"
              />
            </div>

            <div>
              <label className={labelCls}>Received From</label>
              <input
                value={receivedFrom}
                onChange={(e) => setReceivedFrom(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Party Code</label>
              <input
                value={partyCode}
                onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Entity</label>
              <div className="flex flex-wrap gap-1.5">
                {(["Vendor", "Customer", "Staff"] as const).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEntityType(entityType === e ? "" : e)}
                    className={`h-9 px-3 rounded-full text-[11px] font-semibold border ${
                      entityType === e
                        ? "bg-[#0171d3] text-white border-[#0171d3]"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>GST No</label>
              <input
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>PAN NO</label>
              <input
                value={panNo}
                onChange={(e) => setPanNo(e.target.value.toUpperCase())}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Ref. No.</label>
              <input
                value={refNo}
                onChange={(e) => setRefNo(e.target.value.toUpperCase())}
                className={fieldCls}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelCls}>Narration</label>
              <textarea
                value={narration}
                maxLength={500}
                rows={3}
                onChange={(e) => setNarration(e.target.value.slice(0, 500))}
                className="w-full px-2.5 py-2 border border-blue-200 rounded-md text-xs bg-white focus:outline-none focus:border-[#0171d3] resize-y min-h-[72px]"
              />
              <p className="mt-1 text-[11px] text-slate-500">{charsRemaining} characters remaining</p>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="p-4 sm:p-5 space-y-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-700 italic">Account Details...</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>A/C Description</label>
              <input
                value={acDescription}
                onChange={(e) => setAcDescription(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Account Code</label>
              <div className="flex gap-1.5">
                <input
                  value={accountCode}
                  onChange={(e) => setAccountCode(e.target.value.toUpperCase())}
                  className={fieldCls}
                />
                <button
                  type="button"
                  onClick={() => void openAccountLookup()}
                  className="h-9 w-9 rounded-md bg-[#5dade2] text-white text-[11px] font-bold shrink-0 hover:bg-[#3498db]"
                  title="Browse account"
                >
                  ...
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => syncAmountToTaxable(Number(e.target.value) || 0)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Taxable amount</label>
              <input
                type="number"
                value={taxableAmount}
                onChange={(e) => setTaxableAmount(Number(e.target.value) || 0)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>TDS</label>
              <select value={tds} onChange={(e) => setTds(e.target.value)} className={fieldCls}>
                {TDS_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>TDS Rate</label>
              <input
                type="number"
                value={tdsRate}
                onChange={(e) => setTdsRate(Number(e.target.value) || 0)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Amount (TDS)</label>
              <input
                type="number"
                value={tds === "--Select--" || tds === "No TDS" ? tdsAmountManual : tdsAmount}
                onChange={(e) => setTdsAmountManual(Number(e.target.value) || 0)}
                disabled={!(tds === "--Select--" || tds === "No TDS")}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Net Payable</label>
              <input
                readOnly
                value={fmtAmt(netPayable)}
                className={`${fieldCls} bg-emerald-50 font-mono font-bold text-emerald-700`}
              />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-700 italic">Payment Details...</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Mode Of Transaction</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className={fieldCls}>
                {MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Cash / Bank Account</label>
              <select
                value={cashBankAccount}
                onChange={(e) => setCashBankAccount(e.target.value)}
                className={fieldCls}
              >
                {CASH_BANK.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Cheque No</label>
              <input
                value={chequeNo}
                onChange={(e) => setChequeNo(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Cheque Date</label>
              <input
                type="date"
                value={chequeDate}
                onChange={(e) => setChequeDate(e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Available Balance: <span className="font-mono font-semibold">₹ 0.00</span>
          </p>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              disabled={saving}
              onClick={submitVoucher}
              className="min-w-[160px] h-9 px-6 rounded-md border border-[#0171d3] text-[#0171d3] bg-white text-xs font-semibold hover:bg-blue-50 disabled:opacity-50"
            >
              {saving ? "Submitting..." : "Submit Voucher"}
            </button>
          </div>
        </div>
      </WcvFormCard>

      {accountLookupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Select Account</h2>
              <button
                type="button"
                onClick={() => setAccountLookupOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                ×
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto text-xs">
              {accountOptions.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No accounts loaded</p>
              ) : (
                accountOptions.map((a) => (
                  <button
                    key={a.code}
                    type="button"
                    onClick={() => {
                      setAccountCode(a.code);
                      setAcDescription(a.name);
                      setAccountLookupOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50"
                  >
                    <span className="font-mono font-semibold text-blue-700">{a.code}</span>
                    <span className="text-slate-700 ml-2">{a.name}</span>
                    {a.group ? <span className="text-slate-400 ml-2">· {a.group}</span> : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
