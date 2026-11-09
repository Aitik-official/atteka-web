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

function formatEdd(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
    .replace(/ /g, "-");
}

function formatEntryDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " ");
}

function formatEntryTime(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function daysBetween(from?: string | Date | null, to: Date = new Date()) {
  if (!from) return "";
  const a = new Date(from);
  if (Number.isNaN(a.getTime())) return "";
  const ms = to.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function branchLabel(code?: string) {
  const c = String(code || "").trim().toUpperCase();
  if (!c || c === "ALC1") return "Ateka Logistics";
  return c;
}

function mapRow(c: any, billByDocket: Map<string, any>, tripByNo: Map<string, any>, asOf: Date) {
  const docket = String(c.docketNo || "").toUpperCase();
  const bill = billByDocket.get(docket);
  const trip = tripByNo.get(String(c.tripSheetNo || "").toUpperCase());
  const pkgs = num(c.packageDetails?.packagesCount ?? c.pkgs);
  const delivered = /DELIVER|BILLED/i.test(String(c.status || ""));
  const dlyDate = delivered ? c.updatedAt || c.expectedDeliveryDate || null : null;
  const thcFreight = num(trip?.freight ?? c.financials?.freightAmount);
  const advance = num(trip?.advanceAmt ?? trip?.advance);
  const bookedAt = c.bookingDate || c.createdAt || null;

  return {
    cnNumber: docket,
    cnDate: bookedAt,
    cnDateLabel: formatDate(bookedAt),
    bookingBranch: branchLabel(c.bookingBranch),
    bookingBranchCode: String(c.bookingBranch || "ALC1").toUpperCase(),
    edd: c.expectedDeliveryDate || null,
    eddLabel: formatEdd(c.expectedDeliveryDate),
    bookingAgingDays: daysBetween(bookedAt, asOf),
    delyAgingDays: delivered ? daysBetween(bookedAt, dlyDate ? new Date(dlyDate) : asOf) : "",
    consignor: String(c.consignor?.name || ""),
    consignorAddress: String(c.consignor?.address || ""),
    consignee: String(c.consignee?.name || ""),
    consigneeAddress: String(c.consignee?.address || ""),
    from: String(c.fromLocation || "").toUpperCase(),
    to: String(c.toLocation || "").toUpperCase(),
    billingParty: String(c.billingParty || "").toUpperCase(),
    billingBr: String(c.billedAt || bill?.billingBranch || c.bookingBranch || "ALC1").toUpperCase(),
    pkgs,
    actWt: num(c.packageDetails?.actualWeight ?? c.actualWeight),
    chrgWt: num(c.packageDetails?.chargedWeight ?? c.chargedWeight),
    contents: String(c.packageDetails?.productDescription || ""),
    invoiceNo: String(c.invoiceDetails?.invoiceBeNo || c.invoiceBeNo || "").toUpperCase(),
    payMode: String(c.paymentBasis || "").toUpperCase(),
    declaredValue: num(c.invoiceDetails?.declaredValue),
    poNumber: String(c.documentationDetails?.poNo || c.poNumber || ""),
    shipmentNo: String(c.documentationDetails?.shipment || c.shipmentNo || ""),
    dnNumber: String(c.dnNumber || c.documentationDetails?.dnNumber || ""),
    docketRemark: String(c.remark || ""),
    billNumber: String(bill?.billNumber || c.billNo || ""),
    billDate: bill?.billDate || null,
    billDateLabel: formatDate(bill?.billDate),
    billedAmount: bill ? num(bill.grandTotal) : 0,
    thcNumber: String(c.tripSheetNo || trip?.tripSheetNo || "").toUpperCase(),
    thcDate: trip?.tripDate || trip?.createdAt || null,
    thcDateLabel: formatDate(trip?.tripDate || trip?.createdAt),
    thcFreight,
    balancePayment: Math.max(0, thcFreight - advance),
    payModeThc: String(trip?.payMode || c.paymentBasis || "").toUpperCase(),
    tcNumber: String(trip?.tcNumber || trip?.mfNumber || ""),
    vendorName: String(trip?.vendorName || c.vendorName || ""),
    vehNumber: String(c.vehicleNo || trip?.vehicleNo || "").toUpperCase(),
    vehType: String(c.serviceFtl || c.vehicleType || trip?.vehicleType || "").toUpperCase(),
    vdrNo: String(trip?.vendorCode || c.vendorCode || "").toUpperCase(),
    dlyDate,
    dlyDateLabel: formatDate(dlyDate),
    dlyPcs: delivered ? pkgs : 0,
    pdcNumber: delivered || trip ? `DS${String(c.tripSheetNo || docket).replace(/^DS/i, "")}` : "",
    podRemark: String(c.podRemark || c.specialInstructions || ""),
    podYn: c.podUrl && String(c.podUrl).trim() ? "Y" : "N",
    entryDate: formatEntryDate(c.createdAt || bookedAt),
    entryTime: formatEntryTime(c.createdAt || bookedAt),
    salesPerson: String(c.salesPerson || c.preparedBy || c.buDescription || ""),
    transportMode: String(c.mode || c.serviceType || "ROAD").toUpperCase(),
    vertical: String(c.buDescription || c.vertical || c.division || ""),
    status: String(c.status || ""),
    isBilled: !!(bill?.billNumber || /BILL/i.test(String(c.status || "")))
  };
}

function matchesFilters(
  row: ReturnType<typeof mapRow>,
  from: Date | null,
  to: Date | null,
  transportMode: string,
  vertical: string,
  bookingBranch: string,
  billingParty: string,
  billingBranch: string
) {
  // Unbilled only — both financially completed & uncompleted ops still without customer bill
  if (row.isBilled) return false;

  const booked = row.cnDate ? new Date(row.cnDate) : null;
  if (from && booked && booked < from) return false;
  if (to && booked) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (booked > end) return false;
  }
  if (transportMode && transportMode.trim() && !/show all/i.test(transportMode) && !/^transport mode$/i.test(transportMode)) {
    if (!row.transportMode.includes(transportMode.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  if (vertical && vertical.trim() && !/show all/i.test(vertical) && !/vertic/i.test(vertical) && !/division/i.test(vertical)) {
    if (!row.vertical.toUpperCase().includes(vertical.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  if (bookingBranch && bookingBranch.trim() && !/show all/i.test(bookingBranch)) {
    const code = bookingBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim().toUpperCase();
    if (code && !row.bookingBranchCode.includes(code) && !row.bookingBranch.toUpperCase().includes(code)) return false;
  }
  if (billingParty && !/show all/i.test(billingParty)) {
    if (!row.billingParty.includes(billingParty.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  if (billingBranch && !/show all/i.test(billingBranch)) {
    const code = billingBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim().toUpperCase();
    if (code && !row.billingBr.includes(code) && !row.bookingBranchCode.includes(code)) return false;
  }
  return true;
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
    const query: any = {
      status: { $nin: ["BILLED", "CANCELLED"] }
    };
    if (from || to) {
      query.bookingDate = {};
      if (from) query.bookingDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.bookingDate.$lte = end;
      }
    }
    if (bookingBranch && !/show all/i.test(bookingBranch) && bookingBranch.trim()) {
      const code = bookingBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim();
      if (code) query.bookingBranch = new RegExp(code, "i");
    }
    if (billingParty && !/show all/i.test(billingParty)) {
      query.billingParty = new RegExp(billingParty.replace(/^-+|-+$/g, ""), "i");
    }
    if (transportMode && !/show all/i.test(transportMode) && !/^transport mode$/i.test(transportMode)) {
      query.$or = [
        { mode: new RegExp(transportMode, "i") },
        { serviceType: new RegExp(transportMode, "i") }
      ];
    }

    const [consignments, bills, trips] = await Promise.all([
      Consignment.find(query).sort({ bookingDate: -1, createdAt: -1 }).lean(),
      CustomerBill.find().select("billNumber billDate grandTotal consignments billingBranch").lean().catch(() => []),
      TripSheet.find().lean().catch(() => [])
    ]);

    const billByDocket = new Map<string, any>();
    for (const b of bills as any[]) {
      for (const dn of b.consignments || []) billByDocket.set(String(dn).toUpperCase(), b);
    }
    for (const b of memoryStore.bills || []) {
      for (const dn of b.consignments || []) {
        const key = String(dn).toUpperCase();
        if (!billByDocket.has(key)) billByDocket.set(key, b);
      }
    }

    const tripByNo = new Map<string, any>();
    for (const t of trips as any[]) tripByNo.set(String(t.tripSheetNo || "").toUpperCase(), t);
    for (const t of memoryStore.tripSheets || []) {
      const key = String(t.tripSheetNo || "").toUpperCase();
      if (key && !tripByNo.has(key)) tripByNo.set(key, t);
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
      .map((c) => mapRow(c, billByDocket, tripByNo, asOf))
      .filter((r) => matchesFilters(r, from, to, transportMode, vertical, bookingBranch, billingParty, billingBranch));

    return NextResponse.json({
      success: true,
      count: rows.length,
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
      .map((c) => mapRow(c, billByDocket, tripByNo, asOf))
      .filter((r) => matchesFilters(r, from, to, transportMode, vertical, bookingBranch, billingParty, billingBranch));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      isMemoryStore: true
    });
  }
}
