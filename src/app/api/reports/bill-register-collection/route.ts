import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { MoneyReceipt } from "@/models/MoneyReceipt";
import { memoryStore } from "@/lib/memoryStore";

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-");
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

function mapRow(bill: any, mrs: any[]) {
  const amount = num(bill.totalFreight ?? bill.amount);
  const gstAmount = num(bill.taxAmount ?? (num(bill.igst) + num(bill.cgst) + num(bill.sgst)));
  const gross = num(bill.grandTotal || amount + gstAmount);
  const billDate = bill.billDate || bill.createdAt || null;
  const submitted = /SUBMITTED|PAID/i.test(String(bill.status || ""));
  const submissionDate = submitted ? bill.submissionDate || bill.updatedAt || billDate : null;
  const billBranch = String(bill.billingBranch || bill.gstBranch || "ALC1").toUpperCase();
  const collBranch = String(bill.collectionBranch || billBranch).toUpperCase();
  const billNo = String(bill.billNumber || "").toUpperCase();

  // Aggregate MR allocations for this bill
  let collected = 0;
  let freightDeduction = 0;
  let claimDeduction = 0;
  let tdsDeduction = 0;
  let mrNo = "";
  let mrDate: any = null;
  let chqNo = "";
  let chqDate: any = null;

  for (const mr of mrs) {
    const alloc = (mr.allocatedBills || []).find(
      (a: any) => String(a.billNumber || "").toUpperCase() === billNo
    );
    if (!alloc) continue;
    collected += num(alloc.amount);
    freightDeduction += num(alloc.rebate ?? alloc.freightDeduction);
    claimDeduction += num(alloc.claimDeduction);
    // proportion TDS from MR across allocations
    const allocTotal = (mr.allocatedBills || []).reduce((s: number, a: any) => s + num(a.amount), 0) || 1;
    tdsDeduction += (num(mr.tdsDeducted) * num(alloc.amount)) / allocTotal;
    if (!mrNo) {
      mrNo = String(mr.mrNumber || "").toUpperCase();
      mrDate = mr.mrDate || null;
      if (/CHEQUE/i.test(String(mr.paymentMode || ""))) {
        chqNo = String(mr.referenceNumber || mr.chequeNo || "").toUpperCase();
        chqDate = mr.chequeDate || mr.mrDate || null;
      } else if (!chqNo && mr.referenceNumber) {
        chqNo = String(mr.referenceNumber || "").toUpperCase();
        chqDate = mr.mrDate || null;
      }
    }
  }

  const actOs = Math.max(0, gross - collected - tdsDeduction - freightDeduction - claimDeduction);
  const osAmount = actOs;
  const netAmount = Math.max(0, collected);

  return {
    billingParty: `${String(bill.customerCode || "").trim()} - ${String(bill.customerName || "").trim()}`.replace(
      /^ - /,
      ""
    ),
    billNo,
    billBranch,
    manualBillNo: String(bill.manualBillNo || billNo).toUpperCase(),
    billDate,
    billDateLabel: formatDate(billDate),
    submissionDate,
    submissionDateLabel: formatDate(submissionDate),
    billType: billTypeLabel(bill.billType),
    collBranch,
    amount,
    gstAmount,
    grossAmount: gross,
    actOs: Number(actOs.toFixed(2)),
    billRemark: String(bill.remark || ""),
    topSheetNo: String(bill.topsheetNo || ""),
    topSheetDate: bill.topsheetDate || null,
    topSheetDateLabel: formatDate(bill.topsheetDate),
    mrNo,
    mrDate,
    mrDateLabel: formatDate(mrDate),
    freightDeduction: Number(freightDeduction.toFixed(2)),
    claimDeduction: Number(claimDeduction.toFixed(2)),
    osAmount: Number(osAmount.toFixed(2)),
    tdsDeduction: Number(tdsDeduction.toFixed(2)),
    netAmount: Number(netAmount.toFixed(2)),
    chqNo,
    chqDate,
    chqDateLabel: formatDate(chqDate),
    status: bill.status || ""
  };
}

