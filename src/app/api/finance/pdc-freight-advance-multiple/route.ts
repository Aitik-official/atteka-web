import { NextRequest, NextResponse } from "next/server";

type Row = {
  id: string;
  vehicleNo: string;
  pdcNumber: string;
  manualPdcNo: string;
  pdcDate: string;
  pdcBranch: string;
  vendorCode: string;
  vendorName: string;
  totalHire: number;
  advanceAmount: number;
  balanceAmount: number;
};

/** Fabricated multi-PDC advance payment queue — not client production data. */
const DEMO_ROWS: Row[] = [
  {
    id: "pfm-1",
    vehicleNo: "MH12AB1234",
    pdcNumber: "DSBOM11100001",
    manualPdcNo: "M-PDC-88021",
    pdcDate: "2026-11-10",
    pdcBranch: "ALC1",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    totalHire: 48500,
    advanceAmount: 0,
    balanceAmount: 48500
  },
  {
    id: "pfm-2",
    vehicleNo: "MH14CD5678",
    pdcNumber: "PSBOM31100001",
    manualPdcNo: "M-PDC-88044",
    pdcDate: "2026-11-09",
    pdcBranch: "ALC1",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    totalHire: 63200,
    advanceAmount: 0,
    balanceAmount: 63200
  },
  {
    id: "pfm-3",
    vehicleNo: "GJ01EF9012",
    pdcNumber: "DSBOM11100012",
    manualPdcNo: "M-PDC-87990",
    pdcDate: "2026-11-08",
    pdcBranch: "ALC2",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    totalHire: 71500,
    advanceAmount: 10000,
    balanceAmount: 61500
  },
  {
    id: "pfm-4",
    vehicleNo: "RJ14GH3456",
    pdcNumber: "PSBOM31100018",
    manualPdcNo: "M-PDC-88102",
    pdcDate: "2026-11-06",
    pdcBranch: "ALC1",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    totalHire: 39200,
    advanceAmount: 0,
    balanceAmount: 39200
  },
  {
    id: "pfm-5",
    vehicleNo: "MP09JK7788",
    pdcNumber: "DSBOM11100025",
    manualPdcNo: "M-PDC-88210",
    pdcDate: "2026-11-05",
    pdcBranch: "ALC3",
    vendorCode: "VND1004",
    vendorName: "MEHTA FUELS PVT LTD",
    totalHire: 27800,
    advanceAmount: 0,
    balanceAmount: 27800
  },
  {
    id: "pfm-6",
    vehicleNo: "HR26LM1122",
    pdcNumber: "PSBOM31100030",
    manualPdcNo: "M-PDC-88301",
    pdcDate: "2026-11-03",
    pdcBranch: "ALC1",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    totalHire: 55400,
    advanceAmount: 0,
    balanceAmount: 55400
  },
  {
    id: "pfm-7",
    vehicleNo: "UP32NO4455",
    pdcNumber: "DSBOM11100040",
    manualPdcNo: "M-PDC-88400",
    pdcDate: "2026-10-28",
    pdcBranch: "ALC2",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    totalHire: 46800,
    advanceAmount: 0,
    balanceAmount: 46800
  },
  {
    id: "pfm-8",
    vehicleNo: "MH12PQ6677",
    pdcNumber: "PSBOM31100042",
    manualPdcNo: "M-PDC-88421",
    pdcDate: "2026-10-20",
    pdcBranch: "ALC1",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    totalHire: 52100,
    advanceAmount: 5000,
    balanceAmount: 47100
  }
];

const DEMO_VENDORS = Array.from(
  new Map(
    DEMO_ROWS.map((r) => [
      r.vendorCode,
      { code: r.vendorCode, name: r.vendorName, label: `${r.vendorCode} - ${r.vendorName}` }
    ])
  ).values()
);

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

  if (searchParams.get("vendors") === "1") {
    return NextResponse.json({ success: true, data: DEMO_VENDORS });
  }

  const today = new Date().toISOString().slice(0, 10);
  const fromDefault = new Date();
  fromDefault.setDate(fromDefault.getDate() - 29);
  const from = parseIso(searchParams.get("from"), fromDefault.toISOString().slice(0, 10));
  const to = parseIso(searchParams.get("to"), today);
  const vendor = (searchParams.get("vendor") || "").trim().toLowerCase();

  let rows = DEMO_ROWS.filter((r) => r.pdcDate >= from && r.pdcDate <= to);
  if (vendor) {
    rows = rows.filter(
      (r) =>
        r.vendorCode.toLowerCase().includes(vendor) ||
        r.vendorName.toLowerCase().includes(vendor) ||
        `${r.vendorCode} - ${r.vendorName}`.toLowerCase().includes(vendor)
    );
  }

  rows = [...rows].sort((a, b) => b.pdcDate.localeCompare(a.pdcDate) || a.pdcNumber.localeCompare(b.pdcNumber));

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r, idx) => ({
      ...r,
      srNo: idx + 1,
      pdcDateLabel: fmtDateLabel(r.pdcDate),
      vendorLabel: `${r.vendorCode} - ${r.vendorName}`
    })),
    meta: {
      from: fmtDateLabel(from),
      to: fmtDateLabel(to),
      vendor: vendor || "All"
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Select at least one PDC" }, { status: 400 });
    }
    const selected = DEMO_ROWS.filter((r) => ids.includes(r.id));
    const totalBalance = selected.reduce((s, r) => s + r.balanceAmount, 0);
    return NextResponse.json({
      success: true,
      message: `${selected.length} PDC(s) queued for multiple advance payment entry (demo)`,
      data: {
        count: selected.length,
        totalBalance: Number(totalBalance.toFixed(2)),
        batchRef: `MPADV-${Date.now().toString().slice(-8)}`,
        pdcNumbers: selected.map((r) => r.pdcNumber)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Continue failed" }, { status: 500 });
  }
}
