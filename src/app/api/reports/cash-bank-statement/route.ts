import { NextRequest, NextResponse } from "next/server";

type Txn = {
  date: string;
  particulars: string;
  voucherNo: string;
  documentNo: string;
  chequeNo: string;
  debit: number;
  credit: number;
};

/** Fabricated demo cash/bank ledgers — column structure only; not client production data. */
const DEMO_ACCOUNTS = [
  { code: "AFB0001", name: "OPERATIONS BANK A/C" },
  { code: "AFB0002", name: "COLLECTION BANK A/C" },
  { code: "AFB0003", name: "ESCROW BANK A/C" },
  { code: "CAS0001", name: "CASH IN HAND" },
  { code: "CAS0002", name: "PETTY CASH" }
];

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

function fmtDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function demoTxns(from: string, to: string, accountCode: string): { opening: number; txns: Txn[] } {
  // Stable-ish fabricated opening + movements keyed by account code length
  const seed = accountCode.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const opening = Number((125000 + (seed % 40) * 2500.25).toFixed(2));

  const mid = addDays(from, 3);
  const mid2 = addDays(from, 7);
  const mid3 = addDays(from, 12);
  const near = addDays(to, -2);

  const clamp = (iso: string) => (iso < from ? from : iso > to ? to : iso);

  const txns: Txn[] = [
    {
      date: clamp(mid),
      particulars: "Being amount received against freight collection",
      voucherNo: `BRV/${String(1000 + (seed % 90))}`,
      documentNo: `MR${String(24000 + (seed % 500))}`,
      chequeNo: "",
      debit: Number((185000 + (seed % 7) * 1500).toFixed(2)),
      credit: 0
    },
    {
      date: clamp(mid),
      particulars: "Being diesel / fuel payment issued",
      voucherNo: `BPV/${String(2000 + (seed % 80))}`,
      documentNo: `ADV${String(3100 + (seed % 200))}`,
      chequeNo: String(450000 + (seed % 9000)),
      debit: 0,
      credit: Number((92000 + (seed % 5) * 1200).toFixed(2))
    },
    {
      date: clamp(mid2),
      particulars: "Being office expense / admin disbursement",
      voucherNo: `CPV/${String(3000 + (seed % 60))}`,
      documentNo: "",
      chequeNo: "",
      debit: 0,
      credit: Number((18500 + (seed % 9) * 350).toFixed(2))
    },
    {
      date: clamp(mid3),
      particulars: "Being party payment / transporter settlement",
      voucherNo: `BPV/${String(4000 + (seed % 70))}`,
      documentNo: `THC${String(8800 + (seed % 300))}`,
      chequeNo: String(780000 + (seed % 8000)),
      debit: 0,
      credit: Number((145000 + (seed % 6) * 2200).toFixed(2))
    },
    {
      date: clamp(near),
      particulars: "Being bank credit / NEFT receipt",
      voucherNo: `BRV/${String(5000 + (seed % 55))}`,
      documentNo: `INV${String(12000 + (seed % 400))}`,
      chequeNo: "",
      debit: Number((67500 + (seed % 11) * 850).toFixed(2)),
      credit: 0
    },
    {
      date: clamp(to),
      particulars: "Being bank charges / SMS alert fees",
      voucherNo: `JV/${String(6000 + (seed % 40))}`,
      documentNo: "",
      chequeNo: "",
      debit: 0,
      credit: Number((125.5 + (seed % 15)).toFixed(2))
    }
  ];

  return { opening, txns };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listOnly = searchParams.get("accounts") === "1";

  if (listOnly) {
    return NextResponse.json({
      success: true,
      data: DEMO_ACCOUNTS.map((a) => ({
        code: a.code,
        label: `${a.code} - ${a.name}`
      }))
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), addDays(today, -21));
  const to = parseIso(searchParams.get("to"), today);
  const branchRaw = (searchParams.get("branch") || "").trim();
  const accountRaw = (searchParams.get("account") || "").trim();
  const withNarration = (searchParams.get("withNarration") || "Yes").trim();
  const voucherType = (searchParams.get("voucherType") || "Approved").trim();
  const resultMode = (searchParams.get("resultMode") || "Screen").trim();

  const branchLabel =
    !branchRaw || /select|show all/i.test(branchRaw)
      ? "Ateka Logistics - ALC1"
      : branchRaw.includes(" - ")
        ? branchRaw
        : `Ateka Logistics - ${branchRaw.toUpperCase()}`;

  const acc =
    DEMO_ACCOUNTS.find(
      (a) =>
        a.code === accountRaw.toUpperCase() ||
        accountRaw.toUpperCase().startsWith(a.code) ||
        accountRaw.toUpperCase().includes(a.code)
    ) || DEMO_ACCOUNTS[0];

  const accountLabel = `${acc.code} - ${acc.name}`;
  const { opening, txns } = demoTxns(from, to, acc.code);

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
    meta: {
      cashBank: accountLabel,
      preparedAt: branchLabel,
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
