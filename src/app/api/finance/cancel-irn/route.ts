import { NextRequest, NextResponse } from "next/server";
import { cancelIrn, getIrn, listAllIrns, listCancellableIrns } from "@/lib/irnDemoStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeCancelled = searchParams.get("includeCancelled") === "1";
  const rows = includeCancelled ? listAllIrns() : listCancellableIrns();

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r) => ({
      documentType: r.documentType,
      documentNo: r.documentNo,
      documentDate: r.documentDate,
      party: r.party,
      branch: r.branch,
      gstin: r.gstin,
      ackNo: r.ackNo,
      ackDate: r.ackDate,
      irnNo: r.irnNo,
      status: r.status,
      cancelReason: r.cancelReason || null,
      cancelledAt: r.cancelledAt || null
    })),
    meta: { gstIntegration: "pending" }
  });
}

/**
 * Stub IRN cancel — prepares cancel payload for future GST / NIC IRP call.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const documentNo = String(body.documentNo || body.billInvoiceNo || "").trim().toUpperCase();
  const irnNo = String(body.irnNo || "").trim();
  // WCV often uses numeric cancel reason codes; default "1"
  const reason = String(body.reason || body.cancelReason || "1").trim() || "1";

  if (!documentNo && !irnNo) {
    return NextResponse.json({ success: false, error: "documentNo or irnNo required" }, { status: 400 });
  }

  let key = documentNo;
  if (!key && irnNo) {
    const match = listAllIrns().find((r) => r.irnNo === irnNo);
    key = match?.documentNo || "";
  }
  if (!key) {
    return NextResponse.json({ success: false, error: "IRN document not found" }, { status: 404 });
  }

  const existing = getIrn(key);
  if (!existing) {
    return NextResponse.json({ success: false, error: "IRN document not found" }, { status: 404 });
  }

  const cancelPayload = {
    Irn: existing.irnNo,
    CnlRsn: reason,
    CnlRem: reason === "1" ? "Duplicate" : reason === "2" ? "Data entry mistake" : "Others"
  };

  const result = cancelIrn(key, reason);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Demo IRN cancel stub saved. GST / NIC IRP integration is pending.",
    gstIntegration: "pending",
    data: {
      ...result.data,
      // Ready for live adapter
      preparedCancelPayload: cancelPayload
    }
  });
}
