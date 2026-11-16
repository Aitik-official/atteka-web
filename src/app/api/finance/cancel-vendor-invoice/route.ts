import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { cancelVoucher, getVoucherByNumber, listVouchers } from "@/lib/vouchersEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("invoiceNo") || searchParams.get("voucherNumber") || "").trim();
    if (q) {
      const one = await getVoucherByNumber(q);
      if (one && (one.voucherKind === "VENDOR_INVOICE" || one.invoiceNo)) {
        return NextResponse.json({ success: true, data: one, source: "db" });
      }
      const byInvoice = await listVouchers({ kinds: ["VENDOR_INVOICE"], invoiceNumber: q, includeCancelled: true });
      return NextResponse.json({ success: true, data: byInvoice[0] || null, source: "db" });
    }
    const rows = await listVouchers({ kinds: ["VENDOR_INVOICE"], includeCancelled: true });
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
    let voucherNumber = String(body.voucherNumber || body.voucherNo || "").trim();
    const invoiceNo = String(body.invoiceNo || body.invoiceNumber || "").trim();
    if (!voucherNumber && invoiceNo) {
      const rows = await listVouchers({
        kinds: ["VENDOR_INVOICE"],
        invoiceNumber: invoiceNo,
        includeCancelled: true
      });
      voucherNumber = rows[0]?.voucherNumber || "";
    }
    if (!voucherNumber) {
      return NextResponse.json({ error: "Enter voucher / invoice number" }, { status: 400 });
    }
    const result = await cancelVoucher(voucherNumber, body.reason || "Vendor invoice cancelled");
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Cancel failed" },
      { status: Number(error?.status) || 500 }
    );
  }
}
