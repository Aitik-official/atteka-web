import { connectToDatabase } from "@/lib/mongodb";
import { FinanceVoucher, FinanceVoucherKind } from "@/models/FinanceVoucher";
import { Vendor } from "@/models/Vendor";
import { LedgerEntry } from "@/models/LedgerEntry";
import { businessLineConfig } from "@/lib/businessLines";

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
  locations: ["ALC1", "ALC2", "ARC1", "ARC2", "PUNE", "NASHIK"],
  projects: ["General", "Fleet Ops", "Branch Capex"],
  interestAccounts: ["Interest Expense", "Bank Charges", "Other Interest"],
  tdsSections: ["194C", "194H", "194I", "194J", "194Q"],
  cashBankAccounts: [
    "CASH - Cash on Hand",
    "HDFC - HDFC Bank Operating A/c",
    "INDUSIND - INDUSIND BANK ATEKA",
    "DCB - DCB BANK ATEKA"
  ],
  modes: ["Cash", "Cheque", "NEFT", "RTGS", "UPI", "DD"],
  viewTypes: ["Journal", "Debit", "Credit", "Contra", "Bank Payment", "Vendor Invoice", "Vendor Payment"],
  accountGroups: ["ALL", "ASSET", "EXPENSES", "INCOME", "LIABILITIES"] as const,
  accounts: [
    { code: "CASH", name: "Cash on Hand", group: "ASSET" },
    { code: "HDFC", name: "HDFC Bank Operating A/c", group: "ASSET" },
    { code: "INDUSIND", name: "INDUSIND BANK ATEKA", group: "ASSET" },
    { code: "DCB", name: "DCB BANK ATEKA", group: "ASSET" },
    { code: "PARTY02", name: "Sundry Debtors Control", group: "ASSET" },
    { code: "GSTIN", name: "GST Input Tax Credit", group: "ASSET" },
    { code: "EXP100", name: "Freight Expense", group: "EXPENSES" },
    { code: "EXP200", name: "Toll & Parking", group: "EXPENSES" },
    { code: "EXP300", name: "Office Expense", group: "EXPENSES" },
    { code: "EXP400", name: "Diesel / Fuel Expense", group: "EXPENSES" },
    { code: "EXP500", name: "Driver / Staff Expense", group: "EXPENSES" },
    { code: "EXP600", name: "Repair & Maintenance", group: "EXPENSES" },
    { code: "INC100", name: "Freight Income", group: "INCOME" },
    { code: "INC200", name: "Other Income", group: "INCOME" },
    { code: "PARTY01", name: "Sundry Creditors Control", group: "LIABILITIES" },
    { code: "TDS001", name: "TDS Payable", group: "LIABILITIES" },
    { code: "GSTOUT", name: "GST Output Tax Payable", group: "LIABILITIES" }
  ]
};

/** Debit voucher no: DV + ALC126/ARC126 + sequence (e.g. DVARC12603080) */
export function nextDebitVoucherNumber(branch?: string | null) {
  const series = businessLineConfig(branch).docketPrefix; // ALC126 | ARC126
  const seq = Date.now().toString().slice(-5);
  return `DV${series}${seq}`.toUpperCase();
}

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
        ? "DVALC126"
        : kind === "CREDIT"
          ? "CRALC126"
          : kind === "JOURNAL"
            ? "JVALC126"
            : kind === "CONTRA"
              ? "CNALC126"
              : kind === "VENDOR_INVOICE"
                ? "VIALC126"
                : "VPALC126";
    const voucherNumber = `${prefix}${String(26082000 + i).slice(-5)}`;
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
          entryBy: "AL002",
          modeOfTransaction:
            kind === "CREDIT" || (kind === "DEBIT" && i % 4 !== 1) ? "Cash" : "NEFT",
          cashBankAccount:
            kind === "CREDIT" || (kind === "DEBIT" && i % 4 !== 1)
              ? "CASH - Cash on Hand"
              : "HDFC - HDFC Bank Operating A/c"
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
  modeOfTransaction?: string;
  cashBankAccount?: string;
}) {
  const amt = Number(opts.amount || 0);
  if (amt <= 0) return;
  // Only cash-moving voucher kinds hit Cash & Bank statement
  if (!["DEBIT", "CREDIT", "VENDOR_PAYMENT", "CONTRA"].includes(opts.kind)) return;

  const { resolveCashBankCode, cashBankAccountMeta, COA } = await import("@/lib/booksEngine");
  const mode = String(opts.modeOfTransaction || "").toUpperCase();
  const rawAcct = String(opts.cashBankAccount || "").trim();
  const isCash =
    mode === "CASH" ||
    (/CASH|PETTY/i.test(rawAcct) && !/(HDFC|INDUSIND|DCB|INDB)/i.test(rawAcct));
  const bankCode = isCash
    ? COA.CASH.code
    : resolveCashBankCode(rawAcct || (mode && mode !== "CASH" ? mode : "HDFC"));
  const bank = cashBankAccountMeta(bankCode);

  const entryNumber = `JRN-${opts.voucherNumber}`;
  const date = new Date();
  const isInflow = opts.kind === "CREDIT";
  const lines = [
    {
      entryNumber,
      entryDate: date,
      referenceType: "JOURNAL" as const,
      referenceId: opts.voucherNumber,
      accountCode: isInflow ? "DEBTORS" : "EXP100",
      accountName: isInflow ? `Debtors - ${opts.party}` : `Expense - ${opts.party}`,
      accountGroup: isInflow ? "Current Assets" : "Direct Expenses",
      debit: isInflow ? 0 : amt,
      credit: isInflow ? amt : 0,
      narration: opts.narration,
      branchCode: opts.branch || "ALC1",
      financialYear: "2026-2027"
    },
    {
      entryNumber,
      entryDate: date,
      referenceType: "JOURNAL" as const,
      referenceId: opts.voucherNumber,
      accountCode: bank.code,
      accountName: bank.name,
      accountGroup: bank.group,
      debit: isInflow ? amt : 0,
      credit: isInflow ? 0 : amt,
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
        return { code, name, label: code ? `${code} - ${name}` : name, entity: "Vendor" as const };
      });
    }
  } catch {
    /* fallback */
  }
  return [
    { code: "VND0001", name: "ATLAS SPARES TRADING", label: "VND0001 - ATLAS SPARES TRADING", entity: "Vendor" as const },
    { code: "VND0002", name: "METRO TYRE SUPPLIES", label: "VND0002 - METRO TYRE SUPPLIES", entity: "Vendor" as const },
    { code: "VND0003", name: "COASTAL FUEL AGENCY", label: "VND0003 - COASTAL FUEL AGENCY", entity: "Vendor" as const },
    { code: "VND0004", name: "GATEWAY WORKSHOP SERVICES", label: "VND0004 - GATEWAY WORKSHOP SERVICES", entity: "Vendor" as const }
  ];
}

