import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { buildCustomerLedger } from "@/lib/booksEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function fmtRange(from: string, to: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };
  return `${new Date(from).toLocaleDateString("en-GB", opts)} To ${new Date(to).toLocaleDateString("en-GB", opts)}`;
}

async function listCustomers() {
  try {
    await connectToDatabase();
    const rows = await Customer.find().sort({ customerCode: 1 }).limit(100);
    if (rows.length) {
      return rows.map((c: any) => {
        const code = String(c.customerCode || c.code || "").trim();
        const name = String(c.name || c.customerName || "Customer").trim();
        return { code, name, label: code ? `${code} - ${name}` : name };
      });
    }
  } catch {
    /* fallback */
  }
  return [
    { code: "CUS0001", name: "NORTHBOUND FREIGHT PVT LTD", label: "CUS0001 - NORTHBOUND FREIGHT PVT LTD" },
    { code: "CUS0002", name: "COASTAL CARGO SOLUTIONS", label: "CUS0002 - COASTAL CARGO SOLUTIONS" },
    { code: "CUS0003", name: "METRO LOGISTICS PARTNERS", label: "CUS0003 - METRO LOGISTICS PARTNERS" }
  ];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("customers") === "1") {
    return NextResponse.json({ success: true, data: await listCustomers(), source: "db" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const customerRaw = (searchParams.get("customer") || searchParams.get("customerCode") || "").trim();
  const customers = await listCustomers();
  const customer =
    customers.find(
      (c) =>
        c.code === customerRaw.toUpperCase() ||
        c.label === customerRaw ||
        c.name.toLowerCase() === customerRaw.toLowerCase() ||
        customerRaw.toUpperCase().includes(c.code)
    ) || customers[0];

  const built = await buildCustomerLedger({
    from,
    to,
    customerCode: customer?.code,
    customerName: customer?.name
  });

  const opening = built.opening;
  const openingDebit = opening > 0 ? opening : 0;
  const openingCredit = opening < 0 ? Math.abs(opening) : 0;
  const txns = built.txns;

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
  let balance = opening;
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
    periodDebit += t.debit;
    periodCredit += t.credit;
    balance = Number(t.balance.toFixed(2));
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
    source: built.source === "db" ? "db" : "empty",
    meta: {
      customerCode: customer?.code || "",
      customerName: customer?.name || "",
      customerLabel: customer?.label || customerRaw,
      dateRange: fmtRange(from, to),
      from,
      to
    }
  });
}
