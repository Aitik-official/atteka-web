import { NextRequest, NextResponse } from "next/server";

type ApiTxn = {
  id: string;
  txnDate: string;
  valueDate: string;
  refNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  channel: string;
  status: "Posted" | "Pending" | "Reversed";
  bank: string;
  accountNo: string;
};

const BANK_ACCOUNTS = [
  { code: "INDB-201002938471", label: "INDUSIND BANK - 201002938471", bank: "INDUSIND BANK", accountNo: "201002938471" },
  { code: "HDFC-502000112233", label: "HDFC BANK - 502000112233", bank: "HDFC BANK", accountNo: "502000112233" },
  { code: "ICIC-628901234567", label: "ICICI BANK - 628901234567", bank: "ICICI BANK", accountNo: "628901234567" },
  { code: "SBIN-30123456789", label: "SBI - 30123456789", bank: "SBI", accountNo: "30123456789" }
];

/** Fabricated API bank feed — not client production data. */
const DEMO_TXNS: ApiTxn[] = [
  {
    id: "api-1",
    txnDate: "2026-11-04",
    valueDate: "2026-11-04",
    refNo: "INDB2611040001",
    description: "NEFT CR - FREIGHT COLLECTION NORTH",
    debit: 0,
    credit: 185000,
    balance: 1420500,
    channel: "NEFT",
    status: "Posted",
    bank: "INDUSIND BANK",
    accountNo: "201002938471"
  },
  {
    id: "api-2",
    txnDate: "2026-11-05",
    valueDate: "2026-11-05",
    refNo: "INDB2611050012",
    description: "NEFT DR - SHREE TRANSPORT FREIGHT",
    debit: 48500,
    credit: 0,
    balance: 1372000,
    channel: "NEFT",
    status: "Posted",
    bank: "INDUSIND BANK",
    accountNo: "201002938471"
  },
  {
    id: "api-3",
    txnDate: "2026-11-06",
    valueDate: "2026-11-06",
    refNo: "RTGS261106008",
    description: "RTGS DR - MEHTA FUELS SETTLEMENT",
    debit: 156750.5,
    credit: 0,
    balance: 1215249.5,
    channel: "RTGS",
    status: "Posted",
    bank: "INDUSIND BANK",
    accountNo: "201002938471"
  },
  {
    id: "api-4",
    txnDate: "2026-11-07",
    valueDate: "2026-11-07",
    refNo: "IMPS2611070012",
    description: "IMPS DR - DRIVER ADVANCE",
    debit: 12000,
    credit: 0,
    balance: 1203249.5,
    channel: "IMPS",
    status: "Posted",
    bank: "INDUSIND BANK",
    accountNo: "201002938471"
  },
  {
    id: "api-5",
    txnDate: "2026-11-08",
    valueDate: "2026-11-08",
    refNo: "CMS2611080044",
    description: "CMS CHQ CLG - PATEL ROADLINES",
    debit: 0,
    credit: 63200,
    balance: 1266449.5,
    channel: "CHEQUE",
    status: "Posted",
    bank: "INDUSIND BANK",
    accountNo: "201002938471"
  },
  {
    id: "api-6",
    txnDate: "2026-11-09",
    valueDate: "2026-11-09",
    refNo: "INDB2611090003",
    description: "NEFT DR - FLEET MAINTENANCE",
    debit: 27500,
    credit: 0,
    balance: 1238949.5,
    channel: "NEFT",
    status: "Pending",
    bank: "INDUSIND BANK",
    accountNo: "201002938471"
  },
  {
    id: "api-7",
    txnDate: "2026-11-10",
    valueDate: "2026-11-10",
    refNo: "CHG26111001",
    description: "BANK CHARGES - ACCOUNT MAINTENANCE",
    debit: 125.5,
    credit: 0,
    balance: 1238824,
    channel: "FEE",
    status: "Posted",
    bank: "INDUSIND BANK",
    accountNo: "201002938471"
  },
  {
    id: "api-8",
    txnDate: "2026-11-09",
    valueDate: "2026-11-09",
    refNo: "HDFC2611090088",
    description: "NEFT CR - CUSTOMER RECEIPT WEST",
    debit: 0,
    credit: 98000,
    balance: 890500,
    channel: "NEFT",
    status: "Posted",
    bank: "HDFC BANK",
    accountNo: "502000112233"
  },
  {
    id: "api-9",
    txnDate: "2026-11-10",
    valueDate: "2026-11-10",
    refNo: "HDFC2611100019",
    description: "NEFT DR - OFFICE EXPENSE",
    debit: 8450,
    credit: 0,
    balance: 882050,
    channel: "NEFT",
    status: "Reversed",
    bank: "HDFC BANK",
    accountNo: "502000112233"
  },
  {
    id: "api-10",
    txnDate: "2026-11-08",
    valueDate: "2026-11-08",
    refNo: "ICIC2611080021",
    description: "RTGS CR - ZONE COLLECTION",
    debit: 0,
    credit: 215000,
    balance: 1102500,
    channel: "RTGS",
    status: "Posted",
    bank: "ICICI BANK",
    accountNo: "628901234567"
  },
  {
    id: "api-11",
    txnDate: "2026-11-10",
    valueDate: "2026-11-10",
    refNo: "SBIN2611100033",
    description: "NEFT DR - VENDOR PAYMENT",
    debit: 42000,
    credit: 0,
    balance: 655800,
    channel: "NEFT",
    status: "Posted",
    bank: "SBI",
    accountNo: "30123456789"
  }
];

