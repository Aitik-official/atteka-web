"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "@/lib/toastBus";
import {
  DocumentDateFilter,
  SelectionDocumentDateForm
} from "@/components/fleet/SelectionDocumentDateForm";

type AdvanceLine = {
  voucherNumber: string;
  voucherDate: string;
  voucherDateIso: string;
  voucherType: string;
  qty: number;
  rate: number;
  fuelType: string;
  openingKm: number;
  closingKm: number;
  totalKm: number;
  amount: number;
};

type TripRow = {
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
  route: string;
  grossFreight: number;
  advancePaid: number;
  netPayable: number;
  status: string;
  startKm: number;
  endKm: number;
};

type ExpenseForm = {
  dieselExpense: number;
  tollExpense: number;
  foodingExpense: number;
  borderNakaCharges: number;
  loadingExpense: number;
  unloadingExpense: number;
  rtoCharges: number;
  parkingExpense: number;
  repairMaintenance: number;
  driverIncentive: number;
  otherExpense: number;
  lateDelivery: number;
  penalty: number;
  openingBalance: number;
  cashReceivedPaid: number;
  remark: string;
  tripClosedDate: string;
  tripSettlementDate: string;
};

function toInputDate(d: Date | string = new Date()) {
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return new Date().toISOString().slice(0, 10);
  return dt.toISOString().slice(0, 10);
}

