import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { VOUCHER_MASTERS, createVoucher, listAccounts, listVouchers } from "@/lib/vouchersEngine";

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
    if (searchParams.get("lists") === "1") {
      return NextResponse.json({
        success: true,
        data: {
          voucherTypes: VOUCHER_MASTERS.journalTypes,
          locations: VOUCHER_MASTERS.locations,
          accounts: await listAccounts()
        },
        source: "db"
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), addDays(today, -6));
    const to = parseIso(searchParams.get("to"), today);
    const rows = await listVouchers({
      kinds: ["JOURNAL"],
      from,
      to,
      voucherType: searchParams.get("voucherType") || undefined,
      voucherNumber: searchParams.get("voucherNumber") || undefined,
      documentNumber: searchParams.get("documentNumber") || undefined,
      includeCancelled: true
    });

    return NextResponse.json({ success: true, count: rows.length, data: rows, source: "db", meta: { from, to } });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load journals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const total = Number(body.totalDebit || body.totalCredit || body.amount || 0);
    const row = await createVoucher({
      kind: "JOURNAL",
      voucherType: body.voucherType || "Manual Journal",
      voucherDate: body.voucherDate,
      branch: body.location || "ALC1",
      payTo: body.paidTo || "JOURNAL ADJUSTMENT",
      party: body.paidTo || "JOURNAL ADJUSTMENT",
      amount: total,
      netPayable: total,
      refNo: body.refNo,
      documentNo: body.refNo,
      narration: body.narration,
      lines: body.lines || [],
      accounts: body.accounts || [],
      payload: body
    });
    return NextResponse.json({
      success: true,
      message: `Journal voucher ${row.voucherNumber} saved`,
      data: row,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save journal" },
      { status: Number(error?.status) || 400 }
    );
  }
}
