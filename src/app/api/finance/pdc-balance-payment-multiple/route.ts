import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listPdcPaymentRows, listVendorOptions, payPdcBalance } from "@/lib/vendorBillingEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function fmtDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("vendors") === "1") {
      const vendors = await listVendorOptions();
      return NextResponse.json({ success: true, data: vendors, source: "db" });
    }
    const today = new Date().toISOString().slice(0, 10);
    const fromDefault = new Date();
    fromDefault.setDate(fromDefault.getDate() - 29);
    const from = parseIso(searchParams.get("from"), fromDefault.toISOString().slice(0, 10));
    const to = parseIso(searchParams.get("to"), today);
    const vendor = (searchParams.get("vendor") || "").trim();

    const rows = await listPdcPaymentRows({
      from,
      to,
      vendor: vendor || undefined,
      forBalance: true
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: {
        from: fmtDateLabel(from),
        to: fmtDateLabel(to),
        vendor: vendor || ""
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load PDC balance (multiple) rows" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Select at least one PDC" }, { status: 400 });
    }
    const result = await payPdcBalance(ids);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Multiple balance payment failed" },
      { status: Number(error?.status) || 500 }
    );
  }
}
