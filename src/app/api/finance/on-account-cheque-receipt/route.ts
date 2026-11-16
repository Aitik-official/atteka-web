import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { saveOnAccountChequeReceipt } from "@/lib/bankChequeEngine";

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;
  try {
    const body = await req.json();
    const row = await saveOnAccountChequeReceipt(body);
    return NextResponse.json({
      success: true,
      message: `On Account cheque ${row.chequeNo} saved`,
      data: row,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save cheque receipt" },
      { status: Number(error?.status) || 500 }
    );
  }
}
