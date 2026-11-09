import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { CustomerBill } from "@/models/CustomerBill";
import { memoryStore } from "@/lib/memoryStore";

function splitNos(raw: string) {
  return String(raw || "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function enrichRow(c: any, billByDocket: Map<string, any>) {
  const docket = String(c.docketNo || "").toUpperCase();
  const bill = billByDocket.get(docket);
  const thcPdc =
    c.thcNo ||
    c.pdcNo ||
    c.tripSheetNo ||
    (String(c.status || "").toUpperCase().includes("DELIVER") ? `DS${docket}` : "") ||
    "";

  let statusLabel = String(c.status || "BOOKED");
  if (thcPdc && /IN_TRANSIT|ARRIVED|OUT/i.test(statusLabel)) {
    statusLabel = `Out For Delivery PDC No: ${thcPdc}`;
  } else if (statusLabel === "IN_TRANSIT") {
    statusLabel = "In Transit";
  }

  return {
    ...c,
    docketNo: c.docketNo,
    bookingDate: c.bookingDate,
    ewayBillNo: c.ewayBillNo || "",
    ewayBillExpiry: c.ewayBillExpiry || null,
    fromLocation: c.fromLocation || "",
    toLocation: c.toLocation || "",
    vehicleNo: c.vehicleNo || "",
    vehicleType: c.serviceFtl || c.vehicleType || c.serviceType || "",
    status: c.status || "BOOKED",
    statusLabel,
    billingParty: c.billingParty || "",
    consignorName: c.consignor?.name || "",
    consigneeName: c.consignee?.name || "",
    thcPdcNo: thcPdc,
    billNo: bill?.billNumber || c.billNo || "",
    billAmount: Number(bill?.grandTotal ?? c.financials?.grandTotal ?? 0)
  };
}

function summarize(rows: any[]) {
  const total = rows.length;
  let booked = 0;
  let inTransit = 0;
  let delivered = 0;
  for (const r of rows) {
    const s = String(r.status || "").toUpperCase();
    if (s === "DELIVERED" || s === "BILLED") delivered += 1;
    else if (s === "BOOKED" || s === "DOCKET_ALLOCATED" || s === "DRAFT") booked += 1;
    else inTransit += 1;
  }
  return { total, booked, inTransit, delivered };
}

function filterMemory(
  list: any[],
  opts: { docketNos: string[]; invoiceNo: string; dnNo: string; from: Date | null; to: Date | null; docType: string }
) {
  return list.filter((c) => {
    const docket = String(c.docketNo || "").toUpperCase();
    const invoice = String(c.invoiceDetails?.invoiceBeNo || c.invoiceNo || "").toUpperCase();
    const dn = String(c.documentationDetails?.shipment || c.dnNo || "").toUpperCase();
    const booked = c.bookingDate ? new Date(c.bookingDate) : null;

    if (opts.docketNos.length && !opts.docketNos.includes(docket)) return false;
    if (opts.invoiceNo && !invoice.includes(opts.invoiceNo)) return false;
    if (opts.dnNo && !dn.includes(opts.dnNo)) return false;
    if (opts.from && booked && booked < opts.from) return false;
    if (opts.to && booked) {
      const end = new Date(opts.to);
      end.setHours(23, 59, 59, 999);
      if (booked > end) return false;
    }
    if (opts.docType && opts.docType !== "CN" && opts.docType !== "ALL") {
      // Soft filter — replica focuses on CN; keep rows unless explicitly unsupported
      if (opts.docType === "THC" && !c.tripSheetNo) return false;
      if (opts.docType === "PDC" && !/DELIVER|ARRIVED|BILLED/i.test(String(c.status || ""))) return false;
    }
    return true;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const docketNos = splitNos(searchParams.get("docketNo") || "");
  const invoiceNo = String(searchParams.get("invoiceNo") || "").trim().toUpperCase();
  const dnNo = String(searchParams.get("dnNo") || "").trim().toUpperCase();
  const docType = String(searchParams.get("docType") || "CN").trim().toUpperCase();
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const requireCriteria = searchParams.get("strict") === "1";

  if (requireCriteria && !docketNos.length && !invoiceNo && !dnNo && !from && !to) {
    return NextResponse.json(
      { error: "Enter Docket No, Invoice No, DN No, or Date Range to track" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const query: any = {};
    const and: any[] = [];

    if (docketNos.length) and.push({ docketNo: { $in: docketNos } });
    if (invoiceNo) {
      and.push({
        $or: [
          { "invoiceDetails.invoiceBeNo": { $regex: invoiceNo, $options: "i" } },
          { invoiceBeNo: { $regex: invoiceNo, $options: "i" } }
        ]
      });
    }
    if (dnNo) {
      and.push({
        $or: [
          { "documentationDetails.shipment": { $regex: dnNo, $options: "i" } },
          { dnNo: { $regex: dnNo, $options: "i" } }
        ]
      });
    }
    if (from || to) {
      const dateQ: any = {};
      if (from) dateQ.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        dateQ.$lte = end;
      }
      and.push({ bookingDate: dateQ });
    }
    if (and.length) query.$and = and;

    const consignments = await Consignment.find(query).sort({ bookingDate: -1, createdAt: -1 });
    const bills = await CustomerBill.find().select("billNumber grandTotal consignments").lean();
    const billByDocket = new Map<string, any>();
    for (const b of bills as any[]) {
      for (const dn of b.consignments || []) {
        billByDocket.set(String(dn).toUpperCase(), b);
      }
    }

    const byDocket = new Map<string, any>();
    for (const doc of consignments) {
      const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
      byDocket.set(String(obj.docketNo || "").toUpperCase(), enrichRow(obj, billByDocket));
    }

    // Merge memory-only rows that match filters
    const mem = filterMemory(memoryStore.getConsignments(), {
      docketNos,
      invoiceNo,
      dnNo,
      from,
      to,
      docType
    });
    for (const m of mem) {
      const key = String(m.docketNo || "").toUpperCase();
      if (!byDocket.has(key)) byDocket.set(key, enrichRow(m, billByDocket));
    }

    const rows = Array.from(byDocket.values());
    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      summary: summarize(rows),
      source: "mongodb"
    });
  } catch {
    const mem = filterMemory(memoryStore.getConsignments(), {
      docketNos,
      invoiceNo,
      dnNo,
      from,
      to,
      docType
    });
    const billByDocket = new Map<string, any>();
    for (const b of memoryStore.bills || []) {
      for (const dn of b.consignments || []) {
        billByDocket.set(String(dn).toUpperCase(), b);
      }
    }
    const rows = mem.map((m) => enrichRow(m, billByDocket));
    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      summary: summarize(rows),
      isMemoryStore: true
    });
  }
}
