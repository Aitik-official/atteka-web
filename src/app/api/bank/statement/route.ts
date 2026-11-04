import { NextRequest, NextResponse } from "next/server";
import { bankService } from "@/services/bankService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate") || "2026-11-01";
    const toDate = searchParams.get("toDate") || "2026-11-04";

    const statement = await bankService.fetchStatement("201002938471", fromDate, toDate);
    return NextResponse.json({
      success: true,
      bankName: "IndusInd Bank",
      accountNumber: "201002938471",
      period: { fromDate, toDate },
      isSimulated: true,
      data: statement
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

