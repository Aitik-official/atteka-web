import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listReprocessFiles, reprocessOnlinePayment } from "@/lib/bankChequeEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;
  try {
    const files = await listReprocessFiles();
    return NextResponse.json({ success: true, count: files.length, data: files, source: "db" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;
  try {
    const body = await req.json();
    const fileName = String(body.fileName || body.file || body.id || "").trim();
    const result = await reprocessOnlinePayment(fileName);
    const lines = (result.lines || []).map((l: any, idx: number) => ({
      srNo: idx + 1,
      voucherNo: l.voucherNo,
      paidTo: l.paidTo,
      amount: l.amount,
      utrRef: l.utrRef || "",
      status: l.status || "Success",
      remark: "Reprocessed"
    }));
    const successCount = lines.filter((l) => l.status === "Success").length;
    return NextResponse.json({
      success: true,
      message: result.message,
      data: lines,
      meta: {
        fileName: result.file.fileName,
        displayLabel: result.file.displayLabel,
        bank: result.file.bank,
        generatedOn: result.file.generatedOn,
        remarks: String(body.remarks || ""),
        submittedAt: new Date().toISOString(),
        batchRef: `REP${Date.now().toString().slice(-8)}`
      },
      summary: {
        totalLines: lines.length,
        successCount,
        failedCount: lines.length - successCount,
        pendingCount: 0,
        processedAmount: lines.reduce((s: number, l: any) => s + Number(l.amount || 0), 0)
      },
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Re-process failed" },
      { status: Number(error?.status) || 500 }
    );
  }
}
