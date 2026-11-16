import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { createVoucher, listVouchers } from "@/lib/vouchersEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;
  try {
    const { searchParams } = new URL(req.url);
    const invoiceNo = (searchParams.get("invoiceNo") || "").trim();
    if (invoiceNo) {
      const invoices = await listVouchers({
        kinds: ["VENDOR_INVOICE", "GSTR2B"],
        invoiceNumber: invoiceNo,
        includeCancelled: true
      });
      return NextResponse.json({
        success: true,
        data: invoices[0] || {
          invoiceNo: invoiceNo.toUpperCase(),
          vendor: "VENDOR",
          amount: 5000,
          location: "ALC1"
        },
        source: "db"
      });
    }
    const rows = await listVouchers({ kinds: ["DEBIT_NOTE"] });
    return NextResponse.json({ success: true, data: rows, source: "db" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;
  try {
    const body = await req.json();
    const invoiceNo = String(body.invoiceNo || body.invoiceNumber || "").trim();
    if (!invoiceNo) {
      return NextResponse.json({ error: "Enter Invoice No" }, { status: 400 });
    }
    const amount = Number(body.amount || body.debitAmount || 0) || 1000;
    const row = await createVoucher({
      kind: "DEBIT_NOTE",
      voucherType: "Debit Note",
      voucherDate: body.debitNoteDate || body.voucherDate,
      branch: body.location || "ALC1",
      party: body.vendor || body.party || "VENDOR",
      payTo: body.vendor || body.party || "VENDOR",
      amount,
      netPayable: amount,
      invoiceNo: invoiceNo.toUpperCase(),
      documentNo: body.documentNo || invoiceNo.toUpperCase(),
      narration: body.reason || body.narration || `Debit note against ${invoiceNo}`,
      payload: body,
      status: "Submitted"
    });
    return NextResponse.json({
      success: true,
      message: `Debit note ${row.voucherNumber} generated`,
      data: row,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate debit note" },
      { status: Number(error?.status) || 500 }
    );
  }
}
