import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { approveRejectH2h, listH2hQueue } from "@/lib/bankChequeEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function buildSummary(rows: any[]) {
  const pending = rows.filter((r) => r.status === "Pending");
  const sum = (type: string) =>
    pending.filter((r) => r.paymentType === type).reduce((s, r) => s + Number(r.amount || 0), 0);
  const aPay = sum("A-Pay");
  const fPay = sum("F-Pay");
  const bPay = sum("B-Pay");
  const oPay = sum("O-Pay");
  const fleet = sum("Fleet");
  const salary = sum("Salary");
  return {
    aPay,
    fPay,
    bPay,
    oPay,
    fleet,
    salary,
    total: aPay + fPay + bPay + oPay + fleet + salary,
    pendingCount: pending.length,
    balance: 1845620.75
  };
}

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;
  try {
    const { searchParams } = new URL(req.url);
    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), "");
    const to = parseIso(searchParams.get("to"), "");
    const status = (searchParams.get("status") || "Pending").trim();
    const search = (searchParams.get("project") || searchParams.get("search") || "").trim();
    const rows = await listH2hQueue({
      from: from || undefined,
      to: to || undefined,
      status,
      search: search || undefined
    });
    const summary = buildSummary(rows);
    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      summary,
      balanceInfo: {
        balance: summary.balance,
        asOf: today,
        bank: "INDUSIND BANK",
        note: "Replica available balance — live IndusInd feed not connected"
      },
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
    const actionRaw = String(body.action || "").toLowerCase();
    if (actionRaw === "balance") {
      const today = new Date().toISOString().slice(0, 10);
      return NextResponse.json({
        success: true,
        data: {
          availableBalance: 1845620.75,
          ledgerBalance: 1845620.75,
          accountNo: "201002938471",
          ifsc: "INDB0000001",
          asOf: today,
          bank: "INDUSIND BANK",
          note: "Replica available balance — live IndusInd feed not connected"
        },
        source: "db"
      });
    }
    const action = actionRaw === "reject" ? "reject" : "approve";
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    const result = await approveRejectH2h(ids, action, body.remark);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Action failed" },
      { status: Number(error?.status) || 500 }
    );
  }
}
