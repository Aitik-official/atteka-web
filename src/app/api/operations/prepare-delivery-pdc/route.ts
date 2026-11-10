import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";

type Row = {
  id: string;
  docketNo: string;
  docketDate: string;
  docketDateLabel: string;
  bookingBranch: string;
  consigneeName: string;
  pkgsTotal: number;
  weightTotal: number;
  vehicleNo: string;
  ewayBillNo: string;
};

/** Fabricated delivery-PDC dockets — not client production data. */
const DEMO_ROWS: Row[] = [
  {
    id: "dp-1",
    docketNo: "ALC12660633",
    docketDate: "2026-11-10",
    docketDateLabel: "10/11/2026",
    bookingBranch: "ALC1",
    consigneeName: "NORTHBOUND FREIGHT PVT LTD",
    pkgsTotal: 1,
    weightTotal: 9000,
    vehicleNo: "MH46BB6094",
    ewayBillNo: "-"
  },
  {
    id: "dp-2",
    docketNo: "ALC12660617",
    docketDate: "2026-11-09",
    docketDateLabel: "09/11/2026",
    bookingBranch: "ALC1",
    consigneeName: "METRO LOGISTICS PARTNERS",
    pkgsTotal: 1,
    weightTotal: 8500,
    vehicleNo: "MH46DC4316",
    ewayBillNo: "-"
  },
  {
    id: "dp-3",
    docketNo: "ALC12660634",
    docketDate: "2026-11-08",
    docketDateLabel: "08/11/2026",
    bookingBranch: "ALC1",
    consigneeName: "COASTAL CARGO SOLUTIONS",
    pkgsTotal: 1,
    weightTotal: 6000,
    vehicleNo: "MH12AB1201",
    ewayBillNo: "-"
  },
  {
    id: "dp-4",
    docketNo: "ALC12660635",
    docketDate: "2026-11-07",
    docketDateLabel: "07/11/2026",
    bookingBranch: "ALC1",
    consigneeName: "GATEWAY DISTRIBUTION CO",
    pkgsTotal: 2,
    weightTotal: 7200,
    vehicleNo: "MH04CD3402",
    ewayBillNo: "-"
  },
  {
    id: "dp-5",
    docketNo: "ALC12660636",
    docketDate: "2026-11-06",
    docketDateLabel: "06/11/2026",
    bookingBranch: "ALC1",
    consigneeName: "NORTHBOUND FREIGHT PVT LTD",
    pkgsTotal: 1,
    weightTotal: 0,
    vehicleNo: "MH46BB6095",
    ewayBillNo: "-"
  },
  {
    id: "dp-6",
    docketNo: "ALC12660637",
    docketDate: "2026-11-05",
    docketDateLabel: "05/11/2026",
    bookingBranch: "ALC2",
    consigneeName: "METRO LOGISTICS PARTNERS",
    pkgsTotal: 1,
    weightTotal: 0,
    vehicleNo: "GJ05EF5601",
    ewayBillNo: "-"
  },
  {
    id: "dp-7",
    docketNo: "ALC12660638",
    docketDate: "2026-11-04",
    docketDateLabel: "04/11/2026",
    bookingBranch: "ALC1",
    consigneeName: "COASTAL CARGO SOLUTIONS",
    pkgsTotal: 1,
    weightTotal: 6500,
    vehicleNo: "MH15GH7803",
    ewayBillNo: "-"
  },
  {
    id: "dp-8",
    docketNo: "ALC12660639",
    docketDate: "2026-11-03",
    docketDateLabel: "03/11/2026",
    bookingBranch: "ALC1",
    consigneeName: "GATEWAY DISTRIBUTION CO",
    pkgsTotal: 1,
    weightTotal: 9000,
    vehicleNo: "MH46DC4317",
    ewayBillNo: "-"
  }
];

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtDate(d: Date | string | undefined) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB");
}

function mapDoc(doc: any): Row {
  const raw = doc.bookingDate || doc.createdAt || new Date();
  const hash = String(doc.docketNo || "")
    .split("")
    .reduce((s: number, ch: string) => s + ch.charCodeAt(0), 0);
  return {
    id: String(doc._id || doc.docketNo),
    docketNo: String(doc.docketNo || "").toUpperCase(),
    docketDate: toIso(new Date(raw)),
    docketDateLabel: fmtDate(raw),
    bookingBranch: String(doc.bookingBranch || "ALC1").toUpperCase(),
    consigneeName: String(doc.consignee?.name || doc.billingParty || "").toUpperCase(),
    pkgsTotal: Number(doc.packageDetails?.packagesCount || 1),
    weightTotal: Number(doc.packageDetails?.actualWeight || doc.packageDetails?.chargedWeight || 0),
    vehicleNo: String(doc.vehicleNo || `MH${String(10 + (hash % 89)).padStart(2, "0")}AB${1000 + (hash % 9000)}`),
    ewayBillNo: String(doc.ewayBillNo || "-")
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const docketNos = (searchParams.get("docketNos") || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  try {
    await connectToDatabase();
    const query: any = { status: { $nin: ["CANCELLED"] } };

    if (docketNos.length) {
      query.docketNo = { $in: docketNos };
    } else if (from || to) {
      query.bookingDate = {};
      if (from) query.bookingDate.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) query.bookingDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const docs = await Consignment.find(query).sort({ bookingDate: -1 }).limit(300);
    let rows = docs.map(mapDoc);

    if (!rows.length) {
      let demo = DEMO_ROWS;
      if (docketNos.length) {
        demo = DEMO_ROWS.filter((r) => docketNos.some((d) => r.docketNo.includes(d)));
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
  } catch {
    let demo = DEMO_ROWS;
    if (docketNos.length) {
      demo = DEMO_ROWS.filter((r) => docketNos.some((d) => r.docketNo.includes(d)));
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
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const selected = Array.isArray(body.selected) ? body.selected : [];

    if (!selected.length) {
      return NextResponse.json({ error: "Select at least one docket" }, { status: 400 });
    }
    if (!String(body.vendor || "").trim() && !String(body.vehicleNo || "").trim()) {
      return NextResponse.json({ error: "Enter Vendor or Vehicle No." }, { status: 400 });
    }

    const pdcNo = `DPDC/ALC1/${Date.now().toString().slice(-8)}`;
    return NextResponse.json({
      success: true,
      message: `Delivery PDC ${pdcNo} prepared with ${selected.length} docket(s) (demo)`,
      data: {
        pdcNo,
        manualPdcNo: body.manualPdcNo || "",
        pdcDate: body.pdcDate || "",
        pdcTime: body.pdcTime || "",
        vendor: body.vendor || "",
        vehicleNo: body.vehicleNo || "",
        deliveryBy: body.deliveryBy || "",
        selected
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to prepare Delivery PDC" },
      { status: 500 }
    );
  }
}
