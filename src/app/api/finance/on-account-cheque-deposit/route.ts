import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import {
  depositCheques,
  getChequeDepositLists,
  listChequesForDeposit
} from "@/lib/bankChequeEngine";

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
        data: await getChequeDepositLists(),
        source: "db"
      });
    }
    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), today);
    const to = parseIso(searchParams.get("to"), today);
    const location = (searchParams.get("location") || "").trim();
    const customerCode = (searchParams.get("customerCode") || "").trim().toUpperCase();
    const chequeNumber = (searchParams.get("chequeNumber") || "").trim().toUpperCase();

    const rows = await listChequesForDeposit({
      from: chequeNumber ? undefined : from,
      to: chequeNumber ? undefined : to,
      location,
      customerCode: customerCode && customerCode !== "--SHOW ALL--" ? customerCode : undefined,
      chequeNumber: chequeNumber || undefined
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows.map((r, idx) => ({ srNo: idx + 1, ...r })),
      source: "db",
      meta: { from, to, location: location || null, customerCode: customerCode || null, chequeNumber: chequeNumber || null }
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
    const chequeNos = Array.isArray(body.chequeNos) ? body.chequeNos.map(String) : [];
    const result = await depositCheques(chequeNos);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Deposit failed" },
      { status: Number(error?.status) || 400 }
    );
  }
}
