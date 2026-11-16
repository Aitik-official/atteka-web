import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listMoneyReceipts } from "@/lib/customerBillingMrEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), addDays(today, -6));
    const to = parseIso(searchParams.get("to"), today);
    const mrNumber = (searchParams.get("mrNumber") || "").trim().toUpperCase();
    const billNumber = (searchParams.get("billNumber") || "").trim().toUpperCase();

    const rows = await listMoneyReceipts({
      from: mrNumber || billNumber ? undefined : from,
      to: mrNumber || billNumber ? undefined : to,
      mrNumber: mrNumber || undefined,
      billNumber: billNumber || undefined
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: { from, to, mrNumber: mrNumber || null, billNumber: billNumber || null }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load MRs" }, { status: 500 });
  }
}
