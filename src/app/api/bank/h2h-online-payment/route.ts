import { NextRequest, NextResponse } from "next/server";

export type H2hPaymentType = "A-Pay" | "F-Pay" | "B-Pay" | "O-Pay" | "Fleet" | "Salary";

export type H2hPaymentRow = {
  id: string;
  voucherNo: string;
  voucherDate: string;
  ageingDays: number;
  documentNo: string;
  paymentType: H2hPaymentType;
  projectName: string;
  paidTo: string;
  amount: number;
  income: number;
  expense: number;
  bankName: string;
  acNoIfsc: string;
  paymentMode: string;
  hdfcRemark: string;
  entryBy: string;
  attachedFile: string;
  narration: string;
  status: "Pending" | "Approved" | "Rejected";
};

/** Fabricated demo queue — column structure only; not client production data. */
const DEMO_QUEUE: H2hPaymentRow[] = [
  {
    id: "h2h-1",
    voucherNo: "BPV/ALC1/26001",
    voucherDate: "2026-11-08",
    ageingDays: 2,
    documentNo: "THC88421",
    paymentType: "F-Pay",
    projectName: "North Corridor Freight",
    paidTo: "SHREE TRANSPORT CO",
    amount: 48500,
    income: 72000,
    expense: 48500,
    bankName: "HDFC BANK",
    acNoIfsc: "502000112233 - HDFC0001234",
    paymentMode: "NEFT",
    hdfcRemark: "",
    entryBy: "AL002",
    attachedFile: "thc88421.pdf",
    narration: "Being freight settlement against THC88421",
    status: "Pending"
  },
  {
    id: "h2h-2",
    voucherNo: "BPV/ALC1/26002",
    voucherDate: "2026-11-07",
    ageingDays: 3,
    documentNo: "ADV3108",
    paymentType: "A-Pay",
    projectName: "Driver Advance - Trip ALC1-4412",
    paidTo: "RAJESH KUMAR",
    amount: 12000,
    income: 0,
    expense: 12000,
    bankName: "SBI",
    acNoIfsc: "30123456789 - SBIN0000456",
    paymentMode: "IMPS",
    hdfcRemark: "",
    entryBy: "AL015",
    attachedFile: "",
    narration: "Being trip advance for driver",
    status: "Pending"
  },
  {
    id: "h2h-3",
    voucherNo: "BPV/ALC1/26003",
    voucherDate: "2026-11-06",
    ageingDays: 4,
    documentNo: "BILL99210",
    paymentType: "B-Pay",
    projectName: "Vendor Billing Settlement",
    paidTo: "MEHTA FUELS PVT LTD",
    amount: 156750.5,
    income: 0,
    expense: 156750.5,
    bankName: "ICICI BANK",
    acNoIfsc: "628901234567 - ICIC0000789",
    paymentMode: "RTGS",
    hdfcRemark: "Vendor KYC verified",
    entryBy: "AL002",
    attachedFile: "bill99210.pdf",
    narration: "Being diesel / fuel vendor payment",
    status: "Pending"
  },
  {
    id: "h2h-4",
    voucherNo: "BPV/ALC1/26004",
    voucherDate: "2026-11-05",
    ageingDays: 5,
    documentNo: "OPS7711",
    paymentType: "O-Pay",
    projectName: "Office Admin Expense",
    paidTo: "OFFICE MART SUPPLIES",
    amount: 8450,
    income: 0,
    expense: 8450,
    bankName: "AXIS BANK",
    acNoIfsc: "912010123456789 - UTIB0001122",
    paymentMode: "NEFT",
    hdfcRemark: "",
    entryBy: "AL021",
    attachedFile: "",
    narration: "Being stationery and admin purchase",
    status: "Pending"
  },
  {
    id: "h2h-5",
    voucherNo: "BPV/ALC1/26005",
    voucherDate: "2026-11-04",
    ageingDays: 6,
    documentNo: "FLT2201",
    paymentType: "Fleet",
    projectName: "Fleet Maintenance - MH12AB1234",
    paidTo: "AUTO CARE GARAGE",
    amount: 27500,
    income: 0,
    expense: 27500,
    bankName: "HDFC BANK",
    acNoIfsc: "501002223344 - HDFC0003344",
    paymentMode: "NEFT",
    hdfcRemark: "",
    entryBy: "AL008",
    attachedFile: "flt2201.jpg",
    narration: "Being vehicle service / spare parts",
    status: "Pending"
  },
  {
    id: "h2h-6",
    voucherNo: "BPV/ALC1/26006",
    voucherDate: "2026-11-03",
    ageingDays: 7,
    documentNo: "SAL-NOV-01",
    paymentType: "Salary",
    projectName: "Staff Salary - Nov Cycle",
    paidTo: "PAYROLL DISBURSEMENT",
    amount: 325000,
    income: 0,
    expense: 325000,
    bankName: "INDUSIND BANK",
    acNoIfsc: "201002938471 - INDB0000001",
    paymentMode: "Bulk NEFT",
    hdfcRemark: "Salary batch",
    entryBy: "AL001",
    attachedFile: "salary-nov.xlsx",
    narration: "Being staff salary disbursement",
    status: "Pending"
  },
  {
    id: "h2h-7",
    voucherNo: "BPV/ALC1/26007",
    voucherDate: "2026-11-09",
    ageingDays: 1,
    documentNo: "MR24112",
    paymentType: "F-Pay",
    projectName: "West Zone Collection Payout",
    paidTo: "PATEL ROADLINES",
    amount: 63200,
    income: 98000,
    expense: 63200,
    bankName: "YES BANK",
    acNoIfsc: "012345678901 - YESB0000123",
    paymentMode: "NEFT",
    hdfcRemark: "",
    entryBy: "AL015",
    attachedFile: "",
    narration: "Being market truck hire settlement",
    status: "Pending"
  }
];

