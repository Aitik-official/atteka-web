import { NextRequest, NextResponse } from "next/server";

type Row = {
  id: string;
  vehicleNo: string;
  pdcNumber: string;
  manualPdcNo: string;
  pdcDate: string;
  pdcAmount: number;
  advanceAmt: number;
  balanceAmt: number;
  dcName: string;
  vendorCode: string;
  vendorName: string;
  pdcBranch: string;
};

/** Fabricated multi-PDC balance payment queue — not client production data. */
const DEMO_ROWS: Row[] = [
  {
    id: "pbm-1",
    vehicleNo: "MH12AB1234",
    pdcNumber: "DSBOM11100001",
    manualPdcNo: "M-PDC-88021",
    pdcDate: "2026-11-10",
    pdcAmount: 48500,
    advanceAmt: 15000,
    balanceAmt: 33500,
    dcName: "ALC1 Delivery Center",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    pdcBranch: "ALC1"
  },
  {
    id: "pbm-2",
    vehicleNo: "MH14CD5678",
    pdcNumber: "PSBOM31100001",
    manualPdcNo: "M-PDC-88044",
    pdcDate: "2026-11-09",
    pdcAmount: 63200,
    advanceAmt: 20000,
    balanceAmt: 43200,
    dcName: "ALC1 Delivery Center",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    pdcBranch: "ALC1"
  },
  {
    id: "pbm-3",
    vehicleNo: "GJ01EF9012",
    pdcNumber: "DSBOM11100012",
    manualPdcNo: "M-PDC-87990",
    pdcDate: "2026-11-08",
    pdcAmount: 71500,
    advanceAmt: 25000,
    balanceAmt: 46500,
    dcName: "ALC2 Hub",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    pdcBranch: "ALC2"
  },
  {
    id: "pbm-4",
    vehicleNo: "RJ14GH3456",
    pdcNumber: "PSBOM31100018",
    manualPdcNo: "M-PDC-88102",
    pdcDate: "2026-11-06",
    pdcAmount: 39200,
    advanceAmt: 10000,
    balanceAmt: 29200,
    dcName: "ALC1 Delivery Center",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    pdcBranch: "ALC1"
  },
  {
    id: "pbm-5",
    vehicleNo: "MP09JK7788",
    pdcNumber: "DSBOM11100025",
    manualPdcNo: "M-PDC-88210",
    pdcDate: "2026-11-05",
    pdcAmount: 27800,
    advanceAmt: 8000,
    balanceAmt: 19800,
    dcName: "ALC3 Yard",
    vendorCode: "VND1004",
    vendorName: "MEHTA FUELS PVT LTD",
    pdcBranch: "ALC3"
  },
  {
    id: "pbm-6",
    vehicleNo: "HR26LM1122",
    pdcNumber: "PSBOM31100030",
    manualPdcNo: "M-PDC-88301",
    pdcDate: "2026-11-03",
    pdcAmount: 55400,
    advanceAmt: 18000,
    balanceAmt: 37400,
    dcName: "ALC1 Delivery Center",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    pdcBranch: "ALC1"
  },
  {
    id: "pbm-7",
    vehicleNo: "UP32NO4455",
    pdcNumber: "DSBOM11100040",
    manualPdcNo: "M-PDC-88400",
    pdcDate: "2026-10-28",
    pdcAmount: 46800,
    advanceAmt: 12000,
    balanceAmt: 34800,
    dcName: "ALC2 Hub",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    pdcBranch: "ALC2"
  },
  {
    id: "pbm-8",
    vehicleNo: "MH12PQ6677",
    pdcNumber: "PSBOM31100042",
    manualPdcNo: "M-PDC-88421",
    pdcDate: "2026-10-20",
    pdcAmount: 52100,
    advanceAmt: 16000,
    balanceAmt: 36100,
    dcName: "ALC1 Delivery Center",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    pdcBranch: "ALC1"
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

  let rows = DEMO_ROWS.filter((r) => r.pdcDate >= from && r.pdcDate <= to && r.balanceAmt > 0);
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
    const totalBalance = selected.reduce((s, r) => s + r.balanceAmt, 0);
    return NextResponse.json({
      success: true,
      message: `${selected.length} PDC(s) queued for multiple balance payment entry (demo)`,
      data: {
        count: selected.length,
        totalBalance: Number(totalBalance.toFixed(2)),
        batchRef: `MPBAL-${Date.now().toString().slice(-8)}`,
        pdcNumbers: selected.map((r) => r.pdcNumber)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Continue failed" }, { status: 500 });
  }
}
