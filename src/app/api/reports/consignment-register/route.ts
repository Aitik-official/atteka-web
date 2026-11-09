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

function mapRow(c: any, billByDocket: Map<string, any>, tripByNo: Map<string, any>) {
  const docket = String(c.docketNo || "").toUpperCase();
  const bill = billByDocket.get(docket);
  const trip = tripByNo.get(String(c.tripSheetNo || "").toUpperCase());
  const pkgs = Number(c.packageDetails?.packagesCount ?? c.pkgs ?? 0);
  const actWt = Number(c.packageDetails?.actualWeight ?? c.actualWeight ?? 0);
  const chrgWt = Number(c.packageDetails?.chargedWeight ?? c.chargedWeight ?? 0);
  const delivered = /DELIVER|BILLED/i.test(String(c.status || ""));

  return {
    cnNumber: c.docketNo || "",
    cnDate: c.bookingDate || null,
    bookingLocation: c.bookingBranch ? `Atteka Logistics - ${c.bookingBranch}` : "Atteka Logistics - ALC1",
    edd: c.expectedDeliveryDate || null,
    consignor: c.consignor?.name || "",
    consignee: c.consignee?.name || "",
    from: c.fromLocation || "",
    to: c.toLocation || "",
    billingParty: c.billingParty || "",
    billingBr: c.billedAt || c.bookingBranch || "ALC1",
    billNo: bill?.billNumber || c.billNo || "",
    pkgs,
    actWt,
    chrgWt,
    contents: c.packageDetails?.productDescription || "",
    invoiceNo: c.invoiceDetails?.invoiceBeNo || c.invoiceBeNo || "",
    ewayBillNo: c.ewayBillNo || "",
    ewayBillExpiry: c.ewayBillExpiry || null,
    declaredValue: Number(c.invoiceDetails?.declaredValue ?? 0),
    businessType: c.bookingType || c.serviceType || "",
    containerNo: c.documentationDetails?.containerNumber || "",
    containerSize: c.documentationDetails?.containerSize || "",
    docketRemark: c.remark || "",
    thcNumber: c.tripSheetNo || trip?.tripSheetNo || "",
    thcDate: trip?.tripDate || trip?.createdAt || null,
    vdrNo: trip?.vendorCode || c.vendorCode || "",
    vendorCode: trip?.vendorCode || c.vendorCode || "",
    vendorName: trip?.vendorName || c.vendorName || "",
    thcFreight: Number(trip?.freight ?? c.financials?.freightAmount ?? 0),
    balancePayment: Number(
      (trip?.freight ?? c.financials?.freightAmount ?? 0) - (trip?.advance ?? 0)
    ),
    payMode: c.paymentBasis || "",
    mfNumber: trip?.mfNumber || "",
    vehNumber: c.vehicleNo || trip?.vehicleNo || "",
    vehType: c.serviceFtl || c.vehicleType || "",
    loadType: c.serviceType || "",
    dlyDate: delivered ? c.updatedAt || c.expectedDeliveryDate || null : null,
    dlyPcs: delivered ? pkgs : 0,
    pdcNumber: delivered ? `DS${c.docketNo || ""}` : "",
    docketEntryDt: c.createdAt || c.bookingDate || null,
    podLoad: c.podUrl ? "YES" : "NO",
    status: c.status || "",
    transportMode: c.mode || c.serviceType || "ROAD"
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const transportMode = (searchParams.get("transportMode") || "").trim().toUpperCase();
  const bookingBranch = (searchParams.get("bookingBranch") || "").trim().toUpperCase();
  const billingParty = (searchParams.get("billingParty") || "").trim().toUpperCase();
  const billingBranch = (searchParams.get("billingBranch") || "").trim().toUpperCase();
  const undeliveredOnly = searchParams.get("undelivered") === "1";
  const deliveredOnly = searchParams.get("delivered") === "1";

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
    if (bookingBranch && bookingBranch !== "SHOW ALL" && bookingBranch !== "--SHOW ALL--") {
      query.bookingBranch = new RegExp(bookingBranch.replace(/^-+|-+$/g, ""), "i");
    }
    if (billingParty && billingParty !== "SHOW ALL" && billingParty !== "--SHOW ALL--") {
      query.billingParty = new RegExp(billingParty.replace(/^-+|-+$/g, ""), "i");
    }
    if (billingBranch && !/show all/i.test(billingBranch)) {
      query.$or = [
        { billedAt: new RegExp(billingBranch.replace(/^-+|-+$/g, ""), "i") },
        { bookingBranch: new RegExp(billingBranch.replace(/^-+|-+$/g, ""), "i") }
      ];
    }
    if (transportMode && transportMode !== "SHOW ALL") {
      query.$and = (query.$and || []).concat([
        {
          $or: [
            { mode: new RegExp(transportMode, "i") },
            { serviceType: new RegExp(transportMode, "i") }
          ]
        }
      ]);
    }
    if (undeliveredOnly) {
      query.status = { $nin: ["DELIVERED", "BILLED", "CANCELLED"] };
    }
    if (deliveredOnly) {
      query.status = { $in: ["DELIVERED", "BILLED"] };
    }

    const consignments = await Consignment.find(query).sort({ bookingDate: -1, createdAt: -1 });
    const bills = await CustomerBill.find().select("billNumber grandTotal consignments").lean();
    const trips = await TripSheet.find().lean().catch(() => []);

    const billByDocket = new Map<string, any>();
    for (const b of bills as any[]) {
      for (const dn of b.consignments || []) billByDocket.set(String(dn).toUpperCase(), b);
    }
    const tripByNo = new Map<string, any>();
    for (const t of trips as any[]) {
      tripByNo.set(String(t.tripSheetNo || "").toUpperCase(), t);
    }

    // overlay memory consignments in range
    const mem = memoryStore.getConsignments();
    const byDocket = new Map<string, any>();
    for (const c of consignments) {
      const obj = typeof c.toObject === "function" ? c.toObject() : c;
      byDocket.set(String(obj.docketNo || "").toUpperCase(), obj);
    }
    for (const m of mem) {
      const key = String(m.docketNo || "").toUpperCase();
      const booked = m.bookingDate ? new Date(m.bookingDate) : null;
      if (from && booked && booked < from) continue;
      if (to && booked) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (booked > end) continue;
      }
      if (!byDocket.has(key)) byDocket.set(key, m);
    }

    let rows = Array.from(byDocket.values()).map((c) => mapRow(c, billByDocket, tripByNo));
    if (undeliveredOnly) {
      rows = rows.filter((r) => !/DELIVER|BILLED/i.test(String(r.status || "")));
    }
    if (deliveredOnly) {
      rows = rows.filter((r) => /DELIVER|BILLED/i.test(String(r.status || "")));
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "mongodb"
    });
  } catch {
    const mem = memoryStore.getConsignments();
    const billByDocket = new Map<string, any>();
    for (const b of memoryStore.bills || []) {
      for (const dn of b.consignments || []) billByDocket.set(String(dn).toUpperCase(), b);
    }
    const tripByNo = new Map<string, any>();
    for (const t of memoryStore.tripSheets || []) {
      tripByNo.set(String(t.tripSheetNo || "").toUpperCase(), t);
    }

    let rows = mem
      .filter((m) => {
        const booked = m.bookingDate ? new Date(m.bookingDate) : null;
        if (from && booked && booked < from) return false;
        if (to && booked) {
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          if (booked > end) return false;
        }
        if (bookingBranch && !/show all/i.test(bookingBranch)) {
          if (!String(m.bookingBranch || "").toUpperCase().includes(bookingBranch.replace(/^-+|-+$/g, "")))
            return false;
        }
        if (billingParty && !/show all/i.test(billingParty)) {
          if (!String(m.billingParty || "").toUpperCase().includes(billingParty.replace(/^-+|-+$/g, "")))
            return false;
        }
        return true;
      })
      .map((c) => mapRow(c, billByDocket, tripByNo));

    if (undeliveredOnly) {
      rows = rows.filter((r) => !/DELIVER|BILLED/i.test(String(r.status || "")));
    }
    if (deliveredOnly) {
      rows = rows.filter((r) => /DELIVER|BILLED/i.test(String(r.status || "")));
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      isMemoryStore: true
    });
  }
}
