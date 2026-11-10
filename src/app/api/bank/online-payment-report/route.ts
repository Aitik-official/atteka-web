import { NextRequest, NextResponse } from "next/server";

type ReportRow = {
  id: string;
  paymentDate: string;
  voucherNo: string;
  vendorCode: string;
  vendorName: string;
  documentNo: string;
  paymentType: string;
  amount: number;
  bankName: string;
  acNoIfsc: string;
  paymentMode: string;
  utrRef: string;
  status: "Success" | "Pending" | "Failed" | "Reversed";
  entryBy: string;
  narration: string;
};

/** Fabricated demo online payment history — not client production data. */
const DEMO_ROWS: ReportRow[] = [
  {
    id: "opr-1",
    paymentDate: "2026-11-09",
    voucherNo: "BPV/ALC1/26007",
    vendorCode: "VND1001",
    vendorName: "PATEL ROADLINES",
    documentNo: "MR24112",
    paymentType: "F-Pay",
    amount: 63200,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "NEFT",
    utrRef: "INDB2611090001",
    status: "Success",
    entryBy: "AL015",
    narration: "Market truck hire settlement"
  },
  {
    id: "opr-2",
    paymentDate: "2026-11-08",
    voucherNo: "BPV/ALC1/26001",
    vendorCode: "VND1002",
    vendorName: "SHREE TRANSPORT CO",
    documentNo: "THC88421",
    paymentType: "F-Pay",
    amount: 48500,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "NEFT",
    utrRef: "INDB2611080004",
    status: "Success",
    entryBy: "AL002",
    narration: "Freight settlement against THC88421"
  },
  {
    id: "opr-3",
    paymentDate: "2026-11-07",
    voucherNo: "BPV/ALC1/26002",
    vendorCode: "VND1003",
    vendorName: "RAJESH KUMAR",
    documentNo: "ADV3108",
    paymentType: "A-Pay",
    amount: 12000,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "IMPS",
    utrRef: "INDB2611070012",
    status: "Success",
    entryBy: "AL015",
    narration: "Trip advance for driver"
  },
  {
    id: "opr-4",
    paymentDate: "2026-11-06",
    voucherNo: "BPV/ALC1/26003",
    vendorCode: "VND1004",
    vendorName: "MEHTA FUELS PVT LTD",
    documentNo: "BILL99210",
    paymentType: "B-Pay",
    amount: 156750.5,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "RTGS",
    utrRef: "INDB2611060008",
    status: "Success",
    entryBy: "AL002",
    narration: "Diesel / fuel vendor payment"
  },
  {
    id: "opr-5",
    paymentDate: "2026-11-05",
    voucherNo: "BPV/ALC1/26004",
    vendorCode: "VND1005",
    vendorName: "OFFICE MART SUPPLIES",
    documentNo: "OPS7711",
    paymentType: "O-Pay",
    amount: 8450,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "NEFT",
    utrRef: "INDB2611050015",
    status: "Failed",
    entryBy: "AL021",
    narration: "Stationery and admin purchase"
  },
  {
    id: "opr-6",
    paymentDate: "2026-11-04",
    voucherNo: "BPV/ALC1/26005",
    vendorCode: "VND1006",
    vendorName: "AUTO CARE GARAGE",
    documentNo: "FLT2201",
    paymentType: "Fleet",
    amount: 27500,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "NEFT",
    utrRef: "INDB2611040003",
    status: "Pending",
    entryBy: "AL008",
    narration: "Vehicle service / spare parts"
  },
  {
    id: "opr-7",
    paymentDate: "2026-11-03",
    voucherNo: "BPV/ALC1/26006",
    vendorCode: "VND1007",
    vendorName: "PAYROLL DISBURSEMENT",
    documentNo: "SAL-NOV-01",
    paymentType: "Salary",
    amount: 325000,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "Bulk NEFT",
    utrRef: "INDB2611030001",
    status: "Success",
    entryBy: "AL001",
    narration: "Staff salary disbursement"
  },
  {
    id: "opr-8",
    paymentDate: "2026-10-28",
    voucherNo: "BPV/ALC1/25988",
    vendorCode: "VND1002",
    vendorName: "SHREE TRANSPORT CO",
    documentNo: "THC88102",
    paymentType: "F-Pay",
    amount: 39200,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "NEFT",
    utrRef: "INDB2610280009",
    status: "Reversed",
    entryBy: "AL002",
    narration: "Reversal of duplicate freight payout"
  },
  {
    id: "opr-9",
    paymentDate: "2026-10-20",
    voucherNo: "BPV/ALC1/25950",
    vendorCode: "VND1008",
    vendorName: "NORTHWAY LOGISTICS",
    documentNo: "THC87990",
    paymentType: "F-Pay",
    amount: 71500,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "NEFT",
    utrRef: "INDB2610200011",
    status: "Success",
    entryBy: "AL015",
    narration: "Corridor freight settlement"
  },
  {
    id: "opr-10",
    paymentDate: "2026-10-15",
    voucherNo: "BPV/ALC1/25920",
    vendorCode: "VND1004",
    vendorName: "MEHTA FUELS PVT LTD",
    documentNo: "BILL98801",
    paymentType: "B-Pay",
    amount: 98420,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "RTGS",
    utrRef: "INDB2610150006",
    status: "Success",
    entryBy: "AL002",
    narration: "Bulk diesel purchase"
  }
];

const DEMO_VENDORS = Array.from(
  new Map(
    DEMO_ROWS.map((r) => [r.vendorCode, { code: r.vendorCode, name: r.vendorName, label: `${r.vendorCode} - ${r.vendorName}` }])
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
  const voucherNo = (searchParams.get("voucherNo") || "").trim().toLowerCase();

  let rows = DEMO_ROWS.filter((r) => r.paymentDate >= from && r.paymentDate <= to);

  if (vendor) {
    rows = rows.filter(
      (r) =>
        r.vendorCode.toLowerCase().includes(vendor) ||
        r.vendorName.toLowerCase().includes(vendor) ||
        `${r.vendorCode} - ${r.vendorName}`.toLowerCase().includes(vendor)
    );
  }
  if (voucherNo) {
    rows = rows.filter((r) => r.voucherNo.toLowerCase().includes(voucherNo));
  }

  const byStatus = rows.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + r.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const byType = rows.reduce(
    (acc, r) => {
      acc[r.paymentType] = (acc[r.paymentType] || 0) + r.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r, idx) => ({
      ...r,
      srNo: idx + 1,
      paymentDateLabel: fmtDateLabel(r.paymentDate),
      vendorLabel: `${r.vendorCode} - ${r.vendorName}`
    })),
    summary: {
      totalAmount,
      totalCount: rows.length,
      byStatus,
      byType,
      from: fmtDateLabel(from),
      to: fmtDateLabel(to)
    }
  });
}
