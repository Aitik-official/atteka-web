import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TripSheet } from "@/models/TripSheet";
import { memoryStore } from "@/lib/memoryStore";

type Row = {
  id: string;
  tripSheetNo: string;
  docketNo: string;
  docketDate: string;
  docketDateLabel: string;
  customerName: string;
  fromLocation: string;
  toLocation: string;
  vehicleNo: string;
  freightAmt: number;
  advanceAmt: number;
  balanceAmt: number;
};

/** Fabricated loading-sheet rows — not client production data. */
const DEMO_ROWS: Row[] = [
  {
    id: "ls-1",
    tripSheetNo: "TS12600601",
    docketNo: "ALC12600616",
    docketDate: "2026-11-04",
    docketDateLabel: "04 Nov 2026",
    customerName: "NORTHBOUND FREIGHT PVT LTD",
    fromLocation: "BHIWANDI",
    toLocation: "HYDERABAD",
    vehicleNo: "MH04JK3315",
    freightAmt: 15000,
    advanceAmt: 0,
    balanceAmt: 15000
  },
  {
    id: "ls-2",
    tripSheetNo: "TS12600602",
    docketNo: "ALC12600617",
    docketDate: "2026-11-04",
    docketDateLabel: "04 Nov 2026",
    customerName: "METRO LOGISTICS PARTNERS",
    fromLocation: "MUMBAI CITY",
    toLocation: "NHAVASHEVA",
    vehicleNo: "MH46BU8201",
    freightAmt: 4000,
    advanceAmt: 4000,
    balanceAmt: 0
  },
  {
    id: "ls-3",
    tripSheetNo: "TS12600603",
    docketNo: "ALC12600618",
    docketDate: "2026-11-05",
    docketDateLabel: "05 Nov 2026",
    customerName: "COASTAL CARGO SOLUTIONS",
    fromLocation: "BHIWANDI",
    toLocation: "HYDERABAD",
    vehicleNo: "MH12AB4501",
    freightAmt: 12000,
    advanceAmt: 3000,
    balanceAmt: 9000
  },
  {
    id: "ls-4",
    tripSheetNo: "TS12600604",
    docketNo: "ALC12600619",
    docketDate: "2026-11-06",
    docketDateLabel: "06 Nov 2026",
    customerName: "GATEWAY DISTRIBUTION CO",
    fromLocation: "PUNE",
    toLocation: "AHMEDABAD",
    vehicleNo: "MH04JK3316",
    freightAmt: 8000,
    advanceAmt: 0,
    balanceAmt: 8000
  },
  {
    id: "ls-5",
    tripSheetNo: "TS12600605",
    docketNo: "ALC12600620",
    docketDate: "2026-11-07",
    docketDateLabel: "07 Nov 2026",
    customerName: "NORTHBOUND FREIGHT PVT LTD",
    fromLocation: "NASHIK",
    toLocation: "NAGPUR",
    vehicleNo: "MH15CD7801",
    freightAmt: 9500,
    advanceAmt: 2000,
    balanceAmt: 7500
  },
  {
    id: "ls-6",
    tripSheetNo: "TS12600606",
    docketNo: "ALC12600621",
    docketDate: "2026-11-08",
    docketDateLabel: "08 Nov 2026",
    customerName: "METRO LOGISTICS PARTNERS",
    fromLocation: "BHIWANDI",
    toLocation: "CHENNAI",
    vehicleNo: "MH46DC4316",
    freightAmt: 18000,
    advanceAmt: 5000,
    balanceAmt: 13000
  }
];

function fmtLabel(d: Date | string | undefined) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toIso(d: Date | string | undefined) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function flattenTrip(ts: any): Row[] {
  const dockets = Array.isArray(ts.dockets) ? ts.dockets : [];
  const freight = Number(ts.freight || 0);
  const advance = Number(ts.advanceAmt || 0);
  const balance = Number(ts.balanceAmt || freight - advance);
  if (!dockets.length) {
    return [
      {
        id: String(ts._id || ts.tripSheetNo),
        tripSheetNo: String(ts.tripSheetNo || ""),
        docketNo: "-",
        docketDate: toIso(ts.tripDate),
        docketDateLabel: fmtLabel(ts.tripDate),
        customerName: String(ts.customerName || "").toUpperCase(),
        fromLocation: String(ts.pickupLocation || "").toUpperCase(),
        toLocation: String(ts.deliveryLocation || "").toUpperCase(),
        vehicleNo: String(ts.vehicleNo || "").toUpperCase(),
        freightAmt: freight,
        advanceAmt: advance,
        balanceAmt: balance
      }
    ];
  }
  return dockets.map((d: any, idx: number) => ({
    id: `${ts._id || ts.tripSheetNo}-${idx}`,
    tripSheetNo: String(ts.tripSheetNo || ""),
    docketNo: String(d.docketNo || "-").toUpperCase(),
    docketDate: toIso(d.refDate || ts.tripDate),
    docketDateLabel: fmtLabel(d.refDate || ts.tripDate),
    customerName: String(ts.customerName || d.consignorName || "").toUpperCase(),
    fromLocation: String(ts.pickupLocation || "").toUpperCase(),
    toLocation: String(ts.deliveryLocation || d.deliveryAddress || "").toUpperCase(),
    vehicleNo: String(ts.vehicleNo || "").toUpperCase(),
    freightAmt: freight,
    advanceAmt: advance,
    balanceAmt: balance
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const docketNo = (searchParams.get("docketNo") || "").trim().toUpperCase();

  let rows: Row[] = [];

  try {
    await connectToDatabase();
    const list = await TripSheet.find().sort({ createdAt: -1 }).limit(200);
    rows = list.flatMap(flattenTrip);
  } catch {
    const mem = Array.isArray(memoryStore.tripSheets) ? memoryStore.tripSheets : [];
    rows = mem.flatMap(flattenTrip);
  }

  if (docketNo) {
    rows = rows.filter((r) => r.docketNo.includes(docketNo) || r.tripSheetNo.includes(docketNo));
  } else if (from || to) {
    rows = rows.filter((r) => {
      if (from && r.docketDate && r.docketDate < from) return false;
      if (to && r.docketDate && r.docketDate > to) return false;
      return true;
    });
  }

  if (!rows.length) {
    let demo = DEMO_ROWS;
    if (docketNo) {
      demo = DEMO_ROWS.filter((r) => r.docketNo.includes(docketNo));
    } else if (from || to) {
      demo = DEMO_ROWS.filter((r) => {
        if (from && r.docketDate < from) return false;
        if (to && r.docketDate > to) return false;
        return true;
      });
      if (!demo.length) demo = DEMO_ROWS;
    }
    return NextResponse.json({ success: true, data: demo, total: demo.length, source: "demo" });
  }

  return NextResponse.json({ success: true, data: rows, total: rows.length, source: "db" });
}
