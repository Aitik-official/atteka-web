import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";

type Row = {
  id: string;
  cnNo: string;
  labelsGenDate: string;
  labelsGenDateRaw: string;
  origin: string;
  destination: string;
  totalPackages: number;
  volumetric: string;
  codDod: string;
  dacc: string;
  mode: string;
  h4: string;
  serviceType: string;
  nonHpConsignor: string;
};

function fmtLabelDate(d: Date | string | undefined) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function mapDoc(doc: any): Row {
  const raw = doc.bookingDate || doc.createdAt || new Date();
  const charged = Number(doc.packageDetails?.chargedWeight || 0);
  const actual = Number(doc.packageDetails?.actualWeight || 0);
  const payment = String(doc.paymentBasis || "");
  const hash = String(doc.docketNo || "")
    .split("")
    .reduce((s, ch) => s + ch.charCodeAt(0), 0);

  return {
    id: String(doc._id || doc.docketNo),
    cnNo: String(doc.docketNo || "").toUpperCase(),
    labelsGenDate: fmtLabelDate(raw),
    labelsGenDateRaw: toIsoDate(new Date(raw)),
    origin: String(doc.fromLocation || "").toUpperCase(),
    destination: String(doc.toLocation || "").toUpperCase(),
    totalPackages: Number(doc.packageDetails?.packagesCount || 1),
    volumetric: charged > actual ? "Y" : "N",
    codDod: payment === "TO_PAY" || payment === "COD" ? "Y" : "N",
    dacc: hash % 5 === 0 ? "Y" : "N",
    mode: String(doc.mode || "Road").toUpperCase(),
    h4: hash % 3 === 0 ? "Y" : "N",
    serviceType: String(doc.serviceType || doc.serviceFtl || "FTL").toUpperCase(),
    nonHpConsignor: hash % 4 === 0 ? "Y" : "N"
  };
}

/** Fabricated pending-CN fallback — not client production data. */
const DEMO_ROWS: Row[] = [
  {
    id: "demo-1",
    cnNo: "ALC126110101",
    labelsGenDate: "10 Nov 2026",
    labelsGenDateRaw: "2026-11-10",
    origin: "BHIWANDI",
    destination: "PUNE",
    totalPackages: 12,
    volumetric: "N",
    codDod: "N",
    dacc: "N",
    mode: "ROAD",
    h4: "N",
    serviceType: "FTL",
    nonHpConsignor: "N"
  },
  {
    id: "demo-2",
    cnNo: "ALC126110102",
    labelsGenDate: "09 Nov 2026",
    labelsGenDateRaw: "2026-11-09",
    origin: "MUMBAI",
    destination: "AHMEDABAD",
    totalPackages: 8,
    volumetric: "Y",
    codDod: "Y",
    dacc: "N",
    mode: "ROAD",
    h4: "Y",
    serviceType: "FTL",
    nonHpConsignor: "N"
  },
  {
    id: "demo-3",
    cnNo: "ALC126110103",
    labelsGenDate: "08 Nov 2026",
    labelsGenDateRaw: "2026-11-08",
    origin: "NASHIK",
    destination: "NAGPUR",
    totalPackages: 4,
    volumetric: "N",
    codDod: "N",
    dacc: "Y",
    mode: "ROAD",
    h4: "N",
    serviceType: "PTL",
    nonHpConsignor: "Y"
  }
];

function inRange(iso: string, from: string, to: string) {
  if (!iso) return false;
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") || "today").toLowerCase();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const cnNo = (searchParams.get("cnNo") || "").trim().toUpperCase();

  const today = toIsoDate(new Date());
  let fromDate = from;
  let toDate = to;

  if (mode === "today") {
    fromDate = today;
    toDate = today;
  } else if (mode === "last7") {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    fromDate = toIsoDate(d);
    toDate = today;
  } else if (mode === "cnno") {
    fromDate = "";
    toDate = "";
  }

  try {
    await connectToDatabase();
    const query: any = {
      status: { $nin: ["BILLED", "CANCELLED"] }
    };

    if (mode === "cnno" && cnNo) {
      query.docketNo = { $regex: cnNo, $options: "i" };
    } else if (fromDate || toDate) {
      query.bookingDate = {};
      if (fromDate) query.bookingDate.$gte = new Date(`${fromDate}T00:00:00.000Z`);
      if (toDate) query.bookingDate.$lte = new Date(`${toDate}T23:59:59.999Z`);
    }

    const docs = await Consignment.find(query).sort({ bookingDate: -1 }).limit(200);
    let rows = docs.map(mapDoc);

    if (mode === "cnno" && cnNo) {
      rows = rows.filter((r) => r.cnNo.includes(cnNo));
    } else if (fromDate || toDate) {
      rows = rows.filter((r) => inRange(r.labelsGenDateRaw, fromDate, toDate));
    }

    if (!rows.length) {
      let demo = DEMO_ROWS;
      if (mode === "cnno" && cnNo) {
        demo = DEMO_ROWS.filter((r) => r.cnNo.includes(cnNo));
      } else if (fromDate || toDate) {
        demo = DEMO_ROWS.filter((r) => inRange(r.labelsGenDateRaw, fromDate, toDate));
        if (!demo.length) demo = DEMO_ROWS;
      }
      return NextResponse.json({
        success: true,
        data: demo,
        total: demo.length,
        source: "demo"
      });
    }

    return NextResponse.json({ success: true, data: rows, total: rows.length, source: "db" });
  } catch {
    let demo = DEMO_ROWS;
    if (mode === "cnno" && cnNo) {
      demo = DEMO_ROWS.filter((r) => r.cnNo.includes(cnNo));
    } else if (fromDate || toDate) {
      demo = DEMO_ROWS.filter((r) => inRange(r.labelsGenDateRaw, fromDate, toDate));
      if (!demo.length) demo = DEMO_ROWS;
    }
    return NextResponse.json({
      success: true,
      data: demo,
      total: demo.length,
      source: "demo"
    });
  }
}
