import { NextRequest, NextResponse } from "next/server";
import { buildGeneralLedger, listLedgerAccounts } from "@/lib/booksEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function fmtRangeLabel(from: string, to: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };
  return `${new Date(from).toLocaleDateString("en-GB", opts)} To ${new Date(to).toLocaleDateString("en-GB", opts)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("accounts") === "1") {
    const accounts = await listLedgerAccounts();
    return NextResponse.json({
      success: true,
      data: accounts.map((a) => ({ code: a.code, label: a.label, name: a.name })),
      source: "db"
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const branchRaw = (searchParams.get("branch") || "--Show All--").trim();
  const branch =
    !branchRaw || /show all|select/i.test(branchRaw)
      ? ""
      : (branchRaw.includes(" - ") ? branchRaw.split(" - ").pop()! : branchRaw).trim().toUpperCase();
  const accountRaw = (searchParams.get("account") || searchParams.get("accountCode") || "").trim();
  const accounts = await listLedgerAccounts();
  const account =
    accounts.find((a) => a.code === accountRaw || a.label === accountRaw || a.name === accountRaw) ||
    accounts[0];
  if (!account) {
    return NextResponse.json({ success: true, count: 0, data: [], source: "empty" });
  }

  const { openingDebit, openingCredit, txns, source } = await buildGeneralLedger({
    from,
    to,
    branch,
    accountCode: account.code
  });

  type Row = {
    srNo: string;
    branch: string;
    date: string;
    particular: string;
    debit: number;
    credit: number;
    voucherRef: string;
    docRef: string;
    narration: string;
    payto: string;
    expenseBranch: string;
    isOpening?: boolean;
    isCurrentTotal?: boolean;
    isPeriodTotal?: boolean;
    isClosing?: boolean;
    isGrandTotal?: boolean;
  };

  const rows: Row[] = [];
  let periodDebit = 0;
  let periodCredit = 0;

  rows.push({
    srNo: "",
    branch: "",
    date: "",
    particular: "Opening Balance B/D :",
    debit: openingDebit,
    credit: openingCredit,
    voucherRef: "",
    docRef: "",
    narration: "",
    payto: "",
    expenseBranch: "",
    isOpening: true
  });

  txns.forEach((t, idx) => {
    periodDebit += t.debit;
    periodCredit += t.credit;
    rows.push({
      srNo: String(idx + 1),
      branch: branch || t.branch,
      date: t.date,
      particular: t.particular,
      debit: t.debit,
      credit: t.credit,
      voucherRef: t.voucherRef,
      docRef: t.docRef,
      narration: t.narration,
      payto: t.payto,
      expenseBranch: t.expenseBranch
    });
  });

  const totalPeriodDebit = Number((openingDebit + periodDebit).toFixed(2));
  const totalPeriodCredit = Number((openingCredit + periodCredit).toFixed(2));
  const net = totalPeriodDebit - totalPeriodCredit;
  const closingDebit = net < 0 ? Number(Math.abs(net).toFixed(2)) : 0;
  const closingCredit = net > 0 ? Number(net.toFixed(2)) : 0;

  rows.push({
    srNo: "",
    branch: "",
    date: "",
    particular: "Total for the Current Period :",
    debit: Number(periodDebit.toFixed(2)),
    credit: Number(periodCredit.toFixed(2)),
    voucherRef: "",
    docRef: "",
    narration: "",
    payto: "",
    expenseBranch: "",
    isCurrentTotal: true
  });
  rows.push({
    srNo: "",
    branch: "",
    date: "",
    particular: "Total for the Period :",
    debit: totalPeriodDebit,
    credit: totalPeriodCredit,
    voucherRef: "",
    docRef: "",
    narration: "",
    payto: "",
    expenseBranch: "",
    isPeriodTotal: true
  });
  rows.push({
    srNo: "",
    branch: "",
    date: "",
    particular: "Closing Balance C/D :",
    debit: closingDebit,
    credit: closingCredit,
    voucherRef: "",
    docRef: "",
    narration: "",
    payto: "",
    expenseBranch: "",
    isClosing: true
  });
  rows.push({
    srNo: "",
    branch: "",
    date: "",
    particular: "Grand Total :",
    debit: Number((totalPeriodDebit + closingDebit).toFixed(2)),
    credit: Number((totalPeriodCredit + closingCredit).toFixed(2)),
    voucherRef: "",
    docRef: "",
    narration: "",
    payto: "",
    expenseBranch: "",
    isGrandTotal: true
  });

  return NextResponse.json({
    success: true,
    count: txns.length,
    data: rows,
    source: source === "db" ? "db" : "empty",
    meta: {
      branch: branchRaw || "--Show All--",
      dateRange: fmtRangeLabel(from, to),
      account: account.label,
      from,
      to
    }
  });
}
