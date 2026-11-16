import { connectToDatabase } from "@/lib/mongodb";
import { FinanceVoucher, FinanceVoucherKind } from "@/models/FinanceVoucher";
import { Vendor } from "@/models/Vendor";
import { LedgerEntry } from "@/models/LedgerEntry";

function toIso(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function toLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const VOUCHER_MASTERS = {
  debitTypes: ["Cash Payment", "Bank Payment", "Journal Debit", "Petty Cash"],
  journalTypes: ["Manual Journal", "Adjustment", "Provision", "Rectification"],
  locations: ["ALC1", "ALC2", "PUNE", "NASHIK"],
  projects: ["General", "Fleet Ops", "Branch Capex"],
  interestAccounts: ["Interest Expense", "Bank Charges", "Other Interest"],
  tdsSections: ["194C", "194H", "194I", "194J", "194Q"],
  cashBankAccounts: ["Cash in Hand - ALC1", "HDFC Bank - Ops", "ICICI Bank - Current"],
  modes: ["Cash", "Cheque", "NEFT", "RTGS", "UPI"],
  viewTypes: ["Journal", "Debit", "Credit", "Contra", "Bank Payment", "Vendor Invoice", "Vendor Payment"],
  accounts: [
    { code: "CASH001", name: "Cash in Hand - ALC1", group: "Cash & Bank" },
    { code: "BANK001", name: "HDFC Bank - Ops", group: "Cash & Bank" },
    { code: "BANK002", name: "ICICI Bank - Current", group: "Cash & Bank" },
    { code: "EXP100", name: "Freight Expense", group: "Expenses" },
    { code: "EXP200", name: "Toll & Parking", group: "Expenses" },
    { code: "EXP300", name: "Office Expense", group: "Expenses" },
    { code: "INC100", name: "Freight Income", group: "Income" },
    { code: "PARTY01", name: "Sundry Creditors Control", group: "Liabilities" },
    { code: "PARTY02", name: "Sundry Debtors Control", group: "Assets" },
    { code: "TDS001", name: "TDS Payable", group: "Liabilities" }
  ]
};

async function ensureVoucherSeeds() {
  await connectToDatabase();
  const count = await FinanceVoucher.countDocuments();
  if (count >= 20) return;

  const today = new Date();
  const kinds: FinanceVoucherKind[] = [
    "DEBIT",
    "CREDIT",
    "JOURNAL",
    "CONTRA",
    "VENDOR_INVOICE",
    "VENDOR_PAYMENT"
  ];
  const parties = [
    "NORTHBOUND FUELS",
    "METRO TYRE DEPOT",
    "COASTAL TOLL SERVICES",
    "ATLAS SPARES TRADING",
    "GATEWAY WORKSHOP SERVICES"
  ];

  for (let i = 0; i < 24; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (i % 18) - 1);
    const kind = kinds[i % kinds.length];
    const amount = Number((2450 + (i % 9) * 1875 + (i % 5) * 320.5).toFixed(2));
    const party = parties[i % parties.length];
    const prefix =
      kind === "DEBIT"
        ? "DVALC1"
        : kind === "CREDIT"
          ? "CRALC1"
          : kind === "JOURNAL"
            ? "JVALC1"
            : kind === "CONTRA"
              ? "CNALC1"
              : kind === "VENDOR_INVOICE"
                ? "VIALC1"
                : "VPALC1";
    const voucherNumber = `${prefix}${String(26082000 + i)}`;
    await FinanceVoucher.updateOne(
      { voucherNumber },
      {
        $setOnInsert: {
          voucherNumber,
          voucherKind: kind,
          voucherType:
            kind === "DEBIT"
              ? VOUCHER_MASTERS.debitTypes[i % 4]
              : kind === "JOURNAL"
                ? VOUCHER_MASTERS.journalTypes[i % 4]
                : kind,
          voucherDate: d,
          branch: i % 4 === 0 ? "ALC2" : "ALC1",
          party,
          payTo: party,
          amount,
          taxableAmount: amount,
          netPayable: amount,
          documentNo: `DOC${String(26091000 + i)}`,
          invoiceNo: kind.includes("VENDOR") || kind === "DEBIT_NOTE" ? `INV/ALC1/${String(2607000 + i)}` : "",
          narration: `BEING ${kind} ENTRY FOR ${party}`,
          status: "Active",
          preparedBy: "AL002",
          entryBy: "AL002"
        }
      },
      { upsert: true }
    );
  }
}

