import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { MoneyReceipt } from "@/models/MoneyReceipt";
import { memoryStore } from "@/lib/memoryStore";

function parseDate(value?: string | null) {
  if (!value) return null;
  // support DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(value))) {
    const [dd, mm, yyyy] = String(value).split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-");
}

function formatLongDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " ");
}

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function billTypeLabel(raw?: string) {
  const t = String(raw || "Freight Bill");
  if (/freight/i.test(t)) return "Freight";
  return t.replace(/\s*Bill\s*/i, "").trim() || "Freight";
}

function billSrno(bill: any) {
  if (bill.billSrno || bill.invoiceSerial) return String(bill.billSrno || bill.invoiceSerial).toUpperCase();
  if (bill.irnDetails?.ackNo) return String(bill.irnDetails.ackNo).toUpperCase();
  const digits = String(bill.billNumber || "").replace(/\D/g, "").slice(-7) || "0000001";
  return `INV${digits.padStart(7, "0")}`;
}

function agingDays(from?: string | Date | null, asOn: Date = new Date()) {
  if (!from) return 0;
  const a = new Date(from);
  if (Number.isNaN(a.getTime())) return 0;
  return Math.max(0, Math.floor((asOn.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function emptyBuckets() {
  return {
    d0_30: 0,
    d31_60: 0,
    d61_90: 0,
    d91_120: 0,
    d121_150: 0,
    d151_180: 0,
    d181_365: 0,
    d365p: 0
  };
}

function placeInBucket(days: number, amount: number) {
  const b = emptyBuckets();
  if (days <= 30) b.d0_30 = amount;
  else if (days <= 60) b.d31_60 = amount;
  else if (days <= 90) b.d61_90 = amount;
  else if (days <= 120) b.d91_120 = amount;
  else if (days <= 150) b.d121_150 = amount;
  else if (days <= 180) b.d151_180 = amount;
  else if (days <= 365) b.d181_365 = amount;
  else b.d365p = amount;
  return b;
}

function collectedForBill(billNo: string, mrs: any[]) {
  let collected = 0;
  let deductions = 0;
  for (const mr of mrs) {
    const alloc = (mr.allocatedBills || []).find(
      (a: any) => String(a.billNumber || "").toUpperCase() === billNo
    );
    if (!alloc) continue;
    collected += num(alloc.amount);
    deductions += num(alloc.rebate);
    const allocTotal = (mr.allocatedBills || []).reduce((s: number, a: any) => s + num(a.amount), 0) || 1;
    deductions += (num(mr.tdsDeducted) * num(alloc.amount)) / allocTotal;
  }
  return { collected, deductions };
}

function mapRow(bill: any, mrsForBill: any[], asOn: Date) {
  const billNo = String(bill.billNumber || "").toUpperCase();
  const billAmount = num(bill.grandTotal);
  const { collected, deductions } = collectedForBill(billNo, mrsForBill);
  const osAmount = Math.max(0, billAmount - collected - deductions);
  const billDate = bill.billDate || bill.createdAt || null;
  const dueDate = bill.dueDate || null;
  const submitted = /SUBMITTED|PAID|GENERATED/i.test(String(bill.status || ""));
  const submissionDate = submitted ? bill.submissionDate || bill.updatedAt || billDate : null;
  const ageBase = submissionDate || billDate;
  const days = agingDays(ageBase, asOn);
  const buckets = placeInBucket(days, osAmount);
  const billBranch = String(bill.billingBranch || bill.gstBranch || "ALC1").toUpperCase();
  const collBranch = String(bill.collectionBranch || billBranch).toUpperCase();
  const crPeriod = num(bill.creditPeriod ?? bill.cr_period ?? 0);

  return {
    billingParty: `${String(bill.customerCode || "").trim()} - ${String(bill.customerName || "").trim()}`.replace(
      /^ - /,
      ""
    ),
    billNo,
    billSrno: billSrno(bill),
    billBranch,
    manualBillNo: String(bill.manualBillNo || billNo).toUpperCase(),
    billSubmissionLocation: String(bill.submissionLocation || bill.city || "MUMBAI").toUpperCase(),
    billDate,
    billDateLabel: formatLongDate(billDate),
    dueDate,
    dueDateLabel: formatLongDate(dueDate),
    crPeriod,
    entryDate: bill.createdAt || billDate,
    entryDateLabel: formatDate(bill.createdAt || billDate),
    submissionDate,
    submissionDateLabel: formatLongDate(submissionDate),
    agingDays: days,
    ...buckets,
    billType: billTypeLabel(bill.billType),
    collBranch,
    collOwner: String(bill.collOwner || bill.preparedBy || ""),
    billAmount,
    osAmount: Number(osAmount.toFixed(2)),
    billRemark: String(bill.remark || ""),
    topSheetNo: String(bill.topsheetNo || ""),
    topSheetDate: bill.topsheetDate || null,
    topSheetDateLabel: formatDate(bill.topsheetDate),
    pddRemark: String(bill.pddRemark || ""),
    customerType: String(bill.customerType || "CREDIT").toUpperCase(),
    status: bill.status || "",
    vertical: String(bill.vertical || bill.division || "")
  };
}

function matchesFilters(
  row: ReturnType<typeof mapRow>,
  bill: any,
  from: Date | null,
  to: Date | null,
  vertical: string,
  billingBranch: string,
  collectionBranch: string,
  billingParty: string,
  billType: string
) {
  // Submitted O/S: outstanding only
  if (row.osAmount <= 0) return false;
  if (/PAID|CANCEL/i.test(String(row.status || ""))) return false;

  const bd = row.billDate ? new Date(row.billDate) : null;
  if (from && bd && bd < from) return false;
  if (to && bd) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (bd > end) return false;
  }
  if (vertical && vertical.trim() && !/^select$/i.test(vertical) && !/show all/i.test(vertical) && !/vertic/i.test(vertical)) {
    if (!row.vertical.toUpperCase().includes(vertical.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  if (billingBranch && billingBranch.trim() && !/show all/i.test(billingBranch)) {
    const code = billingBranch.replace(/^-+|-+$/g, "").trim().toUpperCase();
    if (code && !row.billBranch.includes(code)) return false;
  }
  if (collectionBranch && collectionBranch.trim() && !/show all/i.test(collectionBranch)) {
    const code = collectionBranch.replace(/^-+|-+$/g, "").trim().toUpperCase();
    if (code && !row.collBranch.includes(code)) return false;
  }
  if (billingParty && billingParty.trim() && !/show all/i.test(billingParty)) {
    const q = billingParty.replace(/^-+|-+$/g, "").toUpperCase();
    if (
      !String(bill.customerName || "").toUpperCase().includes(q) &&
      !String(bill.customerCode || "").toUpperCase().includes(q) &&
      !row.billingParty.toUpperCase().includes(q)
    )
      return false;
  }
  if (billType && billType.trim() && !/show all/i.test(billType) && !/^bill type$/i.test(billType)) {
    const t = billType.replace(/^-+|-+$/g, "").toUpperCase();
    if (!row.billType.toUpperCase().includes(t) && !String(bill.billType || "").toUpperCase().includes(t))
      return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const asOn = parseDate(searchParams.get("asOn")) || to || new Date();
  asOn.setHours(23, 59, 59, 999);
  const vertical = (searchParams.get("vertical") || "").trim();
  const billingBranch = (searchParams.get("billingBranch") || "").trim();
  const collectionBranch = (searchParams.get("collectionBranch") || "").trim();
  const billingParty = (searchParams.get("billingParty") || "").trim();
  const billType = (searchParams.get("billType") || "").trim();

  try {
    await connectToDatabase();
    const query: any = { status: { $nin: ["CANCELLED", "PAID"] } };
    if (from || to) {
      query.billDate = {};
      if (from) query.billDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.billDate.$lte = end;
      }
    }

    const [bills, mrs] = await Promise.all([
      CustomerBill.find(query).sort({ billDate: -1, createdAt: -1 }).lean(),
      MoneyReceipt.find().lean().catch(() => [])
    ]);

    const byNo = new Map<string, any>();
    for (const b of bills as any[]) byNo.set(String(b.billNumber || "").toUpperCase(), b);
    for (const m of memoryStore.bills || []) {
      const key = String(m.billNumber || "").toUpperCase();
      if (key && !byNo.has(key)) byNo.set(key, m);
    }

    const allMrs = [...(mrs as any[]), ...((memoryStore as any).moneyReceipts || [])];
    const mrByBill = new Map<string, any[]>();
    for (const mr of allMrs) {
      for (const a of mr.allocatedBills || []) {
        const bn = String(a.billNumber || "").toUpperCase();
        if (!bn) continue;
        const list = mrByBill.get(bn) || [];
        list.push(mr);
        mrByBill.set(bn, list);
      }
    }

    const rows = Array.from(byNo.values())
      .map((b) => {
        const billNo = String(b.billNumber || "").toUpperCase();
        return { row: mapRow(b, mrByBill.get(billNo) || [], asOn), bill: b };
      })
      .filter(({ row, bill }) =>
        matchesFilters(row, bill, from, to, vertical, billingBranch, collectionBranch, billingParty, billType)
      )
      .map(({ row }) => row);

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      asOn: asOn.toISOString(),
      source: "mongodb"
    });
  } catch {
    const allMrs = (memoryStore as any).moneyReceipts || [];
    const mrByBill = new Map<string, any[]>();
    for (const mr of allMrs) {
      for (const a of mr.allocatedBills || []) {
        const bn = String(a.billNumber || "").toUpperCase();
        if (!bn) continue;
        const list = mrByBill.get(bn) || [];
        list.push(mr);
        mrByBill.set(bn, list);
      }
    }

    const rows = (memoryStore.bills || [])
      .map((b: any) => {
        const billNo = String(b.billNumber || "").toUpperCase();
        return { row: mapRow(b, mrByBill.get(billNo) || [], asOn), bill: b };
      })
      .filter(({ row, bill }: any) =>
        matchesFilters(row, bill, from, to, vertical, billingBranch, collectionBranch, billingParty, billType)
      )
      .map(({ row }: any) => row);

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      asOn: asOn.toISOString(),
      isMemoryStore: true
    });
  }
}
