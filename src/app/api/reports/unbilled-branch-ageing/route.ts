import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { CustomerBill } from "@/models/CustomerBill";
import { memoryStore } from "@/lib/memoryStore";

const AGE_BUCKETS = ["d0_30", "d31_60", "d61_90", "d91_180", "d180p"] as const;
type AgeBucket = (typeof AGE_BUCKETS)[number];

type BucketVals = { cns: number; freight: number; dktTotal: number };

function emptyBucket(): BucketVals {
  return { cns: 0, freight: 0, dktTotal: 0 };
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function agingDays(from?: string | Date | null, to: Date = new Date()) {
  if (!from) return 0;
  const a = new Date(from);
  if (Number.isNaN(a.getTime())) return 0;
  return Math.max(0, Math.floor((to.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function bucketFor(days: number): AgeBucket {
  if (days <= 30) return "d0_30";
  if (days <= 60) return "d31_60";
  if (days <= 90) return "d61_90";
  if (days <= 180) return "d91_180";
  return "d180p";
}

function branchCode(code?: string) {
  return String(code || "ALC1").trim().toUpperCase() || "ALC1";
}

function matchesCnFilters(
  c: any,
  from: Date | null,
  to: Date | null,
  transportMode: string,
  vertical: string,
  bookingBranch: string,
  billingParty: string,
  billingBranch: string
) {
  const booked = c.bookingDate ? new Date(c.bookingDate) : null;
  if (from && booked && booked < from) return false;
  if (to && booked) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (booked > end) return false;
  }
  if (transportMode && transportMode.trim() && !/show all/i.test(transportMode) && !/^transport mode$/i.test(transportMode)) {
    const mode = String(c.mode || c.serviceType || "").toUpperCase();
    if (!mode.includes(transportMode.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  if (vertical && vertical.trim() && !/show all/i.test(vertical) && !/vertic/i.test(vertical) && !/division/i.test(vertical)) {
    const v = String(c.buDescription || c.vertical || c.division || "").toUpperCase();
    if (!v.includes(vertical.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  if (bookingBranch && bookingBranch.trim() && !/show all/i.test(bookingBranch)) {
    const code = bookingBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim().toUpperCase();
    if (code && !branchCode(c.bookingBranch).includes(code)) return false;
  }
  if (billingParty && !/show all/i.test(billingParty)) {
    if (!String(c.billingParty || "").toUpperCase().includes(billingParty.replace(/^-+|-+$/g, "").toUpperCase()))
      return false;
  }
  if (billingBranch && !/show all/i.test(billingBranch)) {
    const code = billingBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim().toUpperCase();
    const billBr = branchCode(c.billedAt || c.bookingBranch);
    if (code && !billBr.includes(code) && !branchCode(c.bookingBranch).includes(code)) return false;
  }
  return true;
}

function aggregate(
  consignments: any[],
  billedDockets: Set<string>,
  from: Date | null,
  to: Date | null,
  transportMode: string,
  vertical: string,
  bookingBranch: string,
  billingParty: string,
  billingBranch: string,
  asOf: Date
) {
  type RowAgg = {
    billBr: string;
    bkgBr: string;
    buckets: Record<AgeBucket, BucketVals>;
    total: BucketVals;
  };

  const map = new Map<string, RowAgg>();

  for (const c of consignments) {
    const docket = String(c.docketNo || "").toUpperCase();
    if (!docket) continue;
    if (billedDockets.has(docket)) continue;
    if (/BILL|CANCEL/i.test(String(c.status || ""))) continue;
    if (!matchesCnFilters(c, from, to, transportMode, vertical, bookingBranch, billingParty, billingBranch)) continue;

    const billBr = branchCode(c.billedAt || c.bookingBranch || "ALC1");
    const bkgBr = branchCode(c.bookingBranch || "ALC1");
    const key = `${billBr}||${bkgBr}`;
    let row = map.get(key);
    if (!row) {
      row = {
        billBr,
        bkgBr,
        buckets: {
          d0_30: emptyBucket(),
          d31_60: emptyBucket(),
          d61_90: emptyBucket(),
          d91_180: emptyBucket(),
          d180p: emptyBucket()
        },
        total: emptyBucket()
      };
      map.set(key, row);
    }

    const freight = num(c.financials?.freightAmount);
    const dktTotal = num(c.financials?.grandTotal ?? freight);
    const days = agingDays(c.bookingDate || c.createdAt, asOf);
    const b = bucketFor(days);

    row.buckets[b].cns += 1;
    row.buckets[b].freight += freight;
    row.buckets[b].dktTotal += dktTotal;
    row.total.cns += 1;
    row.total.freight += freight;
    row.total.dktTotal += dktTotal;
  }

  const data = Array.from(map.values()).sort((a, b) =>
    a.billBr === b.billBr ? a.bkgBr.localeCompare(b.bkgBr) : a.billBr.localeCompare(b.billBr)
  );

  const totals: RowAgg = {
    billBr: "Total",
    bkgBr: "",
    buckets: {
      d0_30: emptyBucket(),
      d31_60: emptyBucket(),
      d61_90: emptyBucket(),
      d91_180: emptyBucket(),
      d180p: emptyBucket()
    },
    total: emptyBucket()
  };

  for (const r of data) {
    for (const k of AGE_BUCKETS) {
      totals.buckets[k].cns += r.buckets[k].cns;
      totals.buckets[k].freight += r.buckets[k].freight;
      totals.buckets[k].dktTotal += r.buckets[k].dktTotal;
    }
    totals.total.cns += r.total.cns;
    totals.total.freight += r.total.freight;
    totals.total.dktTotal += r.total.dktTotal;
  }

  return { data, totals };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const transportMode = (searchParams.get("transportMode") || "").trim();
  const vertical = (searchParams.get("vertical") || "").trim();
  const bookingBranch = (searchParams.get("bookingBranch") || "").trim();
  const billingParty = (searchParams.get("billingParty") || "").trim();
  const billingBranch = (searchParams.get("billingBranch") || "").trim();
  const asOf = to ? new Date(to) : new Date();
  asOf.setHours(23, 59, 59, 999);

  try {
    await connectToDatabase();
    const query: any = { status: { $nin: ["BILLED", "CANCELLED"] } };
    if (from || to) {
      query.bookingDate = {};
      if (from) query.bookingDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.bookingDate.$lte = end;
      }
    }

    const [consignments, bills] = await Promise.all([
      Consignment.find(query).lean(),
      CustomerBill.find().select("consignments").lean().catch(() => [])
    ]);

    const billedDockets = new Set<string>();
    for (const b of bills as any[]) {
      for (const dn of b.consignments || []) billedDockets.add(String(dn).toUpperCase());
    }
    for (const b of memoryStore.bills || []) {
      for (const dn of b.consignments || []) billedDockets.add(String(dn).toUpperCase());
    }

    const byDocket = new Map<string, any>();
    for (const c of consignments as any[]) {
      byDocket.set(String(c.docketNo || "").toUpperCase(), c);
    }
    for (const m of memoryStore.getConsignments()) {
      const key = String(m.docketNo || "").toUpperCase();
      if (key && !byDocket.has(key)) byDocket.set(key, m);
    }

    const { data, totals } = aggregate(
      Array.from(byDocket.values()),
      billedDockets,
      from,
      to,
      transportMode,
      vertical,
      bookingBranch,
      billingParty,
      billingBranch,
      asOf
    );

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      totals,
      source: "mongodb"
    });
  } catch {
    const billedDockets = new Set<string>();
    for (const b of memoryStore.bills || []) {
      for (const dn of b.consignments || []) billedDockets.add(String(dn).toUpperCase());
    }
    const { data, totals } = aggregate(
      memoryStore.getConsignments(),
      billedDockets,
      from,
      to,
      transportMode,
      vertical,
      bookingBranch,
      billingParty,
      billingBranch,
      asOf
    );

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      totals,
      isMemoryStore: true
    });
  }
}
