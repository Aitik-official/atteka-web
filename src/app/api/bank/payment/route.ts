import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { BankOperation } from "@/models/BankOperation";
import { bankService } from "@/services/bankService";
import { memoryStore } from "@/lib/memoryStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { beneficiaryName, accountNumber, ifscCode, amount, remarks } = body;

    if (!beneficiaryName || !amount) {
      return NextResponse.json({ error: "Beneficiary name and amount required" }, { status: 400 });
    }

    const paymentResult = await bankService.processOnlinePayment({
      beneficiaryName,
      accountNumber: accountNumber || "201002938471",
      ifscCode: ifscCode || "INDB0000001",
      amount: Number(amount),
      remarks
    });

    const record = {
      transactionId: paymentResult.transactionId,
      bankName: "IndusInd Bank",
      accountNumber: accountNumber || "201002938471",
      operationType: "ONLINE_PAYMENT" as const,
      beneficiaryName,
      amount: Number(amount),
      utrNumber: paymentResult.utrNumber,
      status: paymentResult.status,
      isSimulated: true,
      notes: remarks
    };

    try {
      await connectToDatabase();
      const dbRecord = await BankOperation.create(record);
      return NextResponse.json({
        success: true,
        data: dbRecord,
        isSimulated: true,
        source: "mongodb",
        message: paymentResult.message
      });
    } catch {
      const memory = { ...record, _id: `bop-${Date.now()}`, createdAt: new Date() };
      memoryStore.bankOps.unshift(memory);
      return NextResponse.json({
        success: true,
        data: memory,
        isSimulated: true,
        isMemoryStore: true,
        message: paymentResult.message
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const history = await BankOperation.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: history.length, data: history });
  } catch {
    return NextResponse.json({ success: true, count: memoryStore.bankOps.length, data: memoryStore.bankOps });
  }
}
