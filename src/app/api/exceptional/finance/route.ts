import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import {
  listAdvancePayablePdcs,
  updateAdvancePayableBranch
} from "@/lib/exceptionalOpsEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const slug = String(searchParams.get("slug") || "").trim();

  if (slug !== "edit-pdc-advance-payable-branch") {
    return NextResponse.json({ error: "Unknown exceptional finance module" }, { status: 404 });
  }

  const dateMode = String(searchParams.get("dateMode") || "range");
  const from = String(searchParams.get("from") || "");
  const to = String(searchParams.get("to") || "");
  const pdcNo = String(searchParams.get("pdcNo") || "")
    .trim()
    .toUpperCase();
  const vendorCode = String(searchParams.get("vendorCode") || "")
    .trim()
    .toUpperCase();
  const branch = String(searchParams.get("branch") || "")
    .trim()
    .toUpperCase();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let fromDate = from;
  let toDate = to;

  if (dateMode === "today") {
    fromDate = today.toISOString().slice(0, 10);
    toDate = fromDate;
  } else if (dateMode === "last7") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    fromDate = start.toISOString().slice(0, 10);
    toDate = today.toISOString().slice(0, 10);
  }

  try {
    if (dateMode === "pdcNo" && !pdcNo) {
      return NextResponse.json({ error: "Enter PDC No" }, { status: 400 });
    }

    const rows = await listAdvancePayablePdcs({
      dateMode,
      from: fromDate,
      to: toDate,
      pdcNo,
      vendorCode: vendorCode || undefined
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      filters: {
        dateMode,
        from: fromDate,
        to: toDate,
        vendorCode: vendorCode || null,
        branch: branch || null
      },
      source: "db",
      hint: rows.length
        ? `PDC Nos: ${rows
            .slice(0, 5)
            .map((r) => r.documentNo)
            .join(" · ")}`
        : "No PDC rows for this criteria"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load PDC list" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.exceptionalWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || "").trim();
    const documentNos: string[] = Array.isArray(body.documentNos)
      ? body.documentNos.map((n: string) => String(n).trim().toUpperCase()).filter(Boolean)
      : [];
    const newBranch = String(body.advancePayableBranch || "")
      .trim()
      .toUpperCase();

    if (slug !== "edit-pdc-advance-payable-branch") {
      return NextResponse.json({ error: "Unknown exceptional finance module" }, { status: 404 });
    }
    if (!documentNos.length) {
      return NextResponse.json({ error: "Select at least one PDC" }, { status: 400 });
    }
    if (!newBranch) {
      return NextResponse.json({ error: "Advance Payable Branch is required" }, { status: 400 });
    }

    const updated = await updateAdvancePayableBranch(documentNos, newBranch);
    if (!updated.length) {
      return NextResponse.json({ error: "No matching PDC found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Advance payable branch set to ${newBranch} for ${updated.length} PDC(s)`,
      data: updated,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update advance payable branch" },
      { status: 500 }
    );
  }
}