function mapListRow(v: any, idx = 0) {
  const iso = toIso(v.voucherDate);
  return {
    id: String(v._id),
    srNo: idx + 1,
    voucherNumber: v.voucherNumber,
    voucherNo: v.voucherNumber,
    voucherDate: toLabel(iso),
    voucherDateIso: iso,
    voucherType: v.voucherType || v.voucherKind,
    voucherKind: v.voucherKind,
    docRefNo: v.documentNo || v.refNo || v.voucherNumber,
    documentNo: v.documentNo || "",
    branch: v.branch || "ALC1",
    location: v.branch || "ALC1",
    payTo: v.payTo || v.party || "",
    party: v.party || v.payTo || "",
    vendor: v.party || "",
    totalAccountedAmount: Number(v.netPayable || v.amount || 0),
    amount: Number(v.amount || 0),
    tds: Number(v.tdsAmount || 0),
    taxableAmount: Number(v.taxableAmount || 0),
    netPayable: Number(v.netPayable || v.amount || 0),
    narration: v.narration || "",
    status: v.status === "Cancelled" ? "Cancelled" : "Active",
    entryBy: v.entryBy || v.preparedBy || "AL002",
    entryDt: toLabel(iso),
    entryDtIso: iso,
    invoiceNo: v.invoiceNo || "",
    invoiceDate: toLabel(iso),
    invoiceDateIso: iso,
    docRefno: v.documentNo || v.refNo || ""
  };
}

async function postSimpleLedger(opts: {
  voucherNumber: string;
  amount: number;
  party: string;
  branch: string;
  narration: string;
  kind: FinanceVoucherKind;
}) {
  const amt = Number(opts.amount || 0);
  if (amt <= 0) return;
  const entryNumber = `JRN-${opts.voucherNumber}`;
  const date = new Date();
  const lines = [
    {
      entryNumber,
      entryDate: date,
      referenceType: "JOURNAL" as const,
      referenceId: opts.voucherNumber,
      accountCode: opts.kind === "CREDIT" ? "PARTY02" : "EXP100",
      accountName: opts.kind === "CREDIT" ? `Debtors - ${opts.party}` : `Expense - ${opts.party}`,
      accountGroup: opts.kind === "CREDIT" ? "Assets" : "Expenses",
      debit: opts.kind === "CREDIT" ? 0 : amt,
      credit: opts.kind === "CREDIT" ? amt : 0,
      narration: opts.narration,
      branchCode: opts.branch || "ALC1",
      financialYear: "2026-2027"
    },
    {
      entryNumber,
      entryDate: date,
      referenceType: "JOURNAL" as const,
      referenceId: opts.voucherNumber,
      accountCode: "CASH001",
      accountName: "Cash in Hand - ALC1",
      accountGroup: "Cash & Bank",
      debit: opts.kind === "CREDIT" ? amt : 0,
      credit: opts.kind === "CREDIT" ? 0 : amt,
      narration: opts.narration,
      branchCode: opts.branch || "ALC1",
      financialYear: "2026-2027"
    }
  ];
  try {
    await LedgerEntry.insertMany(lines, { ordered: false });
  } catch {
    // non-fatal for replica
  }
}

export async function listAccounts() {
  return VOUCHER_MASTERS.accounts;
}

export async function listVendorsForVouchers() {
  await connectToDatabase();
  try {
    const rows = await Vendor.find().sort({ vendorCode: 1 }).limit(80);
    if (rows.length) {
      return rows.map((v: any) => {
        const code = String(v.vendorCode || v.code || "").trim();
        const name = String(v.name || v.vendorName || "Vendor").trim();
        return { code, name, label: code ? `${code} - ${name}` : name };
      });
    }
  } catch {
    /* fallback */
  }
  return [
    { code: "VND0001", name: "ATLAS SPARES TRADING", label: "VND0001 - ATLAS SPARES TRADING" },
    { code: "VND0002", name: "METRO TYRE SUPPLIES", label: "VND0002 - METRO TYRE SUPPLIES" },
    { code: "VND0003", name: "COASTAL FUEL AGENCY", label: "VND0003 - COASTAL FUEL AGENCY" },
    { code: "VND0004", name: "GATEWAY WORKSHOP SERVICES", label: "VND0004 - GATEWAY WORKSHOP SERVICES" }
  ];
}

