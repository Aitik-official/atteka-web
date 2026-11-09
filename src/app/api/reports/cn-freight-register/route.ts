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

function formatDateTime(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function chargeFrom(c: any, keys: string[]) {
  for (const k of keys) {
    if (c?.[k] != null && c[k] !== "") return num(c[k]);
    if (c?.financials?.[k] != null && c.financials[k] !== "") return num(c.financials[k]);
    if (c?.charges?.[k] != null && c.charges[k] !== "") return num(c.charges[k]);
  }
  return 0;
}

function lineCharge(bill: any, docket: string, keys: string[]) {
  const items = Array.isArray(bill?.lineItems) ? bill.lineItems : [];
  const item = items.find(
    (x: any) => String(x.docketNo || x.cnNumber || "").toUpperCase() === docket
  );
  if (!item) return 0;
  for (const k of keys) {
    if (item[k] != null && item[k] !== "") return num(item[k]);
  }
  return 0;
}

function mapRow(c: any, billByDocket: Map<string, any>, tripByNo: Map<string, any>) {
  const docket = String(c.docketNo || "").toUpperCase();
  const bill = billByDocket.get(docket);
  const trip = tripByNo.get(String(c.tripSheetNo || "").toUpperCase());
  const delivered = /DELIVER|BILLED/i.test(String(c.status || ""));

  const customerFreight =
    lineCharge(bill, docket, ["freight", "freightAmount", "customerFreightAmt"]) ||
    chargeFrom(c, ["freightAmount", "customerFreightAmt"]) ||
    num(c.financials?.freightAmount);

  const loadChrg =
    lineCharge(bill, docket, ["loadingCharge", "loadChrg"]) ||
    chargeFrom(c, ["loadingCharge", "loadChrg"]);
  const unloadChrg = chargeFrom(c, ["unloadingCharge", "unloadChrg"]);
  const detention = chargeFrom(c, ["detention", "detentionCharge"]);
  const collChrg = chargeFrom(c, ["collectionCharge", "collChrg"]);
  const otherChrg = chargeFrom(c, ["otherCharge", "otherChrg"]);
  const escortChrg = chargeFrom(c, ["escortCharge", "escortChrg"]);
  const doorDelChrg = chargeFrom(c, ["doorDeliveryCharge", "doorDelChrg"]);
  const odaChrg = chargeFrom(c, ["odaCharge", "odaChrg"]);
  const statChrg = chargeFrom(c, ["statCharge", "statChrg", "statisticalCharge"]);
  const gstAmt =
    lineCharge(bill, docket, ["gstAmount", "taxAmount", "gstAmt"]) ||
    num(c.financials?.gstAmount) ||
    (bill ? num(bill.taxAmount) / Math.max(1, (bill.consignments || []).length) : 0);

  const total =
    lineCharge(bill, docket, ["total", "grandTotal", "amount"]) ||
    num(c.financials?.grandTotal) ||
    customerFreight +
      loadChrg +
      unloadChrg +
      detention +
      collChrg +
      otherChrg +
      escortChrg +
      doorDelChrg +
      odaChrg +
      statChrg +
      gstAmt;

  const vendorFreight = num(trip?.freight);
  const advanceAmt = num(trip?.advanceAmt ?? trip?.advance);
  const balanceAmt = num(trip?.balanceAmt ?? Math.max(0, vendorFreight - advanceAmt));
  const paymentStatus = bill
    ? String(bill.status || "GENERATED").toUpperCase()
    : /BILL/i.test(String(c.status || ""))
      ? "BILLED"
      : "UNBILLED";

  const billSrno = bill
    ? (bill.consignments || []).findIndex((dn: string) => String(dn).toUpperCase() === docket) + 1
    : 0;

  return {
    docketNumber: docket,
    docketDate: c.bookingDate || null,
    docketDateLabel: formatDate(c.bookingDate),
    edd: c.expectedDeliveryDate || null,
    eddLabel: formatDate(c.expectedDeliveryDate),
    ewayBill: String(c.ewayBillNo || "").toUpperCase(),
    ewayExpDt: c.ewayBillExpiry || null,
    ewayExpDtLabel: formatDateTime(c.ewayBillExpiry),
    from: String(c.fromLocation || "").toUpperCase(),
    to: String(c.toLocation || "").toUpperCase(),
    actWt: num(c.packageDetails?.actualWeight ?? c.actualWeight),
    chrgWt: num(c.packageDetails?.chargedWeight ?? c.chargedWeight),
    invoiceNo: String(c.invoiceDetails?.invoiceBeNo || c.invoiceBeNo || docket).toUpperCase(),
    vehNumber: String(c.vehicleNo || trip?.vehicleNo || "").toUpperCase(),
    vehType: String(c.serviceFtl || c.vehicleType || trip?.vehicleType || "").toUpperCase(),
    dlyDate: delivered ? c.updatedAt || c.expectedDeliveryDate || null : null,
    dlyDateLabel: delivered ? formatDate(c.updatedAt || c.expectedDeliveryDate) : "",
    consignor: String(c.consignor?.name || ""),
    consignee: String(c.consignee?.name || ""),
    billingParty: String(c.billingParty || "").toUpperCase(),
    billNumber: String(bill?.billNumber || c.billNo || ""),
    billSrno: billSrno > 0 ? billSrno : "",
    billDate: bill?.billDate || null,
    billDateLabel: formatDate(bill?.billDate),
    rateType: String(c.paymentBasis || c.rateType || "TBB").toUpperCase(),
    customerFreightAmt: customerFreight,
    statChrg,
    detention,
    collChrg,
    otherChrg,
    loadChrg,
    unloadChrg,
    escortChrg,
    doorDelChrg,
    gstAmt: Number(gstAmt.toFixed(2)),
    odaChrg,
    total: Number(total.toFixed(2)),
    remark: String(c.remark || bill?.remark || ""),
    tripSheetNo: String(c.tripSheetNo || trip?.tripSheetNo || "").toUpperCase(),
    tripSheetDate: trip?.tripDate || trip?.createdAt || null,
    tripSheetDateLabel: formatDate(trip?.tripDate || trip?.createdAt),
    vendorCode: String(trip?.vendorCode || c.vendorCode || "").toUpperCase(),
    vendorName: String(trip?.vendorName || c.vendorName || ""),
    vendorFreightAmt: vendorFreight,
    advanceAmt,
    balanceAmt,
    paymentStatus,
    podStatus: c.podUrl && String(c.podUrl).trim() ? "UPLOADED" : "PENDING",
    bookingBranch: String(c.bookingBranch || "ALC1").toUpperCase(),
    billingBranch: String(c.billedAt || bill?.billingBranch || c.bookingBranch || "ALC1").toUpperCase(),
    transportMode: String(c.mode || c.serviceType || "ROAD").toUpperCase(),
    status: c.status || ""
  };
}

function matchesFilters(
  row: ReturnType<typeof mapRow>,
  from: Date | null,
  to: Date | null,
  transportMode: string,
  bookingBranch: string,
  billingParty: string,
  billingBranch: string
) {
  const booked = row.docketDate ? new Date(row.docketDate) : null;
  if (from && booked && booked < from) return false;
  if (to && booked) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (booked > end) return false;
  }
  if (transportMode && !/show all/i.test(transportMode)) {
    if (!row.transportMode.includes(transportMode.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  if (bookingBranch && !/show all/i.test(bookingBranch)) {
    const code = bookingBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim().toUpperCase();
    if (code && !row.bookingBranch.includes(code)) return false;
  }
  if (billingParty && !/show all/i.test(billingParty)) {
    if (!row.billingParty.includes(billingParty.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  if (billingBranch && !/show all/i.test(billingBranch)) {
    const code = billingBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim().toUpperCase();
    if (code && !row.billingBranch.includes(code) && !row.bookingBranch.includes(code)) return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const transportMode = (searchParams.get("transportMode") || "").trim();
  const bookingBranch = (searchParams.get("bookingBranch") || "").trim();
  const billingParty = (searchParams.get("billingParty") || "").trim();
  const billingBranch = (searchParams.get("billingBranch") || "").trim();

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
      const code = bookingBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim();
      if (code) query.bookingBranch = new RegExp(code, "i");
    }
    if (billingParty && !/show all/i.test(billingParty)) {
      query.billingParty = new RegExp(billingParty.replace(/^-+|-+$/g, ""), "i");
    }
    if (transportMode && !/show all/i.test(transportMode)) {
      query.$or = [
        { mode: new RegExp(transportMode, "i") },
        { serviceType: new RegExp(transportMode, "i") }
      ];
    }

    const [consignments, bills, trips] = await Promise.all([
      Consignment.find(query).sort({ bookingDate: -1, createdAt: -1 }).lean(),
      CustomerBill.find().lean().catch(() => []),
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
      .map((c) => mapRow(c, billByDocket, tripByNo))
      .filter((r) => matchesFilters(r, from, to, transportMode, bookingBranch, billingParty, billingBranch));

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
      .map((c) => mapRow(c, billByDocket, tripByNo))
      .filter((r) => matchesFilters(r, from, to, transportMode, bookingBranch, billingParty, billingBranch));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      isMemoryStore: true
    });
  }
}
