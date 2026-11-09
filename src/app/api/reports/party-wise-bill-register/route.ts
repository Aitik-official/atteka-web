import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { memoryStore } from "@/lib/memoryStore";

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
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

function matchesBill(
  bill: any,
  from: Date | null,
  to: Date | null,
  billingBranch: string,
  collectionBranch: string,
  billingParty: string,
  billType: string
) {
  if (/CANCEL/i.test(String(bill.status || ""))) return false;
  const bd = bill.billDate ? new Date(bill.billDate) : bill.createdAt ? new Date(bill.createdAt) : null;
  if (from && bd && bd < from) return false;
  if (to && bd) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (bd > end) return false;
  }
  const billBranch = String(bill.billingBranch || bill.gstBranch || "ALC1").toUpperCase();
  const collBranch = String(bill.collectionBranch || billBranch).toUpperCase();
  if (billingBranch && billingBranch.trim() && !/show all/i.test(billingBranch) && !/^billing branch$/i.test(billingBranch)) {
    const code = billingBranch.replace(/^-+|-+$/g, "").trim().toUpperCase();
    if (code && !billBranch.includes(code)) return false;
  }
  if (
    collectionBranch &&
    collectionBranch.trim() &&
    !/show all/i.test(collectionBranch) &&
    !/^collection branch$/i.test(collectionBranch)
  ) {
    const code = collectionBranch.replace(/^-+|-+$/g, "").trim().toUpperCase();
    if (code && !collBranch.includes(code)) return false;
  }
  if (billingParty && billingParty.trim() && !/show all/i.test(billingParty) && !/^billing party$/i.test(billingParty)) {
    const q = billingParty.replace(/^-+|-+$/g, "").toUpperCase();
    if (
      !String(bill.customerName || "").toUpperCase().includes(q) &&
      !String(bill.customerCode || "").toUpperCase().includes(q)
    )
      return false;
  }
  if (billType && billType.trim() && !/show all/i.test(billType) && !/^bill type$/i.test(billType)) {
    const t = billType.replace(/^-+|-+$/g, "").toUpperCase();
    const label = billTypeLabel(bill.billType).toUpperCase();
    if (!label.includes(t) && !String(bill.billType || "").toUpperCase().includes(t)) return false;
  }
  return true;
}

function aggregate(bills: any[]) {
  type Agg = {
    partyName: string;
    branchName: string;
    billType: string;
    amount: number;
    igstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    totalAmount: number;
  };
  const map = new Map<string, Agg>();

  for (const bill of bills) {
    const partyName = `${String(bill.customerCode || "").trim()} - ${String(bill.customerName || "").trim()}`.replace(
      /^ - /,
      ""
    );
    const branchName = String(bill.billingBranch || bill.gstBranch || "ALC1").toUpperCase();
    const billType = billTypeLabel(bill.billType);
    const key = `${partyName}||${branchName}||${billType}`;
    const amount = num(bill.totalFreight ?? bill.amount);
    let igst = num(bill.igst);
    let cgst = num(bill.cgst);
    let sgst = num(bill.sgst);
    const tax = num(bill.taxAmount);
    // If only taxAmount is set (no split), keep as GST split zeros unless IGST-only pattern
    if (!igst && !cgst && !sgst && tax) {
      // heuristic: if city/gst suggests interstate leave as igst-like later; default split 50/50 CGST/SGST
      cgst = Number((tax / 2).toFixed(2));
      sgst = Number((tax / 2).toFixed(2));
    }
    const totalAmount = num(bill.grandTotal || amount + igst + cgst + sgst);

    const cur = map.get(key) || {
      partyName,
      branchName,
      billType,
      amount: 0,
      igstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      totalAmount: 0
    };
    cur.amount += amount;
    cur.igstAmount += igst;
    cur.cgstAmount += cgst;
    cur.sgstAmount += sgst;
    cur.totalAmount += totalAmount;
    map.set(key, cur);
  }

  const data = Array.from(map.values())
    .map((r) => ({
      ...r,
      amount: Math.round(r.amount),
      igstAmount: Math.round(r.igstAmount),
      cgstAmount: Math.round(r.cgstAmount),
      sgstAmount: Math.round(r.sgstAmount),
      totalAmount: Math.round(r.totalAmount)
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const totals = data.reduce(
    (acc, r) => ({
      amount: acc.amount + r.amount,
      igstAmount: acc.igstAmount + r.igstAmount,
      cgstAmount: acc.cgstAmount + r.cgstAmount,
      sgstAmount: acc.sgstAmount + r.sgstAmount,
      totalAmount: acc.totalAmount + r.totalAmount
    }),
    { amount: 0, igstAmount: 0, cgstAmount: 0, sgstAmount: 0, totalAmount: 0 }
  );

  return { data, totals };
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

    const bills = await CustomerBill.find(query).lean();
    const byNo = new Map<string, any>();
    for (const b of bills as any[]) byNo.set(String(b.billNumber || "").toUpperCase(), b);
    for (const m of memoryStore.bills || []) {
      const key = String(m.billNumber || "").toUpperCase();
      if (key && !byNo.has(key)) byNo.set(key, m);
    }

    const filtered = Array.from(byNo.values()).filter((b) =>
      matchesBill(b, from, to, billingBranch, collectionBranch, billingParty, billType)
    );
    const { data, totals } = aggregate(filtered);

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      totals,
      source: "mongodb"
    });
  } catch {
    const filtered = (memoryStore.bills || []).filter((b: any) =>
      matchesBill(b, from, to, billingBranch, collectionBranch, billingParty, billType)
    );
    const { data, totals } = aggregate(filtered);
    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      totals,
      isMemoryStore: true
    });
  }
}
