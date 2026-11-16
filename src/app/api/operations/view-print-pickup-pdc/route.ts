import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listViewPrintPdcs } from "@/lib/operationsPdcEngine";

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
    const id = (searchParams.get("id") || "").trim();
    const systemPdcNo = (searchParams.get("systemPdcNo") || searchParams.get("pdcNo") || "").trim();
    const manualPdcNo = (searchParams.get("manualPdcNo") || "").trim();
    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), today);
    const to = parseIso(searchParams.get("to"), today);

    const result = await listViewPrintPdcs("PICKUP", {
      id: id || undefined,
      systemPdcNo: systemPdcNo || undefined,
      manualPdcNo: manualPdcNo || undefined,
      from: id || systemPdcNo || manualPdcNo ? undefined : from,
      to: id || systemPdcNo || manualPdcNo ? undefined : to
    });

    if (id || systemPdcNo || manualPdcNo) {
      if (!result.detail) {
        return NextResponse.json({ success: false, error: "Pickup PDC not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: result.detail,
        total: 1,
        source: "db"
      });
    }

    return NextResponse.json({
      success: true,
      data: result.list,
      total: result.list.length,
      source: "db",
      meta: { from, to }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
