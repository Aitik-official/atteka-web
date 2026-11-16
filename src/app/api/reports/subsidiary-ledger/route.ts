import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { Vendor } from "@/models/Vendor";
import { buildSubsidiaryLedger, listLedgerAccounts } from "@/lib/booksEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function fmtRange(from: string, to: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };
  return `${new Date(from).toLocaleDateString("en-GB", opts)} To ${new Date(to).toLocaleDateString("en-GB", opts)}`;
}

async function partyLists() {
  await connectToDatabase();
  let customers: { code: string; label: string; name: string }[] = [];
  let vendors: { code: string; label: string; name: string }[] = [];
  try {
    const cRows = await Customer.find().sort({ customerCode: 1 }).limit(80);
    customers = cRows.map((c: any) => {
      const code = String(c.customerCode || c.code || "").trim();
      const name = String(c.name || c.customerName || "Customer").trim();
      return { code, name, label: code ? `${code} - ${name}` : name };
    });
  } catch {
    customers = [];
  }
  try {
    const vRows = await Vendor.find().sort({ vendorCode: 1 }).limit(80);
    vendors = vRows.map((v: any) => {
      const code = String(v.vendorCode || v.code || "").trim();
      const name = String(v.name || v.vendorName || "Vendor").trim();
      return { code, name, label: code ? `${code} - ${name}` : name };
    });
  } catch {
    vendors = [];
  }
  const accounts = await listLedgerAccounts();
  return {
    accountHeads: ["Show All", ...accounts.map((a) => a.name)],
    customers,
    vendors,
    octroiAgents: [] as { code: string; label: string; name: string }[]
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("lists") === "1") {
    return NextResponse.json({ success: true, data: await partyLists(), source: "db" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const branchRaw = (searchParams.get("branch") || "--Show All--").trim();
  const branch =
    !branchRaw || /show all|select/i.test(branchRaw)
      ? ""
      : (branchRaw.includes(" - ") ? branchRaw.split(" - ").pop()! : branchRaw).trim().toUpperCase();
  const accountHead = (searchParams.get("accountHead") || "Show All").trim();
  const partyType = (searchParams.get("partyType") || "Customer").trim();
  const partyName = (
    searchParams.get("partyName") ||
    searchParams.get("customerName") ||
    searchParams.get("vendorName") ||
    ""
  ).trim();

  const built = await buildSubsidiaryLedger({
    from,
    to,
    branch,
    accountHead: accountHead !== "Show All" ? accountHead : undefined,
    partyName: partyName || undefined
  });

  const { openingDebit, openingCredit, txns } = built;

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

  txns.forEach((t, idx) => {
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
    count: txns.length,
    data: rows,
    source: built.source === "db" ? "db" : "empty",
    meta: {
      branch: branchRaw,
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
