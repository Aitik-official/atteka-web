import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo journal voucher view — not client production data. */
type Line = {
  srNo: number;
  description: string;
  debit: number;
  credit: number;
};

type JournalView = {
  branch: string;
  voucherNo: string;
  chqNo: string;
  date: string;
  narration: string;
  paidRecvdFrom: string;
  lines: Line[];
  totalDebit: number;
  totalCredit: number;
};

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildView(voucherNoRaw: string): JournalView {
  const cleaned = voucherNoRaw.trim().toUpperCase().replace(/\s+/g, "");
  const voucherNo = cleaned.startsWith("JV")
    ? cleaned
    : `JVALC1${cleaned.replace(/\D/g, "").padStart(8, "0") || "26105001"}`;

  const h = hashCode(voucherNo);
  const amount = Number((8500 + (h % 17) * 375 + (h % 9) * 125.5).toFixed(2));

  const parties = [
    "V000101 - NORTHBOUND TOLL SERVICES",
    "V000102 - METRO FUEL AGENCY",
    "V000103 - COASTAL WORKSHOP",
    "V000104 - GATEWAY IT SUPPLIES"
  ];
  const debitAccounts = [
    "TOLL EXPENSE (DEMO)",
    "FUEL EXPENSE (DEMO)",
    "REPAIR & MAINTENANCE (DEMO)",
    "OFFICE EXPENSE (DEMO)"
  ];
  const creditAccounts = [
    "S.CREDITOR - TRANSPORTER (DEMO)",
    "S.CREDITOR - VENDOR (DEMO)",
    "BANK - OPS (DEMO)",
    "CASH IN HAND (DEMO)"
  ];

  const party = parties[h % parties.length];
  const debitAcc = debitAccounts[h % debitAccounts.length];
  const creditAcc = creditAccounts[h % creditAccounts.length];

  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() - ((h % 12) + 1));

  const lines: Line[] = [
    { srNo: 1, description: debitAcc, debit: amount, credit: 0 },
    { srNo: 2, description: creditAcc, debit: 0, credit: amount }
  ];

  return {
    branch: "Ateka Logistics",
    voucherNo,
    chqNo: h % 4 === 0 ? `CHQ${String(100000 + (h % 90000))}` : "",
    date: fmtDate(dateObj),
    narration: `BEING DEMO JOURNAL FOR ${party.split(" - ").slice(1).join(" - ")}`,
    paidRecvdFrom: party,
    lines,
    totalDebit: amount,
    totalCredit: amount
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const voucherNo = (searchParams.get("voucherNo") || "").trim();
  if (!voucherNo) {
    return NextResponse.json({ success: false, error: "Enter Voucher No." }, { status: 400 });
  }

  const data = buildView(voucherNo);
  return NextResponse.json({ success: true, data });
}
