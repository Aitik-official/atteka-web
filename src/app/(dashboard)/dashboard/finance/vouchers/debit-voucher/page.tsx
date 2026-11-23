"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileText,
  Pencil,
  Plus,
  Table2
} from "lucide-react";
import { toast } from "@/lib/toastBus";
import { ListToolbar } from "@/components/common/ListToolbar";
import { EmptyState, TableEmptyRow } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { WcvSubmitButton } from "@/components/common/WcvFormPrimitives";

type VoucherRow = {
  srNo: number;
  voucherNumber: string;
  voucherDate: string;
  voucherDateIso: string;
  voucherType: string;
  docRefNo: string;
  branch: string;
  payTo: string;
  totalAccountedAmount: number;
  narration: string;
  status: "Active" | "Cancelled";
};

type PaidToParty = {
  code: string;
  name: string;
  label: string;
  entity: "Vendor" | "Customer" | "Staff";
};

type Lists = {
  voucherTypes: string[];
  locations: string[];
  projects: string[];
  interestAccounts: string[];
  tdsSections: string[];
  cashBankAccounts: string[];
  modes: string[];
  accountGroups: string[];
  paidToParties: PaidToParty[];
  predictedVoucherNo?: string;
};

type EntityType = "Vendor" | "Customer" | "Staff" | "";
type AccountGroup = "ALL" | "ASSET" | "EXPENSES" | "INCOME" | "LIABILITIES";
const ACCOUNT_GROUPS: AccountGroup[] = ["ALL", "ASSET", "EXPENSES", "INCOME", "LIABILITIES"];
const PAID_TO_OTHER = "__OTHER__";

const COLS = [
  { key: "srNo", label: "Sr No" },
  { key: "voucherNumber", label: "Voucher Number" },
  { key: "voucherDate", label: "Voucher Date" },
  { key: "docRefNo", label: "Doc/ref No." },
  { key: "branch", label: "Branch" },
  { key: "payTo", label: "Pay To" },
  { key: "totalAccountedAmount", label: "Total Accounted Amount" },
  { key: "narration", label: "Narration" },
  { key: "copyEntry", label: "Copy Entry" },
  { key: "edit", label: "Edit" },
  { key: "cancel", label: "Cancel" }
] as const;

