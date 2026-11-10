import { NextRequest, NextResponse } from "next/server";

const DEMO_PARTIES = [
  {
    code: "CUS1001",
    name: "NORTHBOUND FREIGHT PVT LTD",
    gstin: "27AABCN1001A1Z5",
    gstState: "27",
    address: "Plot 12, MIDC Bhosari, Pune",
    pinCode: "411026",
    creditLimit: 100000,
    osAmt: 25000
  },
  {
    code: "CUS1002",
    name: "METRO LOGISTICS PARTNERS",
    gstin: "27AABCM1002B1Z8",
    gstState: "27",
    address: "Warehouse 4, Bhiwandi Industrial Area",
    pinCode: "421302",
    creditLimit: 300000,
    osAmt: 45000
  },
  {
    code: "CUS1003",
    name: "COASTAL CARGO SOLUTIONS",
    gstin: "24AABCC1003C1Z2",
    gstState: "24",
    address: "Near ICD, Ahmedabad",
    pinCode: "382330",
    creditLimit: 250000,
    osAmt: 0
  },
  {
    code: "CUS1004",
    name: "GATEWAY DISTRIBUTION CO",
    gstin: "29AABCG1004D1Z6",
    gstState: "29",
    address: "Whitefield Logistics Park, Bengaluru",
    pinCode: "560066",
    creditLimit: 400000,
    osAmt: 88000
  }
];

const PROFIT_CENTERS = [
  { code: "ALC1", name: "Ateka Logistics - ALC1", gstin: "27AABCA0001A1Z1", gstState: "27" },
  { code: "ALC2", name: "Ateka Logistics - ALC2", gstin: "27AABCA0002B1Z2", gstState: "27" },
  { code: "ALC3", name: "Ateka Logistics - ALC3", gstin: "24AABCA0003C1Z3", gstState: "24" }
];

const BILLING_HEADS = [
  { code: "FREIGHT", label: "Freight Charges", sac: "996511", account: "Freight Income" },
  { code: "DETENTION", label: "Detention Charges", sac: "996511", account: "Detention Income" },
  { code: "LOADING", label: "Loading / Unloading", sac: "996719", account: "Handling Income" },
  { code: "DEMURRAGE", label: "Demurrage Charges", sac: "996511", account: "Demurrage Income" },
  { code: "MISC", label: "Miscellaneous Charges", sac: "996799", account: "Other Income" }
];

const SAC_CODES = ["996511", "996719", "996799", "996812"];

/** Fabricated customer-invoice masters — not client production data. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("masters") === "1") {
    return NextResponse.json({
      success: true,
      data: {
        billNo: `BLALC1${Date.now().toString().slice(-6)}`,
        parties: DEMO_PARTIES.map((p) => ({
          ...p,
          label: `${p.code} - ${p.name}`
        })),
        profitCenters: PROFIT_CENTERS,
        billingHeads: BILLING_HEADS,
        sacCodes: SAC_CODES,
        collectionBranches: PROFIT_CENTERS.map((p) => ({
          code: p.code,
          name: p.name === "Ateka Logistics - ALC1" ? "Ateka Logistics" : p.name
        }))
      }
    });
  }
  return NextResponse.json({ success: true, data: [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const billingParty = String(body.billingParty || "").trim();
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const netPayable = Number(body.netPayable || 0);

    if (!billingParty) {
      return NextResponse.json({ error: "Select Billing Party" }, { status: 400 });
    }
    if (!lines.length || netPayable <= 0) {
      return NextResponse.json({ error: "Add at least one charge line with amount" }, { status: 400 });
    }

    const billNo = String(body.billNo || `BLALC1${Date.now().toString().slice(-6)}`);
    return NextResponse.json({
      success: true,
      message: `Customer Invoice ${billNo} submitted (demo)`,
      data: {
        billNo,
        billDate: body.billDate || "",
        manualBillNo: body.manualBillNo || "",
        billingParty,
        gstTransactionType: body.gstTransactionType || "",
        totals: {
          amount: Number(body.totalAmount || 0),
          igst: Number(body.totalIgst || 0),
          cgst: Number(body.totalCgst || 0),
          sgst: Number(body.totalSgst || 0),
          netPayable: Number(netPayable.toFixed(2))
        },
        lines,
        remark: body.remark || ""
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit Customer Invoice" },
      { status: 500 }
    );
  }
}
