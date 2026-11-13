"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Copy,
  LayoutGrid,
  Plus,
  Receipt,
  Search,
  Square,
  Table2,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { toast } from "@/lib/toastBus";

type Step = 1 | 2 | 3;

interface CustomChargeColumn {
  id: string;
  particular: string;
  defaultAmount: number;
}

interface ChargeRow {
  docketNo: string;
  bookingDate: string;
  from: string;
  to: string;
  vehicleNo: string;
  rateType: string;
  invoiceValue: number;
  totalPkgs: number;
  totalWt: number;
  rate: number;
  freight: number;
  statisticalCharges: number;
  detentionCharges: number;
  collectionCharges: number;
  deliveryCharges: number;
  otherCharges: number;
  loadingCharges: number;
  unloadingCharges: number;
  escortCharges: number;
  diplomatCharges: number;
  codDodCharges: number;
  xtraWtCharges: number;
  serviceCharges: number;
  /** Values keyed by custom column id */
  customCharges: Record<string, number>;
}

const emptyCharges = (base: Partial<ChargeRow> = {}): ChargeRow => ({
  docketNo: "",
  bookingDate: "",
  from: "",
  to: "",
  vehicleNo: "",
  rateType: "Fixed",
  invoiceValue: 0,
  totalPkgs: 0,
  totalWt: 0,
  rate: 0,
  freight: 0,
  statisticalCharges: 0,
  detentionCharges: 0,
  collectionCharges: 0,
  deliveryCharges: 0,
  otherCharges: 0,
  loadingCharges: 0,
  unloadingCharges: 0,
  escortCharges: 0,
  diplomatCharges: 0,
  codDodCharges: 0,
  xtraWtCharges: 0,
  serviceCharges: 0,
  ...base,
  customCharges: { ...(base.customCharges || {}) }
});

