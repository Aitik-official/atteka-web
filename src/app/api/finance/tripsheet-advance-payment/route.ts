import { NextRequest, NextResponse } from "next/server";

type Row = {
  id: string;
  vehicleNo: string;
  pdcNumber: string;
  manualPdcNo: string;
  pdcDate: string;
  pdcBranch: string;
  vehType: string;
  fromLocation: string;
  toLocation: string;
  distance: number;
  vendorType: string;
  vendorCode: string;
  vendorName: string;
  tripSheetNo: string;
  advanceEligible: number;
};

/** Fabricated tripsheet advance payment queue — not client production data. */
const DEMO_ROWS: Row[] = [
  {
    id: "tsa-1",
    vehicleNo: "MH12AB1234",
    pdcNumber: "DSBOM11100001",
    manualPdcNo: "M-PDC-88021",
    pdcDate: "2026-11-10",
    pdcBranch: "ALC1",
    vehType: "Trailer",
    fromLocation: "Pune",
    toLocation: "Ahmedabad",
    distance: 650,
    vendorType: "Market",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    tripSheetNo: "TSALC12611001",
    advanceEligible: 15000
  },
  {
    id: "tsa-2",
    vehicleNo: "MH14CD5678",
    pdcNumber: "PSBOM31100001",
    manualPdcNo: "M-PDC-88044",
    pdcDate: "2026-11-09",
    pdcBranch: "ALC1",
    vehType: "Container",
    fromLocation: "Mumbai",
    toLocation: "Nagpur",
    distance: 820,
    vendorType: "Attached",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    tripSheetNo: "TSALC12611002",
    advanceEligible: 20000
  },
  {
    id: "tsa-3",
    vehicleNo: "GJ01EF9012",
    pdcNumber: "DSBOM11100012",
    manualPdcNo: "M-PDC-87990",
    pdcDate: "2026-11-08",
    pdcBranch: "ALC2",
    vehType: "Open Body",
    fromLocation: "Surat",
    toLocation: "Indore",
    distance: 410,
    vendorType: "Market",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    tripSheetNo: "TSALC22611003",
    advanceEligible: 12000
  },
  {
    id: "tsa-4",
    vehicleNo: "RJ14GH3456",
    pdcNumber: "PSBOM31100018",
    manualPdcNo: "M-PDC-88102",
    pdcDate: "2026-11-06",
    pdcBranch: "ALC1",
    vehType: "Trailer",
    fromLocation: "Jaipur",
    toLocation: "Delhi",
    distance: 280,
    vendorType: "Own",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    tripSheetNo: "TSALC12611004",
    advanceEligible: 8000
  },
  {
    id: "tsa-5",
    vehicleNo: "MP09JK7788",
    pdcNumber: "DSBOM11100025",
    manualPdcNo: "M-PDC-88210",
    pdcDate: "2026-11-05",
    pdcBranch: "ALC3",
    vehType: "Tanker",
    fromLocation: "Bhopal",
    toLocation: "Pune",
    distance: 760,
    vendorType: "Attached",
    vendorCode: "VND1004",
    vendorName: "MEHTA FUELS PVT LTD",
    tripSheetNo: "TSALC32611005",
    advanceEligible: 18000
  },
  {
    id: "tsa-6",
    vehicleNo: "HR26LM1122",
    pdcNumber: "PSBOM31100030",
    manualPdcNo: "M-PDC-88301",
    pdcDate: "2026-11-03",
    pdcBranch: "ALC1",
    vehType: "Container",
    fromLocation: "Gurgaon",
    toLocation: "Kanpur",
    distance: 490,
    vendorType: "Market",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    tripSheetNo: "TSALC12611006",
    advanceEligible: 14000
  },
  {
    id: "tsa-7",
    vehicleNo: "UP32NO4455",
    pdcNumber: "DSBOM11100040",
    manualPdcNo: "M-PDC-88400",
    pdcDate: "2026-10-28",
    pdcBranch: "ALC2",
    vehType: "Open Body",
    fromLocation: "Lucknow",
    toLocation: "Patna",
    distance: 540,
    vendorType: "Market",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    tripSheetNo: "TSALC22610207",
    advanceEligible: 11000
  },
  {
    id: "tsa-8",
    vehicleNo: "MH12PQ6677",
    pdcNumber: "PSBOM31100042",
    manualPdcNo: "M-PDC-88421",
    pdcDate: "2026-10-20",
    pdcBranch: "ALC1",
    vehType: "Trailer",
    fromLocation: "Nashik",
    toLocation: "Hyderabad",
    distance: 710,
    vendorType: "Attached",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    tripSheetNo: "TSALC12610208",
    advanceEligible: 16000
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

const VENDOR_TYPES = ["Market", "Attached", "Own"];

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

  if (searchParams.get("lists") === "1") {
    return NextResponse.json({
      success: true,
      data: { vendors: DEMO_VENDORS, vendorTypes: VENDOR_TYPES }
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const fromDefault = new Date();
  fromDefault.setDate(fromDefault.getDate() - 29);
  const from = parseIso(searchParams.get("from"), fromDefault.toISOString().slice(0, 10));
  const to = parseIso(searchParams.get("to"), today);
  const vendor = (searchParams.get("vendor") || "").trim().toLowerCase();
  const tripSheetNo = (searchParams.get("tripSheetNo") || "").trim().toUpperCase();
  const vehicleSearch = (searchParams.get("vehicle") || "").trim().toLowerCase();
  const vendorType = (searchParams.get("vendorType") || "").trim();

  let rows = DEMO_ROWS.filter((r) => r.pdcDate >= from && r.pdcDate <= to);

  if (vendor) {
    rows = rows.filter(
      (r) =>
        r.vendorCode.toLowerCase().includes(vendor) ||
        r.vendorName.toLowerCase().includes(vendor) ||
        `${r.vendorCode} - ${r.vendorName}`.toLowerCase().includes(vendor)
    );
  }
  if (tripSheetNo) {
    rows = rows.filter((r) => r.tripSheetNo.toUpperCase().includes(tripSheetNo));
  }
  if (vehicleSearch) {
    rows = rows.filter((r) => r.vehicleNo.toLowerCase().includes(vehicleSearch));
  }
  if (vendorType && vendorType !== "--Select--") {
    rows = rows.filter((r) => r.vendorType.toLowerCase() === vendorType.toLowerCase());
  }

  rows = [...rows].sort((a, b) => b.pdcDate.localeCompare(a.pdcDate) || a.vehicleNo.localeCompare(b.vehicleNo));

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
      vendor: vendor || "All",
      tripSheetNo: tripSheetNo || ""
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Select at least one tripsheet / PDC row" }, { status: 400 });
    }
    const selected = DEMO_ROWS.filter((r) => ids.includes(r.id));
    const totalAdvance = selected.reduce((s, r) => s + r.advanceEligible, 0);
    return NextResponse.json({
      success: true,
      message: `${selected.length} TripSheet advance payment(s) queued (demo)`,
      data: {
        count: selected.length,
        totalAdvance: Number(totalAdvance.toFixed(2)),
        batchRef: `TSADV-${Date.now().toString().slice(-8)}`,
        tripSheetNos: selected.map((r) => r.tripSheetNo)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Continue failed" }, { status: 500 });
  }
}
