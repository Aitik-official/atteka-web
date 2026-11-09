import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { CustomerBill } from "@/models/CustomerBill";
import { TripSheet } from "@/models/TripSheet";
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

function statusBucket(status: string) {
  const s = String(status || "").toUpperCase();
  if (/BILL/.test(s)) return "BILLED";
  if (/DELIVER/.test(s)) return "DELIVERED";
  if (/TRANSIT|ARRIVED/.test(s)) return "IN_TRANSIT";
  if (/CANCEL/.test(s)) return "CANCELLED";
  return "BOOKED";
}

function mapRow(c: any, billByDocket: Map<string, any>, tripByNo: Map<string, any>) {
  const docket = String(c.docketNo || "").toUpperCase();
  const bill = billByDocket.get(docket);
  const trip = tripByNo.get(String(c.tripSheetNo || "").toUpperCase());
  const pkgs = Number(c.packageDetails?.packagesCount ?? c.pkgs ?? 0);
  const actWt = Number(c.packageDetails?.actualWeight ?? c.actualWeight ?? 0);
  const chrgWt = Number(c.packageDetails?.chargedWeight ?? c.chargedWeight ?? 0);
  const freight = Number(c.financials?.freightAmount ?? trip?.freight ?? 0);
  const delivered = /DELIVER|BILLED/i.test(String(c.status || ""));
  const podLoaded = !!(c.podUrl && String(c.podUrl).trim());
  const bucket = statusBucket(c.status);

  return {
    cnNumber: docket,
    cnDate: c.bookingDate || null,
    cnDateLabel: formatDate(c.bookingDate),
    bookingBranch: String(c.bookingBranch || "ALC1").toUpperCase(),
    billingParty: String(c.billingParty || "").toUpperCase(),
    consignor: String(c.consignor?.name || ""),
    consignee: String(c.consignee?.name || ""),
    from: String(c.fromLocation || "").toUpperCase(),
    to: String(c.toLocation || "").toUpperCase(),
    pkgs,
    actWt,
    chrgWt,
    status: String(c.status || "BOOKED").toUpperCase(),
    statusBucket: bucket,
    edd: c.expectedDeliveryDate || null,
    eddLabel: formatDate(c.expectedDeliveryDate),
    dlyDate: delivered ? c.updatedAt || c.expectedDeliveryDate || null : null,
    dlyDateLabel: delivered ? formatDate(c.updatedAt || c.expectedDeliveryDate) : "",
    thcPdcNo: String(c.tripSheetNo || trip?.tripSheetNo || "").toUpperCase(),
    vehicleNo: String(c.vehicleNo || trip?.vehicleNo || "").toUpperCase(),
    vendorCode: String(trip?.vendorCode || c.vendorCode || "").toUpperCase(),
    vendorName: String(trip?.vendorName || c.vendorName || ""),
    freight,
    podLoad: podLoaded ? "Y" : "N",
    billNo: String(bill?.billNumber || c.billNo || ""),
    paymentBasis: String(c.paymentBasis || ""),
    mode: String(c.mode || c.serviceType || "ROAD").toUpperCase()
  };
}