function matchesFilters(
  row: ReturnType<typeof mapRow>,
  bill: any,
  from: Date | null,
  to: Date | null,
  billingBranch: string,
  collectionBranch: string,
  billingParty: string,
  billType: string
) {
  const bd = row.billDate ? new Date(row.billDate) : null;
  if (from && bd && bd < from) return false;
  if (to && bd) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (bd > end) return false;
  }
  if (billingBranch && billingBranch.trim() && !/show all/i.test(billingBranch) && !/^billing branch$/i.test(billingBranch)) {
    const code = billingBranch.replace(/^-+|-+$/g, "").trim().toUpperCase();
    if (code && !row.billBranch.includes(code)) return false;
  }
  if (
    collectionBranch &&
    collectionBranch.trim() &&
    !/show all/i.test(collectionBranch) &&
    !/^collection branch$/i.test(collectionBranch)
  ) {
    const code = collectionBranch.replace(/^-+|-+$/g, "").trim().toUpperCase();
    if (code && !row.collBranch.includes(code)) return false;
  }
  if (billingParty && billingParty.trim() && !/show all/i.test(billingParty) && !/^billing party$/i.test(billingParty)) {
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
  const billingBranch = (searchParams.get("billingBranch") || "").trim();
  const collectionBranch = (searchParams.get("collectionBranch") || "").trim();
  const billingParty = (searchParams.get("billingParty") || "").trim();
  const billType = (searchParams.get("billType") || "").trim();

  try {
    await connectToDatabase();
    const query: any = { status: { $ne: "CANCELLED" } };
    if (from || to) {
      query.billDate = {};
      if (from) query.billDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.billDate.$lte = end;
      }
    }
    if (billingBranch && !/show all/i.test(billingBranch) && !/^billing branch$/i.test(billingBranch)) {
      query.billingBranch = new RegExp(billingBranch.replace(/^-+|-+$/g, ""), "i");
    }
    if (
      collectionBranch &&
      !/show all/i.test(collectionBranch) &&
      !/^collection branch$/i.test(collectionBranch)
    ) {
      query.collectionBranch = new RegExp(collectionBranch.replace(/^-+|-+$/g, ""), "i");
    }
    if (billingParty && !/show all/i.test(billingParty) && !/^billing party$/i.test(billingParty)) {
      query.$or = [
        { customerName: new RegExp(billingParty.replace(/^-+|-+$/g, ""), "i") },
        { customerCode: new RegExp(billingParty.replace(/^-+|-+$/g, ""), "i") }
      ];
    }
    if (billType && !/show all/i.test(billType) && !/^bill type$/i.test(billType)) {
      query.billType = new RegExp(billType.replace(/^-+|-+$/g, ""), "i");
    }

    const [bills, mrs] = await Promise.all([
      CustomerBill.find(query).sort({ billDate: -1, createdAt: -1 }).lean(),
      MoneyReceipt.find().lean().catch(() => [])
    ]);

    const byNo = new Map<string, any>();
    for (const b of bills as any[]) {
      byNo.set(String(b.billNumber || "").toUpperCase(), b);
    }
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
        return { row: mapRow(b, mrByBill.get(billNo) || []), bill: b };
      })
      .filter(({ row, bill }) =>
        matchesFilters(row, bill, from, to, billingBranch, collectionBranch, billingParty, billType)
      )
      .map(({ row }) => row);

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
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
        return { row: mapRow(b, mrByBill.get(billNo) || []), bill: b };
      })
      .filter(({ row, bill }: any) =>
        matchesFilters(row, bill, from, to, billingBranch, collectionBranch, billingParty, billType)
      )
      .map(({ row }: any) => row);

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      isMemoryStore: true
    });
  }
}
