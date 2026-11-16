import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { getVoucherByNumber, listVouchers } from "@/lib/vouchersEngine";

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
    if (searchParams.get("detail") === "1") {
      const one = await getVoucherByNumber(searchParams.get("voucherNumber") || "");
      return NextResponse.json({ success: true, data: one, source: "db" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), today);
    const to = parseIso(searchParams.get("to"), today);
    const vendor = (searchParams.get("vendor") || "").trim();
    const voucherNumber = (searchParams.get("voucherNumber") || "").trim();

    const rows = await listVouchers({
      kinds: ["VENDOR_PAYMENT"],
      from: voucherNumber ? undefined : from,
      to: voucherNumber ? undefined : to,
      vendor: vendor || undefined,
      voucherNumber: voucherNumber || undefined,
      includeCancelled: true
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: { from, to, vendor: vendor || null }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load payments" }, { status: 500 });
  }
}
