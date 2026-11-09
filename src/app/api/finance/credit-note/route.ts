import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo bills for Credit Note — not client production data. */
type ChargeBreakdown = {
  freight: number;
  statisticalCharges: number;
  detentionCharges: number;
  collectionCharges: number;
  otherCharge: number;
  extraWtCharge: number;
  deliveryCharges: number;
  loadingCharges: number;
  unloadingCharges: number;
  escortCharges: number;
  diplomatCharges: number;
  codDddCharges: number;
  serviceCharges: number;
};

type BillDetail = {
  systemBillNo: string;
  billDate: string;
  billBranch: string;
  billingToParty: string;
  partyName: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  osAmount: number;
  cnNo: string;
  charges: ChargeBreakdown;
  igst: number;
  cgst: number;
  sgst: number;
};

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fmtBillDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildBill(billNoRaw: string): BillDetail {
  const cleaned = billNoRaw.trim().toUpperCase().replace(/\s+/g, "");
  const systemBillNo = cleaned.startsWith("BL")
    ? cleaned
    : `BLALC1${cleaned.replace(/\D/g, "").padStart(8, "0") || "26001842"}`;

  const h = hashCode(systemBillNo);
  const freight = Number((42000 + (h % 17) * 1750 + (h % 9) * 125.5).toFixed(2));
  const statisticalCharges = h % 5 === 0 ? 250 : 0;
  const detentionCharges = h % 7 === 0 ? 500 : 0;
  const collectionCharges = 0;
  const otherCharge = h % 4 === 0 ? 150 : 0;
  const extraWtCharge = h % 6 === 0 ? 320 : 0;
  const deliveryCharges = h % 3 === 0 ? 200 : 0;
  const loadingCharges = 0;
  const unloadingCharges = 0;
  const escortCharges = 0;
  const diplomatCharges = 0;
  const codDddCharges = 0;
  const serviceCharges = h % 8 === 0 ? 100 : 0;

  const charges: ChargeBreakdown = {
    freight,
    statisticalCharges,
    detentionCharges,
    collectionCharges,
    otherCharge,
    extraWtCharge,
    deliveryCharges,
    loadingCharges,
    unloadingCharges,
    escortCharges,
    diplomatCharges,
    codDddCharges,
    serviceCharges
  };

  const subtotal = Object.values(charges).reduce((a, b) => a + b, 0);
  // Intra-state demo: CGST + SGST @ 9% each
  const cgst = Number((subtotal * 0.09).toFixed(2));
  const sgst = Number((subtotal * 0.09).toFixed(2));
  const igst = 0;
  const gstAmount = Number((cgst + sgst + igst).toFixed(2));
  const totalAmount = Number((subtotal + gstAmount).toFixed(2));

  const billDateObj = new Date();
  billDateObj.setDate(billDateObj.getDate() - ((h % 40) + 5));

  const parties = [
    { code: "P000101", name: "NORTHBOUND FREIGHT PVT LTD" },
    { code: "P000102", name: "COASTAL CARGO SOLUTIONS" },
    { code: "P000103", name: "METRO LOGISTICS PARTNERS" },
    { code: "P000104", name: "GATEWAY DISTRIBUTION CO" }
  ];
  const party = parties[h % parties.length];

  return {
    systemBillNo,
    billDate: fmtBillDate(billDateObj),
    billBranch: "ALC1",
    billingToParty: party.code,
    partyName: party.name,
    amount: Number(subtotal.toFixed(2)),
    gstAmount,
    totalAmount,
    osAmount: totalAmount,
    cnNo: `ALC1${String(26020000 + (h % 9000))}`,
    charges,
    igst,
    cgst,
    sgst
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const billNo = (searchParams.get("billNo") || "").trim();
  if (!billNo) {
    return NextResponse.json({ success: false, error: "Enter Bill No." }, { status: 400 });
  }

  const bill = buildBill(billNo);
  return NextResponse.json({ success: true, data: bill });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const systemBillNo = String(body.systemBillNo || "").trim();
    if (!systemBillNo) {
      return NextResponse.json({ success: false, error: "Bill details missing" }, { status: 400 });
    }

    const creditNoteNo =
      String(body.creditNoteNo || "").trim() ||
      `CN/ALC1/${String(Date.now()).slice(-7)}`;
    const creditNoteDate = String(body.creditNoteDate || new Date().toISOString().slice(0, 10));
    const amount = Number(body.amount || 0);
    const igst = Number(body.igst || 0);
    const cgst = Number(body.cgst || 0);
    const sgst = Number(body.sgst || 0);
    const totalAmt = Number(body.totalAmt || amount + igst + cgst + sgst);
    const reason = String(body.reason || "").trim();

    return NextResponse.json({
      success: true,
      message: "Credit Note generated (demo)",
      data: {
        creditNoteNo,
        creditNoteDate,
        systemBillNo,
        amount,
        igst,
        cgst,
        sgst,
        totalAmt,
        reason: reason || null,
        generatedAt: new Date().toISOString()
      }
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }
}
