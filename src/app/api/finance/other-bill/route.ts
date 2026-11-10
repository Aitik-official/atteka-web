import { NextRequest, NextResponse } from "next/server";

const DEMO_PARTIES = [
  { code: "CUS1001", name: "NORTHBOUND FREIGHT PVT LTD", gstin: "27AABCN1001A1Z5", creditLimit: 500000, osAmt: 125000 },
  { code: "CUS1002", name: "METRO LOGISTICS PARTNERS", gstin: "27AABCM1002B1Z8", creditLimit: 300000, osAmt: 45000 },
  { code: "CUS1003", name: "COASTAL CARGO SOLUTIONS", gstin: "24AABCC1003C1Z2", creditLimit: 250000, osAmt: 0 },
  { code: "CUS1004", name: "GATEWAY DISTRIBUTION CO", gstin: "29AABCG1004D1Z6", creditLimit: 400000, osAmt: 88000 }
];

/** Fabricated other-bill parties — not client production data. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("parties") === "1") {
    return NextResponse.json({
      success: true,
      data: DEMO_PARTIES.map((p) => ({
        ...p,
        label: `${p.code} - ${p.name}`
      }))
    });
  }
  return NextResponse.json({ success: true, data: [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const billingParty = String(body.billingParty || "").trim();
    const charges = body.charges || {};
    const total = Number(body.total || 0);

    if (!billingParty) {
      return NextResponse.json({ error: "Select Billing Party" }, { status: 400 });
    }
    if (!total || total <= 0) {
      return NextResponse.json({ error: "Enter at least one charge amount" }, { status: 400 });
    }

    const billNo = `OB/ALC1/${Date.now().toString().slice(-8)}`;
    return NextResponse.json({
      success: true,
      message: `Other Bill ${billNo} generated (demo)`,
      data: {
        billNo,
        billingParty,
        manualBillNo: body.manualBillNo || "",
        billDate: body.billDate || "",
        total: Number(total.toFixed(2)),
        charges,
        remark: body.remark || "",
        docketNo: body.docketNo || "",
        preparedAt: "ALC1",
        preparedBy: "AL002"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to generate Other Bill" }, { status: 500 });
  }
}