export async function listVouchers(filters: {
  kinds?: FinanceVoucherKind[];
  from?: string;
  to?: string;
  voucherType?: string;
  voucherNumber?: string;
  documentNumber?: string;
  invoiceNumber?: string;
  vendor?: string;
  includeCancelled?: boolean;
}) {
  await ensureVoucherSeeds();
  const clauses: Record<string, unknown>[] = [];
  if (filters.kinds?.length) clauses.push({ voucherKind: { $in: filters.kinds } });
  if (!filters.includeCancelled) clauses.push({ status: { $ne: "Cancelled" } });

  if (filters.voucherNumber) {
    clauses.push({ voucherNumber: { $regex: filters.voucherNumber, $options: "i" } });
  } else if (filters.documentNumber) {
    clauses.push({
      $or: [
        { documentNo: { $regex: filters.documentNumber, $options: "i" } },
        { refNo: { $regex: filters.documentNumber, $options: "i" } }
      ]
    });
  } else if (filters.invoiceNumber) {
    clauses.push({ invoiceNo: { $regex: filters.invoiceNumber, $options: "i" } });
  } else if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.$gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) range.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    clauses.push({ voucherDate: range });
  }

  if (filters.voucherType && !/^show all$/i.test(filters.voucherType) && filters.voucherType !== "All") {
    clauses.push({
      $or: [
        { voucherType: { $regex: filters.voucherType, $options: "i" } },
        { voucherKind: { $regex: filters.voucherType, $options: "i" } }
      ]
    });
  }
  if (filters.vendor) {
    clauses.push({
      $or: [
        { party: { $regex: filters.vendor, $options: "i" } },
        { payTo: { $regex: filters.vendor, $options: "i" } },
        { partyCode: { $regex: filters.vendor, $options: "i" } }
      ]
    });
  }

  const rows = await FinanceVoucher.find(clauses.length ? { $and: clauses } : {})
    .sort({ voucherDate: -1 })
    .limit(400);
  return rows.map((r, i) => mapListRow(r, i));
}

export async function getVoucherByNumber(voucherNumber: string) {
  await ensureVoucherSeeds();
  const v = await FinanceVoucher.findOne({
    voucherNumber: { $regex: voucherNumber.trim(), $options: "i" }
  });
  if (!v) return null;
  return { ...mapListRow(v), payload: v.payload, lines: v.lines, accounts: v.accounts, gstNo: v.gstNo };
}

export async function createVoucher(input: {
  kind: FinanceVoucherKind;
  voucherNumber?: string;
  voucherType?: string;
  voucherDate?: string;
  branch?: string;
  party?: string;
  partyCode?: string;
  payTo?: string;
  amount?: number;
  taxableAmount?: number;
  tdsAmount?: number;
  igst?: number;
  cgst?: number;
  sgst?: number;
  netPayable?: number;
  documentNo?: string;
  invoiceNo?: string;
  refNo?: string;
  narration?: string;
  modeOfTransaction?: string;
  cashBankAccount?: string;
  chequeNo?: string;
  chequeDate?: string;
  gstNo?: string;
  panNo?: string;
  lines?: any[];
  accounts?: any[];
  status?: string;
  payload?: any;
  preparedBy?: string;
}) {
  await ensureVoucherSeeds();
  const prefix =
    input.kind === "DEBIT"
      ? "DVALC1"
      : input.kind === "CREDIT"
        ? "CRALC1"
        : input.kind === "JOURNAL"
          ? "JVALC1"
          : input.kind === "CONTRA"
            ? "CNALC1"
            : input.kind === "VENDOR_INVOICE"
              ? "VIALC1"
              : input.kind === "VENDOR_PAYMENT"
                ? "VPALC1"
                : input.kind === "DEBIT_NOTE"
                  ? "DNALC1"
                  : "G2BALC1";

  const voucherNumber = (
    input.voucherNumber?.trim() || `${prefix}${Date.now().toString().slice(-8)}`
  ).toUpperCase();

  const amount = Number(input.netPayable ?? input.amount ?? input.taxableAmount ?? 0);
  const party = String(input.payTo || input.party || "").trim() || "GENERAL";

  const doc = await FinanceVoucher.create({
    voucherNumber,
    voucherKind: input.kind,
    voucherType: input.voucherType || input.kind,
    voucherDate: input.voucherDate ? new Date(input.voucherDate) : new Date(),
    branch: input.branch || "ALC1",
    party,
    partyCode: input.partyCode || "",
    payTo: party,
    amount: Number(input.amount ?? amount),
    taxableAmount: Number(input.taxableAmount ?? amount),
    tdsAmount: Number(input.tdsAmount || 0),
    igst: Number(input.igst || 0),
    cgst: Number(input.cgst || 0),
    sgst: Number(input.sgst || 0),
    netPayable: amount,
    documentNo: input.documentNo || "",
    invoiceNo: input.invoiceNo || "",
    refNo: input.refNo || "",
    narration: input.narration || `BEING ${input.kind} FOR ${party}`,
    modeOfTransaction: input.modeOfTransaction || "",
    cashBankAccount: input.cashBankAccount || "",
    chequeNo: input.chequeNo || "",
    chequeDate: input.chequeDate ? new Date(input.chequeDate) : undefined,
    gstNo: input.gstNo || "",
    panNo: input.panNo || "",
    lines: input.lines || [],
    accounts: input.accounts || [],
    payload: input.payload || {},
    status: (input.status as any) || "Active",
    preparedBy: input.preparedBy || "AL002",
    entryBy: input.preparedBy || "AL002"
  });

  await postSimpleLedger({
    voucherNumber: doc.voucherNumber,
    amount,
    party,
    branch: doc.branch,
    narration: doc.narration || "",
    kind: input.kind
  });

  return mapListRow(doc);
}

