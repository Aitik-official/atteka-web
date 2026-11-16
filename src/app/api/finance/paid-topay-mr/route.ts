import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { generatePaidTopayMr, listPaidTopayDockets } from "@/lib/customerBillingMrEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    const today = new Date().toISOString().slice(0, 10);
    const mode = (searchParams.get("mode") || "date").trim();
    const from = parseIso(searchParams.get("from"), today);
    const to = parseIso(searchParams.get("to"), today);
    const docketNo = (searchParams.get("docketNo") || "").trim().toUpperCase();

    const rows = await listPaidTopayDockets({
      mode,
      from,
      to,
      docketNo: docketNo || undefined
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: { mode, from, to, docketNo: docketNo || null }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load Paid/Topay dockets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const docketNos: string[] = Array.isArray(body.docketNos)
      ? body.docketNos.map(String)
      : Array.isArray(body.ids)
        ? body.ids.map(String)
        : [];
    const data = await generatePaidTopayMr(docketNos);
    return NextResponse.json({
      success: true,
      message: data.message,
      data,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate Paid/Topay MR" },
      { status: Number(error?.status) || 500 }
    );
  }
}
