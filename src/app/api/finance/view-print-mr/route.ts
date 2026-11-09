import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo MRs for View / Print MR — not client production data. */
const DEMO_CUSTOMERS = [
  "NORTHBOUND FREIGHT PVT LTD",
  "COASTAL CARGO SOLUTIONS",
  "METRO LOGISTICS PARTNERS",
  "GATEWAY DISTRIBUTION CO",
  "ALPINE FREIGHT LINES"
];

const LOCATIONS = ["ALC1", "ALC2", "PUNE", "NASHIK", "THANE", "VASHI"];

type MrRow = {
  mrNo: string;
  mrDate: string;
  mrDateIso: string;
  customerName: string;
  mrLocation: string;
  mrAmount: number;
  deduction: number;
  netAmount: number;
  billNumber: string;
};

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

function buildDemoMrs(): MrRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: MrRow[] = [];
  for (let i = 0; i < 24; i++) {
    const iso = addDays(today, -((i % 12) + (i % 4 === 0 ? 0 : 1)));
    const mrAmount = Number((8500 + (i % 7) * 1250 + (i % 5) * 340.5).toFixed(2));
    const deduction = Number((i % 3 === 0 ? 0 : 150 + (i % 4) * 75).toFixed(2));
    rows.push({
      mrNo: `MR/ALC1/${String(2601100 + i).padStart(7, "0")}`,
      mrDate: fmtDate(iso),
      mrDateIso: iso,
      customerName: DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length],
      mrLocation: LOCATIONS[i % LOCATIONS.length],
      mrAmount,
      deduction,
      netAmount: Number((mrAmount - deduction).toFixed(2)),
      billNumber: `BL/ALC1/${String(2605000 + i).padStart(7, "0")}`
    });
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), addDays(today, -6));
  const to = parseIso(searchParams.get("to"), today);
  const mrNumber = (searchParams.get("mrNumber") || "").trim().toUpperCase();
  const billNumber = (searchParams.get("billNumber") || "").trim().toUpperCase();

  let rows = buildDemoMrs();

  if (mrNumber) {
    rows = rows.filter(
      (r) => r.mrNo.toUpperCase().includes(mrNumber) || mrNumber.includes(r.mrNo.slice(-6))
    );
    if (!rows.length) {
      const iso = today;
      rows = [
        {
          mrNo: mrNumber.startsWith("MR") ? mrNumber : `MR/ALC1/${mrNumber.replace(/\D/g, "").padStart(7, "0")}`,
          mrDate: fmtDate(iso),
          mrDateIso: iso,
          customerName: DEMO_CUSTOMERS[0],
          mrLocation: "ALC1",
          mrAmount: 12500,
          deduction: 250,
          netAmount: 12250,
          billNumber: "BL/ALC1/0000001"
        }
      ];
    }
  } else if (billNumber) {
    rows = rows.filter(
      (r) => r.billNumber.toUpperCase().includes(billNumber) || billNumber.includes(r.billNumber.slice(-6))
    );
    if (!rows.length) {
      const iso = today;
      rows = [
        {
          mrNo: `MR/ALC1/${String(2601999).padStart(7, "0")}`,
          mrDate: fmtDate(iso),
          mrDateIso: iso,
          customerName: DEMO_CUSTOMERS[1],
          mrLocation: "ALC1",
          mrAmount: 9800,
          deduction: 0,
          netAmount: 9800,
          billNumber: billNumber.startsWith("BL")
            ? billNumber
            : `BL/ALC1/${billNumber.replace(/\D/g, "").padStart(7, "0")}`
        }
      ];
    }
  } else {
    rows = rows.filter((r) => r.mrDateIso >= from && r.mrDateIso <= to);
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r, idx) => ({
      srNo: idx + 1,
      mrNo: r.mrNo,
      mrDate: r.mrDate,
      mrDateIso: r.mrDateIso,
      customerName: r.customerName,
      mrLocation: r.mrLocation,
      mrAmount: r.mrAmount,
      deduction: r.deduction,
      netAmount: r.netAmount,
      billNumber: r.billNumber
    })),
    meta: { from, to, mrNumber: mrNumber || null, billNumber: billNumber || null }
  });
}
