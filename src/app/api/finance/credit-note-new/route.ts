import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import {
  createCreditNote,
  listBillingParties,
  listCreditNoteBills
} from "@/lib/customerBillingMrEngine";

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

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("customers") === "1") {
      const customers = await listBillingParties();
      return NextResponse.json({ success: true, data: customers, source: "db" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), addDays(today, -6));
    const to = parseIso(searchParams.get("to"), today);
    const showAll = searchParams.get("showAll") === "1";
    const customer = (searchParams.get("customer") || "").trim();
    const billNo = (searchParams.get("billNo") || "").trim().toUpperCase();

    const rows = await listCreditNoteBills({
      from,
      to,
      showAll,
      customer: customer || undefined,
      billNo: billNo || undefined
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows.map(({ billDateIso: _iso, partyCode: _pc, ...rest }) => rest),
      source: "db",
      meta: { from, to, showAll, customer: customer || null, billNo: billNo || null }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load credit note bills" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const billInvoiceNo = String(body.billInvoiceNo || "").trim().toUpperCase();
    if (!billInvoiceNo) {
      return NextResponse.json({ success: false, error: "Bill / Invoice No required" }, { status: 400 });
    }

    const billRowAmount = Number(body.amount || 0);
    const data = await createCreditNote({
      systemBillNo: billInvoiceNo,
      billInvoiceNo,
      amount: billRowAmount || undefined,
      igst: body.igst,
      cgst: body.cgst,
      sgst: body.sgst,
      totalAmt: body.grossAmount || body.totalAmt,
      withIrn: true,
      reason: body.reason || "Credit Note New"
    });

    return NextResponse.json({
      success: true,
      message: data.message,
      data: {
        billInvoiceNo,
        creditNoteNo: data.creditNoteNo,
        irn: data.irn,
        ackNo: data.ackNo,
        irnStored: true,
        gstPortal: "not_connected",
        generatedAt: data.generatedAt
      },
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Invalid request body" },
      { status: Number(error?.status) || 400 }
    );
  }
}
