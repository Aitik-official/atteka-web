import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { MoneyReceipt } from "@/models/MoneyReceipt";
import { Customer } from "@/models/Customer";
import { memoryStore } from "@/lib/memoryStore";

const AGE_BUCKETS = [
  "d0_30",
  "d31_60",
  "d61_90",
  "d91_120",
  "d121_150",
  "d151_180",
  "d181_365",
  "d365p"
] as const;
type AgeBucket = (typeof AGE_BUCKETS)[number];

type Cell = { bills: number; amount: number };

function emptyCell(): Cell {
  return { bills: 0, amount: 0 };
}

function emptyBuckets(): Record<AgeBucket, Cell> {
  return {
    d0_30: emptyCell(),
    d31_60: emptyCell(),
    d61_90: emptyCell(),
    d91_120: emptyCell(),
    d121_150: emptyCell(),
    d151_180: emptyCell(),
    d181_365: emptyCell(),
    d365p: emptyCell()
  };
}

function parseDate(value?: string | null) {
  if (!value) return null;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(value))) {
    const [dd, mm, yyyy] = String(value).split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function branchCode(code?: string) {
  return String(code || "ALC1").trim().toUpperCase() || "ALC1";
}

function extractBranchCode(raw: string) {
  const t = raw.replace(/^-+|-+$/g, "").trim();
  if (!t || /show all/i.test(t)) return "";
  return (t.includes(" - ") ? t.split(" - ").pop()! : t).trim().toUpperCase();
}

function agingDays(from?: string | Date | null, asOn: Date = new Date()) {
  if (!from) return 0;
  const a = new Date(from);
  if (Number.isNaN(a.getTime())) return 0;
  return Math.max(0, Math.floor((asOn.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function bucketFor(days: number): AgeBucket {
  if (days <= 30) return "d0_30";
  if (days <= 60) return "d31_60";
  if (days <= 90) return "d61_90";
  if (days <= 120) return "d91_120";
  if (days <= 150) return "d121_150";
  if (days <= 180) return "d151_180";
  if (days <= 365) return "d181_365";
  return "d365p";
}

function collectedForBill(billNo: string, mrs: any[]) {
  let collected = 0;
  let deductions = 0;
  for (const mr of mrs) {
    if (mr.onAccount === true && !(mr.allocatedBills || []).length) continue;
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

function isPdd(bill: any) {
  return Boolean(
    String(bill.pddRemark || "").trim() ||
      bill.pddDate ||
      bill.promiseDueDate ||
      bill.pddFlag === true
  );
}

function billTypeLabel(raw?: string) {
  const t = String(raw || "Freight Bill");
  if (/freight/i.test(t)) return "Freight";
  return t.replace(/\s*Bill\s*/i, "").trim() || "Freight";
}

function onAccountForParty(partyCode: string, mrs: any[]) {
  let onAccount = 0;
  for (const mr of mrs) {
    if (String(mr.customerCode || "").toUpperCase() !== partyCode) continue;
    const allocated = (mr.allocatedBills || []).reduce((s: number, a: any) => s + num(a.amount), 0);
    const leftover = Math.max(0, num(mr.totalReceived) - allocated);
    if (!(mr.allocatedBills || []).length || leftover > 0) {
      onAccount += leftover || (!(mr.allocatedBills || []).length ? num(mr.totalReceived) : 0);
    }
  }
  return Number(onAccount.toFixed(2));
}

function matchesBill(
  bill: any,
  osAmount: number,
  from: Date | null,
  to: Date | null,
  vertical: string,
  billingBranch: string,
  collectionBranch: string,
  billingParty: string,
  billType: string
) {
  if (osAmount <= 0) return false;
  if (/PAID|CANCEL/i.test(String(bill.status || ""))) return false;

  const billDate = bill.billDate || bill.createdAt || null;
  const bd = billDate ? new Date(billDate) : null;
  if (from && bd && bd < from) return false;
  if (to && bd) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (bd > end) return false;
  }

  const v = String(bill.vertical || bill.division || "").toUpperCase();
  if (vertical && vertical.trim() && !/^select$/i.test(vertical) && !/show all/i.test(vertical) && !/vertic/i.test(vertical)) {
    if (!v.includes(vertical.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }

  const billBr = branchCode(bill.billingBranch || bill.gstBranch);
  const collBr = branchCode(bill.collectionBranch || billBr);
  const bb = extractBranchCode(billingBranch);
  if (bb && !billBr.includes(bb)) return false;
  const cb = extractBranchCode(collectionBranch);
  if (cb && !collBr.includes(cb)) return false;

  if (billingParty && billingParty.trim() && !/show all/i.test(billingParty)) {
    const q = billingParty.replace(/^-+|-+$/g, "").toUpperCase();
    if (
      !String(bill.customerName || "").toUpperCase().includes(q) &&
      !String(bill.customerCode || "").toUpperCase().includes(q)
    )
      return false;
  }

  if (billType && billType.trim() && !/show all/i.test(billType) && !/^all$/i.test(billType) && !/^bill type$/i.test(billType)) {
    const t = billType.replace(/^-+|-+$/g, "").toUpperCase();
    const label = billTypeLabel(bill.billType).toUpperCase();
    if (!label.includes(t) && !String(bill.billType || "").toUpperCase().includes(t)) return false;
  }

  return true;
}

type RowAgg = {
  partyCode: string;
  partyName: string;
  crPeriod: number;
  crLimited: number;
  typeOfCustomer: string;
  salesPerson: string;
  collectionOwner: string;
  buckets: Record<AgeBucket, Cell>;
  totalOs: Cell;
  pddTotal: Cell;
  netOs: Cell;
  onAccountAmount: number;
};

function aggregate(
  bills: any[],
  customers: Map<string, any>,
  allMrs: any[],
  mrByBill: Map<string, any[]>,
  from: Date | null,
  to: Date | null,
  vertical: string,
  billingBranch: string,
  collectionBranch: string,
  billingParty: string,
  billType: string,
  asOn: Date
) {
  const map = new Map<string, RowAgg>();

  for (const bill of bills) {
    const billNo = String(bill.billNumber || "").toUpperCase();
    if (!billNo) continue;
    const billAmount = num(bill.grandTotal);
    const { collected, deductions } = collectedForBill(billNo, mrByBill.get(billNo) || []);
    const osAmount = Math.max(0, Number((billAmount - collected - deductions).toFixed(2)));
    if (!matchesBill(bill, osAmount, from, to, vertical, billingBranch, collectionBranch, billingParty, billType))
      continue;

    const partyCode = String(bill.customerCode || "").trim().toUpperCase() || "UNKNOWN";
    const cust = customers.get(partyCode);
    let row = map.get(partyCode);
    if (!row) {
      row = {
        partyCode,
        partyName: String(bill.customerName || cust?.name || "").trim(),
        crPeriod: num(bill.creditPeriod ?? bill.cr_period ?? cust?.creditPeriod ?? 0),
        crLimited: num(bill.creditLimit ?? cust?.creditLimit ?? 0),
        typeOfCustomer: String(bill.customerType || cust?.customerType || "CREDIT").toUpperCase(),
        salesPerson: String(bill.salesPerson || cust?.salesPerson || ""),
        collectionOwner: String(bill.collOwner || bill.collectionOwner || cust?.kamPerson || ""),
        buckets: emptyBuckets(),
        totalOs: emptyCell(),
        pddTotal: emptyCell(),
        netOs: emptyCell(),
        onAccountAmount: 0
      };
      map.set(partyCode, row);
    }

    const submitted = /SUBMITTED|PAID|GENERATED/i.test(String(bill.status || ""));
    const submissionDate = submitted ? bill.submissionDate || bill.updatedAt || null : null;
    const ageBase = bill.dueDate || submissionDate || bill.billDate || bill.createdAt;
    const days = agingDays(ageBase, asOn);
    const b = bucketFor(days);

    row.buckets[b].bills += 1;
    row.buckets[b].amount += osAmount;
    row.totalOs.bills += 1;
    row.totalOs.amount += osAmount;

    if (isPdd(bill)) {
      row.pddTotal.bills += 1;
      row.pddTotal.amount += osAmount;
    } else {
      row.netOs.bills += 1;
      row.netOs.amount += osAmount;
    }
  }

  for (const [code, row] of map) {
    row.onAccountAmount = onAccountForParty(code, allMrs);
  }

  // parties with only on-account and no OS bills still shown if on-account > 0 and filters allow
  for (const mr of allMrs) {
    const code = String(mr.customerCode || "").trim().toUpperCase();
    if (!code || map.has(code)) continue;
    const oa = onAccountForParty(code, allMrs);
    if (oa <= 0) continue;
    if (billingParty && billingParty.trim() && !/show all/i.test(billingParty)) {
      const q = billingParty.replace(/^-+|-+$/g, "").toUpperCase();
      if (
        !String(mr.customerName || "").toUpperCase().includes(q) &&
        !code.includes(q)
      )
        continue;
    }
    const cust = customers.get(code);
    map.set(code, {
      partyCode: code,
      partyName: String(mr.customerName || cust?.name || "").trim(),
      crPeriod: num(cust?.creditPeriod ?? 0),
      crLimited: num(cust?.creditLimit ?? 0),
      typeOfCustomer: String(cust?.customerType || "CREDIT").toUpperCase(),
      salesPerson: String(cust?.salesPerson || ""),
      collectionOwner: String(cust?.kamPerson || ""),
      buckets: emptyBuckets(),
      totalOs: emptyCell(),
      pddTotal: emptyCell(),
      netOs: emptyCell(),
      onAccountAmount: oa
    });
  }

  const data = Array.from(map.values())
    .map((r) => ({
      ...r,
      buckets: Object.fromEntries(
        AGE_BUCKETS.map((k) => [
          k,
          { bills: r.buckets[k].bills, amount: Number(r.buckets[k].amount.toFixed(2)) }
        ])
      ) as Record<AgeBucket, Cell>,
      totalOs: { bills: r.totalOs.bills, amount: Number(r.totalOs.amount.toFixed(2)) },
      pddTotal: { bills: r.pddTotal.bills, amount: Number(r.pddTotal.amount.toFixed(2)) },
      netOs: { bills: r.netOs.bills, amount: Number(r.netOs.amount.toFixed(2)) },
      onAccountAmount: Number(r.onAccountAmount.toFixed(2))
    }))
    .filter((r) => r.totalOs.bills > 0 || r.onAccountAmount > 0)
    .sort((a, b) => a.partyName.localeCompare(b.partyName) || a.partyCode.localeCompare(b.partyCode));

  const totals: RowAgg = {
    partyCode: "Total",
    partyName: "",
    crPeriod: 0,
    crLimited: 0,
    typeOfCustomer: "",
    salesPerson: "",
    collectionOwner: "",
    buckets: emptyBuckets(),
    totalOs: emptyCell(),
    pddTotal: emptyCell(),
    netOs: emptyCell(),
    onAccountAmount: 0
  };

  for (const r of data) {
    for (const k of AGE_BUCKETS) {
      totals.buckets[k].bills += r.buckets[k].bills;
      totals.buckets[k].amount += r.buckets[k].amount;
    }
    totals.totalOs.bills += r.totalOs.bills;
    totals.totalOs.amount += r.totalOs.amount;
    totals.pddTotal.bills += r.pddTotal.bills;
    totals.pddTotal.amount += r.pddTotal.amount;
    totals.netOs.bills += r.netOs.bills;
    totals.netOs.amount += r.netOs.amount;
    totals.onAccountAmount += r.onAccountAmount;
  }

  for (const k of AGE_BUCKETS) {
    totals.buckets[k].amount = Number(totals.buckets[k].amount.toFixed(2));
  }
  totals.totalOs.amount = Number(totals.totalOs.amount.toFixed(2));
  totals.pddTotal.amount = Number(totals.pddTotal.amount.toFixed(2));
  totals.netOs.amount = Number(totals.netOs.amount.toFixed(2));
  totals.onAccountAmount = Number(totals.onAccountAmount.toFixed(2));

  return { data, totals };
}

function buildMrIndex(mrs: any[]) {
  const mrByBill = new Map<string, any[]>();
  for (const mr of mrs) {
    for (const a of mr.allocatedBills || []) {
      const bn = String(a.billNumber || "").toUpperCase();
      if (!bn) continue;
      const list = mrByBill.get(bn) || [];
      list.push(mr);
      mrByBill.set(bn, list);
    }
  }
  return mrByBill;
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

    const [bills, mrs, customers] = await Promise.all([
      CustomerBill.find(query).lean(),
      MoneyReceipt.find().lean().catch(() => []),
      Customer.find().lean().catch(() => [])
    ]);

    const byNo = new Map<string, any>();
    for (const b of bills as any[]) byNo.set(String(b.billNumber || "").toUpperCase(), b);
    for (const m of memoryStore.bills || []) {
      const key = String(m.billNumber || "").toUpperCase();
      if (key && !byNo.has(key)) byNo.set(key, m);
    }

    const custMap = new Map<string, any>();
    for (const c of customers as any[]) {
      custMap.set(String(c.customerCode || "").toUpperCase(), c);
    }
    for (const c of (memoryStore as any).customers || []) {
      const key = String(c.customerCode || "").toUpperCase();
      if (key && !custMap.has(key)) custMap.set(key, c);
    }

    const allMrs = [...(mrs as any[]), ...((memoryStore as any).moneyReceipts || [])];
    const mrByBill = buildMrIndex(allMrs);
    const { data, totals } = aggregate(
      Array.from(byNo.values()),
      custMap,
      allMrs,
      mrByBill,
      from,
      to,
      vertical,
      billingBranch,
      collectionBranch,
      billingParty,
      billType,
      asOn
    );

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      totals,
      asOn: asOn.toISOString(),
      source: "mongodb"
    });
  } catch {
    const custMap = new Map<string, any>();
    for (const c of (memoryStore as any).customers || []) {
      const key = String(c.customerCode || "").toUpperCase();
      if (key) custMap.set(key, c);
    }
    const allMrs = (memoryStore as any).moneyReceipts || [];
    const mrByBill = buildMrIndex(allMrs);
    const { data, totals } = aggregate(
      memoryStore.bills || [],
      custMap,
      allMrs,
      mrByBill,
      from,
      to,
      vertical,
      billingBranch,
      collectionBranch,
      billingParty,
      billType,
      asOn
    );

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      totals,
      asOn: asOn.toISOString(),
      isMemoryStore: true
    });
  }
}
