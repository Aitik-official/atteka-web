import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { BANK_CHEQUE_MASTERS, assignChequeBook } from "@/lib/bankChequeEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;
  return NextResponse.json({
    success: true,
    data: {
      locations: BANK_CHEQUE_MASTERS.locations,
      bankAccounts: BANK_CHEQUE_MASTERS.chequeBookAccounts
    },
    source: "db"
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;
  try {
    const body = await req.json();
    const row = await assignChequeBook(body);
    return NextResponse.json({
      success: true,
      message: row.message,
      data: row,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to assign cheque book" },
      { status: Number(error?.status) || 500 }
    );
  }
}
