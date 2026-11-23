"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronDown, X } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { printMoneyReceipt } from "@/lib/mrPrintFormats";

type BillRow = {
  billNumber: string;
  manualBillNumber: string;
  billingBranch: string;
  branchCode?: string;
  partyCode: string;
  partyName: string;
  customerCode?: string;
  customerName?: string;
  partyAddress?: string;
  billType: string;
  freightAmount?: number;
  gstAmount?: number;
  billAmount: number;
  pendingAmount?: number;
  unadjustedAmount: number;
  generationDate: string;
  billDateLabel?: string;
  dueDate: string;
  consignments?: string[];
};

type BillLine = {
  billNumber: string;
  manualBillNumber: string;
  billDate: string;
  amount: number;
  gstAmount: number;
  billAmount: number;
  pendingAmount: number;
  tds: number;
  freightRebate: number;
  claim: number;
  unadjustedAmount: number;
  netRecdAmount: number;
  shortPaymentType: string;
  shortPaymentRemark: string;
  consignments: string[];
};

type DeductionRow = {
  billNo: string;
  docketNo: string;
  dktTot: number;
  freightRebate: number;
  claimDeduction: number;
  totalDeduction: number;
  recoveryType: string;
  maxFreightRebate: number;
  maxClaim: number;
};

type BillLookup = {
  billNo: string;
  dockets: { docketNo: string; docketTotal: number }[];
};

type CustomerOpt = { code: string; name: string; label: string };

const BANK_ACCOUNTS = [
  "INDUSIND BANK ATEKA-201038123456",
  "DCB BANK ATEKA-08422400000786",
  "HDFC BANK ATEKA CURRENT"
];

const MODES = ["DD", "Cheque", "NEFT", "RTGS", "Cash", "Online"];
const SHORT_TYPES = ["Deduction", "Shortage", "On Account", "Others"];
const TDS_TYPES = ["", "194C", "194H", "194I", "194J"];
const RECOVERY_TYPES = ["", "Freight Rebate", "Claim", "Shortage", "Others"];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

function netFor(line: Pick<BillLine, "pendingAmount" | "tds" | "freightRebate" | "claim" | "unadjustedAmount">) {
  return Number(
    Math.max(
      0,
      Number(line.pendingAmount || 0) -
        Number(line.tds || 0) -
        Number(line.freightRebate || 0) -
        Number(line.claim || 0) -
        Number(line.unadjustedAmount || 0)
    ).toFixed(2)
  );
}

