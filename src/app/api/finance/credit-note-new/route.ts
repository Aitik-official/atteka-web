import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo bills for Credit Note New — not client production data. */
const DEMO_CUSTOMERS = [
  { code: "CUS0001", name: "NORTHBOUND FREIGHT PVT LTD", gstin: "27AABCN1001A1Z1" },
  { code: "CUS0002", name: "COASTAL CARGO SOLUTIONS", gstin: "27AABCC2002B1Z2" },
  { code: "CUS0003", name: "METRO LOGISTICS PARTNERS", gstin: "27AABCM3003C1Z3" },
  { code: "CUS0004", name: "GATEWAY DISTRIBUTION CO", gstin: "27AABCG4004D1Z4" }
];

type BillRow = {
  id: string;
  billDate: string;
  billDateIso: string;
  billInvoiceNo: string;
  party: string;
  partyCode: string;
  branch: string;
  gstin: string;
  sacCode: string;
  incomeHeads: string;
  amount: number;
  igst: number;
  cgst: number;
  sgst: number;
  grossAmount: number;
  cnStatus: "Pending" | "Generated";
  creditNoteNo?: string | null;
  irn?: string | null;
};

const generatedStore = new Map<string, { creditNoteNo: string; irn: string }>();

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function buildDemoBills(): BillRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: BillRow[] = [];
  for (let i = 0; i < 16; i++) {
    const cust = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
    const iso = addDays(today, -((i % 14) + 1));
    const amount = Number((28500 + (i % 8) * 3125 + (i % 5) * 410.75).toFixed(2));
    const interState = i % 4 === 0;
    const igst = interState ? Number((amount * 0.12).toFixed(2)) : 0;
    const cgst = interState ? 0 : Number((amount * 0.06).toFixed(2));
    const sgst = interState ? 0 : Number((amount * 0.06).toFixed(2));
    const gross = Number((amount + igst + cgst + sgst).toFixed(2));
    const billInvoiceNo = `BLALC1${String(26071000 + i)}`;
    const saved = generatedStore.get(billInvoiceNo);
    rows.push({
      id: `CNNEW-${String(1000 + i)}`,
      billDate: fmtDate(iso),
      billDateIso: iso,
      billInvoiceNo,
      party: `${cust.code} : ${cust.name}`,
      partyCode: cust.code,
      branch: "ALC1",
      gstin: cust.gstin,
      sacCode: i % 2 === 0 ? "996511" : "996791",
      incomeHeads: i % 2 === 0 ? "FREIGHT INCOME (TBB)" : "OTHER CHARGES (INCOME)",
      amount,
      igst,
      cgst,
      sgst,
      grossAmount: gross,
      cnStatus: saved ? "Generated" : "Pending",
      creditNoteNo: saved?.creditNoteNo || null,
      irn: saved?.irn || null
    });
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("customers") === "1") {
    return NextResponse.json({
      success: true,
      data: DEMO_CUSTOMERS.map((c) => ({
        code: c.code,
        name: c.name,
        label: `${c.code} - ${c.name}`,
        gstin: c.gstin
      }))
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), addDays(today, -6));
  const to = parseIso(searchParams.get("to"), today);
  const showAll = searchParams.get("showAll") === "1";
  const customer = (searchParams.get("customer") || "").trim().toUpperCase();
  const billNo = (searchParams.get("billNo") || "").trim().toUpperCase();

  let rows = buildDemoBills();

  if (billNo) {
    rows = rows.filter(
      (r) =>
        r.billInvoiceNo.toUpperCase().includes(billNo) ||
        billNo.includes(r.billInvoiceNo.slice(-6))
    );
    if (!rows.length) {
      const cust = DEMO_CUSTOMERS[0];
      const amount = 18750.5;
      const cgst = Number((amount * 0.06).toFixed(2));
      const sgst = Number((amount * 0.06).toFixed(2));
      const billInvoiceNo = billNo.startsWith("BL")
        ? billNo
        : `BLALC1${billNo.replace(/\D/g, "").padStart(8, "0")}`;
      rows = [
        {
          id: "CNNEW-MANUAL",
          billDate: fmtDate(today),
          billDateIso: today,
          billInvoiceNo,
          party: `${cust.code} : ${cust.name}`,
          partyCode: cust.code,
          branch: "ALC1",
          gstin: cust.gstin,
          sacCode: "996511",
          incomeHeads: "FREIGHT INCOME (TBB)",
          amount,
          igst: 0,
          cgst,
          sgst,
          grossAmount: Number((amount + cgst + sgst).toFixed(2)),
          cnStatus: "Pending",
          creditNoteNo: null,
          irn: null
        }
      ];
    }
  } else {
    if (!showAll) {
      rows = rows.filter((r) => r.billDateIso >= from && r.billDateIso <= to);
    }
    if (customer) {
      rows = rows.filter(
        (r) =>
          r.party.toUpperCase().includes(customer) ||
          r.partyCode.toUpperCase().includes(customer)
      );
    }
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map(({ billDateIso: _iso, partyCode: _pc, ...rest }) => rest),
    meta: { from, to, showAll, customer: customer || null, billNo: billNo || null }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const billInvoiceNo = String(body.billInvoiceNo || "").trim().toUpperCase();
    if (!billInvoiceNo) {
      return NextResponse.json({ success: false, error: "Bill / Invoice No required" }, { status: 400 });
    }

    const creditNoteNo = `CNALC1${String(Date.now()).slice(-8)}`;
    const irn = `DEMO-CN-IRN-${billInvoiceNo.slice(-6)}-${Date.now().toString(36).toUpperCase()}`;
    generatedStore.set(billInvoiceNo, { creditNoteNo, irn });

    return NextResponse.json({
      success: true,
      message: "Credit Note New generated (demo). GST / NIC IRP pending.",
      data: {
        billInvoiceNo,
        creditNoteNo,
        irn,
        ackNo: `ACK${Date.now().toString().slice(-10)}`,
        generatedAt: new Date().toISOString()
      }
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }
}
