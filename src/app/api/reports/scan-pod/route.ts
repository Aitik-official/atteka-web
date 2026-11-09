import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { memoryStore } from "@/lib/memoryStore";

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDocketDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " ");
}

function formatDlyDate(value?: string | Date | null, delivered?: boolean) {
  if (!delivered || !value) return "N-A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N-A";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " ");
}

function hasPod(c: any) {
  return !!(c?.podUrl && String(c.podUrl).trim());
}

function hasAdd(c: any) {
  const addr =
    c?.consignee?.address ||
    c?.deliveryAddress ||
    c?.add ||
    c?.addressDelivered ||
    "";
  return !!(addr && String(addr).trim());
}

function branchName(code?: string) {
  const c = String(code || "").trim().toUpperCase();
  if (!c || c === "ALC1") return "Ateka Logistics";
  return c;
}

function mapRow(c: any) {
  const delivered = /DELIVER|BILLED/i.test(String(c.status || ""));
  const podLoaded = hasPod(c);
  const addFlag = hasAdd(c);
  const podDate = c.podUploadedAt || c.bookingDate || c.createdAt || null;

  return {
    docketNo: String(c.docketNo || "").toUpperCase(),
    docketDate: c.bookingDate || null,
    docketDateLabel: formatDocketDate(c.bookingDate),
    customerName: String(c.billingParty || c.consignor?.name || "").toUpperCase(),
    bkgBranch: branchName(c.bookingBranch),
    bookingBranchCode: String(c.bookingBranch || "").toUpperCase(),
    add: addFlag ? "Y" : "N",
    dlyDate: formatDlyDate(c.updatedAt || c.expectedDeliveryDate || null, delivered),
    podLoad: podLoaded ? "Y" : "N",
    podUrl: String(c.podUrl || "").trim(),
    podDate,
    status: c.status || ""
  };
}

function matchesFilters(
  row: ReturnType<typeof mapRow>,
  from: Date | null,
  to: Date | null,
  branch: string,
  party: string,
  podStatus: string
) {
  const booked = row.docketDate ? new Date(row.docketDate) : row.podDate ? new Date(row.podDate) : null;
  if (from && booked && booked < from) return false;
  if (to && booked) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (booked > end) return false;
  }

  if (branch && !/show all/i.test(branch)) {
    const code = branch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim().toUpperCase();
    if (code && code !== "ALL") {
      if (!row.bookingBranchCode.includes(code) && !row.bkgBranch.toUpperCase().includes(code)) return false;
    }
  }

  if (party && !/show all/i.test(party) && !/active customer/i.test(party)) {
    if (!row.customerName.includes(party.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }

  const status = podStatus.trim().toLowerCase();
  if (status && status !== "---select---" && status !== "show all") {
    if (status.includes("not uploaded")) {
      if (row.podLoad !== "N") return false;
    } else if (status.includes("add blank") || status.includes("loaded but")) {
      if (!(row.podLoad === "Y" && row.add === "N")) return false;
    } else if (status.includes("uploaded")) {
      if (row.podLoad !== "Y") return false;
    }
  }

  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const branch = (searchParams.get("branch") || "").trim();
  const party = (searchParams.get("party") || "").trim();
  const podStatus = (searchParams.get("podStatus") || "").trim();

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
    if (branch && !/show all/i.test(branch)) {
      const code = branch.replace(/atteka logistics[-\s]*/i, "").trim();
      if (code) query.bookingBranch = new RegExp(code, "i");
    }
    if (party && !/show all/i.test(party) && !/active customer/i.test(party)) {
      query.billingParty = new RegExp(party.replace(/^-+|-+$/g, ""), "i");
    }

    const consignments = await Consignment.find(query).sort({ bookingDate: -1, createdAt: -1 }).lean();
    const byDocket = new Map<string, any>();
    for (const c of consignments as any[]) {
      byDocket.set(String(c.docketNo || "").toUpperCase(), c);
    }
    for (const m of memoryStore.getConsignments()) {
      const key = String(m.docketNo || "").toUpperCase();
      if (!key) continue;
      const existing = byDocket.get(key);
      if (!existing) {
        byDocket.set(key, m);
      } else if (Object.prototype.hasOwnProperty.call(m, "podUrl")) {
        byDocket.set(key, { ...existing, ...m, podUrl: m.podUrl });
      }
    }

    const rows = Array.from(byDocket.values())
      .map(mapRow)
      .filter((r) => matchesFilters(r, from, to, branch, party, podStatus));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "mongodb"
    });
  } catch {
    const rows = memoryStore
      .getConsignments()
      .map(mapRow)
      .filter((r) => matchesFilters(r, from, to, branch, party, podStatus));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      isMemoryStore: true
    });
  }
}
