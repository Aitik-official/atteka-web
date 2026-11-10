import { NextRequest, NextResponse } from "next/server";

type StatementRow = {
  id: string;
  date: string;
  narration: string;
  chqRefNo: string;
  valueDt: string;
  withdrawalAmt: number;
  depositAmt: number;
  closingBalance: number;
  voucherNo: string;
  docNo: string;
  debit: number;
  credit: number;
  bank: string;
};

const BANKS = [
  "INDUSIND BANK",
  "HDFC BANK",
  "ICICI BANK",
  "SBI",
  "AXIS BANK"
];

/** Fabricated bank statement / BRS rows — not client production data. */
const DEMO_ROWS: StatementRow[] = [
  {
    id: "bs-1",
    date: "2026-11-04",
    narration: "NEFT IN - FREIGHT COLLECTION NORTH ZONE",
    chqRefNo: "INDB2611040001",
    valueDt: "2026-11-04",
    withdrawalAmt: 0,
    depositAmt: 185000,
    closingBalance: 1420500,
    voucherNo: "BRV/ALC1/26101",
    docNo: "MR24101",
    debit: 0,
    credit: 185000,
    bank: "INDUSIND BANK"
  },
  {
    id: "bs-2",
    date: "2026-11-05",
    narration: "NEFT OUT - SHREE TRANSPORT CO FREIGHT",
    chqRefNo: "INDB2611050012",
    valueDt: "2026-11-05",
    withdrawalAmt: 48500,
    depositAmt: 0,
    closingBalance: 1372000,
    voucherNo: "BPV/ALC1/26001",
    docNo: "THC88421",
    debit: 48500,
    credit: 0,
    bank: "INDUSIND BANK"
  },
  {
    id: "bs-3",
    date: "2026-11-06",
    narration: "RTGS OUT - MEHTA FUELS PVT LTD",
    chqRefNo: "RTGS261106008",
    valueDt: "2026-11-06",
    withdrawalAmt: 156750.5,
    depositAmt: 0,
    closingBalance: 1215249.5,
    voucherNo: "BPV/ALC1/26003",
    docNo: "BILL99210",
    debit: 156750.5,
    credit: 0,
    bank: "INDUSIND BANK"
  },
  {
    id: "bs-4",
    date: "2026-11-07",
    narration: "IMPS OUT - DRIVER ADVANCE RAJESH KUMAR",
    chqRefNo: "IMPS2611070012",
    valueDt: "2026-11-07",
    withdrawalAmt: 12000,
    depositAmt: 0,
    closingBalance: 1203249.5,
    voucherNo: "BPV/ALC1/26002",
    docNo: "ADV3108",
    debit: 12000,
    credit: 0,
    bank: "INDUSIND BANK"
  },
  {
    id: "bs-5",
    date: "2026-11-08",
    narration: "CMS CHQ CLG - PATEL ROADLINES",
    chqRefNo: "CHQ992812",
    valueDt: "2026-11-08",
    withdrawalAmt: 0,
    depositAmt: 63200,
    closingBalance: 1266449.5,
    voucherNo: "BRV/ALC1/26108",
    docNo: "MR24112",
    debit: 0,
    credit: 63200,
    bank: "INDUSIND BANK"
  },
  {
    id: "bs-6",
    date: "2026-11-09",
    narration: "NEFT OUT - AUTO CARE GARAGE FLEET",
    chqRefNo: "INDB2611090003",
    valueDt: "2026-11-09",
    withdrawalAmt: 27500,
    depositAmt: 0,
    closingBalance: 1238949.5,
    voucherNo: "BPV/ALC1/26005",
    docNo: "FLT2201",
    debit: 27500,
    credit: 0,
    bank: "INDUSIND BANK"
  },
  {
    id: "bs-7",
    date: "2026-11-10",
    narration: "BANK CHARGES - SMS / ACCOUNT FEE",
    chqRefNo: "CHG26111001",
    valueDt: "2026-11-10",
    withdrawalAmt: 125.5,
    depositAmt: 0,
    closingBalance: 1238824,
    voucherNo: "JV/ALC1/26110",
    docNo: "",
    debit: 125.5,
    credit: 0,
    bank: "INDUSIND BANK"
  },
  {
    id: "bs-8",
    date: "2026-11-05",
    narration: "NEFT IN - CUSTOMER FREIGHT RECEIPT",
    chqRefNo: "HDFC2611050044",
    valueDt: "2026-11-05",
    withdrawalAmt: 0,
    depositAmt: 98000,
    closingBalance: 890500,
    voucherNo: "BRV/ALC1/26105",
    docNo: "INV12011",
    debit: 0,
    credit: 98000,
    bank: "HDFC BANK"
  },
  {
    id: "bs-9",
    date: "2026-11-08",
    narration: "NEFT OUT - OFFICE MART SUPPLIES",
    chqRefNo: "HDFC2611080019",
    valueDt: "2026-11-08",
    withdrawalAmt: 8450,
    depositAmt: 0,
    closingBalance: 882050,
    voucherNo: "BPV/ALC1/26004",
    docNo: "OPS7711",
    debit: 8450,
    credit: 0,
    bank: "HDFC BANK"
  },
  {
    id: "bs-10",
    date: "2026-11-06",
    narration: "RTGS IN - WEST ZONE COLLECTION",
    chqRefNo: "ICIC2611060021",
    valueDt: "2026-11-06",
    withdrawalAmt: 0,
    depositAmt: 215000,
    closingBalance: 1102500,
    voucherNo: "BRV/ALC1/26106",
    docNo: "MR24098",
    debit: 0,
    credit: 215000,
    bank: "ICICI BANK"
  }
];

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("banks") === "1") {
    return NextResponse.json({
      success: true,
      data: BANKS.map((b) => ({ code: b, label: b }))
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const fromDefault = new Date();
  fromDefault.setDate(fromDefault.getDate() - 6);
  const from = parseIso(searchParams.get("from") || searchParams.get("fromDate"), fromDefault.toISOString().slice(0, 10));
  const to = parseIso(searchParams.get("to") || searchParams.get("toDate"), today);
  const bank = (searchParams.get("bank") || "").trim().toUpperCase();
  const voucherNo = (searchParams.get("voucherNo") || searchParams.get("voucherNumber") || "").trim().toLowerCase();
  const docNo = (searchParams.get("docNo") || searchParams.get("documentNumber") || "").trim().toLowerCase();

  let rows = DEMO_ROWS.filter((r) => r.date >= from && r.date <= to);

  if (bank && !/select/i.test(bank)) {
    rows = rows.filter((r) => r.bank.toUpperCase() === bank || r.bank.toUpperCase().includes(bank));
  }
  if (voucherNo) {
    rows = rows.filter((r) => r.voucherNo.toLowerCase().includes(voucherNo));
  }
  if (docNo) {
    rows = rows.filter((r) => r.docNo.toLowerCase().includes(docNo));
  }

  rows = [...rows].sort((a, b) => a.date.localeCompare(b.date));

  const totalWithdrawal = rows.reduce((s, r) => s + r.withdrawalAmt, 0);
  const totalDeposit = rows.reduce((s, r) => s + r.depositAmt, 0);
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

  return NextResponse.json({
    success: true,
    count: rows.length,
    bankName: bank || "ALL",
    period: { from, to },
    isSimulated: true,
    data: rows.map((r, idx) => ({
      ...r,
      srNo: idx + 1,
      dateLabel: fmtDateLabel(r.date),
      valueDtLabel: fmtDateLabel(r.valueDt)
    })),
    summary: {
      totalWithdrawal: Number(totalWithdrawal.toFixed(2)),
      totalDeposit: Number(totalDeposit.toFixed(2)),
      totalDebit: Number(totalDebit.toFixed(2)),
      totalCredit: Number(totalCredit.toFixed(2)),
      from: fmtDateLabel(from),
      to: fmtDateLabel(to)
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const fileName = String(body.fileName || "bank-statement-import.xlsx");
    return NextResponse.json({
      success: true,
      message: `Import queued for ${fileName} (demo) — no file processed`,
      imported: 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Import failed" }, { status: 500 });
  }
}