export async function listPaidToMaster() {
  const vendors = await listVendorsForVouchers();
  const parties: { code: string; name: string; label: string; entity: "Vendor" | "Customer" | "Staff" }[] =
    vendors.map((v) => ({ ...v, entity: "Vendor" as const }));

  try {
    const { Customer } = await import("@/models/Customer");
    await connectToDatabase();
    const customers = await Customer.find().sort({ customerCode: 1 }).limit(80).lean();
    for (const c of customers as any[]) {
      const code = String(c.customerCode || c.code || "").trim();
      const name = String(c.customerName || c.name || "Customer").trim();
      if (!name) continue;
      parties.push({
        code,
        name,
        label: code ? `${code} - ${name}` : name,
        entity: "Customer"
      });
    }
  } catch {
    /* optional */
  }

  // Staff master (static replica list)
  const staff = [
    { code: "STF001", name: "ANISHA OZARKAR", label: "STF001 - ANISHA OZARKAR", entity: "Staff" as const },
    { code: "STF002", name: "AL002 ADMINISTRATOR", label: "STF002 - AL002 ADMINISTRATOR", entity: "Staff" as const },
    { code: "STF003", name: "VIJAY MORE", label: "STF003 - VIJAY MORE", entity: "Staff" as const }
  ];
  parties.push(...staff);
  return parties;
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
  const branchHint = input.branch || "ALC1";
  const lineSeries = businessLineConfig(branchHint).docketPrefix; // ALC126 | ARC126
  const prefix =
    input.kind === "DEBIT"
      ? `DV${lineSeries}`
      : input.kind === "CREDIT"
        ? `CR${lineSeries}`
        : input.kind === "JOURNAL"
          ? `JV${lineSeries}`
          : input.kind === "CONTRA"
            ? `CN${lineSeries}`
            : input.kind === "VENDOR_INVOICE"
              ? `VI${lineSeries}`
              : input.kind === "VENDOR_PAYMENT"
                ? `VP${lineSeries}`
                : input.kind === "DEBIT_NOTE"
                  ? `DN${lineSeries}`
                  : `G2B${lineSeries}`;

  let voucherNumber = (input.voucherNumber?.trim() || `${prefix}${Date.now().toString().slice(-5)}`).toUpperCase();
  // Ensure debit vouchers always carry DV before ALC/ARC series
  if (input.kind === "DEBIT" && !voucherNumber.startsWith("DV")) {
    voucherNumber = voucherNumber.startsWith("ALC") || voucherNumber.startsWith("ARC")
      ? `DV${voucherNumber}`
      : nextDebitVoucherNumber(branchHint);
  }

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
    kind: input.kind,
    modeOfTransaction: doc.modeOfTransaction || input.modeOfTransaction || "",
    cashBankAccount: doc.cashBankAccount || input.cashBankAccount || ""
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
