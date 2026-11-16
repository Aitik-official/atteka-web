import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { createOtherBill, listBillingParties } from "@/lib/customerBillingMrEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("parties") === "1") {
      const parties = await listBillingParties();
      return NextResponse.json({ success: true, data: parties, source: "db" });
    }
    return NextResponse.json({ success: true, data: [], source: "db" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load parties" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const data = await createOtherBill(body);
    return NextResponse.json({
      success: true,
      message: data.message,
      data,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate Other Bill" },
      { status: Number(error?.status) || 500 }
    );
  }
}
