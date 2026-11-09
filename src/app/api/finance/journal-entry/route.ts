import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo journal vouchers — not client production data. */
type JournalRow = {
  voucherNumber: string;
  voucherDate: string;
  voucherDateIso: string;
  voucherType: string;
  docRefNo: string;
  branch: string;
  payTo: string;
  totalAccountedAmount: number;
  narration: string;
  entryBy: string;
  entryDt: string;
  entryDtIso: string;
  status: "Active" | "Cancelled";
};

const DEMO_PAYEES = [
  "NORTHBOUND FUELS",
  "METRO TYRE DEPOT",
  "COASTAL TOLL SERVICES",
  "ALPINE CATERERS",
  "GATEWAY IT SUPPLIES",
  "ORBIT STATIONERY MART"
];

const VOUCHER_TYPES = ["Manual Journal", "Adjustment", "Provision", "Rectification"];

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const createdStore: JournalRow[] = [];

function buildDemoRows(): JournalRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: JournalRow[] = [];
  for (let i = 0; i < 24; i++) {
    const iso = addDays(today, -((i % 10) + (i % 3 === 0 ? 0 : 1)));
    const entryIso = addDays(iso, i % 2);
    const amount = Number((3125 + (i % 9) * 1650 + (i % 5) * 275.25).toFixed(2));
    const payTo = DEMO_PAYEES[i % DEMO_PAYEES.length];
    const voucherNumber = `JVALC1${String(26093000 + i)}`;
    rows.push({
      voucherNumber,
      voucherDate: fmtDate(iso),
      voucherDateIso: iso,
      voucherType: VOUCHER_TYPES[i % VOUCHER_TYPES.length],
      docRefNo: voucherNumber,
      branch: "ALC1",
      payTo,
      totalAccountedAmount: amount,
      narration: `BEING DEMO JOURNAL FOR ${payTo}`,
      entryBy: "AL002",
      entryDt: fmtDate(entryIso),
      entryDtIso: entryIso,
      status: "Active"
    });
  }
  return [...createdStore, ...rows];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("lists") === "1") {
    return NextResponse.json({
      success: true,
      data: {
        voucherTypes: VOUCHER_TYPES,
        locations: ["ALC1", "ALC2", "PUNE", "NASHIK"],
        accounts: [
          { code: "CASH001", name: "Cash in Hand - ALC1", group: "Cash & Bank" },
          { code: "BANK001", name: "HDFC Bank - Ops", group: "Cash & Bank" },
          { code: "EXP100", name: "Freight Expense", group: "Expenses" },
          { code: "EXP200", name: "Toll & Parking", group: "Expenses" },
          { code: "INC100", name: "Freight Income", group: "Income" },
          { code: "PARTY01", name: "Sundry Creditors Control", group: "Liabilities" },
          { code: "PARTY02", name: "Sundry Debtors Control", group: "Assets" }
        ]
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), addDays(today, -6));
  const to = parseIso(searchParams.get("to"), today);
  const voucherType = (searchParams.get("voucherType") || "").trim();
  const voucherNumber = (searchParams.get("voucherNumber") || "").trim().toUpperCase();
  const documentNumber = (searchParams.get("documentNumber") || "").trim().toUpperCase();

  let rows = buildDemoRows();

  if (voucherNumber) {
    rows = rows.filter((r) => r.voucherNumber.toUpperCase().includes(voucherNumber));
  } else if (documentNumber) {
    rows = rows.filter((r) => r.docRefNo.toUpperCase().includes(documentNumber));
  } else {
    rows = rows.filter((r) => r.voucherDateIso >= from && r.voucherDateIso <= to);
    if (voucherType) {
      rows = rows.filter((r) => r.voucherType.toLowerCase() === voucherType.toLowerCase());
    }
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r, idx) => ({ srNo: idx + 1, ...r })),
    meta: {
      from,
      to,
      voucherType: voucherType || null,
      voucherNumber: voucherNumber || null,
      documentNumber: documentNumber || null
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const today = new Date().toISOString().slice(0, 10);
    const voucherNumber = `JVALC1${String(Date.now()).slice(-8)}`;
    const voucherDateIso = String(body.voucherDate || today).slice(0, 10);
    const payTo = String(body.paidTo || "JOURNAL ADJUSTMENT").trim();
    const total = Number(body.totalDebit || body.totalCredit || 0);

    const row: JournalRow = {
      voucherNumber,
      voucherDate: fmtDate(voucherDateIso),
      voucherDateIso,
      voucherType: "Manual Journal",
      docRefNo: String(body.refNo || voucherNumber).trim() || voucherNumber,
      branch: String(body.location || "ALC1"),
      payTo,
      totalAccountedAmount: Number(total.toFixed(2)),
      narration: String(body.narration || `BEING DEMO JOURNAL FOR ${payTo}`).trim(),
      entryBy: "AL002",
      entryDt: fmtDate(today),
      entryDtIso: today,
      status: "Active"
    };
    createdStore.unshift(row);

    return NextResponse.json({
      success: true,
      message: "Journal voucher saved (demo)",
      data: row
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }
}
