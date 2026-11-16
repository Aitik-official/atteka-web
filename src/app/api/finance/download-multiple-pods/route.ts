import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { buildPodZip, listBillingParties, listPodDownloadRows } from "@/lib/customerBillingMrEngine";

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
    if (searchParams.get("parties") === "1") {
      const parties = await listBillingParties();
      return NextResponse.json({ success: true, data: parties, source: "db" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const fromDefault = new Date();
    fromDefault.setDate(fromDefault.getDate() - 29);
    const from = parseIso(searchParams.get("from"), fromDefault.toISOString().slice(0, 10));
    const to = parseIso(searchParams.get("to"), today);
    const billingParty = (searchParams.get("billingParty") || "").trim();

    const rows = await listPodDownloadRows({ from, to, billingParty: billingParty || undefined });
    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load POD dockets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    const result = await buildPodZip(ids);
    return new NextResponse(new Uint8Array(result.zip), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "X-POD-Count": String(result.count),
        "X-POD-Message": result.message,
        "X-Source": "db"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to download PODs" },
      { status: Number(error?.status) || 500 }
    );
  }
}
