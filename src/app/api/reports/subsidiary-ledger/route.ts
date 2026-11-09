import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo parties / accounts — not client production data. */
const DEMO_CUSTOMERS = [
  { code: "CUS0001", name: "NORTHBOUND FREIGHT PVT LTD" },
  { code: "CUS0002", name: "COASTAL CARGO SOLUTIONS" },
  { code: "CUS0003", name: "METRO LOGISTICS PARTNERS" }
];

const DEMO_VENDORS = [
  { code: "VEN0001", name: "HIGHWAY TRANSPORT SERVICES" },
  { code: "VEN0002", name: "FUEL SUPPLY AGENCY" },
  { code: "VEN0003", name: "WORKSHOP SPARES TRADERS" }
];

const DEMO_OCTROI = [
  { code: "OCT0001", name: "CITY OCTROI AGENT - WEST" },
  { code: "OCT0002", name: "CITY OCTROI AGENT - EAST" }
];

const DEMO_ACCOUNT_HEADS = [
  "Show All",
  "FREIGHT INCOME (CN BOOKING - TBB)",
  "CENTRAL GST PAYABLE",
  "STATE GST PAYABLE",
  "SUNDRY DEBTORS - CUSTOMER",
  "SUNDRY CREDITORS - TRANSPORTER"
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
  chequeNo: string;
  chequeDate: string;
  costCenter: string;
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

function demoTxns(from: string, to: string, partyKey: string): { openingDebit: number; openingCredit: number; txns: Txn[] } {
  const seed = seedOf(partyKey);
  const openingDebit = Number((185000 + (seed % 60) * 3250.42).toFixed(2));
  const openingCredit = 0;

  const span = Math.max(0, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
  const d1 = from;
  const d2 = addDays(from, Math.min(2, span));
  const d3 = addDays(from, Math.min(4, span));
  const d4 = to;

  const txns: Txn[] = [
    {
      branch: "ALC1",
      date: fmtDate(d1),
      particular: "FREIGHT INCOME (CN BOOKING - TBB)",
      debit: Number((125000 + (seed % 9) * 2400).toFixed(2)),
      credit: 0,
      voucherRef: `JVALC${String(12600000 + (seed % 900))}`,
      docRef: `BLALC${String(12600000 + (seed % 700))}`,
      narration: `When Freight Bill is generated BLALC${String(12600000 + (seed % 700))}`,
      chequeNo: "",
      chequeDate: "",
      costCenter: ""
    },
    {
      branch: "ALC1",
      date: fmtDate(d1),
      particular: "CENTRAL GST PAYABLE",
      debit: 0,
      credit: Number((11250 + (seed % 5) * 180).toFixed(2)),
      voucherRef: `JVALC${String(12600100 + (seed % 900))}`,
      docRef: `BLALC${String(12600000 + (seed % 700))}`,
      narration: "GST component on freight bill",
      chequeNo: "",
      chequeDate: "",
      costCenter: ""
    },
    {
      branch: "ALC1",
      date: fmtDate(d2),
      particular: "STATE GST PAYABLE",
      debit: 0,
      credit: Number((11250 + (seed % 5) * 180).toFixed(2)),
      voucherRef: `JVALC${String(12600200 + (seed % 900))}`,
      docRef: `BLALC${String(12600050 + (seed % 700))}`,
      narration: "SGST component on freight bill",
      chequeNo: "",
      chequeDate: "",
      costCenter: ""
    },
    {
      branch: "ALC1",
      date: fmtDate(d3),
      particular: "ON ACCOUNT RECEIPT",
      debit: 0,
      credit: Number((85000 + (seed % 8) * 1500).toFixed(2)),
      voucherRef: `MRALC${String(24000 + (seed % 500))}`,
      docRef: `MR${String(8800 + (seed % 300))}`,
      narration: "Collection against outstanding bills",
      chequeNo: String(450000 + (seed % 9000)),
      chequeDate: fmtDate(d3),
      costCenter: "ALC1"
    },
    {
      branch: "ALC1",
      date: fmtDate(d4),
      particular: "FREIGHT DEDUCTION / ADJUSTMENT",
      debit: Number((4500 + (seed % 6) * 220).toFixed(2)),
      credit: 0,
      voucherRef: `JVALC${String(12600300 + (seed % 900))}`,
      docRef: `CN${String(5500 + (seed % 200))}`,
      narration: "Demo freight deduction adjustment",
      chequeNo: "",
      chequeDate: "",
      costCenter: ""
    }
  ];

  return { openingDebit, openingCredit, txns };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("lists");

  if (mode === "1") {
    return NextResponse.json({
      success: true,
      data: {
        accountHeads: DEMO_ACCOUNT_HEADS,
        customers: DEMO_CUSTOMERS.map((c) => ({ code: c.code, label: `${c.code} - ${c.name}`, name: c.name })),
        vendors: DEMO_VENDORS.map((v) => ({ code: v.code, label: `${v.code} - ${v.name}`, name: v.name })),
        octroiAgents: DEMO_OCTROI.map((o) => ({ code: o.code, label: `${o.code} - ${o.name}`, name: o.name }))
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), addDays(today, -6));
  const to = parseIso(searchParams.get("to"), today);
  const branchRaw = (searchParams.get("branch") || "--Show All--").trim();
  const accountHead = (searchParams.get("accountHead") || "Show All").trim() || "Show All";
  const customer = (searchParams.get("customer") || "").trim();
  const vendor = (searchParams.get("vendor") || "").trim();
  const octroi = (searchParams.get("octroi") || "").trim();

  const partyName =
    customer ||
    vendor ||
    octroi ||
    DEMO_CUSTOMERS[0].name;

  const partyType = customer ? "Customer" : vendor ? "Vendor" : octroi ? "Octroi Agent" : "Customer";

  const branchLabel =
    !branchRaw || /select|show all/i.test(branchRaw) ? "--Show All--" : branchRaw;

  const { openingDebit, openingCredit, txns } = demoTxns(from, to, partyName);

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
    chequeNo: string;
    chequeDate: string;
    costCenter: string;
    isOpening?: boolean;
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
    chequeNo: "",
    chequeDate: "",
    costCenter: "",
    isOpening: true
  });

  const filteredTxns =
    accountHead && accountHead !== "Show All"
      ? txns.filter((t) => t.particular.toUpperCase().includes(accountHead.toUpperCase().slice(0, 12)))
      : txns;

  const useTxns = filteredTxns.length ? filteredTxns : txns;

  useTxns.forEach((t, idx) => {
    periodDebit += t.debit;
    periodCredit += t.credit;
    rows.push({
      srNo: String(idx + 1),
      branch: t.branch,
      date: t.date,
      particular: t.particular,
      debit: t.debit,
      credit: t.credit,
      voucherRef: t.voucherRef,
      docRef: t.docRef,
      narration: t.narration,
      chequeNo: t.chequeNo,
      chequeDate: t.chequeDate,
      costCenter: t.costCenter
    });
  });

  const totalDebit = Number((openingDebit + periodDebit).toFixed(2));
  const totalCredit = Number((openingCredit + periodCredit).toFixed(2));
  const net = totalDebit - totalCredit;
  const closingDebit = net < 0 ? Number(Math.abs(net).toFixed(2)) : 0;
  const closingCredit = net > 0 ? Number(net.toFixed(2)) : 0;

  rows.push({
    srNo: "",
    branch: "",
    date: "",
    particular: "Total for the Period :",
    debit: totalDebit,
    credit: totalCredit,
    voucherRef: "",
    docRef: "",
    narration: "",
    chequeNo: "",
    chequeDate: "",
    costCenter: "",
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
    chequeNo: "",
    chequeDate: "",
    costCenter: "",
    isClosing: true
  });
  rows.push({
    srNo: "",
    branch: "",
    date: "",
    particular: "Grand Total :",
    debit: Number((totalDebit + closingDebit).toFixed(2)),
    credit: Number((totalCredit + closingCredit).toFixed(2)),
    voucherRef: "",
    docRef: "",
    narration: "",
    chequeNo: "",
    chequeDate: "",
    costCenter: "",
    isGrandTotal: true
  });

  return NextResponse.json({
    success: true,
    count: useTxns.length,
    data: rows,
    meta: {
      branch: branchLabel,
      dateRange: fmtRange(from, to),
      accountHead,
      partyType,
      partyName,
      customerName: partyType === "Customer" ? partyName : "",
      vendorName: partyType === "Vendor" ? partyName : "",
      octroiName: partyType === "Octroi Agent" ? partyName : ""
    }
  });
}
