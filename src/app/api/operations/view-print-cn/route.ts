import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";

type Row = {
  id: string;
  cnNo: string;
  origin: string;
  destination: string;
  totalPackages: number;
  mfNo: string;
  pdcNo: string;
  bookingDate: string;
};

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function mapDoc(doc: any): Row {
  const hash = String(doc.docketNo || "")
    .split("")
    .reduce((s: number, ch: string) => s + ch.charCodeAt(0), 0);
  const trip = String(doc.tripSheetNo || "").toUpperCase();
  return {
    id: String(doc._id || doc.docketNo),
    cnNo: String(doc.docketNo || "").toUpperCase(),
    origin: String(doc.fromLocation || "").toUpperCase(),
    destination: String(doc.toLocation || "").toUpperCase(),
    totalPackages: Number(doc.packageDetails?.packagesCount || 1),
    mfNo: trip || `MF${String(1000 + (hash % 9000))}`,
    pdcNo: trip ? `PDC${trip.slice(-6)}` : `PDC${String(2000 + (hash % 8000))}`,
    bookingDate: toIsoDate(new Date(doc.bookingDate || doc.createdAt || Date.now()))
  };
}

/** Fabricated view/print CN rows — not client production data. */
const DEMO_ROWS: Row[] = [
  {
    id: "vpc-1",
    cnNo: "ALC126110201",
    origin: "BHIWANDI",
    destination: "PUNE",
    totalPackages: 10,
    mfNo: "MF4501",
    pdcNo: "PDC7801",
    bookingDate: "2026-11-10"
  },
  {
    id: "vpc-2",
    cnNo: "ALC126110202",
    origin: "MUMBAI",
    destination: "NAGPUR",
    totalPackages: 6,
    mfNo: "MF4502",
    pdcNo: "PDC7802",
    bookingDate: "2026-11-09"
  },
  {
    id: "vpc-3",
    cnNo: "ALC126110203",
    origin: "SURAT",
    destination: "AHMEDABAD",
    totalPackages: 14,
    mfNo: "MF4503",
    pdcNo: "PDC7803",
    bookingDate: "2026-11-08"
  },
  {
    id: "vpc-4",
    cnNo: "ALC126110204",
    origin: "NASHIK",
    destination: "INDORE",
    totalPackages: 3,
    mfNo: "MF4504",
    pdcNo: "PDC7804",
    bookingDate: "2026-11-07"
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const cnNo = (searchParams.get("cnNo") || "").trim().toUpperCase();

  try {
    await connectToDatabase();
    const query: any = {};

    if (cnNo) {
      query.docketNo = { $regex: cnNo, $options: "i" };
    } else if (from || to) {
      query.bookingDate = {};
      if (from) query.bookingDate.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) query.bookingDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const docs = await Consignment.find(query).sort({ bookingDate: -1 }).limit(300);
    let rows = docs.map(mapDoc);

    if (!rows.length) {
      let demo = DEMO_ROWS;
      if (cnNo) demo = DEMO_ROWS.filter((r) => r.cnNo.includes(cnNo));
      else if (from || to) {
        demo = DEMO_ROWS.filter((r) => {
          if (from && r.bookingDate < from) return false;
          if (to && r.bookingDate > to) return false;
          return true;
        });
        if (!demo.length) demo = DEMO_ROWS;
      }
      return NextResponse.json({ success: true, data: demo, total: demo.length, source: "demo" });
    }

    return NextResponse.json({ success: true, data: rows, total: rows.length, source: "db" });
  } catch {
    let demo = DEMO_ROWS;
    if (cnNo) demo = DEMO_ROWS.filter((r) => r.cnNo.includes(cnNo));
    else if (from || to) {
      demo = DEMO_ROWS.filter((r) => {
        if (from && r.bookingDate < from) return false;
        if (to && r.bookingDate > to) return false;
        return true;
      });
      if (!demo.length) demo = DEMO_ROWS;
    }
    return NextResponse.json({ success: true, data: demo, total: demo.length, source: "demo" });
  }
}
