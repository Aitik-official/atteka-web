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
      const no = searchParams.get("voucherNumber") || searchParams.get("invoiceNumber") || "";
      const one = await getVoucherByNumber(no);
      return NextResponse.json({ success: true, data: one, source: "db" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const mode = (searchParams.get("mode") || "date").trim();
    const from = parseIso(searchParams.get("from"), today);
    const to = parseIso(searchParams.get("to"), today);
    const vendor = (searchParams.get("vendor") || "").trim();
    const invoiceNumber = (searchParams.get("invoiceNumber") || "").trim();
    const voucherNumber = (searchParams.get("voucherNumber") || "").trim();

    const rows = await listVouchers({
      kinds: ["VENDOR_INVOICE", "GSTR2B"],
      from: mode === "date" ? from : undefined,
      to: mode === "date" ? to : undefined,
      vendor: vendor || undefined,
      invoiceNumber: mode === "invoice" ? invoiceNumber : undefined,
      voucherNumber: mode === "voucher" ? voucherNumber : undefined,
      includeCancelled: true
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: { mode, from, to, vendor: vendor || null }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load vendor invoices" }, { status: 500 });
  }
}
