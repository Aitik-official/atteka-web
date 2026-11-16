import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import {
  BILLING_HEADS,
  PROFIT_CENTERS,
  createCustomerInvoice,
  listBillingParties
} from "@/lib/customerBillingMrEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("masters") === "1") {
      const parties = await listBillingParties();
      return NextResponse.json({
        success: true,
        data: {
          billNo: `BLALC1${Date.now().toString().slice(-6)}`,
          parties,
          profitCenters: PROFIT_CENTERS,
          billingHeads: BILLING_HEADS,
          sacCodes: ["996511", "996719", "996799", "996812"],
          collectionBranches: PROFIT_CENTERS.map((p) => ({
            code: p.code,
            name: p.name.replace("Ateka Logistics - ", "Ateka Logistics")
          }))
        },
        source: "db"
      });
    }
    return NextResponse.json({ success: true, data: [], source: "db" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load masters" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const data = await createCustomerInvoice(body);
    return NextResponse.json({
      success: true,
      message: data.message,
      data,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit Customer Invoice" },
      { status: Number(error?.status) || 500 }
    );
  }
}
