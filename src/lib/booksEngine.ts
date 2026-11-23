import { LedgerEntry } from "@/models/LedgerEntry";
import { connectToDatabase } from "@/lib/mongodb";
import { memoryStore } from "@/lib/memoryStore";

export const COA = {
  CASH: { code: "CASH", name: "Cash on Hand", group: "Current Assets" },
  HDFC: { code: "HDFC", name: "HDFC Bank Operating A/c", group: "Bank Accounts" },
  INDUSIND: { code: "INDUSIND", name: "INDUSIND BANK ATEKA", group: "Bank Accounts" },
  DCB: { code: "DCB", name: "DCB BANK ATEKA", group: "Bank Accounts" },
  DEBTORS: { code: "DEBTORS", name: "Sundry Debtors (Receivables)", group: "Current Assets" },
  CREDITORS: { code: "CREDITORS", name: "Sundry Creditors (Payables)", group: "Current Liabilities" },
  FREIGHT_INC: { code: "FREIGHTINC", name: "Freight Income (Direct)", group: "Direct Revenue" },
  GST_OUTPUT: { code: "GSTOUT", name: "GST Output Tax Payable (18%)", group: "Current Liabilities" },
  GST_INPUT: { code: "GSTIN", name: "GST Input Tax Credit", group: "Current Assets" },
  TDS_REC: { code: "TDSREC", name: "TDS Receivable (Tax Deducted by Customer)", group: "Current Assets" },
  TRIP_EXP: { code: "TRIPEXP", name: "Vehicle & Driver Trip Expense", group: "Direct Expenses" }
};

/** Cash & Bank statement accounts — only real cash/bank ledgers (not debtors/income). */
export const CASH_BANK_ACCOUNTS = [
  { code: COA.CASH.code, name: COA.CASH.name, group: COA.CASH.group, aliases: ["CASH", "CASH001", "PETTY", "CASH-COUNTER"] },
  { code: COA.HDFC.code, name: COA.HDFC.name, group: COA.HDFC.group, aliases: ["HDFC"] },
  { code: COA.INDUSIND.code, name: COA.INDUSIND.name, group: COA.INDUSIND.group, aliases: ["INDUSIND", "INDB", "INDUS"] },
  { code: COA.DCB.code, name: COA.DCB.name, group: COA.DCB.group, aliases: ["DCB", "DCBL"] }
] as const;

export function resolveCashBankCode(raw?: string | null): string {
  const s = String(raw || "").trim().toUpperCase();
  if (!s) return COA.CASH.code;
  // "HDFC - HDFC Bank..." / "CASH - Cash on Hand"
  const head = s.includes(" - ") ? s.split(" - ")[0].trim() : s.split(/\s+/)[0].trim();
  for (const a of CASH_BANK_ACCOUNTS) {
    if (a.code === head) return a.code;
    if (a.aliases.some((al) => s.includes(al) || head === al)) return a.code;
  }
  if (/CASH/i.test(s)) return COA.CASH.code;
  return COA.HDFC.code;
}

export function cashBankAccountMeta(code: string) {
  return (
    CASH_BANK_ACCOUNTS.find((a) => a.code === code) || {
      code: COA.CASH.code,
      name: COA.CASH.name,
      group: COA.CASH.group,
      aliases: ["CASH"] as string[]
    }
  );
}

type LedgerLine = {
  entryNumber: string;
  entryDate: Date;
  referenceType: "CN" | "BILL" | "MR" | "EXPENSE" | "JOURNAL";
  referenceId: string;
  accountCode: string;
  accountName: string;
  accountGroup: string;
  debit: number;
  credit: number;
  narration: string;
  branchCode: string;
  financialYear?: string;
};

