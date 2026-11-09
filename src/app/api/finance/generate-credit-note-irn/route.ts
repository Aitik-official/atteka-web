import { NextRequest, NextResponse } from "next/server";
import { getIrn, upsertGeneratedIrn } from "@/lib/irnDemoStore";

/** Fabricated demo credit notes — not client production data. */
const DEMO_CUSTOMERS = [
  { code: "CUS0001", name: "NORTHBOUND FREIGHT PVT LTD", gstin: "27AABCN1001A1Z1" },
  { code: "CUS0002", name: "COASTAL CARGO SOLUTIONS", gstin: "27AABCC2002B1Z2" },
  { code: "CUS0003", name: "METRO LOGISTICS PARTNERS", gstin: "27AABCM3003C1Z3" },
  { code: "CUS0004", name: "GATEWAY DISTRIBUTION CO", gstin: "27AABCG4004D1Z4" }
];

type CnRow = {
  id: string;
  creditNoteDate: string;
  creditNoteDateIso: string;
  creditNoteNo: string;
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

function buildDemoCreditNotes(): CnRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: CnRow[] = [];
  for (let i = 0; i < 12; i++) {
    const cust = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
    const iso = addDays(today, -((i % 10) + 1));
    const amount = Number((12500 + (i % 7) * 3200 + (i % 3) * 450.25).toFixed(2));
    const interState = i % 3 === 0;
    const igst = interState ? Number((amount * 0.12).toFixed(2)) : 0;
    const cgst = interState ? 0 : Number((amount * 0.06).toFixed(2));
    const sgst = interState ? 0 : Number((amount * 0.06).toFixed(2));
    const gross = Number((amount + igst + cgst + sgst).toFixed(2));
    rows.push({
      id: `IRN-CN-${String(2000 + i)}`,
      creditNoteDate: fmtDate(iso),
      creditNoteDateIso: iso,
      creditNoteNo: `CNALC${String(12607000 + i)}`,
      party: `${cust.code} : ${cust.name}`,
      partyCode: cust.code,
      branch: "ALC1",
      gstin: cust.gstin,
      sacCode: i % 2 === 0 ? "996511" : "996791",
      incomeHeads: i % 2 === 0 ? "FREIGHT INCOME ADJUSTMENT" : "RATE DIFFERENCE / CLAIM",
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

  let rows = buildDemoCreditNotes().map((r) => {
    const saved = getIrn(r.creditNoteNo);
    if (!saved || saved.status !== "Generated") return r;
    return {
      ...r,
      irnStatus: "Generated" as const,
      irn: saved.irnNo,
      ackNo: saved.ackNo
    };
  });

  if (!showAll) {
    rows = rows.filter((r) => r.creditNoteDateIso >= from && r.creditNoteDateIso <= to);
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

/** Stub Credit Note IRN — prepares GST payload for later NIC IRP wiring. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const creditNoteNo = String(body.creditNoteNo || "").trim().toUpperCase();
  if (!creditNoteNo) {
    return NextResponse.json({ success: false, error: "creditNoteNo required" }, { status: 400 });
  }

  const note = buildDemoCreditNotes().find((r) => r.creditNoteNo === creditNoteNo);
  if (!note) {
    return NextResponse.json({ success: false, error: "Credit note not found" }, { status: 404 });
  }

  const gstPayload = {
    Version: "1.1",
    TranDtls: { TaxSch: "GST", SupTyp: "B2B", RegRev: "N", IgstOnIntra: "N" },
    DocDtls: {
      Typ: "CRN",
      No: note.creditNoteNo,
      Dt: note.creditNoteDate
    },
    SellerDtls: {
      Gstin: "27AABCADEMO1Z5",
      LglNm: "Ateka Logistics Demo",
      Loc: "ALC1"
    },
    BuyerDtls: {
      Gstin: note.gstin,
      LglNm: note.party,
      Pos: "27"
    },
    ItemList: [
      {
        SlNo: "1",
        PrdDesc: note.incomeHeads,
        HsnCd: note.sacCode,
        Qty: 1,
        Unit: "OTH",
        TotAmt: note.amount,
        AssAmt: note.amount,
        GstRt: 12,
        IgstAmt: note.igst,
        CgstAmt: note.cgst,
        SgstAmt: note.sgst,
        TotItemVal: note.grossAmount
      }
    ],
    ValDtls: {
      AssVal: note.amount,
      IgstVal: note.igst,
      CgstVal: note.cgst,
      SgstVal: note.sgst,
      TotInvVal: note.grossAmount
    }
  };

  const stamp = Date.now().toString(36).toUpperCase();
  const irn = `DEMOCN${stamp}${creditNoteNo.slice(-6)}`.slice(0, 64);
  const ackNo = `ACKCN${stamp}`;
  const at = new Date().toISOString();

  upsertGeneratedIrn({
    documentNo: creditNoteNo,
    documentType: "Credit Note",
    documentDate: note.creditNoteDate,
    documentDateIso: note.creditNoteDateIso,
    party: note.party,
    partyCode: note.partyCode,
    branch: note.branch,
    gstin: note.gstin,
    ackNo,
    ackDate: at,
    irnNo: irn
  });

  return NextResponse.json({
    success: true,
    message: "Demo Credit Note IRN stub generated. GST / NIC IRP integration is pending.",
    gstIntegration: "pending",
    data: {
      creditNoteNo,
      irn,
      ackNo,
      ackDate: at,
      status: "Generated",
      signedInvoice: null,
      signedQRCode: null,
      preparedPayload: gstPayload
    }
  });
}
