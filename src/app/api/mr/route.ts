import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MoneyReceipt } from "@/models/MoneyReceipt";
import { CustomerBill } from "@/models/CustomerBill";
import { postMoneyReceiptLedger } from "@/lib/booksEngine";
import { RBAC, requireApiSession } from "@/lib/rbac";

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
    const gate = await requireApiSession(req, RBAC.financeWrite);
    if ("error" in gate) return gate.error;

    await connectToDatabase();
    const body = await req.json();
    const {
      customerCode,
      customerName,
      allocatedBills,
      paymentMode,
      referenceNumber,
      totalReceived,
      tdsDeducted,
      rebateDiscount,
      branchCode
    } = body;

    const mrNumber = `MR-${Date.now().toString().slice(-6)}`;
    const amount = Number(totalReceived) || 0;
    const tds = Number(tdsDeducted) || 0;

    const newMR = await MoneyReceipt.create({
      mrNumber,
      customerCode,
      customerName,
      allocatedBills: allocatedBills || [],
      paymentMode: paymentMode || "NEFT",
      referenceNumber: referenceNumber || "CHQ0001",
      totalReceived: amount,
      tdsDeducted: tds,
      rebateDiscount: Number(rebateDiscount) || 0
    });

    if (allocatedBills && allocatedBills.length > 0) {
      const billNumbers = allocatedBills.map((b: any) => b.billNumber);
      await CustomerBill.updateMany(
        { billNumber: { $in: billNumbers } },
        { $set: { status: "PAID" } }
      );
    }

    await postMoneyReceiptLedger({
      mrNumber,
      customerName: customerName || "CUSTOMER",
      amountReceived: amount,
      tdsDeduction: tds,
      mode: paymentMode || "NEFT",
      branchCode: branchCode || gate.session.branchCode || "ALC1"
    });

    return NextResponse.json(
      {
        success: true,
        message: "Money Receipt recorded",
        data: newMR,
        ledgerPosted: true
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
