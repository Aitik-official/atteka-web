import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MoneyReceipt } from "@/models/MoneyReceipt";
import { CustomerBill } from "@/models/CustomerBill";

export async function GET() {
  try {
    await connectToDatabase();
    const receipts = await MoneyReceipt.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: receipts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { customerCode, customerName, allocatedBills, paymentMode, referenceNumber, totalReceived, tdsDeducted, rebateDiscount } = body;

    const mrNumber = `MR-${Date.now().toString().slice(-6)}`;

    const newMR = await MoneyReceipt.create({
      mrNumber,
      customerCode,
      customerName,
      allocatedBills: allocatedBills || [],
      paymentMode: paymentMode || "NEFT",
      referenceNumber: referenceNumber || "CHQ0001",
      totalReceived: Number(totalReceived) || 0,
      tdsDeducted: Number(tdsDeducted) || 0,
      rebateDiscount: Number(rebateDiscount) || 0
    });

    // Mark paid bills as PAID
    if (allocatedBills && allocatedBills.length > 0) {
      const billNumbers = allocatedBills.map((b: any) => b.billNumber);
      await CustomerBill.updateMany({ billNumber: { $in: billNumbers } }, { $set: { status: "PAID" } });
    }

    return NextResponse.json({ success: true, message: "Money Receipt recorded", data: newMR }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