async function persistLines(lines: LedgerLine[]) {
  if (!lines.length) return true;
  try {
    await connectToDatabase();
    await LedgerEntry.insertMany(lines, { ordered: false });
    return true;
  } catch (err) {
    console.warn("Ledger Mongo write failed — using memory store", err);
    for (const line of lines) {
      memoryStore.ledgerEntries.push({
        ...line,
        _id: `led-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        entryDate: line.entryDate.toISOString(),
        financialYear: line.financialYear || "2026-2027"
      });
    }
    return true;
  }
}

/** Revenue recognition on Customer Bill (primary spine post). */
export async function postBillLedger(bill: {
  billNumber: string;
  customerName: string;
  totalFreight: number;
  taxAmount: number;
  grandTotal: number;
  branchCode?: string;
}) {
  const entryNum = `JRN-BILL-${bill.billNumber}`;
  const branch = bill.branchCode || "ALC1";
  const date = new Date();
  const freight = Number(bill.totalFreight) || 0;
  const tax = Number(bill.taxAmount) || 0;
  const grand = Number(bill.grandTotal) || freight + tax;

  const lines: LedgerLine[] = [
    {
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "BILL",
      referenceId: bill.billNumber,
      accountCode: COA.DEBTORS.code,
      accountName: `${COA.DEBTORS.name} - ${bill.customerName}`,
      accountGroup: COA.DEBTORS.group,
      debit: grand,
      credit: 0,
      narration: `Bill receivable ${bill.billNumber}`,
      branchCode: branch
    },
    {
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "BILL",
      referenceId: bill.billNumber,
      accountCode: COA.FREIGHT_INC.code,
      accountName: COA.FREIGHT_INC.name,
      accountGroup: COA.FREIGHT_INC.group,
      debit: 0,
      credit: freight,
      narration: `Freight income on bill ${bill.billNumber}`,
      branchCode: branch
    }
  ];

  if (tax > 0) {
    lines.push({
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "BILL",
      referenceId: bill.billNumber,
      accountCode: COA.GST_OUTPUT.code,
      accountName: COA.GST_OUTPUT.name,
      accountGroup: COA.GST_OUTPUT.group,
      debit: 0,
      credit: tax,
      narration: `Output tax on bill ${bill.billNumber}`,
      branchCode: branch
    });
  }

  return persistLines(lines);
}

/** Optional CN booking note — prefer Bill posting for revenue (avoids double count). */
export async function postConsignmentLedger(cn: {
  cnNumber: string;
  consignorName: string;
  totalFreight: number;
  gstAmount: number;
  grandTotal: number;
  branchCode?: string;
}) {
  // Spine policy: revenue hits books on BILL, not on CN book.
  // Keep function for compatibility; no-op unless explicitly forced via env.
  if (process.env.LEDGER_POST_ON_CN !== "true") {
    return true;
  }

  const entryNum = `JRN-CN-${cn.cnNumber}`;
  const branch = cn.branchCode || "ALC1";
  const date = new Date();
  const lines: LedgerLine[] = [
    {
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "CN",
      referenceId: cn.cnNumber,
      accountCode: COA.DEBTORS.code,
      accountName: `${COA.DEBTORS.name} - ${cn.consignorName}`,
      accountGroup: COA.DEBTORS.group,
      debit: cn.grandTotal,
      credit: 0,
      narration: `Freight booking receivable against CN ${cn.cnNumber}`,
      branchCode: branch
    },
    {
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "CN",
      referenceId: cn.cnNumber,
      accountCode: COA.FREIGHT_INC.code,
      accountName: COA.FREIGHT_INC.name,
      accountGroup: COA.FREIGHT_INC.group,
      debit: 0,
      credit: cn.totalFreight,
      narration: `Direct transport revenue from CN ${cn.cnNumber}`,
      branchCode: branch
    }
  ];
  if (cn.gstAmount > 0) {
    lines.push({
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "CN",
      referenceId: cn.cnNumber,
      accountCode: COA.GST_OUTPUT.code,
      accountName: COA.GST_OUTPUT.name,
      accountGroup: COA.GST_OUTPUT.group,
      debit: 0,
      credit: cn.gstAmount,
      narration: `Output tax on CN ${cn.cnNumber}`,
      branchCode: branch
    });
  }
  return persistLines(lines);
}

export async function postMoneyReceiptLedger(mr: {
  mrNumber: string;
  customerName: string;
  amountReceived: number;
  tdsDeduction?: number;
  mode: string;
  branchCode?: string;
  depositedAccount?: string;
  mrDate?: string | Date;
  chequeNo?: string;
}) {
  const entryNum = `JRN-MR-${mr.mrNumber}`;
  const branch = mr.branchCode || "ALC1";
  const date = mr.mrDate ? new Date(mr.mrDate) : new Date();
  const tds = Number(mr.tdsDeduction) || 0;
  const received = Number(mr.amountReceived) || 0;
  const totalCredit = received + tds;
  const mode = String(mr.mode || "").toUpperCase();
  const bankCode =
    mode === "CASH"
      ? COA.CASH.code
      : resolveCashBankCode(mr.depositedAccount || mode);
  const bankMeta = cashBankAccountMeta(bankCode);
  const bankOrCash = {
    code: bankMeta.code,
    name: bankMeta.name,
    group: bankMeta.group
  };

  const lines: LedgerLine[] = [
    {
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "MR",
      referenceId: mr.mrNumber,
      accountCode: bankOrCash.code,
      accountName: bankOrCash.name,
      accountGroup: bankOrCash.group,
      debit: received,
      credit: 0,
      narration: `MR ${mr.mrNumber} · ${mr.customerName} · ${mode}${mr.chequeNo ? ` · Chq ${mr.chequeNo}` : ""}`,
      branchCode: branch
    }
  ];

  if (tds > 0) {
    lines.push({
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "MR",
      referenceId: mr.mrNumber,
      accountCode: COA.TDS_REC.code,
      accountName: COA.TDS_REC.name,
      accountGroup: COA.TDS_REC.group,
      debit: tds,
      credit: 0,
      narration: `TDS on MR ${mr.mrNumber}`,
      branchCode: branch
    });
  }

  lines.push({
    entryNumber: entryNum,
    entryDate: date,
    referenceType: "MR",
    referenceId: mr.mrNumber,
    accountCode: COA.DEBTORS.code,
    accountName: `${COA.DEBTORS.name} - ${mr.customerName}`,
    accountGroup: COA.DEBTORS.group,
    debit: 0,
    credit: totalCredit,
    narration: `Settlement on MR ${mr.mrNumber}`,
    branchCode: branch
  });

  return persistLines(lines);
}

export type TrialBalanceAccount = {
  group: string;
  subGroup: string;
  code: string;
  name: string;
  od: number;
  oc: number;
  cd: number;
  cc: number;
};

function groupLabel(accountGroup: string) {
  const g = (accountGroup || "").toLowerCase();
  if (g.includes("liabilit")) return "LIABILITIES";
  if (g.includes("expense") || g.includes("expense")) return "EXPENSE";
  if (g.includes("revenue") || g.includes("income")) return "INCOME";
  return "ASSETS";
}

/** Aggregate LedgerEntry (+ memory) into trial-balance account rows. */
export async function buildTrialBalanceFromLedger(opts?: {
  from?: string | null;
  to?: string | null;
  branch?: string;
}): Promise<{ accounts: TrialBalanceAccount[]; source: "ledger" | "empty"; count: number }> {
  const branch = (opts?.branch || "").trim().toUpperCase();
  const from = opts?.from ? new Date(opts.from) : null;
  const to = opts?.to ? new Date(opts.to) : null;
  if (to) to.setHours(23, 59, 59, 999);

  let rows: any[] = [];
  try {
    await connectToDatabase();
    const q: any = {};
    if (branch) q.branchCode = branch;
    if (from || to) {
      q.entryDate = {};
      if (from) q.entryDate.$gte = from;
      if (to) q.entryDate.$lte = to;
    }
    rows = await LedgerEntry.find(q).lean();
  } catch {
    rows = [];
  }

  const mem = memoryStore.ledgerEntries.filter((e) => {
    if (branch && String(e.branchCode || "").toUpperCase() !== branch) return false;
    const d = new Date(e.entryDate || Date.now());
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const all = [...rows, ...mem];
  if (!all.length) {
    return { accounts: [], source: "empty", count: 0 };
  }

  const map = new Map<string, TrialBalanceAccount>();
  for (const e of all) {
    const code = String(e.accountCode || "MISC");
    const name = String(e.accountName || code);
    const accountGroup = String(e.accountGroup || "Current Assets");
    const key = code;
    const existing = map.get(key) || {
      group: groupLabel(accountGroup),
      subGroup: accountGroup.toUpperCase(),
      code,
      name,
      od: 0,
      oc: 0,
      cd: 0,
      cc: 0
    };
    existing.cd += Number(e.debit) || 0;
    existing.cc += Number(e.credit) || 0;
    map.set(key, existing);
  }

  const accounts = Array.from(map.values()).map((a) => ({
    ...a,
    cd: Number(a.cd.toFixed(2)),
    cc: Number(a.cc.toFixed(2))
  }));

  return { accounts, source: "ledger", count: all.length };
}

function toIsoDate(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

async function loadLedgerRows(opts?: {
  from?: string | null;
  to?: string | null;
  branch?: string;
  accountCode?: string;
  accountCodes?: string[];
  nameContains?: string;
  beforeFromOnly?: boolean;
}) {
  const branch = (opts?.branch || "").trim().toUpperCase();
  const from = opts?.from ? new Date(opts.from) : null;
  const to = opts?.to ? new Date(opts.to) : null;
  if (to) to.setHours(23, 59, 59, 999);

  let rows: any[] = [];
  try {
    await connectToDatabase();
    const q: any = {};
    if (branch) q.branchCode = branch;
    if (opts?.accountCode) q.accountCode = opts.accountCode;
    if (opts?.accountCodes?.length) q.accountCode = { $in: opts.accountCodes };
    if (opts?.nameContains) {
      q.accountName = { $regex: opts.nameContains, $options: "i" };
    }
    if (opts?.beforeFromOnly && from) {
      q.entryDate = { $lt: from };
    } else if (from || to) {
      q.entryDate = {};
      if (from) q.entryDate.$gte = from;
      if (to) q.entryDate.$lte = to;
    }
    rows = await LedgerEntry.find(q).sort({ entryDate: 1 }).lean();
  } catch {
    rows = [];
  }

  const mem = memoryStore.ledgerEntries.filter((e) => {
    if (branch && String(e.branchCode || "").toUpperCase() !== branch) return false;
    if (opts?.accountCode && String(e.accountCode) !== opts.accountCode) return false;
    if (opts?.accountCodes?.length && !opts.accountCodes.includes(String(e.accountCode))) return false;
    if (opts?.nameContains) {
      const n = String(e.accountName || "").toLowerCase();
      if (!n.includes(opts.nameContains.toLowerCase())) return false;
    }
    const d = new Date(e.entryDate || Date.now());
    if (opts?.beforeFromOnly && from) return d < from;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  return [...rows, ...mem].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );
}

export async function listLedgerAccounts() {
  const rows = await loadLedgerRows({});
  const map = new Map<string, { code: string; label: string; name: string; group: string }>();
  for (const a of Object.values(COA)) {
    map.set(a.code, { code: a.code, label: `${a.code} - ${a.name}`, name: a.name, group: a.group });
  }
  for (const e of rows) {
    const code = String(e.accountCode || "MISC");
    const name = String(e.accountName || code);
    if (!map.has(code)) {
      map.set(code, {
        code,
        label: `${code} - ${name}`,
        name,
        group: String(e.accountGroup || "")
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export async function buildGeneralLedger(opts: {
  from?: string;
  to?: string;
  branch?: string;
  accountCode: string;
}) {
  const openingRows = await loadLedgerRows({
    branch: opts.branch,
    accountCode: opts.accountCode,
    beforeFromOnly: true,
    from: opts.from
  });
  const periodRows = await loadLedgerRows({
    from: opts.from,
    to: opts.to,
    branch: opts.branch,
    accountCode: opts.accountCode
  });
  const openingDebit = openingRows.reduce((s, e) => s + Number(e.debit || 0), 0);
  const openingCredit = openingRows.reduce((s, e) => s + Number(e.credit || 0), 0);
  const txns = periodRows.map((e) => ({
    branch: String(e.branchCode || "ALC1"),
    date: (() => {
      const iso = toIsoDate(e.entryDate);
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    })(),
    particular: String(e.narration || e.accountName || ""),
    debit: Number(e.debit || 0),
    credit: Number(e.credit || 0),
    voucherRef: String(e.entryNumber || ""),
    docRef: String(e.referenceId || ""),
    narration: String(e.narration || ""),
    payto: "",
    expenseBranch: String(e.branchCode || "ALC1")
  }));
  return {
    openingDebit: Number(openingDebit.toFixed(2)),
    openingCredit: Number(openingCredit.toFixed(2)),
    txns,
    source: periodRows.length || openingRows.length ? ("db" as const) : ("empty" as const)
  };
}

export async function buildCustomerLedger(opts: {
  from?: string;
  to?: string;
  customerCode?: string;
  customerName?: string;
}) {
  const q = String(opts.customerCode || opts.customerName || "").trim();
  const openingRows = await loadLedgerRows({
    beforeFromOnly: true,
    from: opts.from,
    nameContains: q || undefined,
    accountCode: q ? undefined : COA.DEBTORS.code
  });
  const periodRows = await loadLedgerRows({
    from: opts.from,
    to: opts.to,
    nameContains: q || undefined,
    accountCode: q ? undefined : COA.DEBTORS.code
  }).then((rows) =>
    rows.filter(
      (e) =>
        String(e.accountCode) === COA.DEBTORS.code ||
        String(e.accountName || "").toLowerCase().includes("debtor") ||
        (q && String(e.accountName || "").toLowerCase().includes(q.toLowerCase()))
    )
  );

  let opening = 0;
  for (const e of openingRows.filter(
    (r) =>
      String(r.accountCode) === COA.DEBTORS.code ||
      String(r.accountName || "").toLowerCase().includes("debtor") ||
      (q && String(r.accountName || "").toLowerCase().includes(q.toLowerCase()))
  )) {
    opening += Number(e.debit || 0) - Number(e.credit || 0);
  }

  let bal = opening;
  const txns = periodRows.map((e) => {
    const debit = Number(e.debit || 0);
    const credit = Number(e.credit || 0);
    bal += debit - credit;
    return {
      date: (() => {
        const iso = toIsoDate(e.entryDate);
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      })(),
      particular: String(e.narration || e.accountName || ""),
      voucherType: String(e.referenceType || "JOURNAL"),
      voucherRef: String(e.entryNumber || ""),
      docRef: String(e.referenceId || ""),
      narration: String(e.narration || ""),
      debit,
      credit,
      balance: Number(bal.toFixed(2))
    };
  });

  return {
    opening: Number(opening.toFixed(2)),
    txns,
    source: txns.length || opening ? ("db" as const) : ("empty" as const)
  };
}

type CbsTxn = {
  date: string;
  particulars: string;
  voucherNo: string;
  documentNo: string;
  chequeNo: string;
  debit: number;
  credit: number;
  balance?: number;
  key: string;
};

function inDateRange(d: Date | string | null | undefined, from?: string, to?: string, beforeFromOnly?: boolean) {
  if (!d) return false;
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return false;
  const iso = toIsoDate(dt);
  if (beforeFromOnly && from) return iso < from;
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

function accountAliases(code: string) {
  const meta = cashBankAccountMeta(code);
  return new Set([code, ...(meta.aliases || [])].map((x) => String(x).toUpperCase()));
}

const BANK_PAYMENT_MODES = new Set([
  "DD",
  "CHEQUE",
  "NEFT",
  "RTGS",
  "ONLINE",
  "BANK",
  "TRANSFER",
  "UPI",
  "IMPS",
  "CARD"
]);

function isCashMode(mode: string, acct: string) {
  const m = mode.toUpperCase();
  const a = acct.toUpperCase();
  if (BANK_PAYMENT_MODES.has(m) || /(HDFC|INDUSIND|DCB|INDB)/.test(a)) return false;
  return m === "CASH" || /CASH|PETTY/.test(`${a} ${m}`);
}

function matchesCashBankAccount(code: string, rawAccount?: string | null, mode?: string | null) {
  const aliases = accountAliases(code);
  const acct = String(rawAccount || "").toUpperCase().trim();
  const m = String(mode || "").toUpperCase().trim();
  const hay = `${acct} ${m}`.trim();

  if (code === COA.CASH.code) {
    return isCashMode(m, acct);
  }

  // Named bank account on deposit / voucher (HDFC / INDUSIND / DCB labels)
  for (const a of aliases) {
    if (a && a !== "CASH" && acct.includes(a)) return true;
  }

  // Bank instruments / transfer modes → named bank if present, else HDFC operating a/c
  if (BANK_PAYMENT_MODES.has(m) || /BANK/.test(acct)) {
    if (/(INDUSIND|INDB)/.test(acct)) return code === COA.INDUSIND.code;
    if (/DCB|DCBL/.test(acct)) return code === COA.DCB.code;
    if (/HDFC/.test(acct)) return code === COA.HDFC.code;
    // No bank named on the voucher → default operating bank book
    if (!acct) return code === COA.HDFC.code;
  }
  return false;
}

/** Resolve which cash/bank book a finance voucher belongs to */
function resolveVoucherCashBank(v: any): { mode: string; acct: string } {
  const payload = v.payload || {};
  let mode = String(v.modeOfTransaction || payload.modeOfTransaction || "").toUpperCase().trim();
  let acct = String(v.cashBankAccount || payload.cashBankAccount || "").trim();
  const kind = String(v.voucherKind || "").toUpperCase();
  const vType = String(v.voucherType || payload.voucherType || "");

  if (!mode && /cash/i.test(vType)) mode = "CASH";
  if (!mode && /bank|neft|rtgs|cheque|transfer|upi/i.test(vType)) mode = "BANK";

  if (!acct && !mode) {
    // Debit / Credit / Vendor Payment / Contra without account → sensible defaults
    if (kind === "CREDIT" || kind === "DEBIT") {
      mode = "CASH";
      acct = "CASH";
    } else if (kind === "VENDOR_PAYMENT" || kind === "CONTRA") {
      mode = "BANK";
      acct = "HDFC";
    }
  } else if (!acct) {
    acct = isCashMode(mode, "") ? "CASH" : "HDFC";
  } else if (!mode) {
    mode = isCashMode("", acct) ? "CASH" : "BANK";
  }
  return { mode, acct };
}

function voucherKindLabel(kind: string) {
  switch (String(kind || "").toUpperCase()) {
    case "DEBIT":
      return "Debit Voucher";
    case "CREDIT":
      return "Credit Voucher";
    case "VENDOR_PAYMENT":
      return "Vendor Payment";
    case "CONTRA":
      return "Contra";
    default:
      return String(kind || "Voucher").replace(/_/g, " ");
  }
}

/**
 * Cash & Bank Transaction Statement
 *
 * INCLUDE (actual cash/bank book movements for the selected account):
 *   - Money Receipts deposited to this cash/bank          → Debit (inflow)
 *   - Debit Vouchers paid from this cash/bank              → Credit (outflow)  e.g. DVALC… / DVARC…
 *   - Credit Vouchers received into this cash/bank         → Debit (inflow)
 *   - Vendor Payments from this cash/bank                  → Credit (outflow)
 *   - Contra entries touching this cash/bank               → Credit (outflow side)
 *   - Company Advances (Cash / Bank / Cheque — not fuel)   → Credit (outflow)
 *   - Orphan ledger lines on this cash/bank code           → as posted
 *
 * EXCLUDE:
 *   - Customer Bills / CNs (receivable only — no cash movement)
 *   - Vendor Invoices / GSTR-2B / Journals / Debit Notes (no cash/bank until paid)
 *   - Cancelled / Rejected vouchers
 *   - Fuel / BPCL pump advances (not a cash or bank ledger)
 *   - TDS / Debtors / Income ledger lines
 */
export async function buildCashBankStatement(opts: {
  from?: string;
  to?: string;
  accountCode?: string;
  branch?: string;
}) {
  const accounts = CASH_BANK_ACCOUNTS.map((a) => ({
    code: a.code,
    name: a.name,
    label: `${a.code} - ${a.name}`,
    group: a.group
  }));
  const code = resolveCashBankCode(opts.accountCode || accounts[0]?.code);
  const aliases = [...accountAliases(code)];
  const branch = String(opts.branch || "").trim().toUpperCase();

  type Raw = Omit<CbsTxn, "balance">;
  const openingRaw: Raw[] = [];
  const periodRaw: Raw[] = [];
  /** Document ids already represented by MR / voucher / advance rows — used to skip ledger dupes */
  const coveredDocs = new Set<string>();
  const seenRowKeys = new Set<string>();

  const pushSplit = (row: Raw, before: boolean) => {
    if (row.debit <= 0 && row.credit <= 0) return;
    if (seenRowKeys.has(row.key)) return;
    seenRowKeys.add(row.key);
    (before ? openingRaw : periodRaw).push(row);
  };

  const markCovered = (...ids: Array<string | null | undefined>) => {
    for (const id of ids) {
      const s = String(id || "").trim().toUpperCase();
      if (s) coveredDocs.add(s);
    }
  };

  // 1) Money Receipts → inflow to deposited cash/bank
  try {
    const { MoneyReceipt } = await import("@/models/MoneyReceipt");
    await connectToDatabase();
    const mrs = await MoneyReceipt.find({}).sort({ mrDate: 1 }).limit(800).lean();
    for (const mr of mrs as any[]) {
      const meta = mr.meta || {};
      const payment = meta.payment || {};
      const mode = String(mr.paymentMode || payment.mode || "").toUpperCase();
      const deposited = String(payment.depositedAccount || payment.bankName || "").trim();
      if (!matchesCashBankAccount(code, deposited || (mode === "CASH" ? "CASH" : ""), mode)) continue;

      const mrBranch = String(meta.mrBranch || "").toUpperCase().trim();
      if (branch && mrBranch && mrBranch !== branch && !mrBranch.includes(branch) && !branch.includes(mrBranch)) {
        continue;
      }

      const before = inDateRange(mr.mrDate, opts.from, opts.to, true);
      const inPeriod = inDateRange(mr.mrDate, opts.from, opts.to, false);
      if (!before && !inPeriod) continue;
      const amt = Number(mr.totalReceived || 0);
      if (amt <= 0) continue;

      const mrNo = String(mr.mrNumber || "").trim();
      const bills = (mr.allocatedBills || []).map((b: any) => b.billNumber).filter(Boolean).join(", ");
      markCovered(mrNo, `MR:${mrNo}`, `JRN-MR-${mrNo}`);
      pushSplit(
        {
          date: toIsoDate(mr.mrDate),
          particulars: `Money Receipt · ${mr.customerName || ""} · ${mode || "BANK"}`.trim(),
          voucherNo: mrNo,
          documentNo: bills || mrNo,
          chequeNo: String(mr.referenceNumber || payment.chequeNeftNo || ""),
          debit: amt,
          credit: 0,
          key: `MR:${mrNo}`
        },
        before
      );
    }
  } catch {
    // ignore if MR collection unavailable
  }

  // 2) Finance vouchers that move cash/bank (Debit / Credit / Vendor Payment / Contra)
  try {
    const { FinanceVoucher } = await import("@/models/FinanceVoucher");
    await connectToDatabase();
    const vouchers = await FinanceVoucher.find({
      status: { $nin: ["Cancelled", "CANCELLED", "Rejected"] },
      voucherKind: { $in: ["DEBIT", "CREDIT", "VENDOR_PAYMENT", "CONTRA"] }
    })
      .sort({ voucherDate: 1 })
      .limit(1200)
      .lean();

    for (const v of vouchers as any[]) {
      const vBranch = String(v.branch || "").toUpperCase().trim();
      if (branch && vBranch && vBranch !== branch && !vBranch.includes(branch) && !branch.includes(vBranch)) {
        continue;
      }

      const kind = String(v.voucherKind || "").toUpperCase();
      const { mode, acct } = resolveVoucherCashBank(v);
      if (!matchesCashBankAccount(code, acct, mode)) continue;

      const before = inDateRange(v.voucherDate, opts.from, opts.to, true);
      const inPeriod = inDateRange(v.voucherDate, opts.from, opts.to, false);
      if (!before && !inPeriod) continue;

      const amt = Number(v.netPayable ?? v.amount ?? v.payload?.netPayable ?? v.payload?.baseAmount ?? 0);
      if (amt <= 0) continue;

      // Debit Voucher / Vendor Payment / Contra = money OUT (Credit column)
      // Credit Voucher = money IN (Debit column)
      const isInflow = kind === "CREDIT";
      const isOutflow = kind === "DEBIT" || kind === "VENDOR_PAYMENT" || kind === "CONTRA";
      if (!isInflow && !isOutflow) continue;

      const vNo = String(v.voucherNumber || "").trim();
      const payTo = String(v.payTo || v.party || v.payload?.paidTo || "").trim();
      const acDesc = String(v.payload?.acDescription || v.accounts?.[0]?.name || "").trim();
      const narr = String(v.narration || v.voucherType || "").trim();
      const parts = [voucherKindLabel(kind), payTo, acDesc || narr, mode].filter(Boolean);

      markCovered(vNo, `VCH:${vNo}`, `JRN-${vNo}`);
      pushSplit(
        {
          date: toIsoDate(v.voucherDate),
          particulars: parts.join(" · "),
          voucherNo: vNo,
          documentNo: String(v.documentNo || v.payload?.documentNo || v.invoiceNo || v.refNo || ""),
          chequeNo: String(v.chequeNo || v.payload?.chequeNo || ""),
          debit: isInflow ? amt : 0,
          credit: isOutflow ? amt : 0,
          key: `VCH:${vNo}`
        },
        before
      );
    }
  } catch {
    // ignore
  }

  // 3) Company advance payments from this bank/cash (not fuel pumps)
  try {
    const { CompanyAdvancePayment } = await import("@/models/CompanyAdvancePayment");
    await connectToDatabase();
    const advs = await CompanyAdvancePayment.find({ status: { $ne: "CANCELLED" } })
      .sort({ documentDate: 1 })
      .limit(400)
      .lean();
    for (const a of advs as any[]) {
      if (branch && String(a.branch || "").toUpperCase() !== branch) continue;
      const payMode = String(a.payMode || "").toUpperCase();
      // Fuel / BPCL pump cards are not cash or bank book movements
      if (payMode === "FUEL" || /BPCL|FUEL\s*PUMP/i.test(String(a.remark || ""))) continue;

      const remark = String(a.remark || "");
      let include = false;
      if (payMode === "CASH" || (!payMode && !remark)) {
        include = code === COA.CASH.code;
      } else if (["BANK", "CHEQUE", "NEFT", "RTGS", "ONLINE", "DD"].includes(payMode) || /BANK|CHEQUE|NEFT/i.test(remark)) {
        include = matchesCashBankAccount(code, remark || payMode, payMode || "BANK");
      }
      if (!include) continue;

      const before = inDateRange(a.documentDate, opts.from, opts.to, true);
      const inPeriod = inDateRange(a.documentDate, opts.from, opts.to, false);
      if (!before && !inPeriod) continue;
      const amt = Number(a.amount || 0);
      if (amt <= 0) continue;

      const docNo = String(a.documentNo || "").trim();
      markCovered(docNo, `ADV:${docNo}`);
      pushSplit(
        {
          date: toIsoDate(a.documentDate),
          particulars: `Company Advance · ${a.vehicleNo || ""} · ${a.driverName || ""} · ${payMode || "CASH"}`.trim(),
          voucherNo: docNo,
          documentNo: String(a.tripsheetNo || ""),
          chequeNo: "",
          debit: 0,
          credit: amt,
          key: `ADV:${docNo}`
        },
        before
      );
    }
  } catch {
    // ignore
  }

  // 4) Orphan ledger cash/bank lines (skip BILL/CN and anything already covered by MR/voucher/advance)
  const ledgerAll = await loadLedgerRows({
    branch: branch || undefined,
    accountCodes: aliases
  });
  for (const e of ledgerAll) {
    const refType = String(e.referenceType || "").toUpperCase();
    if (refType === "BILL" || refType === "CN") continue;

    const refId = String(e.referenceId || "").trim().toUpperCase();
    const entryNo = String(e.entryNumber || "").trim().toUpperCase();
    if (
      coveredDocs.has(refId) ||
      coveredDocs.has(entryNo) ||
      coveredDocs.has(`MR:${refId}`) ||
      coveredDocs.has(`VCH:${refId}`) ||
      coveredDocs.has(`ADV:${refId}`) ||
      coveredDocs.has(`JRN-MR-${refId}`) ||
      coveredDocs.has(`JRN-${refId}`)
    ) {
      continue;
    }

    const before = inDateRange(e.entryDate, opts.from, opts.to, true);
    const inPeriod = inDateRange(e.entryDate, opts.from, opts.to, false);
    if (!before && !inPeriod) continue;
    const debit = Number(e.debit || 0);
    const credit = Number(e.credit || 0);
    pushSplit(
      {
        date: toIsoDate(e.entryDate),
        particulars: String(e.narration || e.accountName || ""),
        voucherNo: String(e.entryNumber || ""),
        documentNo: String(e.referenceId || ""),
        chequeNo: "",
        debit,
        credit,
        key: `LED:${entryNo}:${refId}:${debit}:${credit}`
      },
      before
    );
  }

  const openingRows = openingRaw;
  const periodRows = periodRaw.sort(
    (a, b) => a.date.localeCompare(b.date) || a.voucherNo.localeCompare(b.voucherNo)
  );

  let opening = 0;
  for (const e of openingRows) opening += Number(e.debit || 0) - Number(e.credit || 0);

  let bal = opening;
  const txns = periodRows.map((e) => {
    bal += Number(e.debit || 0) - Number(e.credit || 0);
    return {
      date: e.date,
      particulars: e.particulars,
      voucherNo: e.voucherNo,
      documentNo: e.documentNo,
      chequeNo: e.chequeNo,
      debit: Number(e.debit || 0),
      credit: Number(e.credit || 0),
      balance: Number(bal.toFixed(2))
    };
  });

  return {
    accounts,
    accountCode: code,
    opening: Number(opening.toFixed(2)),
    txns,
    closing: Number(bal.toFixed(2)),
    source: txns.length || opening ? ("db" as const) : ("empty" as const)
  };
}

export async function buildBranchProfitLoss(opts: {
  from?: string;
  to?: string;
  branch?: string;
}) {
  const rows = await loadLedgerRows({
    from: opts.from,
    to: opts.to,
    branch: opts.branch
  });

  const lines: {
    category: "INCOME" | "EXPENSE";
    ledgerGroup: string;
    ledger: string;
    amount: number;
  }[] = [];

  const byKey = new Map<string, { category: "INCOME" | "EXPENSE"; ledgerGroup: string; ledger: string; amount: number }>();
  for (const e of rows) {
    const g = String(e.accountGroup || "");
    const label = groupLabel(g);
    if (label !== "INCOME" && label !== "EXPENSE") continue;
    const category = label as "INCOME" | "EXPENSE";
    const debit = Number(e.debit || 0);
    const credit = Number(e.credit || 0);
    const amount = category === "INCOME" ? Math.max(0, credit - debit) : Math.max(0, debit - credit);
    if (amount <= 0) continue;
    const key = `${category}|${g}|${e.accountName}`;
    const existing = byKey.get(key) || {
      category,
      ledgerGroup: g || (category === "INCOME" ? "Operating Income" : "Operating Expenses"),
      ledger: String(e.accountName || e.accountCode || ""),
      amount: 0
    };
    existing.amount += amount;
    byKey.set(key, existing);
  }

  for (const v of byKey.values()) {
    lines.push({ ...v, amount: Number(v.amount.toFixed(2)) });
  }

  const totalIncome = lines.filter((l) => l.category === "INCOME").reduce((s, l) => s + l.amount, 0);
  const totalExpense = lines.filter((l) => l.category === "EXPENSE").reduce((s, l) => s + l.amount, 0);

  return {
    lines,
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpense: Number(totalExpense.toFixed(2)),
    profitLoss: Number((totalIncome - totalExpense).toFixed(2)),
    source: lines.length ? ("db" as const) : ("empty" as const)
  };
}

export async function buildSubsidiaryLedger(opts: {
  from?: string;
  to?: string;
  branch?: string;
  accountHead?: string;
  partyName?: string;
}) {
  const nameQ = String(opts.partyName || opts.accountHead || "").trim();
  const openingRows = await loadLedgerRows({
    branch: opts.branch,
    beforeFromOnly: true,
    from: opts.from,
    nameContains: nameQ && !/^show all$/i.test(nameQ) ? nameQ : undefined
  });
  const periodRows = await loadLedgerRows({
    from: opts.from,
    to: opts.to,
    branch: opts.branch,
    nameContains: nameQ && !/^show all$/i.test(nameQ) ? nameQ : undefined
  });

  const openingDebit = openingRows.reduce((s, e) => s + Number(e.debit || 0), 0);
  const openingCredit = openingRows.reduce((s, e) => s + Number(e.credit || 0), 0);

  const txns = periodRows.map((e) => ({
    branch: String(e.branchCode || "ALC1"),
    date: (() => {
      const iso = toIsoDate(e.entryDate);
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    })(),
    particular: String(e.narration || e.accountName || ""),
    debit: Number(e.debit || 0),
    credit: Number(e.credit || 0),
    voucherRef: String(e.entryNumber || ""),
    docRef: String(e.referenceId || ""),
    narration: String(e.narration || ""),
    chequeNo: "",
    chequeDate: "",
    costCenter: String(e.branchCode || "")
  }));

  return {
    openingDebit: Number(openingDebit.toFixed(2)),
    openingCredit: Number(openingCredit.toFixed(2)),
    txns,
    source: txns.length || openingDebit || openingCredit ? ("db" as const) : ("empty" as const)
  };
}
