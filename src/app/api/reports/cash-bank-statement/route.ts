import { NextRequest, NextResponse } from "next/server";
import { buildCashBankStatement } from "@/lib/booksEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function fmtDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("accounts") === "1" || searchParams.get("lists") === "1") {
    const built = await buildCashBankStatement({});
    return NextResponse.json({
      success: true,
      data: built.accounts.map((a: any) => ({
        code: a.code,
        name: a.name || a.label,
        label: a.label || `${a.code} - ${a.name}`
      })),
      source: "db"
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const cashBank = (searchParams.get("cashBank") || searchParams.get("account") || "").trim();
  const branchRaw = (searchParams.get("branch") || "").trim();
  const branch =
    !branchRaw || /show all|select/i.test(branchRaw)
      ? ""
      : (branchRaw.includes(" - ") ? branchRaw.split(" - ").pop()! : branchRaw).trim().toUpperCase();
  const withNarration = (searchParams.get("withNarration") || "Yes").trim();
  const voucherType = (searchParams.get("voucherType") || "").trim();
  const resultMode = (searchParams.get("resultMode") || "").trim();

  const accountCode = cashBank.includes(" - ")
    ? cashBank.split(" - ")[0].trim()
    : cashBank.split(" ")[0].trim();

  const built = await buildCashBankStatement({
    from,
    to,
    accountCode: accountCode || undefined,
    branch
  });

  const acc =
    built.accounts.find((a: any) => a.code === built.accountCode || a.code === accountCode) ||
    built.accounts[0];
  const accountLabel = acc
    ? `${acc.code} - ${acc.name || acc.label || acc.code}`
    : cashBank || built.accountCode;
  const opening = built.opening;
  const txns = built.txns;

  type Row = {
    srNo: string;
    date: string;
    particulars: string;
    voucherNo: string;
    documentNo: string;
    chequeNo: string;
    debit: number;
    credit: number;
    balance: number;
    isOpening?: boolean;
    isTotalTxn?: boolean;
    isClosing?: boolean;
    isGrandTotal?: boolean;
  };

  const rows: Row[] = [];
  let balance = opening;
  let totalDebit = 0;
  let totalCredit = 0;

  rows.push({
    srNo: "",
    date: "",
    particulars: "Opening Balance B/F",
    voucherNo: "",
    documentNo: "",
    chequeNo: "",
    debit: 0,
    credit: 0,
    balance: Number(opening.toFixed(2)),
    isOpening: true
  });

  txns.forEach((t, idx) => {
    balance = Number((balance + t.debit - t.credit).toFixed(2));
    totalDebit += t.debit;
    totalCredit += t.credit;
    const particulars =
      withNarration.toLowerCase() === "no"
        ? t.particulars.split(" ").slice(0, 4).join(" ")
        : t.particulars;
    rows.push({
      srNo: String(idx + 1),
      date: fmtDateLabel(t.date),
      particulars,
      voucherNo: t.voucherNo,
      documentNo: t.documentNo,
      chequeNo: t.chequeNo,
      debit: t.debit,
      credit: t.credit,
      balance
    });
  });

  const closing = balance;
  rows.push({
    srNo: "",
    date: "",
    particulars: "Total Transaction",
    voucherNo: "",
    documentNo: "",
    chequeNo: "",
    debit: Number(totalDebit.toFixed(2)),
    credit: Number(totalCredit.toFixed(2)),
    balance: 0,
    isTotalTxn: true
  });
  rows.push({
    srNo: "",
    date: "",
    particulars: "Closing Balance C/F",
    voucherNo: "",
    documentNo: "",
    chequeNo: "",
    debit: closing >= 0 ? 0 : Number(Math.abs(closing).toFixed(2)),
    credit: closing >= 0 ? Number(closing.toFixed(2)) : 0,
    balance: 0,
    isClosing: true
  });
  rows.push({
    srNo: "",
    date: "",
    particulars: "Total",
    voucherNo: "",
    documentNo: "",
    chequeNo: "",
    debit: Number((totalDebit + (closing < 0 ? Math.abs(closing) : 0)).toFixed(2)),
    credit: Number((totalCredit + (closing >= 0 ? closing : 0)).toFixed(2)),
    balance: 0,
    isGrandTotal: true
  });

  const preparedAt = new Date();
  return NextResponse.json({
    success: true,
    count: txns.length,
    data: rows,
    source: built.source === "db" ? "db" : "empty",
    meta: {
      cashBank: accountLabel,
      preparedAt: branch || "ALC1",
      from: fmtDateLabel(from),
      to: fmtDateLabel(to),
      preparedBy: "AL002 / A1 / ALC1",
      certifiedBy: "",
      dateTime: preparedAt.toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      voucherType,
      resultMode,
      withNarration
    }
  });
}
