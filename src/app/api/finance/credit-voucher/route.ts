import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { VOUCHER_MASTERS, createVoucher, listAccounts } from "@/lib/vouchersEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("lists") === "1" || searchParams.get("accounts") === "1") {
      return NextResponse.json({
        success: true,
        data: {
          accounts: await listAccounts(),
          cashBankAccounts: VOUCHER_MASTERS.cashBankAccounts,
          modes: VOUCHER_MASTERS.modes,
          tdsSections: VOUCHER_MASTERS.tdsSections
        },
        source: "db"
      });
    }
    return NextResponse.json({ success: true, data: [], source: "db" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    if (!String(body.receivedFrom || body.payTo || "").trim()) {
      return NextResponse.json({ error: "Enter Received From" }, { status: 400 });
    }
    const row = await createVoucher({
      kind: "CREDIT",
      voucherType: "Credit Voucher",
      voucherDate: body.voucherDate,
      branch: body.location || "ALC1",
      payTo: body.receivedFrom,
      party: body.receivedFrom,
      partyCode: body.partyCode,
      amount: Number(body.amount || 0),
      taxableAmount: Number(body.taxableAmount || body.amount || 0),
      tdsAmount: Number(body.tdsAmount || 0),
      netPayable: Number(body.netPayable || body.taxableAmount || body.amount || 0),
      refNo: body.refNo,
      documentNo: body.refNo,
      narration: body.narration,
      modeOfTransaction: body.mode,
      cashBankAccount: body.cashBankAccount,
      chequeNo: body.chequeNo,
      chequeDate: body.chequeDate,
      gstNo: body.gstNo,
      panNo: body.panNo,
      accounts: body.accountCode
        ? [{ code: body.accountCode, name: body.acDescription || body.accountCode }]
        : [],
      payload: body,
      status: "Submitted"
    });
    return NextResponse.json({
      success: true,
      message: `Credit voucher ${row.voucherNumber} submitted`,
      data: row,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit credit voucher" },
      { status: Number(error?.status) || 500 }
    );
  }
}
