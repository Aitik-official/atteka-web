import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { createVoucher, listVendorsForVouchers } from "@/lib/vouchersEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;
  try {
    const vendors = await listVendorsForVouchers();
    return NextResponse.json({ success: true, data: vendors, source: "db" });
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
    const invoiceType = String(body.invoiceType || "Direct Invoice");
    if (!vendor) return NextResponse.json({ error: "Select vendor" }, { status: 400 });

    const amount = Number(body.amount || body.invoiceAmount || 0) || 1000;
    const row = await createVoucher({
      kind: "VENDOR_INVOICE",
      voucherType: invoiceType,
      voucherDate: body.invoiceDate || body.voucherDate,
      branch: body.location || "ALC1",
      party: vendor,
      payTo: vendor,
      amount,
      taxableAmount: Number(body.taxableAmount || amount),
      tdsAmount: Number(body.tds || 0),
      netPayable: Number(body.netPayable || amount),
      invoiceNo: body.invoiceNo || `INV/ALC1/${Date.now().toString().slice(-7)}`,
      documentNo: body.documentNo || body.docRefno || "",
      narration: body.narration || `Vendor invoice (${invoiceType}) - ${vendor}`,
      gstNo: body.gstNo,
      payload: body,
      status: "Submitted"
    });

    return NextResponse.json({
      success: true,
      message: `Vendor invoice ${row.invoiceNo || row.voucherNumber} saved`,
      data: {
        ...row,
        nextStep: "entry-complete",
        voucherNo: row.voucherNumber
      },
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save vendor invoice" },
      { status: Number(error?.status) || 500 }
    );
  }
}