function formatDisplayDate(value?: string | Date) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoInput(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function TransportBillPage() {
  const [step, setStep] = useState<Step>(1);

  // Masters
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [allConsignments, setAllConsignments] = useState<any[]>([]);

  // Step 1 filters
  const [dateFrom, setDateFrom] = useState(daysAgoInput(6));
  const [dateTo, setDateTo] = useState(todayInput());
  const [gstBranch, setGstBranch] = useState("");
  const [billingParty, setBillingParty] = useState("");
  const [docketNoInput, setDocketNoInput] = useState("");

  // Step 2 selection
  const [filteredDockets, setFilteredDockets] = useState<any[]>([]);
  const [selectedDockets, setSelectedDockets] = useState<string[]>([]);
  const [tableSearch, setTableSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Step 3 bill fields
  const [manualBillNo, setManualBillNo] = useState("");
  const [billFormat, setBillFormat] = useState("E-Invoice Bill Formate");
  const [partyBillingAddress, setPartyBillingAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [city, setCity] = useState("");
  const [sacCode, setSacCode] = useState("996511");
  const [gstPercent, setGstPercent] = useState(5);
  const [billGenerationDate, setBillGenerationDate] = useState(todayInput());
  const [collectionBranch, setCollectionBranch] = useState("ALC1");
  const [billingBranch, setBillingBranch] = useState("ALC1");
  const [partyAddress, setPartyAddress] = useState("");
  const [remark, setRemark] = useState("");
  const [chargeRows, setChargeRows] = useState<ChargeRow[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomChargeColumn[]>([]);
  const [showCustomColModal, setShowCustomColModal] = useState(false);
  const [draftCustomCols, setDraftCustomCols] = useState<CustomChargeColumn[]>([]);
  const [particularInput, setParticularInput] = useState("Extra Charges");
  const [amountInput, setAmountInput] = useState(0);
  const [osAmount] = useState(7881374);
  const [creditLimit, setCreditLimit] = useState(0);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [generatedBillNo, setGeneratedBillNo] = useState<string | null>(null);
  const [uploadingPodFor, setUploadingPodFor] = useState<string | null>(null);
  const [podFile, setPodFile] = useState<File | null>(null);
  const [podUploading, setPodUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()).catch(() => ({})),
      fetch("/api/branches").then((r) => r.json()).catch(() => ({})),
      fetch("/api/consignments").then((r) => r.json()).catch(() => ({}))
    ]).then(([custRes, branchRes, cnRes]) => {
      if (custRes.success) setCustomers(custRes.data || []);
      if (branchRes.success) {
        const list = branchRes.data || [];
        setBranches(list);
        if (list.length > 0) {
          const first = `${list[0].branchName || "Ateka Logistics"}-${list[0].branchCode}`;
          setGstBranch(first);
          setCollectionBranch(list[0].branchCode || "ALC1");
          setBillingBranch(list[0].branchCode || "ALC1");
        }
      }
      if (cnRes.success) {
        // Only dockets assigned on Prepare Loading Slip appear for bill generation
        setAllConsignments(
          (cnRes.data || []).filter(
            (c: any) =>
              c.status !== "BILLED" &&
              c.status !== "DRAFT" &&
              !!c.tripSheetNo
          )
        );
      }
    }).finally(() => setLoading(false));
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.name === billingParty) || null,
    [customers, billingParty]
  );

  useEffect(() => {
    if (!selectedCustomer) return;
    setPartyBillingAddress(selectedCustomer.address || partyBillingAddress);
    setPartyAddress(selectedCustomer.address || partyAddress);
    setGstin(selectedCustomer.gstin || gstin);
    setCity(selectedCustomer.city || city);
    setCreditLimit(Number(selectedCustomer.creditLimit) || 0);
    if (selectedCustomer.billFormat) setBillFormat(selectedCustomer.billFormat);
  }, [selectedCustomer]);

  const applyStep1Filter = () => {
    setFeedback(null);
    const docketTokens = docketNoInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const fromTs = new Date(dateFrom).setHours(0, 0, 0, 0);
    const toTs = new Date(dateTo).setHours(23, 59, 59, 999);

    let list = [...allConsignments];

    if (docketTokens.length > 0) {
      list = list.filter((c) => docketTokens.includes(String(c.docketNo || "").toUpperCase()));
    } else {
      if (!billingParty.trim()) {
        setFeedback({ type: "error", message: "Select a Billing Party or enter Docket No." });
        return;
      }
      const party = billingParty.toLowerCase();
      list = list.filter((c) => {
        const partyMatch =
          String(c.billingParty || "").toLowerCase() === party ||
          String(c.consignor?.name || "").toLowerCase() === party ||
          String(c.consignee?.name || "").toLowerCase() === party;
        const booked = new Date(c.bookingDate).getTime();
        const inRange = !Number.isNaN(booked) && booked >= fromTs && booked <= toTs;
        // Trip-sheet dockets for this party always qualify (may be assigned after booking date window)
        if (c.tripSheetNo && partyMatch) return true;
        return partyMatch && inRange;
      });
    }

    setFilteredDockets(list);
    setSelectedDockets([]);
    setTableSearch("");
    setPage(1);
    setStep(2);
  };

  const searchedDockets = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return filteredDockets;
    return filteredDockets.filter(
      (c) =>
        c.docketNo?.toLowerCase().includes(q) ||
        c.fromLocation?.toLowerCase().includes(q) ||
        c.toLocation?.toLowerCase().includes(q) ||
        c.billingParty?.toLowerCase().includes(q)
    );
  }, [filteredDockets, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(searchedDockets.length / pageSize));
  const pagedDockets = searchedDockets.slice((page - 1) * pageSize, page * pageSize);

  const toggleDocket = (docketNo: string) => {
    setSelectedDockets((prev) =>
      prev.includes(docketNo) ? prev.filter((d) => d !== docketNo) : [...prev, docketNo]
    );
  };

  /** Each docket must have its own non-empty podUrl (status alone is not enough). */
  const hasPod = (c: any) => !!(c?.podUrl && String(c.podUrl).trim());

  const resolveDocket = (dn: string) =>
    filteredDockets.find((x) => x.docketNo === dn) || allConsignments.find((x) => x.docketNo === dn);

  const handleUploadPod = async () => {
    if (!uploadingPodFor || !podFile) return;
    setPodUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", podFile);
      formData.append("docketNo", uploadingPodFor);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        const podUrl = data.data?.fileUrl || data.data?.url || "";
        if (!podUrl) {
          setFeedback({ type: "error", message: "Upload succeeded but no POD URL returned." });
          return;
        }
        const target = String(uploadingPodFor).toUpperCase();
        const patch = (list: any[]) =>
          list.map((c) =>
            String(c.docketNo || "").toUpperCase() === target
              ? {
                  ...c,
                  podUrl,
                  podFileName: data.data?.fileName || "",
                  podUploadedAt: new Date().toISOString(),
                  status: "DELIVERED"
                }
              : c
          );
        setAllConsignments(patch);
        setFilteredDockets(patch);
        const msg = `POD uploaded for ${uploadingPodFor}. Other dockets still need their own POD.`;
        setFeedback({ type: "success", message: msg });
        toast.success(msg, { code: uploadingPodFor, title: "Docket POD" });
        setUploadingPodFor(null);
        setPodFile(null);
      } else {
        const msg = data.error || "POD upload failed.";
        setFeedback({ type: "error", message: msg });
        toast.error(msg);
      }
    } catch {
      const msg = "Network error while uploading POD.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
    } finally {
      setPodUploading(false);
    }
  };

  const proceedToBillGeneration = () => {
    if (selectedDockets.length === 0) {
      setFeedback({ type: "error", message: "Select at least one docket to generate the transport bill." });
      return;
    }
    const missingPod = selectedDockets.filter((dn) => !hasPod(resolveDocket(dn)));
    if (missingPod.length > 0) {
      setFeedback({
        type: "error",
        message: `POD not found for: ${missingPod.join(", ")}. Upload a separate POD for each docket before bill generation.`
      });
      return;
    }

    // Reject shared / duplicated POD URLs across selected dockets
    const podByDocket = selectedDockets.map((dn) => {
      const c = resolveDocket(dn);
      return { docketNo: dn, podUrl: String(c?.podUrl || "").trim() };
    });
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const row of podByDocket) {
      const prev = seen.get(row.podUrl);
      if (prev) duplicates.push(`${row.docketNo} shares POD with ${prev}`);
      else seen.set(row.podUrl, row.docketNo);
    }
    if (duplicates.length > 0) {
      setFeedback({
        type: "error",
        message: `Each docket needs a different POD. ${duplicates.join("; ")}. Re-upload unique POD files.`
      });
      return;
    }

    setFeedback(null);
    setGeneratedBillNo(null);

    const rows = selectedDockets.map((docketNo) => {
      const c = filteredDockets.find((x) => x.docketNo === docketNo) || allConsignments.find((x) => x.docketNo === docketNo);
      const freight = Number(c?.financials?.freightAmount) || 0;
      const loading = Number(c?.financials?.loadingCharge) || 0;
      const pkgs = Number(c?.packageDetails?.packagesCount) || 0;
      const wt = Number(c?.packageDetails?.chargedWeight) || 0;
      const customCharges: Record<string, number> = {};
      for (const col of customColumns) {
        customCharges[col.id] = Number(col.defaultAmount) || 0;
      }
      return emptyCharges({
        docketNo,
        bookingDate: formatDisplayDate(c?.bookingDate),
        from: c?.fromLocation || "",
        to: c?.toLocation || "",
        vehicleNo: c?.vehicleNo || "",
        rateType: "Fixed",
        invoiceValue: 0,
        totalPkgs: pkgs,
        totalWt: wt,
        rate: wt > 0 ? Math.round(freight / wt) : freight,
        freight,
        loadingCharges: loading,
        customCharges
      });
    });

    setChargeRows(rows);

    if (!billingParty && rows.length > 0) {
      const first = filteredDockets.find((x) => x.docketNo === rows[0].docketNo);
      if (first?.billingParty) setBillingParty(first.billingParty);
    }

    setStep(3);
  };

  const updateCharge = (index: number, field: keyof ChargeRow, value: string | number) => {
    setChargeRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateCustomCharge = (rowIndex: number, columnId: string, value: number) => {
    setChargeRows((prev) => {
      const next = [...prev];
      const row = next[rowIndex];
      next[rowIndex] = {
        ...row,
        customCharges: { ...(row.customCharges || {}), [columnId]: value }
      };
      return next;
    });
  };

  const openCustomColumnModal = () => {
    setDraftCustomCols(customColumns.map((c) => ({ ...c })));
    setParticularInput("Extra Charges");
    setAmountInput(0);
    setShowCustomColModal(true);
  };

  const addDraftCustomColumn = () => {
    const name = particularInput.trim();
    if (!name) {
      setFeedback({ type: "error", message: "Particular is required for the custom column." });
      return;
    }
    if (draftCustomCols.some((c) => c.particular.toLowerCase() === name.toLowerCase())) {
      setFeedback({ type: "error", message: `Column "${name}" already exists in the list.` });
      return;
    }
    setDraftCustomCols((prev) => [
      ...prev,
      {
        id: `cc-${Date.now()}-${prev.length}`,
        particular: name,
        defaultAmount: Number(amountInput) || 0
      }
    ]);
    setParticularInput("");
    setAmountInput(0);
    setFeedback(null);
  };

  const removeDraftCustomColumn = (id: string) => {
    setDraftCustomCols((prev) => prev.filter((c) => c.id !== id));
  };

  const saveCustomColumns = () => {
    setCustomColumns(draftCustomCols);
    setChargeRows((prev) =>
      prev.map((row) => {
        const nextCustom: Record<string, number> = {};
        for (const col of draftCustomCols) {
          nextCustom[col.id] =
            row.customCharges?.[col.id] !== undefined
              ? Number(row.customCharges[col.id]) || 0
              : Number(col.defaultAmount) || 0;
        }
        return { ...row, customCharges: nextCustom };
      })
    );
    setShowCustomColModal(false);
    setFeedback({
      type: "success",
      message:
        draftCustomCols.length > 0
          ? `Saved ${draftCustomCols.length} custom charge column(s) on the bill grid.`
          : "Custom charge columns cleared."
    });
  };

  const rowTotal = (row: ChargeRow) => {
    const fixed =
      Number(row.freight || 0) +
      Number(row.statisticalCharges || 0) +
      Number(row.detentionCharges || 0) +
      Number(row.collectionCharges || 0) +
      Number(row.deliveryCharges || 0) +
      Number(row.otherCharges || 0) +
      Number(row.loadingCharges || 0) +
      Number(row.unloadingCharges || 0) +
      Number(row.escortCharges || 0) +
      Number(row.diplomatCharges || 0) +
      Number(row.codDodCharges || 0) +
      Number(row.xtraWtCharges || 0) +
      Number(row.serviceCharges || 0);
    const customSum = Object.values(row.customCharges || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
    return fixed + customSum;
  };

  const subTotal = chargeRows.reduce((acc, r) => acc + rowTotal(r), 0);
  const isInterState = useMemo(() => {
    // Simple heuristic: if destination city/state differs from MH defaults treat as IGST
    const dest = (city || "").toUpperCase();
    return dest && !["MUMBAI", "PUNE", "NASHIK", "NAGPUR", "THANE", "MAHARASHTRA"].some((s) => dest.includes(s));
  }, [city]);
  const taxAmount = Math.round((subTotal * Number(gstPercent || 0)) / 100);
  const igst = isInterState ? taxAmount : 0;
  const cgst = isInterState ? 0 : Math.round(taxAmount / 2);
  const sgst = isInterState ? 0 : taxAmount - cgst;
  const billAmount = subTotal + taxAmount;

  const confirmBillGeneration = async () => {
    if (chargeRows.length === 0) {
      setFeedback({ type: "error", message: "No CN lines available for bill generation." });
      return;
    }
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerCode: selectedCustomer?.customerCode || "CUST",
          customerName: billingParty,
          customerGstin: gstin,
          partyAddress: partyAddress || partyBillingAddress,
          destinationAddress,
          city,
          sacCode,
          gstPercent: Number(gstPercent),
          manualBillNo: manualBillNo || undefined,
          billDate: billGenerationDate,
          collectionBranch,
          billingBranch,
          remark,
          gstBranch,
          dateFrom,
          dateTo,
          billFormat,
          consignmentIds: chargeRows.map((r) => r.docketNo),
          lineItems: chargeRows,
          customChargeColumns: customColumns,
          totalFreight: subTotal,
          taxAmount,
          igst,
          cgst,
          sgst,
          grandTotal: billAmount
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const billNo = data.data?.billNumber || "";
        setGeneratedBillNo(billNo);
        setFeedback({
          type: "success",
          message: `Transport Bill generated successfully for ${chargeRows.length} CN(s).`
        });
        toast.document(`Transport Bill generated for ${chargeRows.length} CN(s). Keep this number for reference.`, {
          title: "Bill Number",
          code: billNo
        });
        const billed = new Set(chargeRows.map((r) => r.docketNo));
        setAllConsignments((prev) => prev.filter((c) => !billed.has(c.docketNo)));
        setFilteredDockets((prev) => prev.filter((c) => !billed.has(c.docketNo)));
        setSelectedDockets([]);
        setChargeRows([]);
      } else {
        const msg = data.error || "Bill generation failed.";
        setFeedback({ type: "error", message: msg });
        toast.error(msg);
      }
    } catch {
      const msg = "Network error while confirming bill generation.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const dateRangeLabel = `${new Date(dateFrom).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })} - ${new Date(dateTo).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })}`;

  return (
    <div className="space-y-4 pb-16 max-w-7xl mx-auto">
      <PageHeader
        moduleCode="C194"
        title="Transport Bill"
        subtitle="Finance • Customer Billing • BillGenrateStep1.aspx → Docket Select → Confirm Bill Generation"
actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm"
              title="Selection criteria"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <Link
              href="/dashboard/finance/customer-billing"
              className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm"
              title="Back to Customer Billing"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        }
      />

      {/* Step indicator */}
      <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
        {[
          { n: 1 as Step, label: "Selection Criteria" },
          { n: 2 as Step, label: "Select Dockets" },
          { n: 3 as Step, label: "Bill Generation" }
        ].map((s) => (
          <span
            key={s.n}
            className={`px-3 py-1.5 rounded-full border ${
              step === s.n
                ? "bg-blue-600 text-white border-blue-600"
                : step > s.n
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-white text-slate-500 border-slate-200"
            }`}
          >
            Step {s.n}: {s.label}
          </span>
        ))}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2 ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <div className="flex-1 space-y-2">
            <span>{feedback.message}</span>
            {generatedBillNo && feedback.type === "success" && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-medium text-green-800">Bill Number</span>
                <code className="px-2.5 py-1 rounded-md bg-white border border-green-200 font-mono text-sm text-slate-900">
                  {generatedBillNo}
                </code>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(generatedBillNo);
                      toast.success(`Bill number ${generatedBillNo} copied to clipboard.`);
                    } catch {
                      toast.error("Could not copy. Select and copy the bill number manually.");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedBillNo(null);
                    setStep(1);
                    setFeedback(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-green-300 bg-white text-green-800 text-[11px] font-bold"
                >
                  New Bill
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== STEP 1 ===================== */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 max-w-3xl space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Docket Date</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{dateRangeLabel}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">GST Branch</label>
            <select
              value={gstBranch}
              onChange={(e) => setGstBranch(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-white"
            >
              {branches.length === 0 ? (
                <option value="Ateka Logistics-ALC1">Ateka Logistics-ALC1</option>
              ) : (
                branches.map((b) => (
                  <option key={b._id || b.branchCode} value={`${b.branchName || "Ateka Logistics"}-${b.branchCode}`}>
                    {b.branchName || "Ateka Logistics"}-{b.branchCode}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Billing Party</label>
            {customers.length > 0 ? (
              <select
                value={billingParty}
                onChange={(e) => setBillingParty(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-white font-medium text-slate-800"
              >
                <option value="">-- Select Billing Party --</option>
                {customers.map((c) => (
                  <option key={c._id || c.customerCode} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={billingParty}
                onChange={(e) => setBillingParty(e.target.value)}
                placeholder="Enter billing party name"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs"
              />
            )}
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-bold text-slate-500 tracking-wider">OR</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Docket No</label>
            <textarea
              value={docketNoInput}
              onChange={(e) => setDocketNoInput(e.target.value.toUpperCase())}
              rows={4}
              placeholder="ALC12660615, ALC12660616"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">For Multiple CNs use [,] separator</p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={applyStep1Filter}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Table2 className="w-4 h-4" />
              Show Dockets
            </button>
          </div>
        </div>
      )}

      {/* ===================== STEP 2 ===================== */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <label className="text-slate-600">
                Show{" "}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="mx-1 h-8 px-2 border border-slate-200 rounded-md"
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>{" "}
                entries
              </label>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search:"
                className="w-full h-8 pl-8 pr-3 border border-slate-200 rounded-md text-xs"
              />
            </div>
          </div>

          {uploadingPodFor && (
            <div className="mx-4 mt-4 p-3 rounded-lg border border-amber-200 bg-amber-50 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="text-xs font-semibold text-amber-900 flex-1">
                Upload POD for <span className="font-mono">{uploadingPodFor}</span>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPodFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!podFile || podUploading}
                  onClick={handleUploadPod}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {podUploading ? "Uploading..." : "Upload"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadingPodFor(null);
                    setPodFile(null);
                  }}
                  className="px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[980px]">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10"></th>
                  <th className="py-2.5 px-3">Docket No</th>
                  <th className="py-2.5 px-3">POD</th>
                  <th className="py-2.5 px-3">Booking date</th>
                  <th className="py-2.5 px-3">Delivery Date</th>
                  <th className="py-2.5 px-3">From</th>
                  <th className="py-2.5 px-3">To</th>
                  <th className="py-2.5 px-3">Biz Description</th>
                  <th className="py-2.5 px-3">Freight</th>
                  <th className="py-2.5 px-3">Sub Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedDockets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400">
                      <div className="space-y-2">
                        <p>No trip-sheet dockets found for the selected parameters.</p>
                        <p className="text-[11px]">
                          Assign dockets on{" "}
                          <Link href="/dashboard/operations/tripsheets/prepare" className="text-blue-600 font-semibold underline">
                            Prepare Loading Slip
                          </Link>{" "}
                          first.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedDockets.map((c) => {
                    const selected = selectedDockets.includes(c.docketNo);
                    const freight = Number(c.financials?.freightAmount) || 0;
                    const podOk = hasPod(c);
                    return (
                      <tr
                        key={c._id || c.docketNo}
                        onClick={() => toggleDocket(c.docketNo)}
                        className={`cursor-pointer ${selected ? "bg-blue-100/80" : "hover:bg-slate-50"}`}
                      >
                        <td className="py-2.5 px-3 align-top">
                          {selected ? (
                            <CheckSquare className="w-4 h-4 text-blue-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700 align-top">{c.docketNo}</td>
                        <td className="py-2.5 px-3 align-top" onClick={(e) => e.stopPropagation()}>
                          {podOk ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                POD uploaded
                              </span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={c.podUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-blue-600 hover:underline font-medium"
                                >
                                  View
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadingPodFor(c.docketNo);
                                    setPodFile(null);
                                    setFeedback(null);
                                  }}
                                  className="text-[10px] text-slate-500 hover:text-blue-700 hover:underline font-medium"
                                >
                                  Replace
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-[11px] font-bold text-red-600">POD not found</div>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadingPodFor(c.docketNo);
                                  setPodFile(null);
                                  setFeedback(null);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                              >
                                <Upload className="w-3 h-3" />
                                Upload POD
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 align-top">{formatDisplayDate(c.bookingDate)}</td>
                        <td className="py-2.5 px-3 text-slate-500 align-top">
                          {c.status === "DELIVERED" ? formatDisplayDate(c.updatedAt) : ""}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 align-top">{c.fromLocation}</td>
                        <td className="py-2.5 px-3 text-slate-700 align-top">{c.toLocation}</td>
                        <td className="py-2.5 px-3 text-slate-500 align-top">{c.buDescription || ""}</td>
                        <td className="py-2.5 px-3 font-mono align-top">{freight.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold align-top">{freight.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing {(page - 1) * pageSize + (searchedDockets.length ? 1 : 0)} to{" "}
              {Math.min(page * pageSize, searchedDockets.length)} of {searchedDockets.length} entries
              {selectedDockets.length > 0 && (
                <span className="ml-2 font-semibold text-blue-700">{selectedDockets.length} row selected</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold">{page}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={proceedToBillGeneration}
              disabled={selectedDockets.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg inline-flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              Continue to Bill Generation
            </button>
          </div>
        </div>
      )}

      {/* ===================== STEP 3 ===================== */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Party</label>
              <input
                value={billingParty}
                readOnly
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Manual Bill No</label>
              <input
                value={manualBillNo}
                onChange={(e) => setManualBillNo(e.target.value.toUpperCase())}
                placeholder="Optional manual bill number"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bill Format</label>
              <select
                value={billFormat}
                onChange={(e) => setBillFormat(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
              >
                <option value="E-Invoice Bill Formate">E-Invoice Bill Formate</option>
                <option value="Standard Bill Format">Standard Bill Format</option>
                <option value="Thermal Format">Thermal Format</option>
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Party Billing Address</label>
              <textarea
                value={partyBillingAddress}
                onChange={(e) => setPartyBillingAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Destination Address</label>
              <input
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SAC Code</label>
              <select
                value={sacCode}
                onChange={(e) => setSacCode(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">--Select--</option>
                <option value="996511">996511 - Goods Transport Agency</option>
                <option value="996791">996791 - Freight Transport Services</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GST %</label>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value))}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-white"
              >
                <option value={0}>0</option>
                <option value={5}>5</option>
                <option value={12}>12</option>
                <option value={18}>18</option>
              </select>
            </div>
          </div>

          {/* CN charge lines */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={openCustomColumnModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Column
                {customColumns.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px]">
                    {customColumns.length}
                  </span>
                )}
              </button>
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input placeholder="Search:" className="w-full h-8 pl-8 pr-3 border border-slate-200 rounded-md text-xs" readOnly value="" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] min-w-[1600px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    {[
                      "SR No.",
                      "CN No.",
                      "Booking Date",
                      "From",
                      "To",
                      "Vehicle No",
                      "Rate Type",
                      "Invoice Value",
                      "Total Pkgs.",
                      "Total Wt.",
                      "Rate",
                      "Freight",
                      "Statistical Charges",
                      "Detention charges",
                      "Collection Charges",
                      "Delivery Charges",
                      "Other Charges",
                      "Loading Charges",
                      "Unloading Charges",
                      "Escort Charges",
                      "Diplomat Charges",
                      "COD/DOD Charges",
                      "Xtra Wt Charges",
                      "Service Charges",
                      ...customColumns.map((c) => c.particular),
                      "IGST",
                      "CGST/SGST",
                      "Total"
                    ].map((h) => (
                      <th key={h} className="py-2 px-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chargeRows.map((row, idx) => {
                    const total = rowTotal(row);
                    const rowTax = Math.round((total * gstPercent) / 100);
                    return (
                      <tr key={row.docketNo} className="hover:bg-slate-50/60">
                        <td className="py-1.5 px-2 font-semibold">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono font-bold text-blue-700">{row.docketNo}</td>
                        <td className="py-1.5 px-2 whitespace-nowrap">{row.bookingDate}</td>
                        <td className="py-1.5 px-2">{row.from}</td>
                        <td className="py-1.5 px-2">{row.to}</td>
                        <td className="py-1.5 px-2 font-mono">{row.vehicleNo}</td>
                        <td className="py-1.5 px-2">{row.rateType}</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            value={row.invoiceValue}
                            onChange={(e) => updateCharge(idx, "invoiceValue", Number(e.target.value))}
                            className="w-16 h-7 px-1 border border-slate-200 rounded font-mono"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            value={row.totalPkgs}
                            onChange={(e) => updateCharge(idx, "totalPkgs", Number(e.target.value))}
                            className="w-14 h-7 px-1 border border-slate-200 rounded font-mono"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            value={row.totalWt}
                            onChange={(e) => updateCharge(idx, "totalWt", Number(e.target.value))}
                            className="w-16 h-7 px-1 border border-slate-200 rounded font-mono"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            value={row.rate}
                            onChange={(e) => updateCharge(idx, "rate", Number(e.target.value))}
                            className="w-16 h-7 px-1 border border-slate-200 rounded font-mono"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            value={row.freight}
                            onChange={(e) => updateCharge(idx, "freight", Number(e.target.value))}
                            className="w-20 h-7 px-1 border border-slate-200 rounded font-mono font-semibold"
                          />
                        </td>
                        {(
                          [
                            "statisticalCharges",
                            "detentionCharges",
                            "collectionCharges",
                            "deliveryCharges",
                            "otherCharges",
                            "loadingCharges",
                            "unloadingCharges",
                            "escortCharges",
                            "diplomatCharges",
                            "codDodCharges",
                            "xtraWtCharges",
                            "serviceCharges"
                          ] as (keyof ChargeRow)[]
                        ).map((field) => (
                          <td key={field} className="py-1.5 px-2">
                            <input
                              type="number"
                              value={row[field] as number}
                              onChange={(e) => updateCharge(idx, field, Number(e.target.value))}
                              className="w-16 h-7 px-1 border border-slate-200 rounded font-mono"
                            />
                          </td>
                        ))}
                        {customColumns.map((col) => (
                          <td key={col.id} className="py-1.5 px-2">
                            <input
                              type="number"
                              value={row.customCharges?.[col.id] ?? 0}
                              onChange={(e) => updateCustomCharge(idx, col.id, Number(e.target.value) || 0)}
                              className="w-16 h-7 px-1 border border-blue-200 rounded font-mono bg-blue-50/40"
                              title={col.particular}
                            />
                          </td>
                        ))}
                        <td className="py-1.5 px-2 font-mono">{isInterState ? rowTax : 0}</td>
                        <td className="py-1.5 px-2 font-mono">{isInterState ? 0 : rowTax}</td>
                        <td className="py-1.5 px-2 font-mono font-bold text-slate-900">{total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals + branch / remark */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bill Generation Date</label>
                <input
                  type="date"
                  value={billGenerationDate}
                  onChange={(e) => setBillGenerationDate(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={openCustomColumnModal}
                className="px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg font-semibold"
              >
                View Exp Details / Custom Columns
              </button>
              <p className="text-slate-600">
                Current O.S Amt./ Credit Limit :{" "}
                <strong className="text-slate-900">
                  {osAmount.toLocaleString()}/{creditLimit}
                </strong>
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Sub Total</span>
                  <span className="text-base font-bold font-mono">{subTotal.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">IGST</span>
                  <span className="text-base font-bold font-mono">{igst.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">CGST</span>
                  <span className="text-base font-bold font-mono">{cgst.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">SGST</span>
                  <span className="text-base font-bold font-mono">{sgst.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 col-span-2">
                  <span className="text-emerald-700 block font-semibold">Bill Amount</span>
                  <span className="text-lg font-black font-mono text-emerald-800">{billAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Collection Branch</label>
                <input
                  value={collectionBranch}
                  onChange={(e) => setCollectionBranch(e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remark</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing branch</label>
                <input
                  value={billingBranch}
                  onChange={(e) => setBillingBranch(e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Party Address</label>
                <textarea
                  value={partyAddress}
                  onChange={(e) => setPartyAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Echo of step-1 criteria */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-700">Docket Date</span>
                  <div>{dateRangeLabel}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">GST Branch</span>
                  <div>{gstBranch}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Billing Party</span>
                  <div className="font-semibold text-slate-900">{billingParty}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            >
              Back to Docket Selection
            </button>
            <button
              type="button"
              disabled={generating || chargeRows.length === 0}
              onClick={confirmBillGeneration}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {generating ? "Confirming..." : "Confirm Bill Generation"}
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Column modal — Particular / Amount / ADD */}
      {showCustomColModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#0070d2] px-4 py-3 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wide">Add Custom Column / Extra Charges</h3>
              <button
                type="button"
                onClick={() => setShowCustomColModal(false)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-12 gap-3 items-end border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Sr.no</label>
                  <div className="h-9 flex items-center font-mono font-bold text-slate-600">
                    {draftCustomCols.length + 1}
                  </div>
                </div>
                <div className="col-span-5">
                  <label className="block font-semibold text-slate-700 mb-1">Particular</label>
                  <input
                    type="text"
                    value={particularInput}
                    onChange={(e) => setParticularInput(e.target.value)}
                    placeholder="e.g. Extra Charges"
                    className="w-full h-9 px-2.5 border border-[#0070d2] rounded focus:outline-none bg-white"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    min={0}
                    value={amountInput}
                    onChange={(e) => setAmountInput(Number(e.target.value) || 0)}
                    className="w-full h-9 px-2.5 border border-[#0070d2] rounded focus:outline-none bg-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={addDraftCustomColumn}
                    className="w-full h-9 rounded-full border-2 border-[#0070d2] text-[#0070d2] font-bold hover:bg-blue-50"
                  >
                    ADD
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-16">Sr.no</th>
                      <th className="py-2 px-3">Particular</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftCustomCols.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          No custom columns yet. Enter Particular &amp; Amount, then ADD.
                        </td>
                      </tr>
                    ) : (
                      draftCustomCols.map((col, i) => (
                        <tr key={col.id}>
                          <td className="py-2 px-3 font-mono text-slate-600">{i + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{col.particular}</td>
                          <td className="py-2 px-3 text-right font-mono">{col.defaultAmount}</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeDraftCustomColumn(col.id)}
                              className="text-slate-400 hover:text-red-600"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={saveCustomColumns}
                  className="min-w-[100px] px-6 py-2 bg-[#0070d2] hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomColModal(false)}
                  className="min-w-[100px] px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
