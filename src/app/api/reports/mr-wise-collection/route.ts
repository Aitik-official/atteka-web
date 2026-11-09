import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MoneyReceipt } from "@/models/MoneyReceipt";
import { memoryStore } from "@/lib/memoryStore";

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

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " ");
}

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function extractCode(raw: string) {
  const t = raw.replace(/^-+|-+$/g, "").trim();
  if (!t || /show all/i.test(t) || /^collection branch$/i.test(t) || /^billing party$/i.test(t)) return "";
  return (t.includes(" - ") ? t.split(" - ").pop()! : t).trim().toUpperCase();
}

function mapRow(mr: any) {
  const mrNumber = String(mr.mrNumber || "").toUpperCase();
  const mrDate = mr.mrDate || mr.createdAt || null;
  const mrAmount = num(mr.totalReceived);
  const freightDed = num(
    mr.freightDeduction ??
      (mr.allocatedBills || []).reduce((s: number, a: any) => s + num(a.rebate ?? a.freightDeduction), 0) +
        num(mr.rebateDiscount)
  );
  const claimDed = num(mr.claimDeduction ?? 0);
  const otherDed = num(mr.otherDeduction ?? 0);
  const tdsDed = num(mr.tdsDeducted);
  const totalDed = Number((freightDed + claimDed + otherDed + tdsDed).toFixed(2));
  const allocated = (mr.allocatedBills || []).reduce((s: number, a: any) => s + num(a.amount), 0);
  const excessAmount = Number(Math.max(0, mrAmount - allocated - totalDed).toFixed(2));
  const netAmount = Number(Math.max(0, mrAmount - totalDed).toFixed(2));
  const isCheque = /CHEQUE|CHQ/i.test(String(mr.paymentMode || ""));
  const chqNo = isCheque
    ? String(mr.chequeNo || mr.referenceNumber || "").toUpperCase()
    : String(mr.chequeNo || "").toUpperCase();
  const chqDate = isCheque ? mr.chequeDate || mrDate : mr.chequeDate || null;
  const chqAmount = isCheque ? num(mr.chequeAmount ?? mrAmount) : num(mr.chequeAmount ?? 0);
  const interest24 = Number(num(mr.interest24 ?? 0).toFixed(2));

  const digits = mrNumber.replace(/\D/g, "");
  const manualMr = String(mr.manualMrNo || mr.manualMR || (digits ? `ALC${digits.slice(-8)}` : mrNumber)).toUpperCase();

  return {
    mrNumber,
    manualMr,
    mrDate,
    mrDateLabel: formatDate(mrDate),
    mrBranch: String(mr.mrBranch || mr.collectionBranch || mr.branch || "ALC1").toUpperCase(),
    partyName: `${String(mr.customerCode || "").trim()} - ${String(mr.customerName || "").trim()}`.replace(/^ - /, ""),
    customerCode: String(mr.customerCode || "").toUpperCase(),
    customerName: String(mr.customerName || ""),
    mrAmount: Number(mrAmount.toFixed(2)),
    freightDed: Number(freightDed.toFixed(2)),
    claimDed: Number(claimDed.toFixed(2)),
    otherDed: Number(otherDed.toFixed(2)),
    tdsDed: Number(tdsDed.toFixed(2)),
    totalDed,
    excessAmount,
    netAmount,
    chqNo,
    chqDate,
    chqDateLabel: formatDate(chqDate),
    chqAmount: Number(chqAmount.toFixed(2)),
    depositedIntoBank: String(mr.depositedIntoBank || mr.bankName || mr.depositBank || "").toUpperCase(),
    interest24,
    paymentMode: String(mr.paymentMode || "")
  };
}

function matchesFilters(
  row: ReturnType<typeof mapRow>,
  from: Date | null,
  to: Date | null,
  collectionBranch: string,
  billingParty: string
) {
  const md = row.mrDate ? new Date(row.mrDate) : null;
  if (from && md && md < from) return false;
  if (to && md) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (md > end) return false;
  }

  const br = extractCode(collectionBranch);
  if (br && !row.mrBranch.includes(br)) return false;

  if (billingParty && billingParty.trim() && !/show all/i.test(billingParty) && !/^billing party$/i.test(billingParty)) {
    const q = billingParty.replace(/^-+|-+$/g, "").toUpperCase();
    if (
      !row.partyName.toUpperCase().includes(q) &&
      !row.customerCode.includes(q) &&
      !row.customerName.toUpperCase().includes(q)
    )
      return false;
  }

  return true;
}

