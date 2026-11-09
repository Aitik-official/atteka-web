import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo vouchers for View / Print Bills — not client production data. */
type VoucherRow = {
  voucherNumber: string;
  voucherDate: string;
  voucherDateIso: string;
  voucherType: string;
  branch: string;
  payTo: string;
  totalAccountedAmount: number;
};

const DEMO_PAYEES = [
  "NORTHBOUND FREIGHT PVT LTD",
  "METRO LOGISTICS PARTNERS",
  "COASTAL CARGO SOLUTIONS",
  "GATEWAY DISTRIBUTION CO",
  "ALPINE WORKSHOP SERVICES",
  "ORBIT BANK CHARGES (DEMO)"
];

const VOUCHER_TYPES = ["Journal", "Debit", "Credit", "Contra", "Bank Payment"];

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
  for (let i = 0; i < 36; i++) {
    const iso = addDays(today, -((i % 20) + (i % 4 === 0 ? 0 : 1)));
    const amount = Number((1850 + (i % 11) * 1425 + (i % 7) * 88.5).toFixed(2));
    rows.push({
      voucherNumber: `JVALC1${String(26104000 + i)}`,
      voucherDate: fmtDate(iso),
      voucherDateIso: iso,
      voucherType: VOUCHER_TYPES[i % VOUCHER_TYPES.length],
      branch: i % 5 === 0 ? "ALC2" : "ALC1",
      payTo: DEMO_PAYEES[i % DEMO_PAYEES.length],
      totalAccountedAmount: amount
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

  let rows = buildDemoRows();

  if (voucherNumber) {
    rows = rows.filter((r) => r.voucherNumber.toUpperCase().includes(voucherNumber));
    if (!rows.length) {
      rows = [
        {
          voucherNumber: voucherNumber.startsWith("JV")
            ? voucherNumber
            : `JVALC1${voucherNumber.replace(/\D/g, "").padStart(8, "0")}`,
          voucherDate: fmtDate(today),
          voucherDateIso: today,
          voucherType: voucherType || "Journal",
          branch: "ALC1",
          payTo: DEMO_PAYEES[0],
          totalAccountedAmount: 4750.5
        }
      ];
    }
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
      voucherNumber: voucherNumber || null
    }
  });
}