/** In-memory mutation store for approve/reject during the session. */
let queueState: H2hPaymentRow[] | null = null;

function getQueue() {
  if (!queueState) {
    queueState = DEMO_QUEUE.map((r) => ({ ...r }));
  }
  return queueState;
}

function sumByType(rows: H2hPaymentRow[], type: H2hPaymentType) {
  return rows
    .filter((r) => r.status === "Pending" && r.paymentType === type)
    .reduce((s, r) => s + r.amount, 0);
}

function buildSummary(rows: H2hPaymentRow[]) {
  const pending = rows.filter((r) => r.status === "Pending");
  const aPay = sumByType(rows, "A-Pay");
  const fPay = sumByType(rows, "F-Pay");
  const bPay = sumByType(rows, "B-Pay");
  const oPay = sumByType(rows, "O-Pay");
  const fleet = sumByType(rows, "Fleet");
  const salary = sumByType(rows, "Salary");
  return {
    aPay,
    fPay,
    bPay,
    oPay,
    fleet,
    salary,
    total: aPay + fPay + bPay + oPay + fleet + salary,
    pendingCount: pending.length,
    balance: 1845620.75
  };
}

function fmtDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bank = (searchParams.get("bank") || "INDUSIND BANK").trim();
  const projectQ = (searchParams.get("project") || "").trim().toLowerCase();
  const entryByQ = (searchParams.get("entryBy") || "").trim().toLowerCase();
  const status = (searchParams.get("status") || "Pending").trim();

  let rows = getQueue().filter((r) => (status === "All" ? true : r.status === status));

  if (projectQ) {
    rows = rows.filter(
      (r) =>
        r.projectName.toLowerCase().includes(projectQ) ||
        r.paidTo.toLowerCase().includes(projectQ) ||
        r.voucherNo.toLowerCase().includes(projectQ)
    );
  }
  if (entryByQ) {
    rows = rows.filter((r) => r.entryBy.toLowerCase().includes(entryByQ));
  }

  return NextResponse.json({
    success: true,
    bank,
    count: rows.length,
    data: rows.map((r) => ({
      ...r,
      voucherDateLabel: fmtDateLabel(r.voucherDate),
      profit: Number((r.income - r.expense).toFixed(2))
    })),
    summary: buildSummary(getQueue()),
    meta: {
      bankAccount: bank,
      debitAccount: "201002938471",
      ifsc: "INDB0000001",
      preparedAt: new Date().toISOString()
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "").toLowerCase();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];

    if (action === "balance") {
      const summary = buildSummary(getQueue());
      return NextResponse.json({
        success: true,
        data: {
          bank: "INDUSIND BANK",
          accountNo: "201002938471",
          ifsc: "INDB0000001",
          availableBalance: summary.balance,
          ledgerBalance: summary.balance + 12500,
          asOf: new Date().toLocaleString("en-GB")
        }
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be approve, reject, or balance" }, { status: 400 });
    }
    if (!ids.length) {
      return NextResponse.json({ error: "Select at least one voucher" }, { status: 400 });
    }

    const queue = getQueue();
    const nextStatus = action === "approve" ? "Approved" : "Rejected";
    let updated = 0;
    for (const row of queue) {
      if (ids.includes(row.id) && row.status === "Pending") {
        row.status = nextStatus;
        updated += 1;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      action: nextStatus,
      summary: buildSummary(queue),
      message:
        nextStatus === "Approved"
          ? `${updated} payment(s) approved for IndusInd H2H dispatch (demo)`
          : `${updated} payment(s) rejected (demo)`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
