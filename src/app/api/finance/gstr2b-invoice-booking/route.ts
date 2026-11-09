import { NextResponse } from "next/server";

/** Fabricated demo GSTR2B invoices — not client production data. */
const DEMO_VENDORS = [
  { code: "VND0001", name: "ATLAS SPARES TRADING", gstin: "27AABCA1001A1Z1" },
  { code: "VND0002", name: "METRO TYRE SUPPLIES", gstin: "27AABCM2002B1Z2" },
  { code: "VND0003", name: "COASTAL FUEL AGENCY", gstin: "27AABCC3003C1Z3" },
  { code: "VND0004", name: "GATEWAY WORKSHOP SERVICES", gstin: "27AABCG4004D1Z4" }
];

const ACCOUNT_DESCS = [
  "Purchase - Spares",
  "Purchase - Tyres",
  "Fuel Expense",
  "Repair & Maintenance"
];

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const rows = Array.from({ length: 12 }, (_, i) => {
    const vendor = DEMO_VENDORS[i % DEMO_VENDORS.length];
    const iso = addDays(today, -((i % 8) + 1));
    const taxable = Number((5200 + (i % 7) * 950 + (i % 4) * 125.5).toFixed(2));
    const interState = i % 3 === 0;
    const igst = interState ? Number((taxable * 0.18).toFixed(2)) : 0;
    const cgst = interState ? 0 : Number((taxable * 0.09).toFixed(2));
    const sgst = interState ? 0 : Number((taxable * 0.09).toFixed(2));
    const cess = i % 5 === 0 ? Number((taxable * 0.01).toFixed(2)) : 0;
    const invoiceAmount = Number((taxable + igst + cgst + sgst + cess).toFixed(2));
    return {
      id: `GSTR2B-${1001 + i}`,
      invoiceDate: fmtDate(iso),
      invoiceDateIso: iso,
      invoiceNo: `G2B/INV/${String(2608000 + i).padStart(7, "0")}`,
      gstin: vendor.gstin,
      vendorCode: vendor.code,
      vendorName: vendor.name,
      taxableAmount: taxable,
      igst,
      cgst,
      sgst,
      cess,
      invoiceAmount,
      accountDesc: ACCOUNT_DESCS[i % ACCOUNT_DESCS.length]
    };
  });

  return NextResponse.json({ success: true, count: rows.length, data: rows });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) {
      return NextResponse.json({ success: false, error: "Select at least one invoice" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: `${ids.length} GSTR2B invoice(s) booked (demo)`,
      data: { bookedIds: ids, bookedAt: new Date().toISOString() }
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }
}
