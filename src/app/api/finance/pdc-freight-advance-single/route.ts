import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listPdcPaymentRows, payPdcAdvance } from "@/lib/vendorBillingEngine";

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
    const today = new Date().toISOString().slice(0, 10);
    const fromDefault = new Date();
    fromDefault.setDate(fromDefault.getDate() - 29);
    const from = parseIso(searchParams.get("from"), fromDefault.toISOString().slice(0, 10));
    const to = parseIso(searchParams.get("to"), today);
    const pdcNo = (searchParams.get("pdcNo") || searchParams.get("systemPdcNo") || "")
      .trim()
      .toUpperCase();

    const rows = await listPdcPaymentRows({
      from: pdcNo ? undefined : from,
      to: pdcNo ? undefined : to,
      pdcNo: pdcNo || undefined
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: {
        from: fmtDateLabel(from),
        to: fmtDateLabel(to),
        pdcNo: pdcNo || "",
        mode: pdcNo ? "pdc" : "date"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load PDC advance rows" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.map(String)
      : body.id
        ? [String(body.id)]
        : body.pdcNumber
          ? [String(body.pdcNumber)]
          : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Select a PDC to pay advance" }, { status: 400 });
    }
    const result = await payPdcAdvance(ids, Number(body.amount || 0) || undefined);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Advance payment failed" },
      { status: Number(error?.status) || 500 }
    );
  }
}
