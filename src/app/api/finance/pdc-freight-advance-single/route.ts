import { NextRequest, NextResponse } from "next/server";

type Row = {
  id: string;
  pdcNumber: string;
  pdcDate: string;
  pdcBranch: string;
  vendorCode: string;
  vendorName: string;
  vehicleNo: string;
  totalHire: number;
  advanceAmount: number;
  balanceAmount: number;
  status: "Open" | "Part Paid" | "Closed";
};

/** Fabricated PDC freight/advance payment queue — not client production data. */
const DEMO_ROWS: Row[] = [
  {
    id: "pfa-1",
    pdcNumber: "DSBOM11100001",
    pdcDate: "2026-11-10",
    pdcBranch: "ALC1",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    vehicleNo: "MH12AB1234",
    totalHire: 48500,
    advanceAmount: 15000,
    balanceAmount: 33500,
    status: "Part Paid"
  },
  {
    id: "pfa-2",
    pdcNumber: "PSBOM31100001",
    pdcDate: "2026-11-09",
    pdcBranch: "ALC1",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    vehicleNo: "MH14CD5678",
    totalHire: 63200,
    advanceAmount: 0,
    balanceAmount: 63200,
    status: "Open"
  },
  {
    id: "pfa-3",
    pdcNumber: "DSBOM11100012",
    pdcDate: "2026-11-08",
    pdcBranch: "ALC2",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    vehicleNo: "GJ01EF9012",
    totalHire: 71500,
    advanceAmount: 25000,
    balanceAmount: 46500,
    status: "Part Paid"
  },
  {
    id: "pfa-4",
    pdcNumber: "PSBOM31100018",
    pdcDate: "2026-11-06",
    pdcBranch: "ALC1",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    vehicleNo: "RJ14GH3456",
    totalHire: 39200,
    advanceAmount: 39200,
    balanceAmount: 0,
    status: "Closed"
  },
  {
    id: "pfa-5",
    pdcNumber: "DSBOM11100025",
    pdcDate: "2026-11-05",
    pdcBranch: "ALC3",
    vendorCode: "VND1004",
    vendorName: "MEHTA FUELS PVT LTD",
    vehicleNo: "MP09JK7788",
    totalHire: 27800,
    advanceAmount: 8000,
    balanceAmount: 19800,
    status: "Part Paid"
  },
  {
    id: "pfa-6",
    pdcNumber: "PSBOM31100030",
    pdcDate: "2026-11-03",
    pdcBranch: "ALC1",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    vehicleNo: "HR26LM1122",
    totalHire: 55400,
    advanceAmount: 0,
    balanceAmount: 55400,
    status: "Open"
  },
  {
    id: "pfa-7",
    pdcNumber: "DSBOM11100040",
    pdcDate: "2026-10-28",
    pdcBranch: "ALC2",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    vehicleNo: "UP32NO4455",
    totalHire: 46800,
    advanceAmount: 12000,
    balanceAmount: 34800,
    status: "Part Paid"
  },
  {
    id: "pfa-8",
    pdcNumber: "PSBOM31100042",
    pdcDate: "2026-10-20",
    pdcBranch: "ALC1",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    vehicleNo: "MH12PQ6677",
    totalHire: 52100,
    advanceAmount: 16000,
    balanceAmount: 36100,
    status: "Part Paid"
  },
  {
    id: "pfa-9",
    pdcNumber: "DSBOM11100055",
    pdcDate: "2026-10-15",
    pdcBranch: "ALC1",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    vehicleNo: "MH04RS8899",
    totalHire: 41000,
    advanceAmount: 41000,
    balanceAmount: 0,
    status: "Closed"
  },
  {
    id: "pfa-10",
    pdcNumber: "PSBOM31100060",
    pdcDate: "2026-10-12",
    pdcBranch: "ALC3",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    vehicleNo: "DL01TU2233",
    totalHire: 68900,
    advanceAmount: 20000,
    balanceAmount: 48900,
    status: "Part Paid"
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
  const today = new Date().toISOString().slice(0, 10);
  const fromDefault = new Date();
  fromDefault.setDate(fromDefault.getDate() - 29);
  const from = parseIso(searchParams.get("from"), fromDefault.toISOString().slice(0, 10));
  const to = parseIso(searchParams.get("to"), today);
  const pdcNo = (searchParams.get("pdcNo") || searchParams.get("systemPdcNo") || "").trim().toUpperCase();

  let rows = [...DEMO_ROWS];

  if (pdcNo) {
    rows = DEMO_ROWS.filter((r) => r.pdcNumber.toUpperCase().includes(pdcNo));
    if (!rows.length) {
      rows = [
        {
          id: "pfa-lookup",
          pdcNumber: pdcNo,
          pdcDate: today,
          pdcBranch: "ALC1",
          vendorCode: "VND1001",
          vendorName: "SHREE TRANSPORT CO",
          vehicleNo: "MH12AB1234",
          totalHire: 45000,
          advanceAmount: 0,
          balanceAmount: 45000,
          status: "Open"
        }
      ];
    }
  } else {
    rows = DEMO_ROWS.filter((r) => r.pdcDate >= from && r.pdcDate <= to);
  }

  rows = rows.sort((a, b) => b.pdcDate.localeCompare(a.pdcDate) || a.pdcNumber.localeCompare(b.pdcNumber));

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
      pdcNo: pdcNo || "",
      mode: pdcNo ? "pdc" : "date"
    }
  });
}
