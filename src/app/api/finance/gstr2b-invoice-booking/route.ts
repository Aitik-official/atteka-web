import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { bookGstr2b, listGstr2bPending } from "@/lib/vouchersEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;
  try {
    const rows = await listGstr2bPending();
    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: { gstPortal: "not_connected", note: "Replica booking store — live GSTR2B sync not wired" }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load GSTR2B" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;
  try {
    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) {
      return NextResponse.json({ success: false, error: "Select at least one invoice" }, { status: 400 });
    }
    const result = await bookGstr2b(ids);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: { ...result, bookedAt: new Date().toISOString() },
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Booking failed" },
      { status: Number(error?.status) || 400 }
    );
  }
}
