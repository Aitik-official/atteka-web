import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { BANK_CHEQUE_MASTERS, fetchApiBankStatement } from "@/lib/bankChequeEngine";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

const SavedQuerySchema = new mongoose.Schema(
  {
    name: String,
    accountCode: String,
    from: String,
    to: String,
    createdBy: { type: String, default: "AL002" }
  },
  { timestamps: true }
);

const BankStatementQuery =
  mongoose.models.BankStatementQuery || mongoose.model("BankStatementQuery", SavedQuerySchema);

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
    if (searchParams.get("accounts") === "1" || searchParams.get("lists") === "1") {
      return NextResponse.json({
        success: true,
        data: BANK_CHEQUE_MASTERS.bankAccounts,
        accounts: BANK_CHEQUE_MASTERS.bankAccounts,
        source: "db"
      });
    }
    if (searchParams.get("saved") === "1") {
      await connectToDatabase();
      const rows = await BankStatementQuery.find().sort({ createdAt: -1 }).limit(50);
      return NextResponse.json({ success: true, data: rows, source: "db" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), today);
    const to = parseIso(searchParams.get("to"), today);
    const accountCode = (
      searchParams.get("account") ||
      searchParams.get("accountCode") ||
      searchParams.get("bankAccount") ||
      ""
    ).trim();
    const result = await fetchApiBankStatement({ accountCode, from, to });
    const totalDebit = result.data.reduce((s, r) => s + Number(r.debit || 0), 0);
    const totalCredit = result.data.reduce((s, r) => s + Number(r.credit || 0), 0);
    const closingBalance = Number(result.data[0]?.balance || result.data[0]?.closingBalance || 0);
    const summary = {
      totalDebit,
      totalCredit,
      net: totalCredit - totalDebit,
      txnCount: result.count,
      count: result.count,
      closingBalance,
      byDay: result.data.reduce((acc: Record<string, number>, r) => {
        const k = r.txnDate || r.date;
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {})
    };
    return NextResponse.json({
      success: true,
      count: result.count,
      data: result.data,
      account: result.account,
      summary,
      meta: result.meta,
      message: result.message,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;
  try {
    const body = await req.json();
    if (body.action === "fetch") {
      const result = await fetchApiBankStatement({
        accountCode: body.accountCode || body.account,
        from: body.from,
        to: body.to
      });
      return NextResponse.json({
        success: true,
        count: result.count,
        data: result.data,
        account: result.account,
        meta: result.meta,
        message: result.message,
        source: "db"
      });
    }
    await connectToDatabase();
    const doc = await BankStatementQuery.create({
      name: body.name || body.queryName || `Query ${new Date().toISOString().slice(0, 10)}`,
      accountCode: body.accountCode || body.account || "",
      from: body.from || "",
      to: body.to || "",
      createdBy: "AL002"
    });
    return NextResponse.json({
      success: true,
      message: "Query saved",
      data: doc,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed" },
      { status: Number(error?.status) || 500 }
    );
  }
}
