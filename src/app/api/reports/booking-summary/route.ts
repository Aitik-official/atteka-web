import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { Branch } from "@/models/Branch";
import { memoryStore } from "@/lib/memoryStore";

type ReportType = "party" | "branch" | "party-month" | "branch-month";

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "long" });
}

function freightOf(c: any) {
  return Number(c.financials?.freightAmount ?? c.financials?.grandTotal ?? c.freightAmount ?? 0);
}

function normalizeList(raw: any[]): any[] {
  return raw.map((c) => (typeof c?.toObject === "function" ? c.toObject() : c));
}

function filterConsignments(
  list: any[],
  from: Date | null,
  to: Date | null,
  bookingBranch: string,
  billingParty: string
) {
  return list.filter((m) => {
    const booked = m.bookingDate ? new Date(m.bookingDate) : null;
    if (from && booked && booked < from) return false;
    if (to && booked) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      if (booked > end) return false;
    }
    if (bookingBranch && !/show all/i.test(bookingBranch) && bookingBranch !== "ALL") {
      const code = bookingBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim();
      if (code && !String(m.bookingBranch || "").toUpperCase().includes(code.toUpperCase())) return false;
    }
    if (billingParty && !/show all/i.test(billingParty) && billingParty !== "ALL") {
      if (!String(m.billingParty || "").toUpperCase().includes(billingParty.replace(/^-+|-+$/g, "").toUpperCase()))
        return false;
    }
    return true;
  });
}