function fieldBox(label: string, children: React.ReactNode, className = "") {
  return (
    <label className={`relative block ${className}`}>
      <span className="absolute -top-2 left-3 px-1 bg-white text-[11px] font-semibold text-[#0171d3] z-10">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full h-10 px-3 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:border-[#0171d3]";

export default function GenerateBillMrRebatePage() {
  const [step, setStep] = useState<"filter" | "report" | "entry" | "success">("filter");
  const [manualBills, setManualBills] = useState("");
  const [customer, setCustomer] = useState("");
  const [billType, setBillType] = useState("Show All");
  const [billScope, setBillScope] = useState<"range" | "all">("range");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(29)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [billTypes, setBillTypes] = useState<string[]>(["Show All"]);
  const [rows, setRows] = useState<BillRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Entry form
  const [mrDate, setMrDate] = useState(toInputDate(new Date()));
  const [mrBranch, setMrBranch] = useState("ALC1");
  const [partyCodeName, setPartyCodeName] = useState("");
  const [partyAddress, setPartyAddress] = useState("");
  const [manualMrPrefix, setManualMrPrefix] = useState("ALC126");
  const [manualMrNo, setManualMrNo] = useState("");
  const [tdsType, setTdsType] = useState("");
  const [tdsRate, setTdsRate] = useState(0);
  const [billLines, setBillLines] = useState<BillLine[]>([]);
  const [mode, setMode] = useState("DD");
  const [depositedAccount, setDepositedAccount] = useState(BANK_ACCOUNTS[0]);
  const [chequeNeftNo, setChequeNeftNo] = useState("");
  const [chequeDate, setChequeDate] = useState(toInputDate(new Date()));
  const [chequeAmount, setChequeAmount] = useState(0);
  const [onAcctBalance, setOnAcctBalance] = useState(0);
  const [amountToBeAccounted, setAmountToBeAccounted] = useState(0);
  const [collectedAmount, setCollectedAmount] = useState(0);
  const [bankName, setBankName] = useState("");
  const [chequeClearDate, setChequeClearDate] = useState(toInputDate(new Date()));
  const [excessSign, setExcessSign] = useState<"+" | "-">("+");
  const [excessAmount, setExcessAmount] = useState(0);
  const [interestSign, setInterestSign] = useState<"+" | "-">("+");
  const [interestAmount, setInterestAmount] = useState(0);
  const [remark, setRemark] = useState("");

  // Popups / two-step submit
  const [showDeductionPopup, setShowDeductionPopup] = useState(false);
  const [showBillLookup, setShowBillLookup] = useState(false);
  const [billLookup, setBillLookup] = useState<BillLookup | null>(null);
  const [rowsPerBill, setRowsPerBill] = useState(1);
  const [deductionRows, setDeductionRows] = useState<DeductionRow[]>([]);
  const [deductionSaved, setDeductionSaved] = useState(false);
  const [acting, setActing] = useState(false);
  const [successMr, setSuccessMr] = useState("");
  const [successPayload, setSuccessPayload] = useState<any>(null);

  useEffect(() => {
    fetch("/api/finance/generate-bill-mr?lists=1")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setCustomers(d.data?.customers || []);
        setBillTypes(d.data?.billTypes || ["Show All"]);
      })
      .catch(() => {});
  }, []);

  const periodLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const loadBills = async (modeLoad: "manual" | "filter") => {
    if (modeLoad === "manual" && !manualBills.trim()) {
      toast.error("Enter Manual Bill Number");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: modeLoad,
        manualBills: manualBills.trim(),
        customer: customer.trim(),
        billType,
        from: billScope === "all" ? "2000-01-01" : fromDate,
        to: billScope === "all" ? "2099-12-31" : toDate
      });
      const res = await fetch(`/api/finance/generate-bill-mr?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load bills");
        return;
      }
      const list: BillRow[] = data.data || [];
      setRows(list);
      setSelected({});
      setPage(1);
      setSearch("");
      setStep("report");
      if (!list.length) toast.warning("No bills found for selected criteria");
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.billNumber, r.manualBillNumber, r.billingBranch, r.partyName, r.billType, r.generationDate]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allPageSelected = paged.length > 0 && paged.every((r) => selected[r.billNumber]);
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const toggleAllPage = (checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      paged.forEach((r) => {
        next[r.billNumber] = checked;
      });
      return next;
    });
  };

  const totals = useMemo(() => {
    return billLines.reduce(
      (acc, l) => {
        acc.pending += Number(l.pendingAmount || 0);
        acc.tds += Number(l.tds || 0);
        acc.rebate += Number(l.freightRebate || 0);
        acc.claim += Number(l.claim || 0);
        acc.unadj += Number(l.unadjustedAmount || 0);
        acc.net += Number(l.netRecdAmount || 0);
        return acc;
      },
      { pending: 0, tds: 0, rebate: 0, claim: 0, unadj: 0, net: 0 }
    );
  }, [billLines]);

  const syncPaymentFromNet = (net: number) => {
    setChequeAmount(net);
    setAmountToBeAccounted(net);
    setCollectedAmount(net);
  };

  const openEntry = () => {
    if (!selectedCount) {
      toast.error("Select at least one bill");
      return;
    }
    const picked = rows.filter((r) => selected[r.billNumber]);
    const first = picked[0];
    setMrBranch(first.branchCode || "ALC1");
    setPartyCodeName(first.partyName || `${first.partyCode} : ${first.customerName || ""}`);
    setPartyAddress(first.partyAddress || "");
    setManualMrPrefix(`${(first.branchCode || "ALC1").replace(/[^A-Za-z]/g, "").slice(0, 3)}126`);
    setManualMrNo(String(Math.floor(Math.random() * 90000) + 10000).slice(-5));

    const lines: BillLine[] = picked.map((r) => {
      const pending = Number(r.pendingAmount ?? r.billAmount ?? 0);
      const line: BillLine = {
        billNumber: r.billNumber,
        manualBillNumber: r.manualBillNumber || r.billNumber,
        billDate: r.billDateLabel || r.generationDate,
        amount: Number(r.freightAmount ?? r.billAmount ?? 0),
        gstAmount: Number(r.gstAmount || 0),
        billAmount: Number(r.billAmount || 0),
        pendingAmount: pending,
        tds: 0,
        freightRebate: 0,
        claim: 0,
        unadjustedAmount: 0,
        netRecdAmount: pending,
        shortPaymentType: "Deduction",
        shortPaymentRemark: "",
        consignments: r.consignments || []
      };
      line.netRecdAmount = netFor(line);
      return line;
    });
    setBillLines(lines);
    syncPaymentFromNet(lines.reduce((s, l) => s + l.netRecdAmount, 0));
    setRemark("");
    setShowDeductionPopup(false);
    setShowBillLookup(false);
    setBillLookup(null);
    setDeductionRows([]);
    setDeductionSaved(false);
    setRowsPerBill(1);
    setStep("entry");
  };

  const updateLine = (idx: number, patch: Partial<BillLine>) => {
    setBillLines((prev) => {
      const next = prev.map((l, i) => {
        if (i !== idx) return l;
        const merged = { ...l, ...patch };
        // Auto TDS from rate when rate changes globally is handled separately
        merged.netRecdAmount = netFor(merged);
        return merged;
      });
      syncPaymentFromNet(next.reduce((s, l) => s + l.netRecdAmount, 0));
      return next;
    });
  };

  const applyTdsRate = (rate: number) => {
    setTdsRate(rate);
    setBillLines((prev) => {
      const next = prev.map((l) => {
        const tds = Number(((Number(l.pendingAmount || 0) * rate) / 100).toFixed(2));
        const merged = { ...l, tds };
        merged.netRecdAmount = netFor(merged);
        return merged;
      });
      syncPaymentFromNet(next.reduce((s, l) => s + l.netRecdAmount, 0));
      return next;
    });
  };

  /** First Submit → empty Document Details. Go fills clickable bill rows. */
  const openDeductionPopup = () => {
    if (!billLines.length) {
      toast.error("No bills on MR");
      return;
    }
    setDeductionRows([]);
    setRowsPerBill(1);
    setShowBillLookup(false);
    setBillLookup(null);
    setShowDeductionPopup(true);
  };

  const buildDeductionRows = (n: number) => {
    const count = Math.max(1, Math.min(20, Number(n) || 1));
    const rowsOut: DeductionRow[] = [];
    for (const line of billLines) {
      for (let i = 0; i < count; i++) {
        const maxReb = Number(line.freightRebate || 0) || 100;
        const maxClaim = Number(line.claim || 0);
        rowsOut.push({
          billNo: line.billNumber,
          docketNo: "",
          dktTot: 0,
          freightRebate: 0,
          claimDeduction: 0,
          totalDeduction: 0,
          recoveryType: "",
          maxFreightRebate: maxReb,
          maxClaim
        });
      }
    }
    setDeductionRows(rowsOut);
    setRowsPerBill(count);
  };

  const openBillLookup = (billNo: string) => {
    const line = billLines.find((l) => l.billNumber === billNo);
    const dockets = (line?.consignments || []).map((d) => ({
      docketNo: d,
      docketTotal: Number(line?.pendingAmount || line?.billAmount || 0)
    }));
    // Always show at least one row so user can copy a docket (seed placeholder if missing)
    setBillLookup({
      billNo,
      dockets: dockets.length
        ? dockets
        : [
            {
              docketNo: `${mrBranch.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "ALC"}126${String(
                Date.now()
              ).slice(-5)}`,
              docketTotal: Number(line?.pendingAmount || line?.billAmount || 0)
            }
          ]
    });
    setShowBillLookup(true);
  };

  const saveDeductionPopup = () => {
    if (!deductionRows.length) {
      toast.error("Click Go to load bill rows first");
      return;
    }
    const missingDocket = deductionRows.some((r) => r.billNo && !String(r.docketNo || "").trim());
    if (missingDocket) {
      toast.warning("Paste Docket No from the bill lookup into the Docket No column");
    }

    setBillLines((prev) => {
      const next = prev.map((line) => {
        const billSpecific = deductionRows.filter((d) => d.billNo === line.billNumber);
        if (!billSpecific.length) return line;
        const enteredReb = billSpecific.reduce((s, r) => s + Number(r.freightRebate || 0), 0);
        const enteredClaim = billSpecific.reduce((s, r) => s + Number(r.claimDeduction || 0), 0);
        const merged = {
          ...line,
          freightRebate: Number((enteredReb || line.freightRebate).toFixed(2)),
          claim: Number((enteredClaim || line.claim).toFixed(2))
        };
        merged.netRecdAmount = netFor(merged);
        return merged;
      });
      syncPaymentFromNet(next.reduce((s, l) => s + l.netRecdAmount, 0));
      return next;
    });

    setDeductionSaved(true);
    setShowDeductionPopup(false);
    setShowBillLookup(false);
    toast.success("Saved");
  };

  const handleEntrySubmit = () => {
    if (!deductionSaved) {
      openDeductionPopup();
      return;
    }
    void finalizeMr();
  };

  const finalizeMr = async () => {
    setActing(true);
    try {
      const docketLines = deductionRows
        .filter((r) => r.billNo)
        .map((r) => ({
          billNo: r.billNo,
          docketNo: r.docketNo,
          docketTotal: r.dktTot || billLines.find((b) => b.billNumber === r.billNo)?.pendingAmount || 0
        }));

      const payload = {
        withRebate: true,
        billNumbers: billLines.map((l) => l.billNumber),
        mrDate,
        mrBranch,
        manualMrPrefix,
        manualMrNo,
        tdsType,
        tdsRate,
        partyCode: partyCodeName.split(":")[0]?.trim() || "",
        partyName: partyCodeName,
        partyAddress,
        remark,
        billLines,
        payment: {
          mode,
          depositedAccount,
          chequeNeftNo,
          chequeDate,
          chequeAmount,
          onAcctBalance,
          amountToBeAccounted,
          collectedAmount,
          bankName,
          chequeClearDate,
          excessSign,
          excessAmount,
          interestSign,
          interestAmount
        },
        deductionLines: deductionRows,
        docketLines
      };

      const res = await fetch("/api/finance/generate-bill-mr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Bill MR with rebate failed");
        return;
      }
      const mrNo = data.data?.mrNumber || "";
      setSuccessMr(mrNo);
      setSuccessPayload({
        mrNumber: mrNo,
        mrDate,
        mrBranch,
        partyCode: payload.partyCode,
        partyName: payload.partyName,
        partyAddress,
        remark,
        payment: payload.payment,
        billLines,
        deductionLines: deductionRows,
        docketLines
      });
      setStep("success");
      toast.success(data.message || `Money Receipt ${mrNo} generated`);
      setRows((prev) => prev.filter((r) => !billLines.some((l) => l.billNumber === r.billNumber)));
      setSelected({});
      setDeductionSaved(false);
    } catch {
      toast.error("Bill MR with rebate failed");
    } finally {
      setActing(false);
    }
  };

  const deductionTotals = useMemo(
    () =>
      deductionRows.reduce(
        (a, r) => {
          a.reb += Number(r.freightRebate || 0);
          a.claim += Number(r.claimDeduction || 0);
          a.tot += Number(r.totalDeduction || 0);
          return a;
        },
        { reb: 0, claim: 0, tot: 0 }
      ),
    [deductionRows]
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {step === "filter" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#0171d3] text-white px-3 py-2.5 flex items-center gap-2 rounded-t-xl">
            <Link
              href="/dashboard/finance/mr-entry"
              className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 inline-flex items-center justify-center"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-sm font-semibold">Generate Bill MR.</h1>
          </div>

          <div className="p-5 space-y-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                {fieldBox(
                  "Manual Bill Number",
                  <textarea
                    value={manualBills}
                    onChange={(e) => setManualBills(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0171d3] resize-y"
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-500 pb-2 max-w-[160px]">
                For Multiple Bills use &apos;,&apos; separator
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadBills("manual")}
                className="h-9 px-5 rounded-md border-2 border-[#0171d3] text-[#0171d3] text-sm font-semibold hover:bg-blue-50 disabled:opacity-60 mb-1"
              >
                Submit
              </button>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">
                OR Select Bills For Preparing Bill MR
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fieldBox(
                  "Enter Customer",
                  <>
                    <input
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      list="mr-rebate-customers"
                      className={inputCls}
                    />
                    <datalist id="mr-rebate-customers">
                      {customers.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </datalist>
                  </>
                )}
                {fieldBox(
                  "Bill Type",
                  <select value={billType} onChange={(e) => setBillType(e.target.value)} className={inputCls}>
                    {billTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="billScope"
                    checked={billScope === "range"}
                    onChange={() => setBillScope("range")}
                    className="mt-3 accent-[#0171d3]"
                  />
                  <div className="relative flex-1">
                    <button
                      type="button"
                      disabled={billScope !== "range"}
                      onClick={() => setShowDates((v) => !v)}
                      className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm bg-white flex items-center gap-2 text-left disabled:bg-slate-50"
                    >
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate flex-1 text-slate-700">{periodLabel}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                    {showDates && billScope === "range" && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">From</label>
                          <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full h-9 px-2 border border-slate-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">To</label>
                          <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full h-9 px-2 border border-slate-300 rounded-md text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDates(false)}
                          className="col-span-2 h-8 rounded-md bg-[#0171d3] text-white text-xs font-semibold"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input
                    type="radio"
                    name="billScope"
                    checked={billScope === "all"}
                    onChange={() => setBillScope("all")}
                    className="accent-[#0171d3]"
                  />
                  All Bills
                </label>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => void loadBills("filter")}
                className="h-9 px-6 rounded-md border-2 border-[#0171d3] text-[#0171d3] text-sm font-semibold hover:bg-blue-50 disabled:opacity-60"
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("filter")}
                className="h-8 w-8 border border-slate-300 rounded bg-white inline-flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-slate-900">Generate Bill MR With Rebate</h1>
                <p className="text-[11px] text-slate-500">
                  {selectedCount} selected · {filtered.length} bill(s) — select bills, then Prepare MR
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={!selectedCount}
              onClick={openEntry}
              className="h-9 px-4 rounded-md bg-[#0171d3] text-white text-sm font-semibold hover:bg-[#015fae]"
            >
              Prepare MR
            </button>
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 text-[12px]">
              <label className="inline-flex items-center gap-2 text-slate-700">
                Show
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 px-1 border border-slate-300 rounded bg-white"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                entries
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700">
                Search:
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-7 px-2 border border-slate-300 rounded w-[180px]"
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[1100px]">
                <thead>
                  <tr className="bg-[#0171d3] text-white">
                    <th className="border border-[#015fae] px-2 py-1.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={(e) => toggleAllPage(e.target.checked)}
                        className="accent-white"
                      />
                    </th>
                    {[
                      "Bill Number",
                      "Manual Bill Number",
                      "Billing Branch",
                      "Party Name",
                      "Bill Type",
                      "Bill Amount",
                      "Unadjusted Amount",
                      "Generation Date",
                      "Due Date"
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border border-[#015fae] px-2 py-1.5 font-semibold whitespace-nowrap ${
                          h.includes("Amount") ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr key={r.billNumber} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/40">
                      <td className="border border-slate-200 px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={!!selected[r.billNumber]}
                          onChange={(e) =>
                            setSelected((prev) => ({ ...prev, [r.billNumber]: e.target.checked }))
                          }
                          className="accent-[#0171d3]"
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 font-mono whitespace-nowrap">
                        {r.billNumber}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 font-mono whitespace-nowrap">
                        {r.manualBillNumber}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.billingBranch}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.partyName}</td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.billType}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                        {fmt(r.billAmount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                        {fmt(r.unadjustedAmount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                        {r.generationDate}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{r.dueDate}</td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={10} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                        No bills to display.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-slate-200 text-[12px]">
              <span className="text-slate-600">
                Showing {(page - 1) * pageSize + (filtered.length ? 1 : 0)} to{" "}
                {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 border border-slate-300 rounded bg-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 border border-slate-300 rounded bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "entry" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#0171d3] text-white px-3 py-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("report")}
              className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold">Generate Bill MR.</h1>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {fieldBox(
                "MR Date",
                <input
                  type="date"
                  value={mrDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMrDate(v);
                    setChequeDate(v);
                    setChequeClearDate(v);
                  }}
                  className={inputCls}
                />
              )}
              {fieldBox(
                "MR Branch",
                <input value={mrBranch} onChange={(e) => setMrBranch(e.target.value.toUpperCase())} className={inputCls} />
              )}
              {fieldBox(
                "Party Code and Name",
                <input value={partyCodeName} onChange={(e) => setPartyCodeName(e.target.value)} className={inputCls} />
              )}
              {fieldBox(
                "Party Address",
                <input value={partyAddress} onChange={(e) => setPartyAddress(e.target.value)} className={inputCls} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fieldBox(
                "Manual MR No",
                <div className="flex gap-2">
                  <input
                    value={manualMrPrefix}
                    onChange={(e) => setManualMrPrefix(e.target.value.toUpperCase())}
                    className={`${inputCls} max-w-[120px]`}
                  />
                  <input
                    value={manualMrNo}
                    onChange={(e) => setManualMrNo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={inputCls}
                  />
                </div>
              )}
              {fieldBox(
                "TDS Type",
                <select value={tdsType} onChange={(e) => setTdsType(e.target.value)} className={inputCls}>
                  {TDS_TYPES.map((t) => (
                    <option key={t || "blank"} value={t}>
                      {t || "—"}
                    </option>
                  ))}
                </select>
              )}
              {fieldBox(
                "Calculate TDS Rate (in %)",
                <input
                  type="number"
                  value={tdsRate}
                  onChange={(e) => applyTdsRate(Number(e.target.value) || 0)}
                  className={inputCls}
                />
              )}
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                List of Bills
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px] min-w-[1400px]">
                  <thead>
                    <tr className="bg-[#0171d3] text-white">
                      {[
                        "System Bill / Manual Bill",
                        "Bill Date",
                        "Amount",
                        "GST Amount",
                        "Bill Amount",
                        "Pending Amount",
                        "TDS",
                        "Freight Rebate",
                        "Claim",
                        "Unadjusted Amount",
                        "Net Recd. Amount",
                        "Short Payment Type",
                        "Short Payment Remark"
                      ].map((h) => (
                        <th key={h} className="border border-[#015fae] px-2 py-1.5 whitespace-nowrap text-left font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {billLines.map((l, idx) => (
                      <tr key={l.billNumber} className="odd:bg-white even:bg-slate-50">
                        <td className="border border-slate-200 px-2 py-1.5 font-mono whitespace-nowrap">
                          <div>{l.billNumber}</div>
                          <div className="text-slate-500">{l.manualBillNumber}</div>
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">{l.billDate}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">{fmt(l.amount)}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">{fmt(l.gstAmount)}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">{fmt(l.billAmount)}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">{fmt(l.pendingAmount)}</td>
                        <td className="border border-slate-200 px-1 py-1">
                          <input
                            type="number"
                            value={l.tds}
                            onChange={(e) => updateLine(idx, { tds: Number(e.target.value) || 0 })}
                            className="w-20 h-8 px-1 border border-slate-300 rounded text-right"
                          />
                        </td>
                        <td className="border border-slate-200 px-1 py-1">
                          <input
                            type="number"
                            value={l.freightRebate}
                            onChange={(e) => updateLine(idx, { freightRebate: Number(e.target.value) || 0 })}
                            className="w-24 h-8 px-1 border border-slate-300 rounded text-right"
                          />
                        </td>
                        <td className="border border-slate-200 px-1 py-1">
                          <input
                            type="number"
                            value={l.claim}
                            onChange={(e) => updateLine(idx, { claim: Number(e.target.value) || 0 })}
                            className="w-20 h-8 px-1 border border-slate-300 rounded text-right"
                          />
                        </td>
                        <td className="border border-slate-200 px-1 py-1">
                          <input
                            type="number"
                            value={l.unadjustedAmount}
                            onChange={(e) =>
                              updateLine(idx, { unadjustedAmount: Number(e.target.value) || 0 })
                            }
                            className="w-24 h-8 px-1 border border-slate-300 rounded text-right"
                          />
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono font-semibold">
                          {fmt(l.netRecdAmount)}
                        </td>
                        <td className="border border-slate-200 px-1 py-1">
                          <select
                            value={l.shortPaymentType}
                            onChange={(e) => updateLine(idx, { shortPaymentType: e.target.value })}
                            className="h-8 px-1 border border-slate-300 rounded bg-white"
                          >
                            {SHORT_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-slate-200 px-1 py-1">
                          <input
                            value={l.shortPaymentRemark}
                            onChange={(e) => updateLine(idx, { shortPaymentRemark: e.target.value })}
                            placeholder="Type remark"
                            className="w-40 h-8 px-2 border border-slate-300 rounded"
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-semibold">
                      <td className="border border-slate-200 px-2 py-1.5" colSpan={5}>
                        Total
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                        {fmt(totals.pending)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                        {fmt(totals.tds)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                        {fmt(totals.rebate)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                        {fmt(totals.claim)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                        {fmt(totals.unadj)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                        {fmt(totals.net)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5" colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-slate-200 rounded-md p-3 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#0171d3]">
                Payment Details / Cheque / NEFT Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {fieldBox(
                  "Mode of Transaction",
                  <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
                    {MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}
                {fieldBox(
                  "Deposited in Account",
                  <select
                    value={depositedAccount}
                    onChange={(e) => setDepositedAccount(e.target.value)}
                    className={inputCls}
                  >
                    {BANK_ACCOUNTS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                )}
                {fieldBox(
                  "Cheque / NEFT Number",
                  <input
                    value={chequeNeftNo}
                    onChange={(e) => setChequeNeftNo(e.target.value.toUpperCase())}
                    className={inputCls}
                  />
                )}
                {fieldBox(
                  "Cheque Date",
                  <input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className={inputCls}
                  />
                )}
                {fieldBox(
                  "Cheque Amount",
                  <input
                    type="number"
                    value={chequeAmount}
                    onChange={(e) => setChequeAmount(Number(e.target.value) || 0)}
                    className={inputCls}
                  />
                )}
                {fieldBox(
                  "On Acct. Balance Rs.",
                  <input
                    type="number"
                    value={onAcctBalance}
                    onChange={(e) => setOnAcctBalance(Number(e.target.value) || 0)}
                    className={inputCls}
                  />
                )}
                {fieldBox(
                  "Amount to be Accounted",
                  <input
                    type="number"
                    value={amountToBeAccounted}
                    onChange={(e) => setAmountToBeAccounted(Number(e.target.value) || 0)}
                    className={inputCls}
                  />
                )}
                {fieldBox(
                  "Collected Amount",
                  <input
                    type="number"
                    value={collectedAmount}
                    onChange={(e) => setCollectedAmount(Number(e.target.value) || 0)}
                    className={inputCls}
                  />
                )}
                {fieldBox(
                  "Bank Name",
                  <input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputCls} />
                )}
                {fieldBox(
                  "Cheque Clear Date",
                  <input
                    type="date"
                    value={chequeClearDate}
                    onChange={(e) => setChequeClearDate(e.target.value)}
                    className={inputCls}
                  />
                )}
                {fieldBox(
                  "Excess Amount",
                  <div className="flex gap-2">
                    <select
                      value={excessSign}
                      onChange={(e) => setExcessSign(e.target.value as "+" | "-")}
                      className="h-10 px-2 border border-slate-300 rounded-md"
                    >
                      <option value="+">[+]</option>
                      <option value="-">[-]</option>
                    </select>
                    <input
                      type="number"
                      value={excessAmount}
                      onChange={(e) => setExcessAmount(Number(e.target.value) || 0)}
                      className={inputCls}
                    />
                  </div>
                )}
                {fieldBox(
                  "Interest",
                  <div className="flex gap-2">
                    <select
                      value={interestSign}
                      onChange={(e) => setInterestSign(e.target.value as "+" | "-")}
                      className="h-10 px-2 border border-slate-300 rounded-md"
                    >
                      <option value="+">[+]</option>
                      <option value="-">[-]</option>
                    </select>
                    <input
                      type="number"
                      value={interestAmount}
                      onChange={(e) => setInterestAmount(Number(e.target.value) || 0)}
                      className={inputCls}
                    />
                  </div>
                )}
              </div>
              {fieldBox(
                "Remark",
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-[#0171d3]"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              {deductionSaved ? (
                <span className="text-[11px] font-semibold text-emerald-700 mr-auto">
                  Document details saved — click Submit again to generate MR
                </span>
              ) : null}
              <button
                type="button"
                disabled={acting}
                onClick={handleEntrySubmit}
                className="h-9 px-5 rounded-md bg-[#0171d3] text-white text-sm font-semibold hover:bg-[#015fae] disabled:opacity-50"
              >
                {acting ? "Submitting..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => setStep("report")}
                className="h-9 px-5 rounded-md bg-[#0b3d6e] text-white text-sm font-semibold"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden max-w-4xl mx-auto">
          <div className="bg-[#0171d3] text-white px-3 py-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold">Generate Bill MR.</h1>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-md bg-[#17a2b8] text-white px-4 py-2.5 text-sm font-semibold">
              Following document has been successfully generated:
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-700">
                    <th className="text-left px-3 py-2 border-b">Document name</th>
                    <th className="text-left px-3 py-2 border-b">Document Number</th>
                    <th className="text-right px-3 py-2 border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2.5 border-b">Bill MR</td>
                    <td className="px-3 py-2.5 border-b font-mono font-semibold text-[#0171d3]">
                      {successMr}
                    </td>
                    <td className="px-3 py-2.5 border-b text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (successPayload) printMoneyReceipt(successPayload);
                          else toast.info(`MR ${successMr}`);
                        }}
                        className="text-[#0171d3] font-semibold hover:underline"
                      >
                        View | Print
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(successMr);
                    toast.success(`Copied ${successMr}`);
                  } catch {
                    toast.error("Unable to copy");
                  }
                }}
                className="h-8 px-3 rounded-md border border-slate-300 text-xs font-semibold hover:bg-slate-50"
              >
                Copy MR No
              </button>
              <button
                type="button"
                onClick={() => {
                  const csv = [
                    "MR No,MR Date,Customer,Branch,Cheque/Ref No,Net Amount",
                    [
                      successMr,
                      mrDate,
                      `"${(partyCodeName || "").replace(/"/g, '""')}"`,
                      mrBranch,
                      chequeNeftNo || "",
                      chequeAmount
                    ].join(",")
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${successMr || "BillMR"}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("MR saved to Excel");
                }}
                className="h-8 px-3 rounded-md border border-slate-300 text-xs font-semibold hover:bg-slate-50"
              >
                Save to Excel
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-1">Your Next Step:</p>
              <Link
                href="/dashboard/finance/mr-entry/view-print-mr"
                className="text-[#0171d3] text-sm font-semibold hover:underline"
              >
                View &amp; Print Bill MRs
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Popup 1 — Document Details (empty until Go; bill no clickable) */}
      {showDeductionPopup && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-md shadow-xl border border-slate-300 overflow-hidden">
            <div className="bg-[#0171d3] text-white px-3 py-2.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Document Details</h2>
              <button
                type="button"
                onClick={() => setShowDeductionPopup(false)}
                className="h-7 w-7 rounded hover:bg-white/20 inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  No of Rows per Bill
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={rowsPerBill}
                    onChange={(e) => setRowsPerBill(Number(e.target.value) || 1)}
                    className="ml-2 h-8 w-16 px-2 border border-slate-300 rounded"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => buildDeductionRows(rowsPerBill)}
                  className="h-8 px-4 rounded-full bg-[#0171d3] text-white text-xs font-semibold"
                >
                  Go
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200">
                <table className="w-full border-collapse text-[11px] min-w-[960px]">
                  <thead>
                    <tr className="bg-[#0b3d6e] text-white">
                      {[
                        "Bill No.",
                        "Docket No",
                        "Dkt Tot",
                        "Freight Rebate",
                        "Claim Deduction",
                        "Total Deduction",
                        "Recovery Type"
                      ].map((h) => (
                        <th key={h} className="border border-[#083054] px-2 py-1.5 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deductionRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-slate-200 px-3 py-8 text-center text-slate-400">
                          Enter rows and click Go to load bill number(s)
                        </td>
                      </tr>
                    ) : (
                      deductionRows.map((r, idx) => (
                        <tr key={idx} className="odd:bg-white even:bg-blue-50/40">
                          <td className="border border-slate-200 px-2 py-1.5">
                            <button
                              type="button"
                              onClick={() => openBillLookup(r.billNo)}
                              className="font-mono font-bold text-[#0171d3] hover:underline"
                              title="Open docket lookup"
                            >
                              {r.billNo}
                            </button>
                          </td>
                          <td className="border border-slate-200 px-1 py-1">
                            <input
                              value={r.docketNo}
                              onChange={(e) =>
                                setDeductionRows((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, docketNo: e.target.value.toUpperCase() } : x
                                  )
                                )
                              }
                              placeholder="Paste docket no"
                              className="w-40 h-8 px-1 border border-slate-300 rounded font-mono"
                            />
                          </td>
                          <td className="border border-slate-200 px-1 py-1">
                            <input
                              type="number"
                              value={r.dktTot || ""}
                              onChange={(e) =>
                                setDeductionRows((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, dktTot: Number(e.target.value) || 0 } : x
                                  )
                                )
                              }
                              className="w-24 h-8 px-1 border border-slate-300 rounded text-right"
                            />
                          </td>
                          <td className="border border-slate-200 px-1 py-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={r.freightRebate}
                                onChange={(e) =>
                                  setDeductionRows((prev) =>
                                    prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const freightRebate = Number(e.target.value) || 0;
                                      return {
                                        ...x,
                                        freightRebate,
                                        totalDeduction: Number(
                                          (freightRebate + x.claimDeduction).toFixed(2)
                                        )
                                      };
                                    })
                                  )
                                }
                                className="w-16 h-8 px-1 border border-slate-300 rounded text-right"
                              />
                              <span className="text-slate-500 whitespace-nowrap">
                                / {fmt(r.maxFreightRebate)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-slate-200 px-1 py-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={r.claimDeduction}
                                onChange={(e) =>
                                  setDeductionRows((prev) =>
                                    prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const claimDeduction = Number(e.target.value) || 0;
                                      return {
                                        ...x,
                                        claimDeduction,
                                        totalDeduction: Number(
                                          (x.freightRebate + claimDeduction).toFixed(2)
                                        )
                                      };
                                    })
                                  )
                                }
                                className="w-16 h-8 px-1 border border-slate-300 rounded text-right"
                              />
                              <span className="text-slate-500 whitespace-nowrap">/ {fmt(r.maxClaim)}</span>
                            </div>
                          </td>
                          <td className="border border-slate-200 px-1 py-1">
                            <div className="flex items-center gap-1 justify-end">
                              <span className="font-mono">{fmt(r.totalDeduction)}</span>
                              <span className="text-slate-500 whitespace-nowrap">
                                / {fmt(r.maxFreightRebate + r.maxClaim)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-slate-200 px-1 py-1">
                            <select
                              value={r.recoveryType}
                              onChange={(e) =>
                                setDeductionRows((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, recoveryType: e.target.value } : x
                                  )
                                )
                              }
                              className="h-8 px-1 border border-slate-300 rounded bg-white"
                            >
                              {RECOVERY_TYPES.map((t) => (
                                <option key={t || "blank"} value={t}>
                                  {t || "—"}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                    {deductionRows.length > 0 && (
                      <tr className="bg-slate-100 font-semibold">
                        <td className="border border-slate-200 px-2 py-1.5" colSpan={3}>
                          Total
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                          {fmt(deductionTotals.reb)} /{" "}
                          {fmt(deductionRows.reduce((s, r) => s + r.maxFreightRebate, 0))}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                          {fmt(deductionTotals.claim)} /{" "}
                          {fmt(deductionRows.reduce((s, r) => s + r.maxClaim, 0))}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                          {fmt(deductionTotals.tot)} /{" "}
                          {fmt(
                            deductionRows.reduce((s, r) => s + r.maxFreightRebate + r.maxClaim, 0)
                          )}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5" />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={saveDeductionPopup}
                  className="h-9 px-8 rounded-full bg-[#0171d3] text-white text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup 2 — bill lookup: copy Docket No into Document Details */}
      {showBillLookup && billLookup && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-md shadow-xl border border-slate-300 overflow-hidden">
            <div className="bg-[#0171d3] text-white px-3 py-2.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold font-mono">{billLookup.billNo}</h2>
              <button
                type="button"
                onClick={() => setShowBillLookup(false)}
                className="h-7 w-7 rounded hover:bg-white/20 inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-slate-500">
                Copy the Docket No below and paste it into the Document Details Docket No column.
              </p>
              <div className="overflow-x-auto border border-slate-200">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b3d6e] text-white">
                      <th className="border border-[#083054] px-2 py-1.5 text-left">Docket No</th>
                      <th className="border border-[#083054] px-2 py-1.5 text-left">Docket Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billLookup.dockets.map((d) => (
                      <tr key={d.docketNo}>
                        <td className="border border-slate-200 px-2 py-2">
                          <button
                            type="button"
                            title="Click to copy Docket No"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(d.docketNo);
                                // Prefill first empty Docket No / Dkt Tot for this bill
                                setDeductionRows((prev) => {
                                  const idx = prev.findIndex(
                                    (r) => r.billNo === billLookup.billNo && !String(r.docketNo || "").trim()
                                  );
                                  if (idx < 0) return prev;
                                  return prev.map((r, i) =>
                                    i === idx
                                      ? { ...r, docketNo: d.docketNo, dktTot: d.docketTotal || r.dktTot }
                                      : r
                                  );
                                });
                                toast.success(`Copied ${d.docketNo}`);
                              } catch {
                                toast.error("Unable to copy");
                              }
                            }}
                            className="font-mono font-bold text-[#0171d3] hover:underline"
                          >
                            {d.docketNo}
                          </button>
                        </td>
                        <td className="border border-slate-200 px-2 py-2 font-mono text-right">
                          {fmt(d.docketTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowBillLookup(false)}
                  className="h-8 px-4 rounded-md border border-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
