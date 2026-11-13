import { LedgerEntry } from "@/models/LedgerEntry";
import { connectToDatabase } from "@/lib/mongodb";
import { memoryStore } from "@/lib/memoryStore";

export const COA = {
  CASH: { code: "CASH", name: "Cash on Hand", group: "Current Assets" },
  HDFC: { code: "HDFC", name: "HDFC Bank Operating A/c", group: "Bank Accounts" },
  DEBTORS: { code: "DEBTORS", name: "Sundry Debtors (Receivables)", group: "Current Assets" },
  CREDITORS: { code: "CREDITORS", name: "Sundry Creditors (Payables)", group: "Current Liabilities" },
  FREIGHT_INC: { code: "FREIGHTINC", name: "Freight Income (Direct)", group: "Direct Revenue" },
  GST_OUTPUT: { code: "GSTOUT", name: "GST Output Tax Payable (18%)", group: "Current Liabilities" },
  GST_INPUT: { code: "GSTIN", name: "GST Input Tax Credit", group: "Current Assets" },
  TDS_REC: { code: "TDSREC", name: "TDS Receivable (Tax Deducted by Customer)", group: "Current Assets" },
  TRIP_EXP: { code: "TRIPEXP", name: "Vehicle & Driver Trip Expense", group: "Direct Expenses" }
};

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
}) {
  const entryNum = `JRN-MR-${mr.mrNumber}`;
  const branch = mr.branchCode || "ALC1";
  const date = new Date();
  const tds = Number(mr.tdsDeduction) || 0;
  const received = Number(mr.amountReceived) || 0;
  const totalCredit = received + tds;
  const bankOrCash = String(mr.mode || "").toUpperCase() === "CASH" ? COA.CASH : COA.HDFC;

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
      narration: `Collection via ${mr.mode} on MR ${mr.mrNumber}`,
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
