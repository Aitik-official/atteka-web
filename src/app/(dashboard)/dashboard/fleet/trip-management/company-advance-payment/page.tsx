"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "@/lib/toastBus";

type DateMode = "range" | "today" | "last7";
type SearchMode = "dateVehicle" | "document";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatLongToday(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

type AdvanceDoc = {
  documentNo: string;
  tripsheetNo: string;
  manualThcNo: string;
  vehicleNo: string;
  driverName: string;
  branch: string;
  documentDate: string;
  documentDateIso: string;
  fromLocation: string;
  toLocation: string;
  openKm: number;
  requestedAmount: number;
  status: string;
};

type VoucherLine = {
  voucherNumber: string;
  voucherDate: string;
  voucherType: string;
  qty: number;
  rate: number;
  openingKm: number;
  closingKm: number;
  totalKm: number;
  amount: number;
};

const SAMPLE_DOCS: AdvanceDoc[] = [
  {
    documentNo: "ADV-ALC1-26011001",
    tripsheetNo: "DSALC12600409",
    manualThcNo: "ALC12660450",
    vehicleNo: "MH04JK3515",
    driverName: "Vijay More",
    branch: "ALC1",
    documentDate: "06/11/2026",
    documentDateIso: toInputDate(new Date()),
    fromLocation: "RANJANGAON",
    toLocation: "NAVI MUMBAI AIRPORT",
    openKm: 0,
    requestedAmount: 15000,
    status: "OPEN"
  },
  {
    documentNo: "ADV-ALC1-26011002",
    tripsheetNo: "DSALC12600448",
    manualThcNo: "ALC12660488",
    vehicleNo: "MH04AB1234",
    driverName: "Ramesh Patil",
    branch: "ALC1",
    documentDate: "06/11/2026",
    documentDateIso: toInputDate(new Date()),
    fromLocation: "PUNE",
    toLocation: "MUMBAI",
    openKm: 0,
    requestedAmount: 22000,
    status: "OPEN"
  },
  {
    documentNo: "ADV-ALC1-26010915",
    tripsheetNo: "DSALC12600391",
    manualThcNo: "ALC12660390",
    vehicleNo: "MH12CD5678",
    driverName: "Suresh Yadav",
    branch: "ALC1",
    documentDate: "05/11/2026",
    documentDateIso: toInputDate(daysAgo(1)),
    fromLocation: "NASHIK",
    toLocation: "THANE",
    openKm: 120,
    requestedAmount: 18000,
    status: "PARTIAL"
  }
];

const VOUCHER_TYPES = ["--Select--", "Advance", "Diesel", "Toll", "Parking", "Other"];
const PAYMENT_ACCOUNTS = [
  "--Select--",
  "BPCL",
  "BPCL - Highway Retail Outlet",
  "BPCL - Ranjangaon Pump",
  "BPCL - Kalamboli Pump",
  "HPCL - Diesel Pump",
  "IOCL - Indian Oil Pump",
  "Indian Oil - Depot Road",
  "Reliance Petroleum",
  "Nayara Energy",
  "Shell Diesel Pump",
  "Essar Petrol Pump",
  "Local Diesel Pump - Pune",
  "Local Diesel Pump - Nashik",
  "CASH",
  "BANK / NEFT",
  "CHEQUE",
  "PETTY CASH"
];
const PAY_TO_DRIVER = ["--Select--", "Yes", "No"];

export default function CompanyAdvancePaymentEntryPage() {
  const today = useMemo(() => new Date(), []);
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [searchMode, setSearchMode] = useState<SearchMode>("dateVehicle");
  const [fromDate, setFromDate] = useState(toInputDate(today));
  const [toDate, setToDate] = useState(toInputDate(today));
  const [vehicleNo, setVehicleNo] = useState("Show all");
  const [documentNo, setDocumentNo] = useState("");
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [step, setStep] = useState<"filter" | "list" | "entry">("filter");
  const [results, setResults] = useState<AdvanceDoc[]>([]);
  const [selected, setSelected] = useState<AdvanceDoc | null>(null);
  const [openKm, setOpenKm] = useState(0);
  const [voucherType, setVoucherType] = useState("Diesel");
  const [voucherDate, setVoucherDate] = useState(toInputDate(new Date()));
  const [paymentAccount, setPaymentAccount] = useState("BPCL");
  const [paymentToDriver, setPaymentToDriver] = useState("--Select--");
  const [amount, setAmount] = useState<string>("");
  const [advanceRecovery, setAdvanceRecovery] = useState(0);
  const [opBal] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paidBy] = useState("ANISHA OZARKAR");
  const [voucherLines, setVoucherLines] = useState<VoucherLine[]>([]);
  const [saving, setSaving] = useState(false);

  const clearEntryFields = (keepOpenKm = 0) => {
    setOpenKm(keepOpenKm);
    setVoucherType("Diesel");
    setVoucherDate(toInputDate(new Date()));
    setPaymentAccount("BPCL");
    setPaymentToDriver("--Select--");
    setAmount("");
    setAdvanceRecovery(0);
    setAmountPaid(0);
  };

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const nos = (d.data || [])
          .map((v: any) => String(v.vehicleNumber || "").trim().toUpperCase())
          .filter(Boolean);
        setVehicles([...new Set(nos)] as string[]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (dateMode === "today") {
      const t = toInputDate(new Date());
      setFromDate(t);
      setToDate(t);
    } else if (dateMode === "last7") {
      setFromDate(toInputDate(daysAgo(6)));
      setToDate(toInputDate(new Date()));
    }
  }, [dateMode]);

  const mapApiRow = (d: any): AdvanceDoc => {
    const iso = d.documentDate ? toInputDate(new Date(d.documentDate)) : toInputDate(new Date());
    const ts = String(d.tripsheetNo || d.documentNo || "").toUpperCase();
    return {
      documentNo: d.documentNo,
      tripsheetNo: ts || `DSALC1${Date.now().toString().slice(-6)}`,
      manualThcNo: String(d.manualThcNo || d.manualTripSheetNo || ts.replace(/^DS/, "") || "").toUpperCase(),
      vehicleNo: d.vehicleNo,
      driverName: d.driverName || "",
      branch: d.branch || "ALC1",
      documentDate: d.documentDate
        ? new Date(d.documentDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })
        : "",
      documentDateIso: iso,
      fromLocation: String(d.fromLocation || d.pickupLocation || "").toUpperCase() || "—",
      toLocation: String(d.toLocation || d.deliveryLocation || "").toUpperCase() || "—",
      openKm: Number(d.openKm ?? d.startKm ?? 0) || 0,
      requestedAmount: Number(d.amount) || 0,
      status: d.status || "OPEN"
    };
  };

  const handleSubmitFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === "document" && !documentNo.trim()) {
      toast.error("Enter Document No.");
      return;
    }
    try {
      const params = new URLSearchParams();
      if (searchMode === "document") params.set("documentNo", documentNo.trim());
      else {
        params.set("from", fromDate);
        params.set("to", toDate);
        if (vehicleNo !== "Show all") params.set("vehicleNo", vehicleNo);
      }
      const res = await fetch(`/api/fleet/advance-payments?${params.toString()}`);
      const data = await res.json();
      let rows: AdvanceDoc[] = (data.data || []).map(mapApiRow);
      if (rows.length === 0 && searchMode !== "document") {
        const vNo = vehicleNo !== "Show all" ? vehicleNo : "MH46DC5192";
        const seq = Date.now().toString().slice(-5);
        rows = [
          {
            documentNo: `ADV-${vNo.replace(/\s/g, "")}-${seq.slice(-4)}`,
            tripsheetNo: `DSALC1${seq}`,
            manualThcNo: `ALC1${seq}`,
            vehicleNo: vNo,
            driverName: "",
            branch: "ALC1",
            documentDate: new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }),
            documentDateIso: toInputDate(new Date()),
            fromLocation: "RANJANGAON",
            toLocation: "NAVI MUMBAI AIRPORT",
            openKm: 0,
            requestedAmount: 0,
            status: "OPEN"
          }
        ];
      }
      setResults(rows);
      setStep("list");
      if (data.isMemoryStore) {
        toast.warning("MongoDB unavailable — showing memory fallback");
      }
    } catch {
      toast.error("Failed to load advance documents");
    }
  };

  const openEntry = async (row: AdvanceDoc) => {
    let enriched = { ...row };
    // Enrich from tripsheet when available
    try {
      if (row.tripsheetNo) {
        const res = await fetch(`/api/tripsheets?tripSheetNo=${encodeURIComponent(row.tripsheetNo)}`);
        const data = await res.json();
        const ts = (data.data || [])[0];
        if (ts) {
          enriched = {
            ...enriched,
            tripsheetNo: String(ts.tripSheetNo || enriched.tripsheetNo).toUpperCase(),
            manualThcNo: String(ts.manualTripSheetNo || enriched.manualThcNo || "").toUpperCase(),
            vehicleNo: String(ts.vehicleNo || enriched.vehicleNo).toUpperCase(),
            driverName: String(ts.driverName || enriched.driverName || ""),
            fromLocation: String(ts.pickupLocation || enriched.fromLocation || "").toUpperCase(),
            toLocation: String(ts.deliveryLocation || enriched.toLocation || "").toUpperCase(),
            openKm: Number(ts.startKm ?? enriched.openKm) || 0,
            documentDate: ts.tripDate
              ? new Date(ts.tripDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })
              : enriched.documentDate,
            documentDateIso: ts.tripDate ? toInputDate(new Date(ts.tripDate)) : enriched.documentDateIso
          };
        }
      }
    } catch {
      /* keep list row values */
    }

    setSelected(enriched);
    clearEntryFields(enriched.openKm || 0);

    // Load prior voucher lines for this tripsheet (multiple entries during a trip)
    try {
      const params = new URLSearchParams();
      if (enriched.tripsheetNo) params.set("documentNo", enriched.tripsheetNo);
      const res = await fetch(`/api/fleet/advance-payments?${params.toString()}`);
      const data = await res.json();
      const prior: VoucherLine[] = (data.data || [])
        .filter(
          (d: any) =>
            String(d.tripsheetNo || "").toUpperCase() === enriched.tripsheetNo.toUpperCase() ||
            String(d.vehicleNo || "").toUpperCase() === enriched.vehicleNo.toUpperCase()
        )
        .map((d: any) => {
          const remark = String(d.remark || "");
          const typeMatch = remark.split("|")[0]?.trim();
          const amt = Number(d.amount) || 0;
          const iso = d.documentDate ? toInputDate(new Date(d.documentDate)) : toInputDate(new Date());
          return {
            voucherNumber: String(d.documentNo || `VCH-${Date.now().toString().slice(-6)}`),
            voucherDate: iso,
            voucherType: typeMatch && typeMatch !== "Advance" ? typeMatch : "Diesel",
            qty: 1,
            rate: amt,
            openingKm: Number(d.openKm ?? 0) || 0,
            closingKm: Number(d.openKm ?? 0) || 0,
            totalKm: 0,
            amount: amt
          } as VoucherLine;
        });
      setVoucherLines(prior);
    } catch {
      setVoucherLines([]);
    }

    setStep("entry");
  };

  const voucherTotal = useMemo(
    () => voucherLines.reduce((s, l) => s + (Number(l.amount) || 0), 0),
    [voucherLines]
  );

  const buildVoucherLine = (): VoucherLine | null => {
    const amt = Number(amountPaid) || Number(amount) || 0;
    if (!amt || voucherType === "--Select--") return null;
    const opening = Number(openKm) || 0;
    return {
      voucherNumber: `VCH-${Date.now().toString().slice(-6)}`,
      voucherDate,
      voucherType,
      qty: 1,
      rate: amt,
      openingKm: opening,
      closingKm: opening,
      totalKm: 0,
      amount: amt
    };
  };

  const saveAdvance = async () => {
    if (!selected) return;
    if (voucherType === "--Select--") {
      toast.error("Select Voucher Type");
      return;
    }
    if (paymentAccount === "--Select--") {
      toast.error("Select Payment Account");
      return;
    }
    const line = buildVoucherLine();
    if (!line) {
      toast.error("Enter Amount / Amount Paid");
      return;
    }
    const payAmt = line.amount;
    setSaving(true);
    try {
      const payMode = /cash/i.test(paymentAccount)
        ? "CASH"
        : /cheque/i.test(paymentAccount)
          ? "CHEQUE"
          : /bpcl|hpcl|iocl|oil|diesel|pump|nayara|shell|essar|reliance|petroleum/i.test(
                paymentAccount
              )
            ? "FUEL"
            : "BANK";
      const res = await fetch("/api/fleet/advance-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentNo: line.voucherNumber,
          tripsheetNo: selected.tripsheetNo,
          vehicleNo: selected.vehicleNo,
          driverName: selected.driverName,
          branch: selected.branch,
          payMode,
          amount: payAmt,
          remark: `${voucherType} | ${paymentAccount} | Recovery ${advanceRecovery} | Op.Bal ${opBal} | Paid By ${paidBy}`,
          status: "PAID",
          preparedBy: paidBy,
          fromLocation: selected.fromLocation,
          toLocation: selected.toLocation,
          openKm,
          voucherType,
          voucherDate,
          paymentAccount,
          paymentToDriver,
          advanceRecovery,
          amountPaid: payAmt,
          voucherLines: [line]
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save advance payment");
        return;
      }
      const savedNo = data.data?.documentNo || line.voucherNumber;
      const savedLine: VoucherLine = { ...line, voucherNumber: savedNo };

      // Append to table — keep prior rows; multiple entries per trip
      setVoucherLines((prev) => [...prev, savedLine]);

      if (payMode === "CASH" || payMode === "BANK" || payMode === "CHEQUE") {
        await fetch("/api/bank/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            beneficiaryName: selected.driverName || selected.vehicleNo,
            accountNumber: "CASH-COUNTER",
            ifscCode: payMode === "CASH" ? "CASH0000001" : "INDB0000001",
            amount: payAmt,
            remarks: `Company Advance ${savedNo} / ${selected.vehicleNo} / ${voucherType} / ${paymentAccount}`
          })
        }).catch(() => {});
      }

      toast.success(`${voucherType} entry ${savedNo} added`);
      // Clear fields for next entry on the same trip
      clearEntryFields(Number(openKm) || selected.openKm || 0);
    } catch {
      toast.error("Failed to save advance payment");
    } finally {
      setSaving(false);
    }
  };

  const fieldRow = (
    leftLabel: string,
    leftNode: React.ReactNode,
    rightLabel: string,
    rightNode: React.ReactNode
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 py-1.5 border-b border-slate-100">
      <div className="grid grid-cols-[160px_1fr] gap-2 items-center text-[12px]">
        <span className="text-slate-700 font-medium">{leftLabel}</span>
        <div>{leftNode}</div>
      </div>
      <div className="grid grid-cols-[160px_1fr] gap-2 items-center text-[12px]">
        <span className="text-slate-700 font-medium">{rightLabel}</span>
        <div>{rightNode}</div>
      </div>
    </div>
  );

  const readonlyVal = (v: string | number) => (
    <span className="font-semibold text-slate-900">{v === "" || v == null ? "—" : v}</span>
  );

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-10">
      {step === "filter" && (
        <form onSubmit={handleSubmitFilter} className="bg-white border border-slate-300 shadow-sm">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Selection Document Date
          </div>

          <table className="w-full text-[12px] border-collapse">
            <tbody>
              {/* Date row */}
              <tr className="border-b border-slate-200">
                <td className="w-[180px] align-top bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
                  Select Document Date
                </td>
                <td className="px-3 py-3 space-y-2.5">
                  <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateMode"
                      checked={dateMode === "range" && searchMode === "dateVehicle"}
                      onChange={() => {
                        setSearchMode("dateVehicle");
                        setDateMode("range");
                      }}
                      className="accent-[#0171d3]"
                    />
                    <span className="text-slate-700">From :</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setSearchMode("dateVehicle");
                        setDateMode("range");
                        setFromDate(e.target.value);
                      }}
                      className="h-7 px-2 border border-slate-300 rounded-sm bg-white"
                    />
                    <span className="text-slate-700 ml-1">To :</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setSearchMode("dateVehicle");
                        setDateMode("range");
                        setToDate(e.target.value);
                      }}
                      className="h-7 px-2 border border-slate-300 rounded-sm bg-white"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({formatDisplayDate(fromDate)} – {formatDisplayDate(toDate)})
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateMode"
                      checked={dateMode === "today" && searchMode === "dateVehicle"}
                      onChange={() => {
                        setSearchMode("dateVehicle");
                        setDateMode("today");
                      }}
                      className="accent-[#0171d3]"
                    />
                    <span className="text-slate-800">Todays - {formatLongToday(today)}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateMode"
                      checked={dateMode === "last7" && searchMode === "dateVehicle"}
                      onChange={() => {
                        setSearchMode("dateVehicle");
                        setDateMode("last7");
                      }}
                      className="accent-[#0171d3]"
                    />
                    <span className="text-slate-800">Last 7 Days</span>
                  </label>
                </td>
              </tr>

              {/* Vehicle row */}
              <tr className="border-b border-slate-200">
                <td className="align-middle bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
                  Enter Vehicle No.
                </td>
                <td className="px-3 py-3">
                  <select
                    value={vehicleNo}
                    onChange={(e) => {
                      setSearchMode("dateVehicle");
                      setVehicleNo(e.target.value);
                    }}
                    className="h-8 min-w-[220px] px-2 border border-slate-300 rounded-sm bg-white"
                  >
                    <option value="Show all">Show all</option>
                    {vehicles.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              {/* OR */}
              <tr className="border-b border-slate-200">
                <td colSpan={2} className="bg-white text-center py-2">
                  <span className="inline-block text-[#0171d3] font-bold text-sm tracking-wide">OR</span>
                </td>
              </tr>

              {/* Document No */}
              <tr>
                <td className="align-middle bg-[#e8f1fb] text-slate-700 font-semibold px-3 py-3 border-r border-slate-200">
                  Enter Document No.
                </td>
                <td className="px-3 py-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="searchMode"
                      checked={searchMode === "document"}
                      onChange={() => setSearchMode("document")}
                      className="accent-[#0171d3]"
                    />
                    <input
                      type="text"
                      value={documentNo}
                      onChange={(e) => {
                        setSearchMode("document");
                        setDocumentNo(e.target.value.toUpperCase());
                      }}
                      onFocus={() => setSearchMode("document")}
                      className="h-8 w-full max-w-md px-2 border border-slate-300 rounded-sm uppercase font-mono"
                      placeholder=""
                    />
                  </label>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-center py-4 border-t border-slate-200 bg-slate-50/60">
            <button
              type="submit"
              className="min-w-[110px] h-9 px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] font-semibold text-sm hover:bg-[#e8f1fb] shadow-sm"
            >
              Submit
            </button>
          </div>
        </form>
      )}

      {step === "list" && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 flex items-center justify-between">
            <span>Company Advance Payment Documents</span>
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="text-[11px] font-medium bg-white/15 hover:bg-white/25 px-2 py-1 rounded"
            >
              Change Filter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#e8f1fb] text-slate-700">
                  <th className="border border-slate-200 px-2 py-2 text-left">Document No</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Tripsheet</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Vehicle No</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Driver</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Date</th>
                  <th className="border border-slate-200 px-2 py-2 text-right">Amount</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Status</th>
                  <th className="border border-slate-200 px-2 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.documentNo} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-2 font-mono font-semibold text-[#0171d3]">
                      {row.documentNo}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 font-mono">{row.tripsheetNo}</td>
                    <td className="border border-slate-200 px-2 py-2 font-mono font-bold">{row.vehicleNo}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.driverName}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.documentDate}</td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                      {row.requestedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border border-slate-200 px-2 py-2">{row.status}</td>
                    <td className="border border-slate-200 px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => openEntry(row)}
                        className="px-2.5 py-1 rounded border border-[#7eb6e8] text-[#0171d3] font-semibold hover:bg-[#e8f1fb]"
                      >
                        Pay Advance
                      </button>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={8} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No documents found for selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === "entry" && selected && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 flex items-center justify-between">
            <span>Company Advance Payment Entry</span>
            <button
              type="button"
              onClick={() => setStep("list")}
              className="text-[11px] font-medium bg-white/15 hover:bg-white/25 px-2 py-1 rounded inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          </div>

          <div className="p-4 md:p-5 space-y-1">
            {fieldRow(
              "THC / PDC Number",
              readonlyVal(selected.tripsheetNo),
              "Date",
              readonlyVal(selected.documentDate)
            )}
            {fieldRow(
              "Vehicle Number",
              readonlyVal(selected.vehicleNo),
              "Manual THC / PDC No",
              readonlyVal(selected.manualThcNo || "—")
            )}
            {fieldRow(
              "From Location",
              readonlyVal(selected.fromLocation),
              "To Location",
              readonlyVal(selected.toLocation)
            )}
            {fieldRow(
              "Open K/M",
              <input
                type="number"
                value={openKm}
                onChange={(e) => setOpenKm(Number(e.target.value))}
                className="h-8 w-full max-w-[160px] px-2 border border-slate-300 rounded-sm font-mono"
              />,
              "Driver Name",
              readonlyVal(selected.driverName || "—")
            )}
            {fieldRow(
              "Voucher Type",
              <select
                value={voucherType}
                onChange={(e) => setVoucherType(e.target.value)}
                className="h-8 w-full max-w-[220px] px-2 border border-slate-300 rounded-sm bg-white"
              >
                {VOUCHER_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>,
              "Voucher Date",
              <input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="h-8 w-full max-w-[180px] px-2 border border-slate-300 rounded-sm"
              />
            )}
            {fieldRow(
              "Payment Account",
              <select
                value={paymentAccount}
                onChange={(e) => setPaymentAccount(e.target.value)}
                className="h-8 w-full max-w-[220px] px-2 border border-slate-300 rounded-sm bg-white"
              >
                {PAYMENT_ACCOUNTS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>,
              "Payment To Driver",
              <select
                value={paymentToDriver}
                onChange={(e) => setPaymentToDriver(e.target.value)}
                className="h-8 w-full max-w-[180px] px-2 border border-slate-300 rounded-sm bg-white"
              >
                {PAY_TO_DRIVER.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            )}
            {fieldRow(
              "Amount",
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  const n = Number(e.target.value) || 0;
                  if (n > 0) setAmountPaid(n);
                }}
                className="h-8 w-full max-w-[160px] px-2 border border-slate-300 rounded-sm font-mono"
              />,
              "",
              null
            )}
            {fieldRow(
              "Advance Recovery",
              <input
                type="number"
                value={advanceRecovery}
                onChange={(e) => setAdvanceRecovery(Number(e.target.value))}
                className="h-8 w-full max-w-[160px] px-2 border border-slate-300 rounded-sm font-mono"
              />,
              "Op. Bal",
              readonlyVal(opBal)
            )}
            {fieldRow(
              "Amount Paid",
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="h-8 w-full max-w-[160px] px-2 border border-slate-300 rounded-sm font-mono"
              />,
              "Paid By",
              readonlyVal(paidBy)
            )}
          </div>

          <div className="px-4 pb-3 overflow-x-auto">
            <table className="w-full border-collapse text-[11px] min-w-[900px]">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  {[
                    "Voucher Number",
                    "Voucher Date",
                    "Voucher Type",
                    "Qty",
                    "Rate",
                    "Opening Km",
                    "Closing KM",
                    "Total Km",
                    "Amount"
                  ].map((h) => (
                    <th
                      key={h}
                      className="border border-[#015fae] px-2 py-1.5 text-left font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {voucherLines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="border border-slate-200 px-3 py-6 text-center text-slate-400"
                    >
                      No entries yet — submit to add Diesel / Advance lines for this trip
                    </td>
                  </tr>
                ) : (
                  voucherLines.map((l) => (
                    <tr key={l.voucherNumber} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 px-2 py-1.5 font-mono">{l.voucherNumber}</td>
                      <td className="border border-slate-200 px-2 py-1.5">
                        {l.voucherDate ? formatDisplayDate(l.voucherDate) : ""}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5">{l.voucherType}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">{l.qty}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">
                        {Number(l.rate).toFixed(2)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">{l.openingKm}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">{l.closingKm}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">{l.totalKm}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                        {Number(l.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-slate-100">
                  <td colSpan={8} className="border border-slate-200 px-2 py-1.5 text-right font-semibold">
                    Total
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-right font-mono font-semibold">
                    {voucherTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-center py-4 border-t border-slate-200 bg-slate-50/60">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveAdvance()}
              className="min-w-[110px] h-9 px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] font-semibold text-sm hover:bg-[#e8f1fb] shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
