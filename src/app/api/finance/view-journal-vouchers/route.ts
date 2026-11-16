import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { getVoucherByNumber, listVouchers } from "@/lib/vouchersEngine";

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    const voucherNo = (searchParams.get("voucherNo") || "").trim();
    if (!voucherNo) {
      return NextResponse.json({ success: false, error: "Enter Voucher No." }, { status: 400 });
    }

    let voucher = await getVoucherByNumber(voucherNo);
    if (voucher && voucher.voucherKind && voucher.voucherKind !== "JOURNAL") {
      return NextResponse.json(
        { success: false, error: `${voucher.voucherNumber} is not a Journal voucher` },
        { status: 404 }
      );
    }
    if (!voucher) {
      const rows = await listVouchers({
        kinds: ["JOURNAL"],
        voucherNumber: voucherNo,
        includeCancelled: true
      });
      voucher = rows[0] ? await getVoucherByNumber(rows[0].voucherNumber) : null;
    }
    if (!voucher) {
      return NextResponse.json({ success: false, error: "Journal voucher not found" }, { status: 404 });
    }

    const rawLines = Array.isArray(voucher.lines) ? voucher.lines : [];
    const lines = rawLines.length
      ? rawLines.map((l: any, i: number) => ({
          srNo: i + 1,
          description: String(l.particular || l.accountName || l.description || ""),
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0)
        }))
      : [
          {
            srNo: 1,
            description: String(voucher.narration || voucher.payTo || "Journal"),
            debit: Number(voucher.totalAccountedAmount || voucher.amount || 0),
            credit: 0
          },
          {
            srNo: 2,
            description: String(voucher.payTo || "Contra"),
            debit: 0,
            credit: Number(voucher.totalAccountedAmount || voucher.amount || 0)
          }
        ];

    const totalDebit = lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        branch: `Ateka Logistics-${voucher.branch || "ALC1"}`,
        voucherNo: voucher.voucherNumber,
        chqNo: String((voucher as any).chequeNo || voucher.payload?.chequeNo || ""),
        date: fmtDate(voucher.voucherDateIso || voucher.voucherDate),
        narration: voucher.narration || "",
        paidRecvdFrom: voucher.payTo || voucher.party || "",
        lines,
        totalDebit: Number(totalDebit.toFixed(2)),
        totalCredit: Number(totalCredit.toFixed(2))
      },
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