function emptyTotals() {
  return {
    mrAmount: 0,
    freightDed: 0,
    claimDed: 0,
    otherDed: 0,
    tdsDed: 0,
    totalDed: 0,
    excessAmount: 0,
    netAmount: 0,
    chqAmount: 0,
    interest24: 0
  };
}

function addTotals(t: ReturnType<typeof emptyTotals>, r: ReturnType<typeof mapRow>) {
  t.mrAmount += r.mrAmount;
  t.freightDed += r.freightDed;
  t.claimDed += r.claimDed;
  t.otherDed += r.otherDed;
  t.tdsDed += r.tdsDed;
  t.totalDed += r.totalDed;
  t.excessAmount += r.excessAmount;
  t.netAmount += r.netAmount;
  t.chqAmount += r.chqAmount;
  t.interest24 += r.interest24;
}

function roundTotals(t: ReturnType<typeof emptyTotals>) {
  (Object.keys(t) as (keyof typeof t)[]).forEach((k) => {
    t[k] = Number(t[k].toFixed(2));
  });
  return t;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const collectionBranch = (searchParams.get("collectionBranch") || "").trim();
  const billingParty = (searchParams.get("billingParty") || "").trim();
  const groupBy = (searchParams.get("groupBy") || "Branch").trim();

  try {
    await connectToDatabase();
    const query: any = {};
    if (from || to) {
      query.mrDate = {};
      if (from) query.mrDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.mrDate.$lte = end;
      }
    }

    const mrs = await MoneyReceipt.find(query).sort({ mrDate: -1, createdAt: -1 }).lean();
    const byNo = new Map<string, any>();
    for (const m of mrs as any[]) byNo.set(String(m.mrNumber || "").toUpperCase(), m);
    for (const m of (memoryStore as any).moneyReceipts || []) {
      const key = String(m.mrNumber || "").toUpperCase();
      if (key && !byNo.has(key)) byNo.set(key, m);
    }

    const rows = Array.from(byNo.values())
      .map(mapRow)
      .filter((r) => matchesFilters(r, from, to, collectionBranch, billingParty));

    // group sections for Branch Total rows
    const groups = new Map<string, ReturnType<typeof mapRow>[]>();
    for (const r of rows) {
      let key = "ALL";
      if (/branch/i.test(groupBy)) key = r.mrBranch;
      else if (/party/i.test(groupBy)) key = r.partyName;
      else if (/date/i.test(groupBy)) key = r.mrDateLabel || "Unknown";
      const list = groups.get(key) || [];
      list.push(r);
      groups.set(key, list);
    }

    const sections: { groupKey: string; rows: ReturnType<typeof mapRow>[]; branchTotal: ReturnType<typeof emptyTotals> }[] =
      [];
    const grand = emptyTotals();

    const sortedKeys = Array.from(groups.keys()).sort();
    for (const key of sortedKeys) {
      const list = groups.get(key) || [];
      const branchTotal = emptyTotals();
      for (const r of list) {
        addTotals(branchTotal, r);
        addTotals(grand, r);
      }
      sections.push({ groupKey: key, rows: list, branchTotal: roundTotals(branchTotal) });
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      sections,
      grandTotal: roundTotals(grand),
      groupBy,
      source: "mongodb"
    });
  } catch {
    const rows = ((memoryStore as any).moneyReceipts || [])
      .map(mapRow)
      .filter((r: any) => matchesFilters(r, from, to, collectionBranch, billingParty));

    const groups = new Map<string, any[]>();
    for (const r of rows) {
      let key = "ALL";
      if (/branch/i.test(groupBy)) key = r.mrBranch;
      else if (/party/i.test(groupBy)) key = r.partyName;
      else if (/date/i.test(groupBy)) key = r.mrDateLabel || "Unknown";
      const list = groups.get(key) || [];
      list.push(r);
      groups.set(key, list);
    }

    const sections: any[] = [];
    const grand = emptyTotals();
    for (const key of Array.from(groups.keys()).sort()) {
      const list = groups.get(key) || [];
      const branchTotal = emptyTotals();
      for (const r of list) {
        addTotals(branchTotal, r);
        addTotals(grand, r);
      }
      sections.push({ groupKey: key, rows: list, branchTotal: roundTotals(branchTotal) });
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      sections,
      grandTotal: roundTotals(grand),
      groupBy,
      isMemoryStore: true
    });
  }
}
