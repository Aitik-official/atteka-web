import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo debit vouchers — not client production data. */
type VoucherRow = {
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

const DEMO_PAYEES = [
  "NORTHBOUND FUELS",
  "METRO TYRE DEPOT",
  "COASTAL TOLL SERVICES",
  "ALPINE CATERERS",
  "GATEWAY IT SUPPLIES",
  "ORBIT STATIONERY MART"
];

const VOUCHER_TYPES = ["Cash Payment", "Bank Payment", "Journal Debit", "Petty Cash"];

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

const createdStore: VoucherRow[] = [];

function buildDemoRows(): VoucherRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: VoucherRow[] = [];
  for (let i = 0; i < 24; i++) {
    const iso = addDays(today, -((i % 10) + (i % 3 === 0 ? 0 : 1)));
    const amount = Number((2450 + (i % 9) * 1875 + (i % 5) * 320.5).toFixed(2));
    const payTo = DEMO_PAYEES[i % DEMO_PAYEES.length];
    rows.push({
      voucherNumber: `DVALC1${String(26082000 + i)}`,
      voucherDate: fmtDate(iso),
      voucherDateIso: iso,
      voucherType: VOUCHER_TYPES[i % VOUCHER_TYPES.length],
      docRefNo: `JVALC1${String(26091000 + i)}`,
      branch: i % 4 === 0 ? "ALC2" : "ALC1",
      payTo,
      totalAccountedAmount: amount,
      narration: `BEING DEMO PAYMENT TO ${payTo}`,
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
        projects: ["General", "Fleet Ops", "Branch Capex"],
        interestAccounts: ["Interest Expense", "Bank Charges", "Other Interest"],
        tdsSections: ["194C", "194H", "194I", "194J", "194Q"],
        cashBankAccounts: ["Cash in Hand - ALC1", "HDFC Bank - Ops", "ICICI Bank - Current"],
        modes: ["Cash", "Cheque", "NEFT", "RTGS", "UPI"]
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
    meta: { from, to, voucherType: voucherType || null, voucherNumber: voucherNumber || null, documentNumber: documentNumber || null }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const today = new Date().toISOString().slice(0, 10);
    const voucherNumber =
      String(body.predictedVoucherNo || "").trim() ||
      `DVALC1${String(Date.now()).slice(-8)}`;
    const voucherDateIso = String(body.voucherDate || today).slice(0, 10);
    const payTo = String(body.paidTo || "DEMO PAYEE").trim();
    const netPayable = Number(body.netPayable || body.taxableAmount || body.baseAmount || 0);

    const row: VoucherRow = {
      voucherNumber,
      voucherDate: fmtDate(voucherDateIso),
      voucherDateIso,
      voucherType: String(body.modeOfTransaction || "Cash Payment"),
      docRefNo: String(body.documentNo || `JVALC1${String(Date.now()).slice(-8)}`),
      branch: String(body.location || "ALC1"),
      payTo,
      totalAccountedAmount: Number(netPayable.toFixed(2)),
      narration: String(body.narration || `BEING DEMO PAYMENT TO ${payTo}`).trim(),
      status: "Active"
    };
    createdStore.unshift(row);

    return NextResponse.json({
      success: true,
      message: "Debit voucher saved (demo)",
      data: row
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }
}
