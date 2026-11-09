import { NextRequest, NextResponse } from "next/server";
import { getIrn, upsertGeneratedIrn } from "@/lib/irnDemoStore";

/** Fabricated demo bills for IRN selection — not client production data. */
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
  irnStatus: "Pending" | "Generated" | "Failed";
  irn?: string | null;
  ackNo?: string | null;
};

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
  for (let i = 0; i < 18; i++) {
    const cust = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
    const iso = addDays(today, -((i % 12) + 1));
    const amount = Number((45000 + (i % 9) * 8500 + (i % 4) * 1250.5).toFixed(2));
    const interState = i % 3 === 0;
    const igst = interState ? Number((amount * 0.12).toFixed(2)) : 0;
    const cgst = interState ? 0 : Number((amount * 0.06).toFixed(2));
    const sgst = interState ? 0 : Number((amount * 0.06).toFixed(2));
    const gross = Number((amount + igst + cgst + sgst).toFixed(2));
    rows.push({
      id: `IRN-BILL-${String(1000 + i)}`,
      billDate: fmtDate(iso),
      billDateIso: iso,
      billInvoiceNo: `BLALC${String(12606000 + i)}`,
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
      irnStatus: "Pending",
      irn: null,
      ackNo: null
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

  let rows = buildDemoBills().map((r) => {
    const saved = getIrn(r.billInvoiceNo);
    if (!saved || saved.status !== "Generated") return r;
    return {
      ...r,
      irnStatus: "Generated" as const,
      irn: saved.irnNo,
      ackNo: saved.ackNo
    };
  });

  if (!showAll) {
    rows = rows.filter((r) => r.billDateIso >= from && r.billDateIso <= to);
  }
  if (customer) {
    rows = rows.filter(
      (r) =>
        r.partyCode.includes(customer) ||
        r.party.toUpperCase().includes(customer) ||
        customer.includes(r.partyCode)
    );
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows,
    meta: {
      from: showAll ? null : from,
      to: showAll ? null : to,
      showAll,
      customer: customer || null,
      gstIntegration: "pending"
    }
  });
}

/**
 * Stub IRN generation — prepares payload shape for future GST / NIC IRP call.
 * Does not call live GST APIs.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const billInvoiceNo = String(body.billInvoiceNo || "").trim().toUpperCase();
  if (!billInvoiceNo) {
    return NextResponse.json({ success: false, error: "billInvoiceNo required" }, { status: 400 });
  }

  const bills = buildDemoBills();
  const bill = bills.find((b) => b.billInvoiceNo === billInvoiceNo);
  if (!bill) {
    return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });
  }

  // Ready-for-GST payload (next integration step)
  const gstPayload = {
    Version: "1.1",
    TranDtls: { TaxSch: "GST", SupTyp: "B2B", RegRev: "N", IgstOnIntra: "N" },
    DocDtls: {
      Typ: "INV",
      No: bill.billInvoiceNo,
      Dt: bill.billDate
    },
    SellerDtls: {
      Gstin: "27AABCADEMO1Z5",
      LglNm: "Ateka Logistics Demo",
      Loc: "ALC1"
    },
    BuyerDtls: {
      Gstin: bill.gstin,
      LglNm: bill.party,
      Pos: "27"
    },
    ItemList: [
      {
        SlNo: "1",
        PrdDesc: bill.incomeHeads,
        HsnCd: bill.sacCode,
        Qty: 1,
        Unit: "OTH",
        TotAmt: bill.amount,
        AssAmt: bill.amount,
        GstRt: bill.igst > 0 ? 12 : 12,
        IgstAmt: bill.igst,
        CgstAmt: bill.cgst,
        SgstAmt: bill.sgst,
        TotItemVal: bill.grossAmount
      }
    ],
    ValDtls: {
      AssVal: bill.amount,
      IgstVal: bill.igst,
      CgstVal: bill.cgst,
      SgstVal: bill.sgst,
      TotInvVal: bill.grossAmount
    }
  };

  const stamp = Date.now().toString(36).toUpperCase();
  const irn = `DEMO${stamp}${billInvoiceNo.slice(-6)}`.slice(0, 64);
  const ackNo = `ACK${stamp}`;
  const at = new Date().toISOString();

  upsertGeneratedIrn({
    documentNo: billInvoiceNo,
    documentType: "Invoice",
    documentDate: bill.billDate,
    documentDateIso: bill.billDateIso,
    party: bill.party,
    partyCode: bill.partyCode,
    branch: bill.branch,
    gstin: bill.gstin,
    ackNo,
    ackDate: at,
    irnNo: irn
  });

  return NextResponse.json({
    success: true,
    message: "Demo IRN stub generated. GST / NIC IRP integration is pending.",
    gstIntegration: "pending",
    data: {
      billInvoiceNo,
      irn,
      ackNo,
      ackDate: at,
      status: "Generated",
      signedInvoice: null,
      signedQRCode: null,
      // Keep payload for the upcoming live adapter
      preparedPayload: gstPayload
    }
  });
}
