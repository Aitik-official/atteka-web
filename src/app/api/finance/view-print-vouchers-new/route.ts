import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo vouchers for View Print Vouchers New — not client production data. */
type VoucherRow = {
  voucherNo: string;
  docRefNo: string;
  voucherDate: string;
  voucherDateIso: string;
  payTo: string;
  particular: string;
  debit: number;
  credit: number;
  chqUtrNo: string;
  chqUtrDt: string;
  branch: string;
  voucherType: string;
  narration: string;
  entryBy: string;
  entryDt: string;
};

const DEMO_PAYEES = [
  "NORTHBOUND FREIGHT PVT LTD",
  "METRO LOGISTICS PARTNERS",
  "COASTAL CARGO SOLUTIONS",
  "GATEWAY DISTRIBUTION CO",
  "ALPINE WORKSHOP SERVICES"
];

const PARTICULARS = [
  "Cash in Hand - ALC1",
  "HDFC Bank - Ops",
  "Freight Expense",
  "Toll Expense",
  "Sundry Creditors"
];

const VOUCHER_TYPES = ["Debit", "Credit", "Journal", "Contra", "Bank Payment"];

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

function buildDemoRows(): VoucherRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: VoucherRow[] = [];
  for (let i = 0; i < 28; i++) {
    const iso = addDays(today, -((i % 12) + (i % 3 === 0 ? 0 : 1)));
    const entryIso = addDays(iso, i % 2);
    const amount = Number((2750 + (i % 9) * 1125 + (i % 5) * 95.25).toFixed(2));
    const isDebit = i % 2 === 0;
    const payTo = DEMO_PAYEES[i % DEMO_PAYEES.length];
    const voucherType = VOUCHER_TYPES[i % VOUCHER_TYPES.length];
    rows.push({
      voucherNo: `VNALC1${String(26108000 + i)}`,
      docRefNo: `DRALC1${String(26109000 + i)}`,
      voucherDate: fmtDate(iso),
      voucherDateIso: iso,
      payTo,
      particular: PARTICULARS[i % PARTICULARS.length],
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount,
      chqUtrNo: i % 3 === 0 ? `UTR${String(900000 + i)}` : "",
      chqUtrDt: i % 3 === 0 ? fmtDate(iso) : "",
      branch: i % 4 === 0 ? "ALC2" : "ALC1",
      voucherType,
      narration: `BEING DEMO ${voucherType.toUpperCase()} FOR ${payTo}`,
      entryBy: "AL002",
      entryDt: fmtDate(entryIso)
    });
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("lists") === "1") {
    return NextResponse.json({ success: true, data: { voucherTypes: VOUCHER_TYPES } });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const voucherType = (searchParams.get("voucherType") || "").trim();
  const voucherNumber = (searchParams.get("voucherNumber") || "").trim().toUpperCase();
  const documentNumber = (searchParams.get("documentNumber") || "").trim().toUpperCase();

  let rows = buildDemoRows();

  if (voucherNumber) {
    rows = rows.filter((r) => r.voucherNo.toUpperCase().includes(voucherNumber));
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
