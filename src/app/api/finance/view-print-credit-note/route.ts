import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listCreditNotes } from "@/lib/customerBillingMrEngine";

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
    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), addDays(today, -364));
    const to = parseIso(searchParams.get("to"), today);
    const creditNoteNo = (searchParams.get("creditNoteNo") || "").trim().toUpperCase();
    const mrNo = (searchParams.get("mrNo") || "").trim().toUpperCase();
    const billNo = (searchParams.get("billNo") || "").trim().toUpperCase();

    const rows = await listCreditNotes({
      from: creditNoteNo || mrNo || billNo ? undefined : from,
      to: creditNoteNo || mrNo || billNo ? undefined : to,
      creditNoteNo: creditNoteNo || undefined,
      mrNo: mrNo || undefined,
      billNo: billNo || undefined
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: {
        from,
        to,
        creditNoteNo: creditNoteNo || null,
        mrNo: mrNo || null,
        billNo: billNo || null
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load credit notes" },
      { status: 500 }
    );
  }
}
