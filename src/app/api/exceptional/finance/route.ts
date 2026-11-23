import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import {
  listAdvancePayablePdcs,
  updateAdvancePayableBranch
} from "@/lib/exceptionalOpsEngine";
import {
  getBillForRemarkAddress,
  listGstOptionsForBill,
  updateBillRemarkAddress
} from "@/lib/billRemarkAddressEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const slug = String(searchParams.get("slug") || "").trim();

  // —— Change Remark & Bill Address ——
  if (slug === "edit-bill-remark-and-bill-address") {
    const billNo = String(searchParams.get("billNo") || searchParams.get("billNumber") || "")
      .trim()
      .toUpperCase();
    if (!billNo) {
      return NextResponse.json({ error: "Enter Bill No." }, { status: 400 });
    }
    try {
      if (searchParams.get("gstOptions") === "1") {
        const options = await listGstOptionsForBill(billNo);
        return NextResponse.json({ success: true, count: options.length, data: options, source: "db" });
      }
      const bill = await getBillForRemarkAddress(billNo);
      if (!bill) {
        return NextResponse.json({ error: `Bill ${billNo} not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: bill, source: (bill as any).source || "db" });
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || "Failed to load bill" },
        { status: Number(error?.status) || 500 }
      );
    }
  }

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

    if (slug === "edit-bill-remark-and-bill-address") {
      const updated = await updateBillRemarkAddress({
        billNumber: body.billNumber || body.billNo,
        remark: body.remark,
        billAddress: body.billAddress ?? body.partyAddress,
        customerGstin: body.customerGstin ?? body.gstin,
        destinationAddress: body.destinationAddress,
        city: body.city,
        pinCode: body.pinCode ?? body.pincode
      });
      return NextResponse.json({
        success: true,
        message: `Bill ${updated.billNumber} remark & address updated — print will show new details`,
        data: updated,
        source: (updated as any).source || "db",
        isMemoryStore: Boolean((updated as any).isMemoryStore)
      });
    }

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
      { error: error?.message || "Failed to update" },
      { status: Number(error?.status) || 500 }
    );
  }
}
