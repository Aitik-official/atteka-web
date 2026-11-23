import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { generateBillMr, listBillingParties, listBillsForMr } from "@/lib/customerBillingMrEngine";

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
      const customers = await listBillingParties();
      return NextResponse.json({
        success: true,
        data: {
          customers,
          billTypes: ["Show All", "Freight", "Supplementary", "Other Bill", "Customer Invoice"]
        },
        source: "db"
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), addDays(today, -29));
    const to = parseIso(searchParams.get("to"), today);
    const customer = (searchParams.get("customer") || "").trim();
    const billType = (searchParams.get("billType") || "Show All").trim();
    const manualBills = (searchParams.get("manualBills") || "")
      .split(/[,;\n]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const mode = (searchParams.get("mode") || "filter").trim();

    const bills = await listBillsForMr({
      from,
      to,
      customer: customer || undefined,
      billType,
      manualBills,
      mode
    });

    return NextResponse.json({
      success: true,
      count: bills.length,
      data: bills,
      source: "db",
      meta: { from, to, customer: customer || null, billType, mode }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load bills" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const billNumbers: string[] = Array.isArray(body.billNumbers)
      ? body.billNumbers.map(String)
      : Array.isArray(body.ids)
        ? body.ids.map(String)
        : [];
    const data = await generateBillMr({
      billNumbers,
      withRebate: Boolean(body.withRebate),
      rebatePercent: Number(body.rebatePercent || 0) || undefined,
      mrDate: body.mrDate,
      mrBranch: body.mrBranch,
      manualMrPrefix: body.manualMrPrefix,
      manualMrNo: body.manualMrNo,
      tdsType: body.tdsType,
      tdsRate: body.tdsRate,
      billLines: body.billLines,
      payment: body.payment,
      deductionLines: body.deductionLines,
      docketLines: body.docketLines,
      partyCode: body.partyCode,
      partyName: body.partyName,
      partyAddress: body.partyAddress,
      remark: body.remark
    });
    return NextResponse.json({
      success: true,
      message: data.message,
      data,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate Bill MR" },
      { status: Number(error?.status) || 500 }
    );
  }
}
