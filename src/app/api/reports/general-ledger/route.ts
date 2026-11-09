import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo GL accounts — column structure only; not client production data. */
const DEMO_ACCOUNTS = [
  { code: "AFB0001", name: "OPERATIONS BANK A/C" },
  { code: "AFB0002", name: "COLLECTION BANK A/C" },
  { code: "LSH0001", name: "VEHICLE LOAN - BANK A" },
  { code: "LSH0002", name: "VEHICLE LOAN - BANK B" },
  { code: "VOC0007", name: "DIESEL EXPENSES" },
  { code: "IOI0003", name: "FREIGHT INCOME (TBB)" },
  { code: "EPC0001", name: "SALARY (BASIC)" },
  { code: "CAS0001", name: "CASH IN HAND" },
  { code: "CDA0001", name: "SUNDRY DEBTORS - SUBMITTED" },
  { code: "LCL0002", name: "SUNDRY CREDITORS - TRANSPORTER" }
];

type Txn = {
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
};

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

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function fmtRangeLabel(from: string, to: string) {
  const f = new Date(from);
  const t = new Date(to);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };
  return `${f.toLocaleDateString("en-GB", opts)} To ${t.toLocaleDateString("en-GB", opts)}`;
}

function demoTxns(from: string, to: string, accountCode: string): { openingDebit: number; openingCredit: number; txns: Txn[] } {
  const seed = accountCode.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const isLiability = /^(LSH|LCL)/.test(accountCode);
  const openingDebit = isLiability ? 0 : Number((85000 + (seed % 50) * 1250.5).toFixed(2));
  const openingCredit = isLiability ? Number((120000 + (seed % 40) * 2100.25).toFixed(2)) : 0;

  const d1 = from;
  const d2 = addDays(from, Math.min(2, Math.max(0, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000))));
  const d3 = to;

  const txns: Txn[] = [
    {
      branch: "ALC1",
      date: fmtDate(d1),
      particular: isLiability ? "Being EMI / loan remittance" : "Being amount received / credited",
      debit: isLiability ? Number((45000 + (seed % 8) * 1500).toFixed(2)) : 0,
      credit: isLiability ? 0 : Number((62000 + (seed % 7) * 1800).toFixed(2)),
      voucherRef: `BPV/${String(2400 + (seed % 90))}`,
      docRef: `DOC${String(8800 + (seed % 200))}`,
      narration: "Demo period posting - settlement entry",
      payto: isLiability ? "BANK LENDER A" : "SELF",
      expenseBranch: "ALC1"
    },
    {
      branch: "ALC1",
      date: fmtDate(d2),
      particular: isLiability ? "Being interest / charge accrual" : "Being payment / disbursement",
      debit: isLiability ? 0 : Number((28500 + (seed % 9) * 950).toFixed(2)),
      credit: isLiability ? Number((12500 + (seed % 6) * 400).toFixed(2)) : 0,
      voucherRef: `JV/${String(3100 + (seed % 70))}`,
      docRef: "",
      narration: "Demo accrual / adjustment voucher",
      payto: "",
      expenseBranch: "ALC1"
    },
    {
      branch: "ALC1",
      date: fmtDate(d3),
      particular: "Being transfer / contra adjustment",
      debit: Number((8500 + (seed % 5) * 300).toFixed(2)),
      credit: Number((8500 + (seed % 5) * 300).toFixed(2)),
      voucherRef: `CV/${String(4500 + (seed % 55))}`,
      docRef: `REF${String(1200 + (seed % 150))}`,
      narration: "Demo contra entry between ledgers",
      payto: "INTER BRANCH",
      expenseBranch: "ALC1"
    }
  ];

  return { openingDebit, openingCredit, txns };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("accounts") === "1") {
    return NextResponse.json({
      success: true,
      data: DEMO_ACCOUNTS.map((a) => ({
        code: a.code,
        label: `${a.code} - ${a.name}`
      }))
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const y = new Date().getFullYear();
  const month = new Date().getMonth();
  const fyStart = month >= 3 ? y : y - 1;
  const defaultFrom = `${fyStart}-04-01`;
  const defaultTo = `${fyStart + 1}-03-31`;

  const from = parseIso(searchParams.get("from"), defaultFrom || addDays(today, -7));
  const to = parseIso(searchParams.get("to"), defaultTo || today);
  const branchRaw = (searchParams.get("branch") || "--Show All--").trim();
  const accountRaw = (searchParams.get("account") || "").trim();

  const branchLabel =
    !branchRaw || /select|show all/i.test(branchRaw) ? "--Show All--" : branchRaw;

  const acc =
    DEMO_ACCOUNTS.find(
      (a) =>
        a.code === accountRaw.toUpperCase() ||
        accountRaw.toUpperCase().includes(a.code) ||
        accountRaw.toUpperCase().includes(a.name)
    ) || DEMO_ACCOUNTS[2];

  const accountLabel = `${acc.code} - ${acc.name}`;
  const { openingDebit, openingCredit, txns } = demoTxns(from, to, acc.code);

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
      branch: branchLabel === "--Show All--" ? t.branch : branchLabel.includes(" - ") ? branchLabel.split(" - ").pop()! : t.branch,
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
    meta: {
      branch: branchLabel,
      dateRange: fmtRangeLabel(from, to),
      account: accountLabel,
      from,
      to
    }
  });
}