type ColKey = (typeof COLS)[number]["key"];

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
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function fmtAmt(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function amountInWords(amount: number): string {
  if (!amount || amount <= 0) return "Zero Rupees Only";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigits = (n: number) => {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`.trim();
  };
  const threeDigits = (n: number) => {
    if (n < 100) return twoDigits(n);
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " + twoDigits(n % 100) : ""}`.trim();
  };
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let n = rupees;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;
  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  let words = `${parts.join(" ")} Rupees`.trim();
  if (paise) words += ` and ${twoDigits(paise)} Paise`;
  return `${words} Only`;
}

const emptyForm = () => ({
  predictedVoucherNo: "",
  voucherDate: toInputDate(new Date()),
  location: "",
  projectName: "",
  documentNo: "",
  documentDate: toInputDate(new Date()),
  paidTo: "",
  partyCode: "",
  entityType: "" as EntityType,
  gstNo: "",
  panNo: "",
  narration: "",
  acDescription: "",
  accountCode: "",
  baseAmount: 0,
  ratesAdjustable: true,
  igstPct: 0,
  igstAmt: 0,
  cgstPct: 0,
  cgstAmt: 0,
  sgstPct: 0,
  sgstAmt: 0,
  municipalTax: 0,
  interestAccount: "",
  interestAmount: 0,
  tdsSection: "",
  tdsRate: 0,
  tdsAmount: 0,
  modeOfTransaction: "Cash",
  cashBankAccount: "",
  chequeNo: "",
  chequeDate: toInputDate(new Date())
});

export default function DebitVoucherPage() {
  const [step, setStep] = useState<"filter" | "report" | "form">("filter");
  const [fromDate, setFromDate] = useState(toInputDate(daysAgo(6)));
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [showDates, setShowDates] = useState(false);
  const [voucherType, setVoucherType] = useState("");
  const [voucherNumber, setVoucherNumber] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [lists, setLists] = useState<Lists>({
    voucherTypes: [],
    locations: [],
    projects: [],
    interestAccounts: [],
    tdsSections: [],
    cashBankAccounts: [],
    modes: ["Cash", "Cheque", "NEFT"],
    accountGroups: ACCOUNT_GROUPS,
    paidToParties: []
  });
  const [rows, setRows] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState("");
  const [cardView, setCardView] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>(
    Object.fromEntries(COLS.map((c) => [c.key, true])) as Record<ColKey, boolean>
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [colFilters, setColFilters] = useState<Record<string, string>>(
    Object.fromEntries(COLS.map((c) => [c.key, ""]))
  );
  const [form, setForm] = useState(emptyForm);
  const [formMode, setFormMode] = useState<"new" | "edit" | "copy">("new");
  const [accounts, setAccounts] = useState<{ code: string; name: string; group: string }[]>([]);
  const [accountBrowseOpen, setAccountBrowseOpen] = useState(false);
  const [accountBrowseStep, setAccountBrowseStep] = useState<"groups" | "list">("groups");
  const [selectedGroups, setSelectedGroups] = useState<AccountGroup[]>(["ALL"]);
  const [paidToSelect, setPaidToSelect] = useState("");
  const [successModal, setSuccessModal] = useState<{ voucherNumber: string; row: VoucherRow } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/finance/debit-voucher?lists=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLists({
            voucherTypes: d.data.voucherTypes || [],
            locations: d.data.locations || [],
            projects: d.data.projects || [],
            interestAccounts: d.data.interestAccounts || [],
            tdsSections: d.data.tdsSections || [],
            cashBankAccounts: d.data.cashBankAccounts || [],
            modes: d.data.modes || ["Cash", "Cheque", "NEFT"],
            accountGroups: d.data.accountGroups || ACCOUNT_GROUPS,
            paidToParties: d.data.paidToParties || [],
            predictedVoucherNo: d.data.predictedVoucherNo
          });
          if (Array.isArray(d.data?.accounts)) setAccounts(d.data.accounts);
        }
      })
      .catch(() => {});
  }, []);

  const dateRangeLabel = `${formatLong(fromDate)} - ${formatLong(toDate)}`;

  const taxSync = useMemo(() => {
    const base = Number(form.baseAmount || 0);
    const igstAmt = form.ratesAdjustable
      ? Number(((base * Number(form.igstPct || 0)) / 100).toFixed(2))
      : Number(form.igstAmt || 0);
    const cgstAmt = form.ratesAdjustable
      ? Number(((base * Number(form.cgstPct || 0)) / 100).toFixed(2))
      : Number(form.cgstAmt || 0);
    const sgstAmt = form.ratesAdjustable
      ? Number(((base * Number(form.sgstPct || 0)) / 100).toFixed(2))
      : Number(form.sgstAmt || 0);
    const municipal = Number(form.municipalTax || 0);
    const interest = Number(form.interestAmount || 0);
    const taxable = Number((base + igstAmt + cgstAmt + sgstAmt + municipal + interest).toFixed(2));
    const tdsAmount = form.tdsRate
      ? Number(((taxable * Number(form.tdsRate || 0)) / 100).toFixed(2))
      : Number(form.tdsAmount || 0);
    const netPayable = Number((taxable - tdsAmount).toFixed(2));
    return { igstAmt, cgstAmt, sgstAmt, taxable, tdsAmount, netPayable };
  }, [form]);

  const loadRows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        voucherType,
        voucherNumber: voucherNumber.trim(),
        documentNumber: documentNumber.trim()
      });
      const res = await fetch(`/api/finance/debit-voucher?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load vouchers");
        return;
      }
      setRows(data.data || []);
      setPage(1);
      setTableSearch("");
      setStep("report");
      if (!(data.data || []).length) toast.warning("No vouchers found");
    } catch {
      toast.error("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = rows.filter((r) => r.status !== "Cancelled");
    const q = tableSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.voucherNumber.toLowerCase().includes(q) ||
          r.docRefNo.toLowerCase().includes(q) ||
          r.payTo.toLowerCase().includes(q) ||
          r.narration.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q)
      );
    }
    const f = colFilters;
    if (f.srNo.trim()) list = list.filter((r) => String(r.srNo).includes(f.srNo.trim()));
    if (f.voucherNumber.trim())
      list = list.filter((r) =>
        r.voucherNumber.toLowerCase().includes(f.voucherNumber.trim().toLowerCase())
      );
    if (f.voucherDate.trim())
      list = list.filter((r) =>
        r.voucherDate.toLowerCase().includes(f.voucherDate.trim().toLowerCase())
      );
    if (f.docRefNo.trim())
      list = list.filter((r) => r.docRefNo.toLowerCase().includes(f.docRefNo.trim().toLowerCase()));
    if (f.branch.trim())
      list = list.filter((r) => r.branch.toLowerCase().includes(f.branch.trim().toLowerCase()));
    if (f.payTo.trim())
      list = list.filter((r) => r.payTo.toLowerCase().includes(f.payTo.trim().toLowerCase()));
    if (f.totalAccountedAmount.trim())
      list = list.filter((r) => String(r.totalAccountedAmount).includes(f.totalAccountedAmount.trim()));
    if (f.narration.trim())
      list = list.filter((r) =>
        r.narration.toLowerCase().includes(f.narration.trim().toLowerCase())
      );
    return list;
  }, [rows, tableSearch, colFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const fromEntry = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toEntry = Math.min(page * pageSize, filtered.length);
  const col = (key: ColKey) => visibleCols[key] !== false;

  const setFilter = (key: string, value: string) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const setField = <K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Voucher Date and Document Date stay in sync
      if (key === "voucherDate") next.documentDate = value as string;
      if (key === "documentDate") next.voucherDate = value as string;
      return next;
    });
  };

  const applyPaidToMaster = (value: string) => {
    setPaidToSelect(value);
    if (!value) {
      setFieldClear("paidTo", "");
      setField("partyCode", "");
      setField("entityType", "");
      return;
    }
    if (value === PAID_TO_OTHER) {
      setFieldClear("paidTo", "");
      setField("partyCode", "");
      return;
    }
    const party = lists.paidToParties.find((p) => p.label === value || p.code === value);
    if (party) {
      setFieldClear("paidTo", party.name);
      setField("partyCode", party.code);
      setField("entityType", party.entity);
    } else {
      setFieldClear("paidTo", value);
    }
  };

  const openNew = () => {
    const base = emptyForm();
    if (lists.predictedVoucherNo) base.predictedVoucherNo = lists.predictedVoucherNo;
    if (lists.locations[0]) base.location = lists.locations[0];
    setForm(base);
    setPaidToSelect("");
    setFormMode("new");
    setStep("form");
  };

  const openEdit = (r: VoucherRow) => {
    setForm({
      ...emptyForm(),
      predictedVoucherNo: r.voucherNumber,
      voucherDate: r.voucherDateIso,
      documentDate: r.voucherDateIso,
      location: r.branch,
      documentNo: r.docRefNo,
      paidTo: r.payTo,
      narration: r.narration,
      baseAmount: r.totalAccountedAmount
    });
    const match = lists.paidToParties.find(
      (p) => p.name.toLowerCase() === r.payTo.toLowerCase() || p.label.toLowerCase().includes(r.payTo.toLowerCase())
    );
    setPaidToSelect(match ? match.label : PAID_TO_OTHER);
    setFormMode("edit");
    setStep("form");
  };

  const openCopy = (r: VoucherRow) => {
    const today = toInputDate(new Date());
    setForm({
      ...emptyForm(),
      predictedVoucherNo: lists.predictedVoucherNo || "",
      voucherDate: today,
      documentDate: today,
      location: r.branch,
      documentNo: "",
      paidTo: r.payTo,
      narration: r.narration,
      baseAmount: r.totalAccountedAmount
    });
    const match = lists.paidToParties.find(
      (p) => p.name.toLowerCase() === r.payTo.toLowerCase() || p.label.toLowerCase().includes(r.payTo.toLowerCase())
    );
    setPaidToSelect(match ? match.label : PAID_TO_OTHER);
    setFormMode("copy");
    setStep("form");
    toast.info(`Copied ${r.voucherNumber} — new voucher draft`);
  };

  const cancelRow = async (r: VoucherRow) => {
    try {
      const res = await fetch("/api/finance/debit-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", voucherNumber: r.voucherNumber })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cancel failed");
        return;
      }
      setRows((prev) =>
        prev.map((x) => (x.voucherNumber === r.voucherNumber ? { ...x, status: "Cancelled" } : x))
      );
      toast.success(data.message || `${r.voucherNumber} cancelled`);
    } catch {
      toast.error("Cancel failed");
    }
  };

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!form.paidTo.trim()) next.paidTo = "Paid To is required";
    if (!form.location.trim()) next.location = "Location is required";
    if (!form.baseAmount || form.baseAmount <= 0) next.baseAmount = "Enter a base amount greater than zero";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const formValid =
    !!form.paidTo.trim() && !!form.location.trim() && !!form.baseAmount && form.baseAmount > 0;

  const submitVoucher = async () => {
    if (!validateForm()) {
      toast.error("Fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/finance/debit-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          igstAmt: taxSync.igstAmt,
          cgstAmt: taxSync.cgstAmt,
          sgstAmt: taxSync.sgstAmt,
          taxableAmount: taxSync.taxable,
          tdsAmount: taxSync.tdsAmount,
          netPayable: taxSync.netPayable
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save voucher");
        return;
      }
      const saved: VoucherRow = {
        srNo: 1,
        voucherNumber: data.data?.voucherNumber || "",
        voucherDate: data.data?.voucherDate || form.voucherDate,
        voucherDateIso: data.data?.voucherDateIso || form.voucherDate,
        voucherType: data.data?.voucherType || form.modeOfTransaction,
        docRefNo: data.data?.docRefNo || form.documentNo,
        branch: data.data?.branch || form.location,
        payTo: data.data?.payTo || form.paidTo,
        totalAccountedAmount: Number(data.data?.totalAccountedAmount ?? taxSync.netPayable),
        narration: data.data?.narration || form.narration,
        status: "Active"
      };
      setFieldErrors({});
      setRows((prev) => [saved, ...prev.map((r, i) => ({ ...r, srNo: i + 2 }))]);
      setSuccessModal({ voucherNumber: saved.voucherNumber, row: saved });
      // Refresh predicted no for next voucher
      fetch("/api/finance/debit-voucher?lists=1")
        .then((r) => r.json())
        .then((d) => {
          if (d.data?.predictedVoucherNo) {
            setLists((prev) => ({ ...prev, predictedVoucherNo: d.data.predictedVoucherNo }));
          }
        })
        .catch(() => {});
    } catch {
      toast.error("Failed to save voucher");
    } finally {
      setSaving(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    if (selectedGroups.includes("ALL") || selectedGroups.length === 0) return accounts;
    return accounts.filter((a) =>
      selectedGroups.some((g) => String(a.group || "").toUpperCase().includes(g))
    );
  }, [accounts, selectedGroups]);

  const toggleGroup = (g: AccountGroup) => {
    if (g === "ALL") {
      setSelectedGroups(["ALL"]);
      return;
    }
    setSelectedGroups((prev) => {
      const withoutAll = prev.filter((x) => x !== "ALL");
      if (withoutAll.includes(g)) {
        const next = withoutAll.filter((x) => x !== g);
        return next.length ? next : ["ALL"];
      }
      return [...withoutAll, g];
    });
  };

  const openAccountBrowse = () => {
    setSelectedGroups(["ALL"]);
    setAccountBrowseStep("groups");
    setAccountBrowseOpen(true);
  };

  const exportExcel = () => {
    const headers = [
      "Sr No",
      "Voucher Number",
      "Voucher Date",
      "Doc/ref No.",
      "Branch",
      "Pay To",
      "Total Accounted Amount",
      "Narration"
    ];
    const body = filtered.map((r, idx) => [
      idx + 1,
      r.voucherNumber,
      r.voucherDate,
      r.docRefNo,
      r.branch,
      r.payTo,
      r.totalAccountedAmount,
      r.narration
    ]);
    const csv = [headers, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DebitVouchers_${toInputDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyTable = async () => {
    const text = filtered
      .map(
        (r, idx) =>
          `${idx + 1}\t${r.voucherNumber}\t${r.voucherDate}\t${r.docRefNo}\t${r.branch}\t${r.payTo}\t${r.totalAccountedAmount}\t${r.narration}`
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied voucher rows");
    } catch {
      toast.error("Unable to copy");
    }
  };

  const fieldCls =
    "w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#0171d3] focus:ring-2 focus:ring-[#0171d3]/15 transition-[border-color,box-shadow]";
  const fieldErrCls = "border-rose-400 focus:border-rose-500 focus:ring-rose-200/60";
  const labelCls = "block text-[11px] font-semibold text-slate-600 mb-1";
  const setFieldClear = (key: string, value: unknown) => {
    setField(key as keyof typeof form, value as never);
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="space-y-4 pb-16 max-w-7xl mx-auto">
      {step === "filter" && (
        <div className="min-h-[55vh] flex items-start justify-center pt-10 px-4">
          <div className="w-full max-w-md space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Voucher Date</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDates((v) => !v)}
                  className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-left bg-white flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="flex-1 truncate text-slate-700">{dateRangeLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {showDates && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-3 space-y-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">From</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full h-9 px-2 border border-slate-200 rounded-md text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">To</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full h-9 px-2 border border-slate-200 rounded-md text-xs mt-0.5"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDates(false)}
                      className="w-full h-8 bg-blue-600 text-white text-xs font-semibold rounded-md"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            <select
              value={voucherType}
              onChange={(e) => setVoucherType(e.target.value)}
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 bg-white"
            >
              <option value="">Select Voucher Type</option>
              {lists.voucherTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <input
              value={voucherNumber}
              onChange={(e) => setVoucherNumber(e.target.value.toUpperCase())}
              placeholder="Voucher Number"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400"
            />
            <input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
              placeholder="Document Number"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400"
            />

            <button
              type="button"
              disabled={loading}
              onClick={loadRows}
              title="Show table"
              className="w-11 h-11 rounded-md bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              <Table2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === "report" && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <ListToolbar
            onBack={() => setStep("filter")}
            title="Debit Voucher"
            columns={COLS.map((c) => ({ key: c.key, label: c.label }))}
            visibleCols={visibleCols}
            onToggleColumn={(key) =>
              setVisibleCols((prev) => ({ ...prev, [key]: !prev[key as ColKey] }))
            }
            onCopy={copyTable}
            onExcel={exportExcel}
            cardView={cardView}
            onToggleCardView={() => setCardView((v) => !v)}
            search={tableSearch}
            onSearchChange={(v) => {
              setTableSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search vouchers…"
            right={
              <>
                <button
                  type="button"
                  onClick={openNew}
                  className="h-8 px-3 rounded-lg bg-[#0171d3] text-white font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-[#015fae]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
                <label className="text-xs text-slate-600 inline-flex items-center gap-1.5">
                  Show
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-8 px-2 border border-slate-200 rounded-md"
                  >
                    {[10, 25, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            }
          />

          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : !cardView ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1200px]">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {COLS.map(
                      (c) =>
                        col(c.key) && (
                          <th key={c.key} className="py-2 px-3 whitespace-nowrap">
                            {c.label}
                          </th>
                        )
                    )}
                  </tr>
                  <tr className="bg-white font-normal">
                    {COLS.map(
                      (c) =>
                        col(c.key) && (
                          <th key={`f-${c.key}`} className="px-2 pb-2">
                            {["copyEntry", "edit", "cancel"].includes(c.key) ? (
                              <input
                                disabled
                                placeholder={`Search ${c.label}`}
                                className="w-full h-8 px-2 border border-slate-200 rounded text-[11px] bg-slate-50"
                              />
                            ) : (
                              <input
                                value={colFilters[c.key]}
                                onChange={(e) => setFilter(c.key, e.target.value)}
                                placeholder={`Search ${c.label}`}
                                className="w-full h-8 px-2 border border-slate-200 rounded text-[11px]"
                              />
                            )}
                          </th>
                        )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <TableEmptyRow
                      colSpan={11}
                      title="No debit vouchers yet"
                      description="Create a debit voucher to start this list."
                      actionLabel="Add New"
                      onAction={openNew}
                    />
                  ) : (
                    paged.map((r, idx) => (
                      <tr key={r.voucherNumber} className="hover:bg-slate-50/80">
                        {col("srNo") && (
                          <td className="py-2.5 px-3 font-mono">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                        )}
                        {col("voucherNumber") && (
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {r.voucherNumber}
                          </td>
                        )}
                        {col("voucherDate") && (
                          <td className="py-2.5 px-3 whitespace-nowrap">{r.voucherDate}</td>
                        )}
                        {col("docRefNo") && (
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">{r.docRefNo}</td>
                        )}
                        {col("branch") && <td className="py-2.5 px-3 font-mono">{r.branch}</td>}
                        {col("payTo") && <td className="py-2.5 px-3">{r.payTo}</td>}
                        {col("totalAccountedAmount") && (
                          <td className="py-2.5 px-3 font-mono text-right">
                            {fmtAmt(r.totalAccountedAmount)}
                          </td>
                        )}
                        {col("narration") && (
                          <td className="py-2.5 px-3 max-w-[220px] truncate" title={r.narration}>
                            {r.narration}
                          </td>
                        )}
                        {col("copyEntry") && (
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => openCopy(r)}
                              className="inline-flex items-center gap-1 text-blue-600 font-semibold"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </button>
                          </td>
                        )}
                        {col("edit") && (
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="inline-flex items-center gap-1 text-blue-600 font-semibold"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                          </td>
                        )}
                        {col("cancel") && (
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => cancelRow(r)}
                              className="inline-flex items-center gap-1 text-blue-600 font-semibold"
                            >
                              <Ban className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paged.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    compact
                    title="No debit vouchers yet"
                    description="Create a debit voucher to start this list."
                    actionLabel="Add New"
                    onAction={openNew}
                  />
                </div>
              ) : (
                paged.map((r) => (
                  <div key={r.voucherNumber} className="border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="font-mono font-bold text-blue-700">{r.voucherNumber}</div>
                    <div className="font-medium">{r.payTo}</div>
                    <div className="text-slate-500">
                      {r.voucherDate} · {r.branch}
                    </div>
                    <div className="font-mono font-semibold">{fmtAmt(r.totalAccountedAmount)}</div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => openCopy(r)} className="text-blue-600 font-semibold">
                        Copy
                      </button>
                      <button type="button" onClick={() => openEdit(r)} className="text-blue-600 font-semibold">
                        Edit
                      </button>
                      <button type="button" onClick={() => cancelRow(r)} className="text-blue-600 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Showing {fromEntry} to {toEntry} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "form" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("report")}
              className="h-9 w-9 rounded-lg border border-slate-200 inline-flex items-center justify-center hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <FileText className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Debit Voucher</h1>
              <p className="text-xs text-slate-500">
                Payment voucher with GST % &amp; TDS
                {formMode !== "new" ? ` · ${formMode}` : ""}
              </p>
            </div>
          </div>

          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-blue-700">Voucher Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Predicted Voucher No.</label>
                <input
                  value={form.predictedVoucherNo}
                  onChange={(e) => setField("predictedVoucherNo", e.target.value.toUpperCase())}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Voucher Date</label>
                <input
                  type="date"
                  value={form.voucherDate}
                  onChange={(e) => setFieldClear("voucherDate", e.target.value)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Locations <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.location}
                  onChange={(e) => {
                    const loc = e.target.value;
                    setFieldClear("location", loc);
                    if (loc && formMode === "new") {
                      fetch(`/api/finance/debit-voucher?lists=1&branch=${encodeURIComponent(loc)}`)
                        .then((r) => r.json())
                        .then((d) => {
                          if (d.data?.predictedVoucherNo) {
                            setField("predictedVoucherNo", d.data.predictedVoucherNo);
                            setLists((prev) => ({
                              ...prev,
                              predictedVoucherNo: d.data.predictedVoucherNo
                            }));
                          }
                        })
                        .catch(() => {});
                    }
                  }}
                  className={`${fieldCls} ${fieldErrors.location ? fieldErrCls : ""}`}
                  aria-invalid={!!fieldErrors.location}
                >
                  <option value="">---Select---</option>
                  {lists.locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                {fieldErrors.location ? (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.location}</p>
                ) : null}
              </div>
              <div>
                <label className={labelCls}>Projects Name</label>
                <select
                  value={form.projectName}
                  onChange={(e) => setField("projectName", e.target.value)}
                  className={fieldCls}
                >
                  <option value="">--Select--</option>
                  {lists.projects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Document No</label>
                <input
                  value={form.documentNo}
                  onChange={(e) => setField("documentNo", e.target.value.toUpperCase())}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Document Date</label>
                <input
                  type="date"
                  value={form.documentDate}
                  onChange={(e) => setFieldClear("documentDate", e.target.value)}
                  className={fieldCls}
                />
                <p className="mt-0.5 text-[10px] text-slate-400">Kept same as Voucher Date</p>
              </div>
              <div>
                <label className={labelCls}>
                  Paid To <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paidToSelect}
                  onChange={(e) => applyPaidToMaster(e.target.value)}
                  className={`${fieldCls} ${fieldErrors.paidTo ? fieldErrCls : ""}`}
                  aria-invalid={!!fieldErrors.paidTo}
                >
                  <option value="">-- Select from master --</option>
                  {lists.paidToParties.map((p) => (
                    <option key={`${p.entity}-${p.code || p.label}`} value={p.label}>
                      {p.label} ({p.entity})
                    </option>
                  ))}
                  <option value={PAID_TO_OTHER}>Other (type manually)</option>
                </select>
                {paidToSelect === PAID_TO_OTHER || (!paidToSelect && form.paidTo) ? (
                  <input
                    value={form.paidTo}
                    onChange={(e) => setFieldClear("paidTo", e.target.value)}
                    placeholder="Enter Paid To name"
                    className={`${fieldCls} mt-1.5 ${fieldErrors.paidTo ? fieldErrCls : ""}`}
                  />
                ) : null}
                {paidToSelect && paidToSelect !== PAID_TO_OTHER ? (
                  <p className="mt-1 text-[11px] text-slate-500 font-semibold">{form.paidTo}</p>
                ) : null}
                {fieldErrors.paidTo ? (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.paidTo}</p>
                ) : null}
              </div>
              <div>
                <label className={labelCls}>Party Code</label>
                <input
                  value={form.partyCode}
                  onChange={(e) => setField("partyCode", e.target.value.toUpperCase())}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Entity</label>
                <div className="flex gap-1.5">
                  {(["Vendor", "Customer", "Staff"] as const).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setField("entityType", form.entityType === e ? "" : e)}
                      className={`h-9 px-3 rounded-full text-[11px] font-semibold border ${
                        form.entityType === e
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200"
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
                  value={form.gstNo}
                  onChange={(e) => setField("gstNo", e.target.value.toUpperCase())}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>PAN NO</label>
                <input
                  value={form.panNo}
                  onChange={(e) => setField("panNo", e.target.value.toUpperCase())}
                  className={fieldCls}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelCls}>Narration</label>
                <input
                  value={form.narration}
                  onChange={(e) => setField("narration", e.target.value)}
                  className={fieldCls}
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-blue-700">Account Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>A/C Description</label>
                <input
                  value={form.acDescription}
                  onChange={(e) => setField("acDescription", e.target.value)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Account Code</label>
                <div className="flex gap-2">
                  <input
                    value={form.accountCode}
                    onChange={(e) => setField("accountCode", e.target.value.toUpperCase())}
                    className={fieldCls}
                  />
                  <button
                    type="button"
                    onClick={openAccountBrowse}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold shrink-0"
                  >
                    Browse
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Base Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.baseAmount}
                  onChange={(e) => setFieldClear("baseAmount", Number(e.target.value) || 0)}
                  className={`${fieldCls} ${fieldErrors.baseAmount ? fieldErrCls : ""}`}
                  aria-invalid={!!fieldErrors.baseAmount}
                />
                {fieldErrors.baseAmount ? (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.baseAmount}</p>
                ) : null}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Tax Breakup (GST &amp; Other Levies)
                </h2>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.ratesAdjustable}
                    onChange={(e) => setField("ratesAdjustable", e.target.checked)}
                  />
                  % Rates adjustable
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className={labelCls}>IGST %</label>
                  <input
                    type="number"
                    value={form.igstPct}
                    disabled={!form.ratesAdjustable}
                    onChange={(e) => setField("igstPct", Number(e.target.value) || 0)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>IGST Amount (₹)</label>
                  <input
                    type="number"
                    value={form.ratesAdjustable ? taxSync.igstAmt : form.igstAmt}
                    disabled={form.ratesAdjustable}
                    onChange={(e) => setField("igstAmt", Number(e.target.value) || 0)}
                    className={fieldCls}
                  />
                </div>
                <div className="flex items-end pb-1 text-slate-500 font-semibold">IGST</div>

                <div>
                  <label className={labelCls}>CGST %</label>
                  <input
                    type="number"
                    value={form.cgstPct}
                    disabled={!form.ratesAdjustable}
                    onChange={(e) => setField("cgstPct", Number(e.target.value) || 0)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CGST Amount (₹)</label>
                  <input
                    type="number"
                    value={form.ratesAdjustable ? taxSync.cgstAmt : form.cgstAmt}
                    disabled={form.ratesAdjustable}
                    onChange={(e) => setField("cgstAmt", Number(e.target.value) || 0)}
                    className={fieldCls}
                  />
                </div>
                <div className="flex items-end pb-1 text-slate-500 font-semibold">CGST</div>

                <div>
                  <label className={labelCls}>SGST %</label>
                  <input
                    type="number"
                    value={form.sgstPct}
                    disabled={!form.ratesAdjustable}
                    onChange={(e) => setField("sgstPct", Number(e.target.value) || 0)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>SGST Amount (₹)</label>
                  <input
                    type="number"
                    value={form.ratesAdjustable ? taxSync.sgstAmt : form.sgstAmt}
                    disabled={form.ratesAdjustable}
                    onChange={(e) => setField("sgstAmt", Number(e.target.value) || 0)}
                    className={fieldCls}
                  />
                </div>
                <div className="flex items-end pb-1 text-slate-500 font-semibold">SGST</div>

                <div className="col-span-2">
                  <label className={labelCls}>Municipal Tax (₹)</label>
                  <input
                    type="number"
                    value={form.municipalTax}
                    onChange={(e) => setField("municipalTax", Number(e.target.value) || 0)}
                    className={fieldCls}
                  />
                </div>
                <div className="flex items-end pb-1 text-slate-500 font-semibold">Local Tax</div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Interest &amp; Taxable Summary
              </h2>
              <div>
                <label className={labelCls}>Interest A/C</label>
                <select
                  value={form.interestAccount}
                  onChange={(e) => setField("interestAccount", e.target.value)}
                  className={fieldCls}
                >
                  <option value="">--Select--</option>
                  {lists.interestAccounts.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Interest Amount (₹)</label>
                <input
                  type="number"
                  value={form.interestAmount}
                  onChange={(e) => setField("interestAmount", Number(e.target.value) || 0)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Taxable Amount (₹) (Base + all taxes + interest)</label>
                <input readOnly value={fmtAmt(taxSync.taxable)} className={`${fieldCls} bg-slate-50 font-mono`} />
              </div>
              <p className="text-[10px] text-slate-500">
                GST is calculated on Base Amount. Change % or amount to auto-sync.
              </p>
            </section>
          </div>

          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-blue-700">
              TDS Deduction Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Income Tax Act / TDS Section</label>
                <select
                  value={form.tdsSection}
                  onChange={(e) => setField("tdsSection", e.target.value)}
                  className={fieldCls}
                >
                  <option value="">--Select--</option>
                  {lists.tdsSections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>TDS Rate (%)</label>
                <input
                  type="number"
                  value={form.tdsRate}
                  onChange={(e) => setField("tdsRate", Number(e.target.value) || 0)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>TDS Amount (₹)</label>
                <input readOnly value={fmtAmt(taxSync.tdsAmount)} className={`${fieldCls} bg-slate-50 font-mono`} />
              </div>
              <div>
                <label className={labelCls}>Net Payable (₹)</label>
                <input
                  readOnly
                  value={fmtAmt(taxSync.netPayable)}
                  className={`${fieldCls} bg-emerald-50 font-mono font-bold text-emerald-700`}
                />
              </div>
            </div>
            <p className="text-xs text-slate-600">
              <span className="font-semibold">Amount in words:</span> {amountInWords(taxSync.netPayable)}
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-blue-700">Payment Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Mode Of Transaction</label>
                <select
                  value={form.modeOfTransaction}
                  onChange={(e) => setField("modeOfTransaction", e.target.value)}
                  className={fieldCls}
                >
                  {lists.modes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Cash / Bank Account</label>
                <select
                  value={form.cashBankAccount}
                  onChange={(e) => setField("cashBankAccount", e.target.value)}
                  className={fieldCls}
                >
                  <option value="">--Select--</option>
                  {lists.cashBankAccounts.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Cheque No</label>
                <input
                  value={form.chequeNo}
                  onChange={(e) => setField("chequeNo", e.target.value)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Cheque Date</label>
                <input
                  type="date"
                  value={form.chequeDate}
                  onChange={(e) => setField("chequeDate", e.target.value)}
                  className={fieldCls}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Available Balance: <span className="font-mono font-semibold">₹ 0.00</span>
            </p>
          </section>

          <div className="flex flex-col items-center gap-2 pb-4">
            {!formValid ? (
              <p className="text-[11px] text-slate-500">
                Fill Location, Paid To, and Base Amount to enable submit
              </p>
            ) : null}
            <WcvSubmitButton disabled={!formValid} loading={saving} onClick={() => void submitVoucher()}>
              Submit Voucher
            </WcvSubmitButton>
          </div>
        </div>
      )}

      {accountBrowseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-sm border border-slate-300 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-200 bg-slate-100 text-[12px] font-semibold text-slate-700 flex items-center justify-between">
              <span>{accountBrowseStep === "groups" ? "Select the Groups" : "Select Account"}</span>
              <button
                type="button"
                onClick={() => setAccountBrowseOpen(false)}
                className="w-7 h-7 hover:bg-slate-200 text-slate-500"
              >
                ×
              </button>
            </div>

            {accountBrowseStep === "groups" ? (
              <div className="p-4 space-y-3">
                <div className="space-y-2 text-[13px] text-slate-800">
                  {ACCOUNT_GROUPS.map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(g) || (g !== "ALL" && selectedGroups.includes("ALL"))}
                        onChange={() => toggleGroup(g)}
                        className="accent-[#0171d3]"
                      />
                      <span className="font-medium">{g}</span>
                    </label>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAccountBrowseStep("list")}
                    className="min-w-[100px] h-8 px-4 rounded-full bg-[#0171d3] text-white text-xs font-semibold hover:bg-[#015fae]"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto text-xs">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAccountBrowseStep("groups")}
                    className="text-[#0171d3] font-semibold"
                  >
                    ← Groups
                  </button>
                  <span className="text-slate-500">
                    {selectedGroups.includes("ALL") ? "ALL" : selectedGroups.join(", ")}
                  </span>
                </div>
                {filteredAccounts.length === 0 ? (
                  <p className="py-8 text-center text-slate-400">No accounts in selected groups</p>
                ) : (
                  filteredAccounts.map((a) => (
                    <button
                      key={a.code}
                      type="button"
                      onClick={() => {
                        setField("accountCode", a.code);
                        setField("acDescription", a.name);
                        setAccountBrowseOpen(false);
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
            )}
          </div>
        </div>
      )}

      {successModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 px-6 py-7 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Voucher Generated</h2>
            <p className="text-sm text-slate-600 mt-1">Debit Voucher has been generated successfully.</p>
            <p className="mt-4 text-sm text-slate-700">
              Voucher No.:{" "}
              <span
                className="font-mono font-bold text-[#0171d3] select-all cursor-text"
                title="Select and copy"
              >
                {successModal.voucherNumber}
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Select the voucher no. to copy into Excel</p>
            <p className="mt-5 text-sm font-medium text-slate-800">Do you want to pass the copy entry now?</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const row = successModal.row;
                  setSuccessModal(null);
                  openCopy(row);
                }}
                className="min-w-[88px] h-9 px-4 rounded-md bg-[#0171d3] text-white text-sm font-semibold hover:bg-[#015fae]"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessModal(null);
                  setStep("report");
                }}
                className="min-w-[88px] h-9 px-4 rounded-md bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
