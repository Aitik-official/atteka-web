import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { createCreditNote, getBillForCreditNote } from "@/lib/customerBillingMrEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    const billNo = (searchParams.get("billNo") || "").trim();
    if (!billNo) {
      return NextResponse.json({ success: false, error: "Enter Bill No." }, { status: 400 });
    }
    const bill = await getBillForCreditNote(billNo);
    return NextResponse.json({ success: true, data: bill, source: "db" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load bill" },
      { status: Number(error?.status) || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const data = await createCreditNote(body);
    return NextResponse.json({
      success: true,
      message: data.message,
      data,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Invalid request body" },
      { status: Number(error?.status) || 400 }
    );
  }
}
