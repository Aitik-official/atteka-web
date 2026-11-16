import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listBillingParties, listCompletionFinancial } from "@/lib/customerBillingMrEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function fmtDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("customers") === "1") {
      const parties = await listBillingParties();
      return NextResponse.json({ success: true, data: parties, source: "db" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), today);
    const to = parseIso(searchParams.get("to"), today);
    const customer = (searchParams.get("customer") || "").trim();
    const docketNo = (searchParams.get("docketNo") || searchParams.get("cnNo") || "")
      .trim()
      .toUpperCase();

    const rows = await listCompletionFinancial({
      from: docketNo ? undefined : from,
      to: docketNo ? undefined : to,
      customer: customer || undefined,
      docketNo: docketNo || undefined
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: {
        from: fmtDateLabel(from),
        to: fmtDateLabel(to),
        customer: customer || "All",
        docketNo: docketNo || "",
        mode: docketNo ? "docket" : "criteria"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load completion financial" },
      { status: 500 }
    );
  }
}