function collectMonths(rows: any[], from: Date | null, to: Date | null) {
  const set = new Set<string>();
  for (const r of rows) {
    const d = r.bookingDate ? new Date(r.bookingDate) : null;
    if (d && !Number.isNaN(d.getTime())) set.add(monthKey(d));
  }
  if (from && to) {
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    const end = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cur <= end) {
      set.add(monthKey(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  return Array.from(set).sort();
}

function aggregateParty(rows: any[]) {
  const map = new Map<string, { billingParty: string; totalCns: number; amount: number }>();
  for (const r of rows) {
    const party = String(r.billingParty || "").trim();
    const cur = map.get(party) || { billingParty: party, totalCns: 0, amount: 0 };
    cur.totalCns += 1;
    cur.amount += freightOf(r);
    map.set(party, cur);
  }
  const data = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  const totals = data.reduce(
    (acc, r) => ({ totalCns: acc.totalCns + r.totalCns, amount: acc.amount + r.amount }),
    { totalCns: 0, amount: 0 }
  );
  return { data, totals };
}

function aggregateBranch(rows: any[], branchMeta: Map<string, { name: string; region: string }>) {
  const byBranch = new Map<
    string,
    { region: string; branch: string; branchCode: string; totalDocket: number; totalFreight: number }
  >();
  for (const r of rows) {
    const code = String(r.bookingBranch || "ALC1").trim().toUpperCase() || "ALC1";
    const meta = branchMeta.get(code);
    const region = meta?.region || "WEST";
    const name = meta?.name || "Atteka Logistics";
    const label = `${code} : ${name}`;
    const cur = byBranch.get(code) || {
      region,
      branch: label,
      branchCode: code,
      totalDocket: 0,
      totalFreight: 0
    };
    cur.totalDocket += 1;
    cur.totalFreight += freightOf(r);
    byBranch.set(code, cur);
  }

  const branches = Array.from(byBranch.values()).sort((a, b) => b.totalFreight - a.totalFreight);
  const regionMap = new Map<string, { region: string; totalDocket: number; totalFreight: number; branches: typeof branches }>();
  for (const b of branches) {
    const cur = regionMap.get(b.region) || {
      region: b.region,
      totalDocket: 0,
      totalFreight: 0,
      branches: [] as typeof branches
    };
    cur.totalDocket += b.totalDocket;
    cur.totalFreight += b.totalFreight;
    cur.branches.push(b);
    regionMap.set(b.region, cur);
  }
  const regions = Array.from(regionMap.values()).sort((a, b) => b.totalFreight - a.totalFreight);
  const totals = regions.reduce(
    (acc, r) => ({ totalDocket: acc.totalDocket + r.totalDocket, totalFreight: acc.totalFreight + r.totalFreight }),
    { totalDocket: 0, totalFreight: 0 }
  );
  const chart = regions.map((r) => ({
    label: r.region,
    dktCount: r.totalDocket,
    sumFrt: r.totalFreight
  }));
  return { regions, branches, chart, totals };
}

function aggregatePartyMonth(rows: any[], months: string[]) {
  const map = new Map<
    string,
    { billingParty: string; months: Record<string, { cnt: number; freight: number }>; totalCnt: number; totalFreight: number }
  >();
  for (const r of rows) {
    const party = String(r.billingParty || "").trim();
    const d = r.bookingDate ? new Date(r.bookingDate) : null;
    const mk = d && !Number.isNaN(d.getTime()) ? monthKey(d) : months[0] || monthKey(new Date());
    let cur = map.get(party);
    if (!cur) {
      cur = {
        billingParty: party,
        months: Object.fromEntries(months.map((m) => [m, { cnt: 0, freight: 0 }])),
        totalCnt: 0,
        totalFreight: 0
      };
      map.set(party, cur);
    }
    if (!cur.months[mk]) cur.months[mk] = { cnt: 0, freight: 0 };
    cur.months[mk].cnt += 1;
    cur.months[mk].freight += freightOf(r);
    cur.totalCnt += 1;
    cur.totalFreight += freightOf(r);
  }
  const data = Array.from(map.values()).sort((a, b) => b.totalFreight - a.totalFreight);
  const totals = {
    months: Object.fromEntries(
      months.map((m) => [
        m,
        data.reduce(
          (acc, r) => ({
            cnt: acc.cnt + (r.months[m]?.cnt || 0),
            freight: acc.freight + (r.months[m]?.freight || 0)
          }),
          { cnt: 0, freight: 0 }
        )
      ])
    ),
    totalCnt: data.reduce((s, r) => s + r.totalCnt, 0),
    totalFreight: data.reduce((s, r) => s + r.totalFreight, 0)
  };
  return { data, totals, months: months.map((k) => ({ key: k, label: monthLabel(k) })) };
}

function aggregateBranchMonth(rows: any[], months: string[], branchMeta: Map<string, { name: string; region: string }>) {
  const map = new Map<
    string,
    { branch: string; months: Record<string, { cnt: number; freight: number }>; totalCnt: number; totalFreight: number }
  >();
  for (const r of rows) {
    const code = String(r.bookingBranch || "ALC1").trim().toUpperCase() || "ALC1";
    const meta = branchMeta.get(code);
    const label = `${code} : ${meta?.name || "Atteka Logistics"}`;
    const d = r.bookingDate ? new Date(r.bookingDate) : null;
    const mk = d && !Number.isNaN(d.getTime()) ? monthKey(d) : months[0] || monthKey(new Date());
    let cur = map.get(code);
    if (!cur) {
      cur = {
        branch: label,
        months: Object.fromEntries(months.map((m) => [m, { cnt: 0, freight: 0 }])),
        totalCnt: 0,
        totalFreight: 0
      };
      map.set(code, cur);
    }
    if (!cur.months[mk]) cur.months[mk] = { cnt: 0, freight: 0 };
    cur.months[mk].cnt += 1;
    cur.months[mk].freight += freightOf(r);
    cur.totalCnt += 1;
    cur.totalFreight += freightOf(r);
  }
  const data = Array.from(map.values()).sort((a, b) => b.totalFreight - a.totalFreight);
  const totals = {
    months: Object.fromEntries(
      months.map((m) => [
        m,
        data.reduce(
          (acc, r) => ({
            cnt: acc.cnt + (r.months[m]?.cnt || 0),
            freight: acc.freight + (r.months[m]?.freight || 0)
          }),
          { cnt: 0, freight: 0 }
        )
      ])
    ),
    totalCnt: data.reduce((s, r) => s + r.totalCnt, 0),
    totalFreight: data.reduce((s, r) => s + r.totalFreight, 0)
  };
  return { data, totals, months: months.map((k) => ({ key: k, label: monthLabel(k) })) };
}

function resolveReportType(raw: string): ReportType | null {
  const v = raw.trim().toLowerCase();
  if (v === "party" || v === "party wise" || v === "party-wise") return "party";
  if (v === "branch" || v === "branch wise" || v === "branch-wise") return "branch";
  if (v.includes("party") && v.includes("month")) return "party-month";
  if (v.includes("branch") && v.includes("month")) return "branch-month";
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const bookingBranch = (searchParams.get("bookingBranch") || "").trim();
  const billingParty = (searchParams.get("billingParty") || "").trim();
  const reportType = resolveReportType(searchParams.get("reportType") || "");

  if (!reportType) {
    return NextResponse.json({ success: false, error: "Select a Report Type" }, { status: 400 });
  }

  let rows: any[] = [];
  let branchMeta = new Map<string, { name: string; region: string }>();
  let isMemoryStore = false;

  try {
    await connectToDatabase();
    const query: any = {};
    if (from || to) {
      query.bookingDate = {};
      if (from) query.bookingDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.bookingDate.$lte = end;
      }
    }
    if (bookingBranch && !/show all/i.test(bookingBranch) && bookingBranch !== "ALL") {
      const code = bookingBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim();
      if (code) query.bookingBranch = new RegExp(code, "i");
    }
    if (billingParty && !/show all/i.test(billingParty) && billingParty !== "ALL") {
      query.billingParty = new RegExp(billingParty.replace(/^-+|-+$/g, ""), "i");
    }

    const [consignments, branches] = await Promise.all([
      Consignment.find(query).lean(),
      Branch.find().select("branchCode branchName regionBranch").lean().catch(() => [])
    ]);

    for (const b of branches as any[]) {
      const code = String(b.branchCode || "").toUpperCase();
      if (!code) continue;
      branchMeta.set(code, {
        name: b.branchName || "Atteka Logistics",
        region: String(b.regionBranch || "WEST").toUpperCase() || "WEST"
      });
    }
    if (!branchMeta.has("ALC1")) {
      branchMeta.set("ALC1", { name: "Atteka Logistics", region: "WEST" });
    }

    const byDocket = new Map<string, any>();
    for (const c of normalizeList(consignments as any[])) {
      byDocket.set(String(c.docketNo || "").toUpperCase(), c);
    }
    for (const m of memoryStore.getConsignments()) {
      const key = String(m.docketNo || "").toUpperCase();
      if (!byDocket.has(key)) byDocket.set(key, m);
    }
    rows = filterConsignments(Array.from(byDocket.values()), from, to, bookingBranch, billingParty);
  } catch {
    isMemoryStore = true;
    branchMeta.set("ALC1", { name: "Atteka Logistics", region: "WEST" });
    rows = filterConsignments(memoryStore.getConsignments(), from, to, bookingBranch, billingParty);
  }

  const months = collectMonths(rows, from, to);
  let payload: any = {};

  if (reportType === "party") {
    payload = { reportType, ...aggregateParty(rows) };
  } else if (reportType === "branch") {
    payload = { reportType, ...aggregateBranch(rows, branchMeta) };
  } else if (reportType === "party-month") {
    payload = { reportType, ...aggregatePartyMonth(rows, months) };
  } else {
    payload = { reportType, ...aggregateBranchMonth(rows, months, branchMeta) };
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    ...payload,
    isMemoryStore: isMemoryStore || undefined
  });
}
