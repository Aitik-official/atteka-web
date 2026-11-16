import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { recordPrintJob } from "@/lib/bankChequeEngine";
import { PrintJobKind } from "@/models/PrintJob";

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;
  try {
    const body = await req.json();
    const kind = String(body.kind || "").toUpperCase() as PrintJobKind;
    const allowed: PrintJobKind[] = ["DOCKET", "VOUCHER", "DEBIT_ADVICE", "PDC_FREIGHT_MEMO"];
    if (!allowed.includes(kind)) {
      return NextResponse.json({ error: "Invalid print kind" }, { status: 400 });
    }
    const documentNos = Array.isArray(body.documentNos)
      ? body.documentNos.map(String)
      : body.documentNo
        ? [String(body.documentNo)]
        : body.cnList
          ? body.cnList.map(String)
          : [];
    const job = await recordPrintJob({
      kind,
      documentNos,
      payload: body
    });
    return NextResponse.json({
      success: true,
      message: job.message,
      data: job,
      source: "db",
      meta: { livePrinter: "not_connected", note: "Replica print job logged — no live printer dispatch" }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Print job failed" },
      { status: Number(error?.status) || 500 }
    );
  }
}
