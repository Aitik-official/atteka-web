import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { memoryStore } from "@/lib/memoryStore";

export async function GET() {
  try {
    await connectToDatabase();
    const bills = await CustomerBill.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: bills });
  } catch {
    return NextResponse.json({ success: true, data: memoryStore.bills, isMemoryStore: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerCode, customerName, consignmentIds } = body;

    const billNumber = `TBILL-${Date.now().toString().slice(-6)}`;
    const billRecord = {
      _id: `b-${Date.now()}`,
      billNumber,
      billDate: new Date(),
      customerCode: customerCode || "CUST-001",
      customerName: customerName || "TATA MOTORS LTD",
      consignments: consignmentIds || [],
      totalFreight: 42500,
      taxAmount: 2125,
      grandTotal: 44625,
      status: "GENERATED"
    };

    try {
      await connectToDatabase();
      const newBill = await CustomerBill.create(billRecord);
      return NextResponse.json({ success: true, message: "Bill generated", data: newBill }, { status: 201 });
    } catch {
      memoryStore.bills.unshift(billRecord);
      return NextResponse.json({ success: true, message: "Bill generated (Memory Store)", data: billRecord }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
