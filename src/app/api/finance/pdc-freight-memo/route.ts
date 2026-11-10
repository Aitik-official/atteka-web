import { NextRequest, NextResponse } from "next/server";

type PdcRow = {
  id: string;
  pdcNo: string;
  manualThcNo: string;
  pdcDate: string;
  vehicleNo: string;
  vendorCode: string;
  vendorName: string;
  advBranch: string;
  totalHire: number;
  advance: number;
  voucher: string;
};

/** Fabricated PDC freight memo print queue — not client production data. */
const DEMO_ROWS: PdcRow[] = [
  {
    id: "pfm-1",
    pdcNo: "DSBOM11100001",
    manualThcNo: "MTHC-88021",
    pdcDate: "2026-11-10",
    vehicleNo: "MH12AB1234",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    advBranch: "ALC1",
    totalHire: 48500,
    advance: 15000,
    voucher: "BPV/ALC1/26110"
  },
  {
    id: "pfm-2",
    pdcNo: "PSBOM31100001",
    manualThcNo: "MTHC-88044",
    pdcDate: "2026-11-10",
    vehicleNo: "MH14CD5678",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    advBranch: "ALC1",
    totalHire: 63200,
    advance: 20000,
    voucher: "BPV/ALC1/26111"
  },
  {
    id: "pfm-3",
    pdcNo: "DSBOM11100012",
    manualThcNo: "MTHC-87990",
    pdcDate: "2026-11-09",
    vehicleNo: "GJ01EF9012",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    advBranch: "ALC2",
    totalHire: 71500,
    advance: 25000,
    voucher: "BPV/ALC2/26098"
  },
  {
    id: "pfm-4",
    pdcNo: "PSBOM31100018",
    manualThcNo: "MTHC-88102",
    pdcDate: "2026-11-08",
    vehicleNo: "RJ14GH3456",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    advBranch: "ALC1",
    totalHire: 39200,
    advance: 10000,
    voucher: "BPV/ALC1/26088"
  },
  {
    id: "pfm-5",
    pdcNo: "DSBOM11100025",
    manualThcNo: "MTHC-88210",
    pdcDate: "2026-11-07",
    vehicleNo: "MP09JK7788",
    vendorCode: "VND1004",
    vendorName: "MEHTA FUELS PVT LTD",
    advBranch: "ALC3",
    totalHire: 27800,
    advance: 8000,
    voucher: "BPV/ALC3/26070"
  },
  {
    id: "pfm-6",
    pdcNo: "PSBOM31100030",
    manualThcNo: "MTHC-88301",
    pdcDate: "2026-11-05",
    vehicleNo: "HR26LM1122",
    vendorCode: "VND1002",
    vendorName: "PATEL ROADLINES",
    advBranch: "ALC1",
    totalHire: 55400,
    advance: 18000,
    voucher: "BPV/ALC1/26055"
  },
  {
    id: "pfm-7",
    pdcNo: "DSBOM11100040",
    manualThcNo: "MTHC-88400",
    pdcDate: "2026-11-04",
    vehicleNo: "UP32NO4455",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    advBranch: "ALC2",
    totalHire: 46800,
    advance: 12000,
    voucher: "BPV/ALC2/26040"
  },
  {
    id: "pfm-8",
    pdcNo: "PSBOM31100042",
    manualThcNo: "MTHC-88421",
    pdcDate: "2026-11-03",
    vehicleNo: "MH12PQ6677",
    vendorCode: "VND1001",
    vendorName: "SHREE TRANSPORT CO",
    advBranch: "ALC1",
    totalHire: 52100,
    advance: 16000,
    voucher: "BPV/ALC1/26033"
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("vendors") === "1") {
    return NextResponse.json({ success: true, data: DEMO_VENDORS });
  }

  const mode = (searchParams.get("mode") || "criteria").trim().toLowerCase();
  const dateMode = (searchParams.get("dateMode") || "today").trim().toLowerCase();
  const today = todayIso();
  let from = parseIso(searchParams.get("from"), today);
  let to = parseIso(searchParams.get("to"), today);

  if (dateMode === "today") {
    from = today;
    to = today;
  } else if (dateMode === "last7") {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    from = d.toISOString().slice(0, 10);
    to = today;
  }

  const vendor = (searchParams.get("vendor") || "").trim().toLowerCase();
  const pdcNumbersRaw = (searchParams.get("pdcNumbers") || searchParams.get("pdcNumber") || "").trim();

  let rows = [...DEMO_ROWS];

  if (mode === "pdc" || pdcNumbersRaw) {
    const codes = pdcNumbersRaw
      .split(",")
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean);
    if (!codes.length) {
      return NextResponse.json({ error: "Enter at least one PDC Number" }, { status: 400 });
    }
    rows = DEMO_ROWS.filter((r) => codes.some((c) => r.pdcNo.toUpperCase().includes(c)));
  } else {
    rows = DEMO_ROWS.filter((r) => r.pdcDate >= from && r.pdcDate <= to);
    if (vendor) {
      rows = rows.filter(
        (r) =>
          r.vendorCode.toLowerCase().includes(vendor) ||
          r.vendorName.toLowerCase().includes(vendor) ||
          `${r.vendorCode} - ${r.vendorName}`.toLowerCase().includes(vendor)
      );
    }
  }

  rows = rows.sort((a, b) => b.pdcDate.localeCompare(a.pdcDate) || a.pdcNo.localeCompare(b.pdcNo));

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
      mode: mode === "pdc" || pdcNumbersRaw ? "pdc" : "criteria",
      from: fmtDateLabel(from),
      to: fmtDateLabel(to),
      vendor: vendor || "All",
      pdcNumbers: pdcNumbersRaw || ""
    }
  });
}
