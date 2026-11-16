import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listVouchers } from "@/lib/vouchersEngine";

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
    const from = parseIso(searchParams.get("from"), today);
    const to = parseIso(searchParams.get("to"), today);
    const rows = await listVouchers({
      kinds: ["DEBIT", "CREDIT", "CONTRA", "JOURNAL", "VENDOR_INVOICE", "VENDOR_PAYMENT"],
      from,
      to,
      voucherNumber: searchParams.get("voucherNumber") || undefined,
      includeCancelled: true
    });
    const cancelled = rows
      .filter((r) => r.status === "Cancelled")
      .map((r) => ({
        voucherNo: r.voucherNumber,
        docRefNo: r.docRefNo,
        voucherDate: r.voucherDate,
        voucherDateIso: r.voucherDateIso,
        payTo: r.payTo,
        particular: r.payTo,
        debit: r.totalAccountedAmount,
        credit: 0,
        chqUtrNo: "",
        chqUtrDt: "",
        branch: r.branch,
        voucherType: r.voucherType,
        narration: r.narration,
        entryBy: r.entryBy,
        entryDt: r.entryDt
      }));
    return NextResponse.json({
      success: true,
      count: cancelled.length,
      data: cancelled,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