/** In-memory saved queries for the session. */
const savedQueries: {
  id: string;
  bankAccount: string;
  from: string;
  to: string;
  savedAt: string;
}[] = [];

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function fmtDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function findAccount(raw: string) {
  const q = (raw || "").trim().toUpperCase();
  return (
    BANK_ACCOUNTS.find(
      (a) =>
        a.code.toUpperCase() === q ||
        a.label.toUpperCase() === q ||
        a.accountNo === q ||
        a.bank.toUpperCase() === q
    ) || null
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("accounts") === "1") {
    return NextResponse.json({ success: true, data: BANK_ACCOUNTS });
  }

  if (searchParams.get("saved") === "1") {
    return NextResponse.json({ success: true, data: savedQueries });
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const from = parseIso(searchParams.get("from"), yesterday.toISOString().slice(0, 10));
  const to = parseIso(searchParams.get("to"), today);
  const bankAccount = (searchParams.get("bankAccount") || searchParams.get("bank") || "").trim();

  const acc = findAccount(bankAccount);
  if (!acc && bankAccount) {
    return NextResponse.json({ error: "Invalid bank account" }, { status: 400 });
  }

  let rows = DEMO_TXNS.filter((r) => r.txnDate >= from && r.txnDate <= to);
  if (acc) {
    rows = rows.filter((r) => r.accountNo === acc.accountNo || r.bank === acc.bank);
  }

  rows = [...rows].sort((a, b) => a.txnDate.localeCompare(b.txnDate) || a.id.localeCompare(b.id));

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const closingBalance = rows.length ? rows[rows.length - 1].balance : 0;

  const byChannel = rows.reduce(
    (accMap, r) => {
      accMap[r.channel] = (accMap[r.channel] || 0) + r.debit + r.credit;
      return accMap;
    },
    {} as Record<string, number>
  );

  const byDay = rows.reduce(
    (accMap, r) => {
      accMap[r.txnDate] = (accMap[r.txnDate] || 0) + r.debit + r.credit;
      return accMap;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    success: true,
    count: rows.length,
    isSimulated: true,
    source: "API_BANK_FEED",
    meta: {
      bankAccount: acc?.label || "All linked accounts",
      bank: acc?.bank || "MULTI",
      accountNo: acc?.accountNo || "",
      from: fmtDateLabel(from),
      to: fmtDateLabel(to),
      fetchedAt: new Date().toLocaleString("en-GB")
    },
    summary: {
      txnCount: rows.length,
      totalDebit: Number(totalDebit.toFixed(2)),
      totalCredit: Number(totalCredit.toFixed(2)),
      net: Number((totalCredit - totalDebit).toFixed(2)),
      closingBalance: Number(closingBalance.toFixed(2)),
      byChannel,
      byDay
    },
    data: rows.map((r, idx) => ({
      ...r,
      srNo: idx + 1,
      txnDateLabel: fmtDateLabel(r.txnDate),
      valueDateLabel: fmtDateLabel(r.valueDate)
    }))
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "save").toLowerCase();
    const bankAccount = String(body.bankAccount || "").trim();
    const from = String(body.from || "").trim();
    const to = String(body.to || "").trim();

    if (action === "save") {
      if (!bankAccount || !from || !to) {
        return NextResponse.json({ error: "Bank account and dates required to save query" }, { status: 400 });
      }
      const entry = {
        id: `sq-${Date.now()}`,
        bankAccount,
        from,
        to,
        savedAt: new Date().toLocaleString("en-GB")
      };
      savedQueries.unshift(entry);
      if (savedQueries.length > 20) savedQueries.pop();
      return NextResponse.json({
        success: true,
        message: "Query saved (demo session)",
        data: entry
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