export async function cancelVoucher(voucherNumber: string, reason?: string) {
  await ensureVoucherSeeds();
  const v = await FinanceVoucher.findOne({
    voucherNumber: { $regex: `^${voucherNumber.trim()}$`, $options: "i" }
  });
  if (!v) throw Object.assign(new Error("Voucher not found"), { status: 404 });
  if (v.status === "Cancelled") {
    return { ...mapListRow(v), message: `${v.voucherNumber} already cancelled` };
  }
  v.status = "Cancelled";
  v.narration = `${v.narration || ""}${reason ? ` | Cancel: ${reason}` : " | Cancelled"}`.trim();
  await v.save();
  return { ...mapListRow(v), message: `${v.voucherNumber} cancelled` };
}

export async function listGstr2bPending() {
  await ensureVoucherSeeds();
  // Pending pool: seed-like synthetic rows that aren't booked yet, plus unbooked GSTR2B docs
  const booked = await FinanceVoucher.find({ voucherKind: "GSTR2B" }).select("invoiceNo documentNo");
  const bookedSet = new Set(
    booked.flatMap((b) => [String(b.invoiceNo || "").toUpperCase(), String(b.documentNo || "").toUpperCase()])
  );

  const vendors = await listVendorsForVouchers();
  const today = new Date();
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (i % 8) - 1);
    const iso = toIso(d);
    const vendor = vendors[i % vendors.length];
    const invoiceNo = `G2B/INV/${String(2608000 + i).padStart(7, "0")}`;
    if (bookedSet.has(invoiceNo)) continue;
    const taxable = Number((5200 + (i % 7) * 950 + (i % 4) * 125.5).toFixed(2));
    const interState = i % 3 === 0;
    const igst = interState ? Number((taxable * 0.18).toFixed(2)) : 0;
    const cgst = interState ? 0 : Number((taxable * 0.09).toFixed(2));
    const sgst = interState ? 0 : Number((taxable * 0.09).toFixed(2));
    const cess = i % 5 === 0 ? Number((taxable * 0.01).toFixed(2)) : 0;
    rows.push({
      id: `GSTR2B-${1001 + i}`,
      invoiceDate: toLabel(iso),
      invoiceDateIso: iso,
      invoiceNo,
      gstin: `27AABC${String(1000 + i)}A1Z${i % 9}`,
      vendorCode: vendor.code,
      vendorName: vendor.name,
      taxableAmount: taxable,
      igst,
      cgst,
      sgst,
      cess,
      invoiceAmount: Number((taxable + igst + cgst + sgst + cess).toFixed(2)),
      accountDesc: ["Purchase - Spares", "Purchase - Tyres", "Fuel Expense", "Repair & Maintenance"][
        i % 4
      ]
    });
  }
  return rows;
}

export async function bookGstr2b(ids: string[]) {
  await ensureVoucherSeeds();
  const pending = await listGstr2bPending();
  const selected = pending.filter((r) => ids.includes(r.id) || ids.includes(r.invoiceNo));
  if (!selected.length) throw Object.assign(new Error("No matching GSTR2B invoices"), { status: 404 });

  const booked = [];
  for (const row of selected) {
    const saved = await createVoucher({
      kind: "GSTR2B",
      voucherType: "GSTR2B Booking",
      voucherDate: row.invoiceDateIso,
      party: `${row.vendorCode} - ${row.vendorName}`,
      partyCode: row.vendorCode,
      amount: row.invoiceAmount,
      taxableAmount: row.taxableAmount,
      igst: row.igst,
      cgst: row.cgst,
      sgst: row.sgst,
      netPayable: row.invoiceAmount,
      invoiceNo: row.invoiceNo,
      documentNo: row.id,
      narration: `GSTR2B booking ${row.invoiceNo}`,
      gstNo: row.gstin,
      status: "Booked",
      payload: row
    });
    booked.push(saved.voucherNumber);
  }
  return {
    count: booked.length,
    bookedIds: selected.map((s) => s.id),
    voucherNumbers: booked,
    message: `${booked.length} GSTR2B invoice(s) booked`
  };
}
