import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { createVoucher, listVendorsForVouchers, listVouchers } from "@/lib/vouchersEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("vendors") === "1") {
      return NextResponse.json({
        success: true,
        data: await listVendorsForVouchers(),
        source: "db"
      });
    }
    const vendor = (searchParams.get("vendor") || "").trim();
    const invoices = await listVouchers({
      kinds: ["VENDOR_INVOICE"],
      vendor: vendor || undefined
    });
    return NextResponse.json({ success: true, data: invoices, source: "db" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const vendor = String(body.vendor || "").trim();
    if (!vendor) return NextResponse.json({ error: "Select vendor" }, { status: 400 });

    const amount = Number(body.amount || body.paymentAmount || 0) || 1000;
    const row = await createVoucher({
      kind: "VENDOR_PAYMENT",
      voucherType: body.paymentMode || "Vendor Payment",
      voucherDate: body.paymentDate || body.voucherDate,
      branch: body.location || "ALC1",
      party: vendor,
      payTo: vendor,
      amount,
      netPayable: amount,
      documentNo: body.againstInvoice || body.documentNo || "",
      invoiceNo: body.againstInvoice || "",
      narration: body.narration || `Vendor payment - ${vendor}`,
      modeOfTransaction: body.paymentMode || body.mode || "NEFT",
      cashBankAccount: body.cashBankAccount || "HDFC Bank - Ops",
      chequeNo: body.chequeNo,
      chequeDate: body.chequeDate,
      payload: body,
      status: "Paid"
    });

    return NextResponse.json({
      success: true,
      message: `Vendor payment ${row.voucherNumber} saved`,
      data: { ...row, nextStep: "payment-complete", voucherNo: row.voucherNumber },
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save vendor payment" },
      { status: Number(error?.status) || 500 }
    );
  }
}
