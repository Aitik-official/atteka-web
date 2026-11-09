import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo customers — not client production data. */
const DEMO_CUSTOMERS = [
  { code: "CUS0001", name: "NORTHBOUND FREIGHT PVT LTD" },
  { code: "CUS0002", name: "COASTAL CARGO SOLUTIONS" },
  { code: "CUS0003", name: "METRO LOGISTICS PARTNERS" },
  { code: "CUS0004", name: "GATEWAY DISTRIBUTION CO" }
];

type Txn = {
  date: string;
  particular: string;
  voucherType: string;
  voucherRef: string;
  docRef: string;
  narration: string;
  debit: number;
  credit: number;
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
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtRange(from: string, to: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };
  return `${new Date(from).toLocaleDateString("en-GB", opts)} To ${new Date(to).toLocaleDateString("en-GB", opts)}`;
}

function seedOf(s: string) {
  return s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 42;
}

function resolveCustomer(raw: string) {
  const t = raw.trim().toUpperCase();
  if (!t) return DEMO_CUSTOMERS[0];
  return (
    DEMO_CUSTOMERS.find(
      (c) => c.code === t || t.includes(c.code) || c.name.includes(t) || t.includes(c.name.slice(0, 8))
    ) || {
      code: t.startsWith("CUS") ? t : `CUS${t.replace(/\D/g, "").padStart(4, "0") || "0099"}`,
      name: raw.trim() || "DEMO CUSTOMER"
    }
  );
}

function demoTxns(from: string, to: string, customerCode: string): { openingDebit: number; openingCredit: number; txns: Txn[] } {
  const seed = seedOf(customerCode);
  const openingDebit = Number((245000 + (seed % 55) * 2850.35).toFixed(2));
  const openingCredit = 0;

  const span = Math.max(0, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
  const d1 = from;
  const d2 = addDays(from, Math.min(2, span));
  const d3 = addDays(from, Math.min(5, span));
  const d4 = to;

  const txns: Txn[] = [
    {
      date: fmtDate(d1),
      particular: "FREIGHT BILL GENERATED",
      voucherType: "Bill",
      voucherRef: `BLALC${String(12601000 + (seed % 800))}`,
      docRef: `CN${String(55000 + (seed % 900))}`,
      narration: "Freight bill raised against submitted CNs",
      debit: Number((98500 + (seed % 8) * 2100).toFixed(2)),
      credit: 0
    },
    {
      date: fmtDate(d1),
      particular: "GST ON FREIGHT BILL",
      voucherType: "Journal",
      voucherRef: `JVALC${String(12602000 + (seed % 700))}`,
      docRef: `BLALC${String(12601000 + (seed % 800))}`,
      narration: "CGST / SGST on freight bill",
      debit: Number((17730 + (seed % 6) * 240).toFixed(2)),
      credit: 0
    },
    {
      date: fmtDate(d2),
      particular: "MR COLLECTION",
      voucherType: "MR",
      voucherRef: `MRALC${String(24000 + (seed % 500))}`,
      docRef: `CHQ${String(780000 + (seed % 9000))}`,
      narration: "Amount received against outstanding bills",
      debit: 0,
      credit: Number((75000 + (seed % 7) * 1800).toFixed(2))
    },
    {
      date: fmtDate(d3),
      particular: "FREIGHT DEDUCTION",
      voucherType: "Journal",
      voucherRef: `JVALC${String(12603000 + (seed % 600))}`,
      docRef: `CN${String(55100 + (seed % 400))}`,
      narration: "Demo claim / freight deduction adjustment",
      debit: 0,
      credit: Number((3500 + (seed % 5) * 150).toFixed(2))
    },
    {
      date: fmtDate(d4),
      particular: "FREIGHT BILL GENERATED",
      voucherType: "Bill",
      voucherRef: `BLALC${String(12604000 + (seed % 750))}`,
      docRef: `CN${String(56000 + (seed % 850))}`,
      narration: "Additional freight bill in selected period",
      debit: Number((64200 + (seed % 9) * 1250).toFixed(2)),
      credit: 0
    }
  ];

  return { openingDebit, openingCredit, txns };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("customers") === "1") {
    return NextResponse.json({
      success: true,
      data: DEMO_CUSTOMERS.map((c) => ({
        code: c.code,
        name: c.name,
        label: `${c.code} - ${c.name}`
      }))
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const customerRaw = (searchParams.get("customer") || "").trim();
  const customer = resolveCustomer(customerRaw || DEMO_CUSTOMERS[0].code);

  const { openingDebit, openingCredit, txns } = demoTxns(from, to, customer.code);

  type Row = {
    srNo: string;
    date: string;
    particular: string;
    voucherType: string;
    voucherRef: string;
    docRef: string;
    narration: string;
    debit: number;
    credit: number;
    balance: number;
    isOpening?: boolean;
    isPeriodTotal?: boolean;
    isClosing?: boolean;
    isGrandTotal?: boolean;
  };

  const rows: Row[] = [];
  let balance = openingDebit - openingCredit;
  let periodDebit = 0;
  let periodCredit = 0;

  rows.push({
    srNo: "",
    date: "",
    particular: "Opening Balance B/D :",
    voucherType: "",
    voucherRef: "",
    docRef: "",
    narration: "",
    debit: openingDebit,
    credit: openingCredit,
    balance: Number(balance.toFixed(2)),
    isOpening: true
  });

  txns.forEach((t, idx) => {
    balance = Number((balance + t.debit - t.credit).toFixed(2));
    periodDebit += t.debit;
    periodCredit += t.credit;
    rows.push({
      srNo: String(idx + 1),
      date: t.date,
      particular: t.particular,
      voucherType: t.voucherType,
      voucherRef: t.voucherRef,
      docRef: t.docRef,
      narration: t.narration,
      debit: t.debit,
      credit: t.credit,
      balance
    });
  });

  const totalDebit = Number((openingDebit + periodDebit).toFixed(2));
  const totalCredit = Number((openingCredit + periodCredit).toFixed(2));
  const closing = Number(balance.toFixed(2));
  const closingDebit = closing > 0 ? closing : 0;
  const closingCredit = closing < 0 ? Math.abs(closing) : 0;

  rows.push({
    srNo: "",
    date: "",
    particular: "Total for the Period :",
    voucherType: "",
    voucherRef: "",
    docRef: "",
    narration: "",
    debit: totalDebit,
    credit: totalCredit,
    balance: 0,
    isPeriodTotal: true
  });
  rows.push({
    srNo: "",
    date: "",
    particular: "Closing Balance C/D :",
    voucherType: "",
    voucherRef: "",
    docRef: "",
    narration: "",
    debit: closingDebit,
    credit: closingCredit,
    balance: 0,
    isClosing: true
  });
  rows.push({
    srNo: "",
    date: "",
    particular: "Grand Total :",
    voucherType: "",
    voucherRef: "",
    docRef: "",
    narration: "",
    debit: Number((totalDebit + closingCredit).toFixed(2)),
    credit: Number((totalCredit + closingDebit).toFixed(2)),
    balance: 0,
    isGrandTotal: true
  });

  return NextResponse.json({
    success: true,
    count: txns.length,
    data: rows,
    meta: {
      customerCode: customer.code,
      customerName: customer.name,
      customerLabel: `${customer.code} - ${customer.name}`,
      dateRange: fmtRange(from, to),
      from,
      to
    }
  });
}
