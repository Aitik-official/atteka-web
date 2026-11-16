import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { createVoucher } from "@/lib/vouchersEngine";

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const debit = lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
    const credit = lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
    if (Number(debit.toFixed(2)) !== Number(credit.toFixed(2)) || debit <= 0) {
      return NextResponse.json(
        { error: "Debit and Credit totals must match and be greater than 0" },
        { status: 400 }
      );
    }

    const row = await createVoucher({
      kind: "CONTRA",
      voucherNumber: body.voucherNo,
      voucherType: "Contra",
      voucherDate: body.voucherDate,
      branch: "ALC1",
      party: "CONTRA ENTRY",
      payTo: "CONTRA ENTRY",
      amount: debit,
      netPayable: debit,
      narration: body.narration || "Contra entry",
      lines,
      payload: body
    });

    return NextResponse.json({
      success: true,
      message: `Contra entry ${row.voucherNumber} submitted`,
      data: row,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit contra entry" },
      { status: Number(error?.status) || 500 }
    );
  }
}