function money(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function emptyExpenses(closed = toInputDate(), settled = toInputDate()): ExpenseForm {
  return {
    dieselExpense: 0,
    tollExpense: 0,
    foodingExpense: 0,
    borderNakaCharges: 0,
    loadingExpense: 0,
    unloadingExpense: 0,
    rtoCharges: 0,
    parkingExpense: 0,
    repairMaintenance: 0,
    driverIncentive: 0,
    otherExpense: 0,
    lateDelivery: 0,
    penalty: 0,
    openingBalance: 0,
    cashReceivedPaid: 0,
    remark: "",
    tripClosedDate: closed,
    tripSettlementDate: settled
  };
}

export default function TripSettlementPage() {
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [step, setStep] = useState<"filter" | "list" | "settle">("filter");
  const [results, setResults] = useState<TripRow[]>([]);
  const [selected, setSelected] = useState<TripRow | null>(null);
  const [advances, setAdvances] = useState<AdvanceLine[]>([]);
  const [form, setForm] = useState<ExpenseForm>(emptyExpenses());
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const mapListRow = (d: any): TripRow => ({
    documentNo: String(d.documentNo || d.tripsheetNo || "").toUpperCase(),
    tripsheetNo: String(d.tripsheetNo || d.documentNo || "").toUpperCase(),
    manualThcNo: String(d.manualThcNo || "").toUpperCase(),
    vehicleNo: String(d.vehicleNo || "").toUpperCase(),
    driverName: String(d.driverName || ""),
    branch: String(d.branch || "ALC1").toUpperCase(),
    documentDate: String(d.documentDate || ""),
    documentDateIso: String(d.documentDateIso || toInputDate()),
    fromLocation: String(d.fromLocation || "—").toUpperCase(),
    toLocation: String(d.toLocation || "—").toUpperCase(),
    route: String(d.route || ""),
    grossFreight: Number(d.grossFreight) || 0,
    advancePaid: Number(d.advancePaid) || 0,
    netPayable: Number(d.netPayable) || 0,
    status: String(d.status || "PREPARED").toUpperCase(),
    startKm: Number(d.startKm) || 0,
    endKm: Number(d.endKm) || 0
  });

  const handleFilter = async (filter: DocumentDateFilter) => {
    if (filter.searchMode === "document" && !filter.documentNo.trim()) {
      toast.error("Enter Document No.");
      return;
    }
    try {
      const params = new URLSearchParams({ pending: "1" });
      if (filter.searchMode === "document") params.set("documentNo", filter.documentNo.trim());
      else {
        params.set("from", filter.fromDate);
        params.set("to", filter.toDate);
        if (filter.vehicleNo !== "Show all") params.set("vehicleNo", filter.vehicleNo);
      }
      const res = await fetch(`/api/fleet/trip-settlements?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load trips for settlement");
        return;
      }
      setResults((data.data || []).map(mapListRow));
      setStep("list");
      if ((data.data || []).length === 0) {
        toast.warning("No open tripsheets found for selected criteria");
      }
    } catch {
      toast.error("Failed to load trips for settlement");
    }
  };

  const openSettle = async (row: TripRow) => {
    setLoadingDetail(true);
    setSelected(row);
    setForm(emptyExpenses());
    setAdvances([]);
    setStep("settle");
    try {
      const res = await fetch(
        `/api/fleet/trip-settlements?detail=1&tripsheetNo=${encodeURIComponent(row.tripsheetNo)}`
      );
      const data = await res.json();
      if (!res.ok || !data.data) {
        toast.error(data.error || "Failed to load trip settlement detail");
        return;
      }
      const d = data.data;
      const header = mapListRow(d);
      setSelected(header);
      const lines: AdvanceLine[] = (d.advances || []).map((a: any) => ({
        voucherNumber: String(a.voucherNumber || "").toUpperCase(),
        voucherDate: String(a.voucherDate || ""),
        voucherDateIso: String(a.voucherDateIso || toInputDate()),
        voucherType: String(a.voucherType || "Advance"),
        qty: Number(a.qty) || 0,
        rate: Number(a.rate) || 0,
        fuelType: String(a.fuelType || "Petrol"),
        openingKm: Number(a.openingKm) || header.startKm || 0,
        closingKm: Number(a.closingKm) || Number(a.openingKm) || header.startKm || 0,
        totalKm: Number(a.totalKm) || 0,
        amount: Number(a.amount) || 0
      }));
      setAdvances(lines);
      setForm(
        emptyExpenses(
          d.tripClosedDate || toInputDate(),
          d.tripSettlementDate || toInputDate()
        )
      );
    } catch {
      toast.error("Failed to load trip settlement detail");
    } finally {
      setLoadingDetail(false);
    }
  };

  const updateAdvance = (idx: number, patch: Partial<AdvanceLine>) => {
    setAdvances((prev) =>
      prev.map((line, i) => {
        if (i !== idx) return line;
        const next = { ...line, ...patch };
        const open = Number(next.openingKm) || 0;
        const close = Number(next.closingKm) || 0;
        next.totalKm = Math.max(0, close - open);
        return next;
      })
    );
  };

  const tripAdvance = useMemo(
    () => advances.reduce((s, a) => s + (Number(a.amount) || 0), 0),
    [advances]
  );

  const totals = useMemo(() => {
    const expenses =
      Number(form.dieselExpense) +
      Number(form.tollExpense) +
      Number(form.foodingExpense) +
      Number(form.borderNakaCharges) +
      Number(form.loadingExpense) +
      Number(form.unloadingExpense) +
      Number(form.rtoCharges) +
      Number(form.parkingExpense) +
      Number(form.repairMaintenance) +
      Number(form.driverIncentive) +
      Number(form.otherExpense);
    const deductions = Number(form.lateDelivery) + Number(form.penalty);
    const totalAmount = Number((expenses - deductions).toFixed(2));
    const tripExpense = Number((totalAmount - tripAdvance).toFixed(2));
    const netPayableReceivable = Number(
      (Number(form.openingBalance) + totalAmount - tripAdvance).toFixed(2)
    );
    const balanceAmount = Number((netPayableReceivable - Number(form.cashReceivedPaid)).toFixed(2));
    return { totalAmount, tripExpense, netPayableReceivable, balanceAmount };
  }, [form, tripAdvance]);

  const setNum = (key: keyof ExpenseForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  };

  const saveSettlement = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/fleet/trip-settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentNo: `TSL-${selected.tripsheetNo}`,
          tripsheetNo: selected.tripsheetNo,
          vehicleNo: selected.vehicleNo,
          driverName: selected.driverName,
          branch: selected.branch,
          route: selected.route || `${selected.fromLocation} → ${selected.toLocation}`,
          fromLocation: selected.fromLocation,
          toLocation: selected.toLocation,
          manualThcNo: selected.manualThcNo,
          documentDate: selected.documentDateIso,
          tripClosedDate: form.tripClosedDate,
          tripSettlementDate: form.tripSettlementDate,
          grossFreight: selected.grossFreight,
          dieselExpense: form.dieselExpense,
          tollExpense: form.tollExpense,
          foodingExpense: form.foodingExpense,
          borderNakaCharges: form.borderNakaCharges,
          loadingExpense: form.loadingExpense,
          unloadingExpense: form.unloadingExpense,
          rtoCharges: form.rtoCharges,
          parkingExpense: form.parkingExpense,
          repairMaintenance: form.repairMaintenance,
          driverIncentive: form.driverIncentive,
          otherExpense: form.otherExpense,
          lateDelivery: form.lateDelivery,
          penalty: form.penalty,
          openingBalance: form.openingBalance,
          cashReceivedPaid: form.cashReceivedPaid,
          tripAdvance,
          advances,
          endKm: advances.reduce((m, a) => Math.max(m, Number(a.closingKm) || 0), selected.endKm || 0),
          remark: form.remark,
          status: "SETTLED"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to finalize trip settlement");
        return;
      }
      toast.document(`Trip ${selected.tripsheetNo} settled`, {
        title: data.isMemoryStore ? "Settlement (Memory)" : "Trip Settlement",
        code: data.data?.documentNo || selected.tripsheetNo
      });
      setSelected(null);
      setAdvances([]);
      setStep("filter");
    } catch {
      toast.error("Failed to finalize trip settlement");
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    "h-8 w-full px-2 border border-slate-300 rounded-sm bg-white text-[12px] font-mono focus:outline-none focus:border-[#0171d3]";
  const labelCls = "text-[12px] text-slate-700 font-medium whitespace-nowrap";
  const readonlyCls = "text-[12px] font-semibold text-slate-900";

  const expenseRow = (
    leftLabel: string,
    leftNode: React.ReactNode,
    rightLabel: string,
    rightNode: React.ReactNode
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 py-1.5">
      <div className="grid grid-cols-[170px_1fr] gap-2 items-center">
        <span className={labelCls}>{leftLabel}</span>
        {leftNode}
      </div>
      <div className="grid grid-cols-[170px_1fr] gap-2 items-center">
        <span className={labelCls}>{rightLabel}</span>
        {rightNode}
      </div>
    </div>
  );

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-10">
      {step === "filter" && (
        <SelectionDocumentDateForm
          vehicleLabel="Entry Vehicle No."
          vehicles={vehicles}
          onSubmit={handleFilter}
        />
      )}

      {step === "list" && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 flex items-center justify-between">
            <span>Trip Settlement Documents</span>
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
                  <th className="border border-slate-200 px-2 py-2 text-left">Document / Tripsheet</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Vehicle No</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Driver</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Route</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Date</th>
                  <th className="border border-slate-200 px-2 py-2 text-right">Gross Freight</th>
                  <th className="border border-slate-200 px-2 py-2 text-right">Net Payable</th>
                  <th className="border border-slate-200 px-2 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.tripsheetNo} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-2 font-mono font-semibold text-[#0171d3]">
                      {row.tripsheetNo}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 font-mono font-bold">{row.vehicleNo}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.driverName || "—"}</td>
                    <td className="border border-slate-200 px-2 py-2">
                      {row.route || `${row.fromLocation} → ${row.toLocation}`}
                    </td>
                    <td className="border border-slate-200 px-2 py-2">{row.documentDate}</td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                      {money(row.grossFreight)}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono font-semibold text-emerald-700">
                      {money(row.netPayable)}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => openSettle(row)}
                        className="px-2.5 py-1 rounded border border-[#7eb6e8] text-[#0171d3] font-semibold hover:bg-[#e8f1fb]"
                      >
                        Settle
                      </button>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={8} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No open tripsheets found for settlement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === "settle" && selected && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">
            Trip Settlement — {selected.tripsheetNo}
          </div>

          {loadingDetail ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading trip & advances…</div>
          ) : (
            <>
              {/* Readonly trip header */}
              <div className="px-4 py-3 border-b border-slate-200 space-y-2">
                {expenseRow(
                  "THC / PDC Number",
                  <span className={`${readonlyCls} font-mono text-[#0171d3]`}>{selected.tripsheetNo}</span>,
                  "Manual THC / PDC No",
                  <span className={`${readonlyCls} font-mono`}>{selected.manualThcNo || "—"}</span>
                )}
                {expenseRow(
                  "Vehicle Number",
                  <span className={`${readonlyCls} font-mono`}>{selected.vehicleNo}</span>,
                  "Trip Closed Date",
                  <input
                    type="date"
                    value={form.tripClosedDate}
                    onChange={(e) => setForm({ ...form, tripClosedDate: e.target.value })}
                    className={fieldCls}
                  />
                )}
                {expenseRow(
                  "From - To Location",
                  <span className={readonlyCls}>
                    {selected.fromLocation} → {selected.toLocation}
                  </span>,
                  "Trip Settlement Date",
                  <input
                    type="date"
                    value={form.tripSettlementDate}
                    onChange={(e) => setForm({ ...form, tripSettlementDate: e.target.value })}
                    className={fieldCls}
                  />
                )}
                {expenseRow(
                  "Date",
                  <span className={readonlyCls}>{selected.documentDate || "—"}</span>,
                  "Driver",
                  <span className={readonlyCls}>{selected.driverName || "—"}</span>
                )}
              </div>

              {/* Company Advance Payment table */}
              <div className="px-3 py-3 border-b border-slate-200">
                <div className="text-[12px] font-semibold text-slate-700 mb-2 text-center">
                  Company Advance Payment
                </div>
                <div className="overflow-x-auto border border-slate-300">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-[#0171d3] text-white">
                        <th className="border border-[#0a5fad] px-1.5 py-1.5 text-left">Voucher Number</th>
                        <th className="border border-[#0a5fad] px-1.5 py-1.5 text-left">Voucher Date</th>
                        <th className="border border-[#0a5fad] px-1.5 py-1.5 text-left">Voucher Type</th>
                        <th className="border border-[#0a5fad] px-1.5 py-1.5 text-center">Qty / Rate</th>
                        <th className="border border-[#0a5fad] px-1.5 py-1.5 text-center">Opening Km</th>
                        <th className="border border-[#0a5fad] px-1.5 py-1.5 text-center">Closing Km</th>
                        <th className="border border-[#0a5fad] px-1.5 py-1.5 text-center">Total Km</th>
                        <th className="border border-[#0a5fad] px-1.5 py-1.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advances.map((line, idx) => (
                        <tr key={`${line.voucherNumber}-${idx}`} className="bg-white">
                          <td className="border border-slate-200 px-1.5 py-1 font-mono text-[#0171d3] font-semibold">
                            {line.voucherNumber}
                          </td>
                          <td className="border border-slate-200 px-1.5 py-1">{line.voucherDate}</td>
                          <td className="border border-slate-200 px-1.5 py-1">{line.voucherType}</td>
                          <td className="border border-slate-200 px-1.5 py-1 text-center font-mono">
                            {line.qty} [{line.fuelType}] {line.rate || 0}
                          </td>
                          <td className="border border-slate-200 px-1 py-1">
                            <input
                              type="number"
                              value={line.openingKm}
                              onChange={(e) => updateAdvance(idx, { openingKm: Number(e.target.value) || 0 })}
                              className="h-7 w-full px-1 border border-slate-300 rounded-sm font-mono text-center"
                            />
                          </td>
                          <td className="border border-slate-200 px-1 py-1">
                            <input
                              type="number"
                              value={line.closingKm}
                              onChange={(e) => updateAdvance(idx, { closingKm: Number(e.target.value) || 0 })}
                              className="h-7 w-full px-1 border border-slate-300 rounded-sm font-mono text-center"
                            />
                          </td>
                          <td className="border border-slate-200 px-1.5 py-1 text-center font-mono">
                            {line.totalKm}
                          </td>
                          <td className="border border-slate-200 px-1.5 py-1 text-right font-mono font-semibold">
                            {money(line.amount)}
                          </td>
                        </tr>
                      ))}
                      {advances.length === 0 && (
                        <tr>
                          <td colSpan={8} className="border border-slate-200 px-3 py-6 text-center text-slate-500">
                            No company advance payments recorded for this trip yet.
                          </td>
                        </tr>
                      )}
                      <tr className="bg-[#e8f1fb] font-semibold">
                        <td colSpan={7} className="border border-slate-200 px-2 py-1.5 text-right">
                          Total
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">
                          {money(tripAdvance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expense & settlement calc */}
              <div className="px-4 py-3 space-y-1">
                {expenseRow(
                  "Diesel Expense",
                  <input type="number" className={fieldCls} value={form.dieselExpense} onChange={(e) => setNum("dieselExpense", e.target.value)} />,
                  "Repair & Maintenance",
                  <input type="number" className={fieldCls} value={form.repairMaintenance} onChange={(e) => setNum("repairMaintenance", e.target.value)} />
                )}
                {expenseRow(
                  "Toll Expense",
                  <input type="number" className={fieldCls} value={form.tollExpense} onChange={(e) => setNum("tollExpense", e.target.value)} />,
                  "Driver Incentive",
                  <input type="number" className={fieldCls} value={form.driverIncentive} onChange={(e) => setNum("driverIncentive", e.target.value)} />
                )}
                {expenseRow(
                  "Fooding Expense",
                  <input type="number" className={fieldCls} value={form.foodingExpense} onChange={(e) => setNum("foodingExpense", e.target.value)} />,
                  "Other Expense",
                  <input type="number" className={fieldCls} value={form.otherExpense} onChange={(e) => setNum("otherExpense", e.target.value)} />
                )}
                {expenseRow(
                  "Border/Naka Charges",
                  <input type="number" className={fieldCls} value={form.borderNakaCharges} onChange={(e) => setNum("borderNakaCharges", e.target.value)} />,
                  "Late Delivery (-)",
                  <input type="number" className={fieldCls} value={form.lateDelivery} onChange={(e) => setNum("lateDelivery", e.target.value)} />
                )}
                {expenseRow(
                  "Loading Expense",
                  <input type="number" className={fieldCls} value={form.loadingExpense} onChange={(e) => setNum("loadingExpense", e.target.value)} />,
                  "Penalty (-)",
                  <input type="number" className={fieldCls} value={form.penalty} onChange={(e) => setNum("penalty", e.target.value)} />
                )}
                {expenseRow(
                  "Un-Loading Expense",
                  <input type="number" className={fieldCls} value={form.unloadingExpense} onChange={(e) => setNum("unloadingExpense", e.target.value)} />,
                  "Total Amount",
                  <input readOnly className={`${fieldCls} bg-slate-50 font-semibold`} value={money(totals.totalAmount)} />
                )}
                {expenseRow(
                  "RTO Charges",
                  <input type="number" className={fieldCls} value={form.rtoCharges} onChange={(e) => setNum("rtoCharges", e.target.value)} />,
                  "Trip Advance (-)",
                  <input readOnly className={`${fieldCls} bg-slate-50 font-semibold text-red-700`} value={money(tripAdvance)} />
                )}
                {expenseRow(
                  "Parking Expense",
                  <input type="number" className={fieldCls} value={form.parkingExpense} onChange={(e) => setNum("parkingExpense", e.target.value)} />,
                  "Net Payable / Receivable",
                  <input
                    readOnly
                    className={`${fieldCls} bg-slate-50 font-bold ${
                      totals.netPayableReceivable >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                    value={money(totals.netPayableReceivable)}
                  />
                )}
                {expenseRow(
                  "Trip Expense",
                  <input
                    readOnly
                    className={`${fieldCls} bg-slate-50 font-semibold ${
                      totals.tripExpense >= 0 ? "text-slate-900" : "text-red-700"
                    }`}
                    value={money(totals.tripExpense)}
                  />,
                  "Cash Received / Paid",
                  <input type="number" className={fieldCls} value={form.cashReceivedPaid} onChange={(e) => setNum("cashReceivedPaid", e.target.value)} />
                )}
                {expenseRow(
                  "Opening Balance",
                  <input type="number" className={fieldCls} value={form.openingBalance} onChange={(e) => setNum("openingBalance", e.target.value)} />,
                  "Balance Amount",
                  <input
                    readOnly
                    className={`${fieldCls} bg-slate-50 font-bold ${
                      totals.balanceAmount >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                    value={money(totals.balanceAmount)}
                  />
                )}
                <div className="grid grid-cols-[170px_1fr] gap-2 items-start pt-2">
                  <span className={labelCls}>Remark</span>
                  <textarea
                    value={form.remark}
                    onChange={(e) => setForm({ ...form, remark: e.target.value })}
                    rows={3}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-sm text-[12px] focus:outline-none focus:border-[#0171d3]"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setStep("list")}
                  className="inline-flex items-center gap-1.5 text-[#0171d3] font-semibold text-xs hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to list
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveSettlement}
                  className="inline-flex items-center gap-1.5 min-w-[140px] justify-center h-9 px-5 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] font-semibold text-sm hover:bg-[#e8f1fb] disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? "Saving..." : "Submit"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