function matchesFilters(
  row: ReturnType<typeof mapRow>,
  from: Date | null,
  to: Date | null,
  bookingBranch: string,
  billingParty: string,
  statusFilter: string
) {
  const booked = row.cnDate ? new Date(row.cnDate) : null;
  if (from && booked && booked < from) return false;
  if (to && booked) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (booked > end) return false;
  }
  if (bookingBranch && !/show all/i.test(bookingBranch)) {
    const code = bookingBranch
      .replace(/^-+|-+$/g, "")
      .replace(/atteka logistics[-\s]*/i, "")
      .trim()
      .toUpperCase();
    if (code && !row.bookingBranch.includes(code)) return false;
  }
  if (billingParty && !/show all/i.test(billingParty) && !/active customer/i.test(billingParty)) {
    if (!row.billingParty.includes(billingParty.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  const sf = statusFilter.trim().toUpperCase();
  if (sf && sf !== "SHOW ALL" && sf !== "---SELECT---" && sf !== "ALL") {
    if (sf === "UNDELIVERED") {
      if (row.statusBucket === "DELIVERED" || row.statusBucket === "BILLED") return false;
    } else if (sf === "POD PENDING") {
      if (row.podLoad !== "N") return false;
    } else if (!row.statusBucket.includes(sf.replace(/\s+/g, "_")) && !row.status.includes(sf)) {
      return false;
    }
  }
  return true;
}

function buildSummary(rows: ReturnType<typeof mapRow>[]) {
  const summary = {
    totalCns: rows.length,
    booked: 0,
    inTransit: 0,
    delivered: 0,
    billed: 0,
    cancelled: 0,
    podPending: 0,
    podUploaded: 0,
    totalPkgs: 0,
    totalFreight: 0
  };
  for (const r of rows) {
    if (r.statusBucket === "BOOKED") summary.booked += 1;
    else if (r.statusBucket === "IN_TRANSIT") summary.inTransit += 1;
    else if (r.statusBucket === "DELIVERED") summary.delivered += 1;
    else if (r.statusBucket === "BILLED") summary.billed += 1;
    else if (r.statusBucket === "CANCELLED") summary.cancelled += 1;
    if (r.podLoad === "N") summary.podPending += 1;
    else summary.podUploaded += 1;
    summary.totalPkgs += r.pkgs;
    summary.totalFreight += r.freight;
  }
  return summary;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const bookingBranch = (searchParams.get("bookingBranch") || "").trim();
  const billingParty = (searchParams.get("billingParty") || "").trim();
  const statusFilter = (searchParams.get("status") || "").trim();

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
    if (bookingBranch && !/show all/i.test(bookingBranch)) {
      const code = bookingBranch.replace(/atteka logistics[-\s]*/i, "").trim();
      if (code) query.bookingBranch = new RegExp(code, "i");
    }
    if (billingParty && !/show all/i.test(billingParty) && !/active customer/i.test(billingParty)) {
      query.billingParty = new RegExp(billingParty.replace(/^-+|-+$/g, ""), "i");
    }

    const [consignments, bills, trips] = await Promise.all([
      Consignment.find(query).sort({ bookingDate: -1, createdAt: -1 }).lean(),
      CustomerBill.find().select("billNumber consignments").lean().catch(() => []),
      TripSheet.find().lean().catch(() => [])
    ]);

    const billByDocket = new Map<string, any>();
    for (const b of bills as any[]) {
      for (const dn of b.consignments || []) billByDocket.set(String(dn).toUpperCase(), b);
    }
    const tripByNo = new Map<string, any>();
    for (const t of trips as any[]) {
      tripByNo.set(String(t.tripSheetNo || "").toUpperCase(), t);
    }

    const byDocket = new Map<string, any>();
    for (const c of consignments as any[]) {
      byDocket.set(String(c.docketNo || "").toUpperCase(), c);
    }
    for (const m of memoryStore.getConsignments()) {
      const key = String(m.docketNo || "").toUpperCase();
      if (!key) continue;
      const existing = byDocket.get(key);
      if (!existing) byDocket.set(key, m);
      else if (Object.prototype.hasOwnProperty.call(m, "podUrl")) {
        byDocket.set(key, { ...existing, ...m, podUrl: m.podUrl });
      }
    }

    const rows = Array.from(byDocket.values())
      .map((c) => mapRow(c, billByDocket, tripByNo))
      .filter((r) => matchesFilters(r, from, to, bookingBranch, billingParty, statusFilter));

    return NextResponse.json({
      success: true,
      count: rows.length,
      summary: buildSummary(rows),
      data: rows,
      source: "mongodb"
    });
  } catch {
    const billByDocket = new Map<string, any>();
    for (const b of memoryStore.bills || []) {
      for (const dn of b.consignments || []) billByDocket.set(String(dn).toUpperCase(), b);
    }
    const tripByNo = new Map<string, any>();
    for (const t of memoryStore.tripSheets || []) {
      tripByNo.set(String(t.tripSheetNo || "").toUpperCase(), t);
    }

    const rows = memoryStore
      .getConsignments()
      .map((c) => mapRow(c, billByDocket, tripByNo))
      .filter((r) => matchesFilters(r, from, to, bookingBranch, billingParty, statusFilter));

    return NextResponse.json({
      success: true,
      count: rows.length,
      summary: buildSummary(rows),
      data: rows,
      isMemoryStore: true
    });
  }
}
