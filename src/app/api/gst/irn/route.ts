import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { GstOperation } from "@/models/GstOperation";
import { CustomerBill } from "@/models/CustomerBill";
import { gstService } from "@/services/gstService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { billNumber, sellerGstin, buyerGstin, totalAmount, taxAmount } = body;

    const irnResult = await gstService.generateIRN({
      billNumber: billNumber || `BILL-${Date.now()}`,
      billDate: new Date().toISOString(),
      sellerGstin: sellerGstin || "27AABCA1234F1Z5",
      buyerGstin: buyerGstin || "27AABCB9876G1Z2",
      totalAmount: Number(totalAmount) || 10000,
      taxAmount: Number(taxAmount) || 500
    });

    const record = {
      referenceDocNumber: billNumber,
      gstin: sellerGstin || "27AABCA1234F1Z5",
      operationType: "E_INVOICE_IRN",
      irnNumber: irnResult.irn,
      ackNumber: irnResult.ackNo,
      status: "GENERATED",
      isSimulated: true,
      responsePayload: irnResult
    };

    try {
      await connectToDatabase();
      const savedRecord = await GstOperation.create(record);
      return NextResponse.json({
        success: true,
        message: irnResult.message,
        data: savedRecord,
        isSimulated: true
      });
    } catch {
      return NextResponse.json({
        success: true,
        message: irnResult.message,
        data: record,
        isSimulated: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const irn = searchParams.get("irn");
    const reason = searchParams.get("reason") || "Data entry error";

    if (!irn) {
      return NextResponse.json({ error: "IRN is required" }, { status: 400 });
    }

    const cancelResult = await gstService.cancelIRN(irn, reason);

    try {
      await connectToDatabase();
      await GstOperation.findOneAndUpdate(
        { irnNumber: irn },
        { $set: { status: "CANCELLED" } }
      );
    } catch {
      // Memory store fallback
    }

    return NextResponse.json({
      success: true,
      message: cancelResult.message,
      isSimulated: true
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
