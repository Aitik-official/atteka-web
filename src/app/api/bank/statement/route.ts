import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { BANK_CHEQUE_MASTERS, importBankStatement, listBankStatement } from "@/lib/bankChequeEngine";

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
    if (searchParams.get("lists") === "1") {
      return NextResponse.json({
        success: true,
        data: { banks: BANK_CHEQUE_MASTERS.banks, accounts: BANK_CHEQUE_MASTERS.bankAccounts },
        source: "db"
      });
    }
    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), today);
    const to = parseIso(searchParams.get("to"), today);
    const bank = (searchParams.get("bank") || "").trim();
    const rows = await listBankStatement({ from, to, bank: bank || undefined, channel: "MANUAL" });
    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: { from, to, bank: bank || null, isSimulated: false }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;
  try {
    const body = await req.json().catch(() => ({}));
    const result = await importBankStatement({
      bank: body.bank,
      accountNo: body.accountNo,
      note: body.note || body.fileName
    });
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Import failed" },
      { status: Number(error?.status) || 500 }
    );
  }
}
