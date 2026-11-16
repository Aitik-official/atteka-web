import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import {
  VOUCHER_MASTERS,
  cancelVoucher,
  createVoucher,
  listAccounts,
  listVouchers
} from "@/lib/vouchersEngine";

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
          voucherTypes: VOUCHER_MASTERS.debitTypes,
          locations: VOUCHER_MASTERS.locations,
          projects: VOUCHER_MASTERS.projects,
          interestAccounts: VOUCHER_MASTERS.interestAccounts,
          tdsSections: VOUCHER_MASTERS.tdsSections,
          cashBankAccounts: VOUCHER_MASTERS.cashBankAccounts,
          modes: VOUCHER_MASTERS.modes,
          accounts: await listAccounts()
        },
        source: "db"
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), addDays(today, -6));
    const to = parseIso(searchParams.get("to"), today);
    const rows = await listVouchers({
      kinds: ["DEBIT"],
      from,
      to,
      voucherType: searchParams.get("voucherType") || undefined,
      voucherNumber: searchParams.get("voucherNumber") || undefined,
      documentNumber: searchParams.get("documentNumber") || undefined,
      includeCancelled: true
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: { from, to }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load debit vouchers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    if (body.action === "cancel") {
      const result = await cancelVoucher(String(body.voucherNumber || ""), body.reason);
      return NextResponse.json({ success: true, message: result.message, data: result, source: "db" });
    }

    const row = await createVoucher({
      kind: "DEBIT",
      voucherNumber: body.predictedVoucherNo || body.voucherNumber,
      voucherType: body.modeOfTransaction || body.voucherType || "Cash Payment",
      voucherDate: body.voucherDate,
      branch: body.location || body.branch || "ALC1",
      payTo: body.paidTo || body.payTo,
      party: body.paidTo || body.payTo,
      amount: Number(body.baseAmount || body.amount || 0),
      taxableAmount: Number(body.taxableAmount || body.baseAmount || 0),
      tdsAmount: Number(body.tdsAmount || 0),
      igst: Number(body.igst || 0),
      cgst: Number(body.cgst || 0),
      sgst: Number(body.sgst || 0),
      netPayable: Number(body.netPayable || body.taxableAmount || body.baseAmount || 0),
      documentNo: body.documentNo,
      narration: body.narration,
      modeOfTransaction: body.modeOfTransaction,
      cashBankAccount: body.cashBankAccount,
      chequeNo: body.chequeNo,
      chequeDate: body.chequeDate,
      gstNo: body.gstNo,
      panNo: body.panNo,
      payload: body
    });

    return NextResponse.json({
      success: true,
      message: `Debit voucher ${row.voucherNumber} saved`,
      data: row,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save debit voucher" },
      { status: Number(error?.status) || 400 }
    );
  }
}
