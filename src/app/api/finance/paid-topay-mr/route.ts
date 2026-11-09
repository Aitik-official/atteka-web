import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo dockets for Paid/Topay MR — not client production data. */
const DEMO_CUSTOMERS = [
  "CUS0001 : NORTHBOUND FREIGHT PVT LTD",
  "CUS0002 : COASTAL CARGO SOLUTIONS",
  "CUS0003 : METRO LOGISTICS PARTNERS",
  "CUS0004 : GATEWAY DISTRIBUTION CO"
];

const ROUTES = [
  { from: "BHIWANDI", to: "PUNE" },
  { from: "MUMBAI", to: "NASHIK" },
  { from: "THANE", to: "AHMEDABAD" },
  { from: "PUNE", to: "NAGPUR" },
  { from: "VASHI", to: "SURAT" }
];

type DocketRow = {
  docketNo: string;
  docketDate: string;
  docketDateIso: string;
  customer: string;
  fromLocation: string;
  toLocation: string;
  actualWt: number;
  chargeWt: number;
  packageNo: number;
  payBasis: "Paid" | "ToPay";
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
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function buildDemoDockets(): DocketRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: DocketRow[] = [];
  for (let i = 0; i < 20; i++) {
    const route = ROUTES[i % ROUTES.length];
    const iso = addDays(today, -((i % 10) + (i % 3 === 0 ? 0 : 1)));
    const actual = Number((120 + (i % 8) * 35 + (i % 5) * 12.5).toFixed(2));
    const charge = Number((actual + (i % 4) * 5).toFixed(2));
    rows.push({
      docketNo: `ALC${String(12608000 + i)}`,
      docketDate: fmtDate(iso),
      docketDateIso: iso,
      customer: DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length],
      fromLocation: route.from,
      toLocation: route.to,
      actualWt: actual,
      chargeWt: charge,
      packageNo: 1 + (i % 6),
      payBasis: i % 2 === 0 ? "Paid" : "ToPay"
    });
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().slice(0, 10);
  const mode = (searchParams.get("mode") || "date").trim(); // date | docket
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const docketNo = (searchParams.get("docketNo") || "").trim().toUpperCase();

  let rows = buildDemoDockets();

  if (mode === "docket" && docketNo) {
    rows = rows.filter(
      (r) => r.docketNo.includes(docketNo) || docketNo.includes(r.docketNo.slice(-6))
    );
    // synthesize a row if user typed an unknown docket so UX still works
    if (!rows.length) {
      const route = ROUTES[0];
      rows = [
        {
          docketNo: docketNo.startsWith("ALC") ? docketNo : `ALC${docketNo.replace(/\D/g, "").padStart(8, "0")}`,
          docketDate: fmtDate(today),
          docketDateIso: today,
          customer: DEMO_CUSTOMERS[0],
          fromLocation: route.from,
          toLocation: route.to,
          actualWt: 150,
          chargeWt: 160,
          packageNo: 2,
          payBasis: "ToPay"
        }
      ];
    }
  } else {
    rows = rows.filter((r) => r.docketDateIso >= from && r.docketDateIso <= to);
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r) => ({
      docketNo: r.docketNo,
      docketDate: r.docketDate,
      customer: r.customer,
      fromLocation: r.fromLocation,
      toLocation: r.toLocation,
      actualChargeWt: `${r.actualWt} / ${r.chargeWt}`,
      packageNo: r.packageNo,
      payBasis: r.payBasis
    })),
    meta: { mode, from, to, docketNo: docketNo || null }
  });
}
