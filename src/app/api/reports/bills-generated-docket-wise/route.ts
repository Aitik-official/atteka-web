import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { Consignment } from "@/models/Consignment";
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

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function billTypeLabel(raw?: string) {
  const t = String(raw || "Freight Bill");
  if (/freight/i.test(t)) return "Freight";
  return t.replace(/\s*Bill\s*/i, "").trim() || "Freight";
}

function mapRows(bill: any, cnByDocket: Map<string, any>) {
  const dockets: string[] = Array.isArray(bill.consignments)
    ? bill.consignments.map((d: any) => String(d).toUpperCase()).filter(Boolean)
    : [];
  const lineItems = Array.isArray(bill.lineItems) ? bill.lineItems : [];
  const customerName = `${String(bill.customerCode || "").trim()} - ${String(bill.customerName || "").trim()}`.replace(
    /^ - /,
    ""
  );
  const billNo = String(bill.billNumber || "").toUpperCase();
  const billBranch = String(bill.billingBranch || bill.gstBranch || "ALC1").toUpperCase();
  const collBranch = String(bill.collectionBranch || billBranch).toUpperCase();
  const billDate = bill.billDate || bill.createdAt || null;
  const billAmount = num(bill.grandTotal);
  const perDktFallback = dockets.length ? billAmount / dockets.length : billAmount;
  const dueDate = bill.dueDate || null;
  const submissionDate = bill.status === "SUBMITTED" || bill.status === "PAID" ? bill.updatedAt || billDate : null;
  const topSheetNo = String(bill.topsheetNo || "");
  const topSheetDate = bill.topsheetDate || bill.mrsDate || null;

  const sources =
    dockets.length > 0
      ? dockets
      : lineItems.map((li: any) => String(li.docketNo || li.cnNumber || "").toUpperCase()).filter(Boolean);

  if (!sources.length) {
    return [
      {
        customerName,
        billNo,
        billBranch,
        manualBillNo: String(bill.manualBillNo || billNo).toUpperCase(),
        billDate,
        billDateLabel: formatDate(billDate),
        billType: billTypeLabel(bill.billType),
        dueDate,
        dueDateLabel: formatDate(dueDate),
        submissionDate,
        submissionDateLabel: formatDate(submissionDate),
        docketNo: "",
        docketDate: null,
        docketDateLabel: "",
        bkgBranch: "",
        actWt: 0,
        chrgWt: 0,
        fromLocation: "",
        toLocation: "",
        deliveryDate: null,
        deliveryDateLabel: "",
        collBranch,
        dktTotal: billAmount,
        billAmount,
        topSheetNo,
        topSheetDate,
        topSheetDateLabel: formatDate(topSheetDate),
        invoiceNo: "",
        shipmentNo: "",
        poNumber: ""
      }
    ];
  }

  return sources.map((docketNo: string) => {
    const cn = cnByDocket.get(docketNo);
    const line = lineItems.find(
      (li: any) => String(li.docketNo || li.cnNumber || "").toUpperCase() === docketNo
    );
    const delivered = /DELIVER|BILLED/i.test(String(cn?.status || ""));
    const dktTotal = num(
      line?.total ?? line?.amount ?? line?.grandTotal ?? cn?.financials?.grandTotal ?? perDktFallback
    );
    const docketDate = cn?.bookingDate || line?.docketDate || null;
    const deliveryDate = delivered ? cn?.updatedAt || cn?.expectedDeliveryDate || null : null;

    return {
      customerName,
      billNo,
      billBranch,
      manualBillNo: String(bill.manualBillNo || billNo).toUpperCase(),
      billDate,
      billDateLabel: formatDate(billDate),
      billType: billTypeLabel(bill.billType),
      dueDate,
      dueDateLabel: formatDate(dueDate),
      submissionDate,
      submissionDateLabel: formatDate(submissionDate),
      docketNo,
      docketDate,
      docketDateLabel: formatDate(docketDate),
      bkgBranch: String(cn?.bookingBranch || "ALC1").toUpperCase(),
      actWt: num(cn?.packageDetails?.actualWeight ?? line?.actWt ?? line?.actualWeight),
      chrgWt: num(cn?.packageDetails?.chargedWeight ?? line?.chrgWt ?? line?.chargedWeight),
      fromLocation: String(cn?.fromLocation || line?.from || "").toUpperCase(),
      toLocation: String(cn?.toLocation || line?.to || "").toUpperCase(),
      deliveryDate,
      deliveryDateLabel: formatDate(deliveryDate),
      collBranch,
      dktTotal: Number(dktTotal.toFixed(2)),
      billAmount,
      topSheetNo,
      topSheetDate,
      topSheetDateLabel: formatDate(topSheetDate),
      invoiceNo: String(cn?.invoiceDetails?.invoiceBeNo || line?.invoiceNo || "").toUpperCase(),
      shipmentNo: String(cn?.documentationDetails?.shipment || line?.shipmentNo || ""),
      poNumber: String(cn?.documentationDetails?.poNo || line?.poNumber || "")
    };
  });
}

function matchesFilters(
  row: ReturnType<typeof mapRows>[number],
  bill: any,
  from: Date | null,
  to: Date | null,
  billingBranch: string,
  collectionBranch: string,
  billingParty: string,
  billType: string
) {
  const bd = row.billDate ? new Date(row.billDate) : null;
  if (from && bd && bd < from) return false;
  if (to && bd) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (bd > end) return false;
  }
  if (billingBranch && billingBranch.trim() && !/show all/i.test(billingBranch) && !/^billing branch$/i.test(billingBranch)) {
    const code = billingBranch.replace(/^-+|-+$/g, "").trim().toUpperCase();
    if (code && !row.billBranch.includes(code)) return false;
  }
  if (
    collectionBranch &&
    collectionBranch.trim() &&
    !/show all/i.test(collectionBranch) &&
    !/^collection branch$/i.test(collectionBranch)
  ) {
    const code = collectionBranch.replace(/^-+|-+$/g, "").trim().toUpperCase();
    if (code && !row.collBranch.includes(code)) return false;
  }
  if (billingParty && billingParty.trim() && !/show all/i.test(billingParty) && !/^billing party$/i.test(billingParty)) {
    const q = billingParty.replace(/^-+|-+$/g, "").toUpperCase();
    if (
      !String(bill.customerName || "").toUpperCase().includes(q) &&
      !String(bill.customerCode || "").toUpperCase().includes(q) &&
      !row.customerName.toUpperCase().includes(q)
    )
      return false;
  }
  if (billType && billType.trim() && !/show all/i.test(billType) && !/^bill type$/i.test(billType)) {
    const t = billType.replace(/^-+|-+$/g, "").toUpperCase();
    if (!row.billType.toUpperCase().includes(t) && !String(bill.billType || "").toUpperCase().includes(t))
      return false;
  }
  return true;
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

    const bills = await CustomerBill.find(query).sort({ billDate: -1, createdAt: -1 }).lean();
    const byBillNo = new Map<string, any>();
    for (const b of bills as any[]) {
      byBillNo.set(String(b.billNumber || "").toUpperCase(), b);
    }
    for (const m of memoryStore.bills || []) {
      const key = String(m.billNumber || "").toUpperCase();
      if (key && !byBillNo.has(key)) byBillNo.set(key, m);
    }

    const allBills = Array.from(byBillNo.values());
    const docketNos = [
      ...new Set(
        allBills.flatMap((b) =>
          (b.consignments || []).map((d: any) => String(d).toUpperCase()).filter(Boolean)
        )
      )
    ];

    const cnByDocket = new Map<string, any>();
    if (docketNos.length) {
      const cns = await Consignment.find({ docketNo: { $in: docketNos } }).lean().catch(() => []);
      for (const c of cns as any[]) cnByDocket.set(String(c.docketNo || "").toUpperCase(), c);
    }
    for (const m of memoryStore.getConsignments()) {
      const key = String(m.docketNo || "").toUpperCase();
      if (key && !cnByDocket.has(key)) cnByDocket.set(key, m);
    }

    const rows = allBills
      .flatMap((b: any) => mapRows(b, cnByDocket).map((r: any) => ({ row: r, bill: b })))
      .filter(({ row, bill }: any) =>
        matchesFilters(row, bill, from, to, billingBranch, collectionBranch, billingParty, billType)
      )
      .map(({ row }: any) => row);

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "mongodb"
    });
  } catch {
    const cnByDocket = new Map<string, any>();
    for (const m of memoryStore.getConsignments()) {
      const key = String(m.docketNo || "").toUpperCase();
      if (key) cnByDocket.set(key, m);
    }
    const rows = (memoryStore.bills || [])
      .flatMap((b: any) => mapRows(b, cnByDocket).map((r: any) => ({ row: r, bill: b })))
      .filter(({ row, bill }: any) =>
        matchesFilters(row, bill, from, to, billingBranch, collectionBranch, billingParty, billType)
      )
      .map(({ row }: any) => row);

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      isMemoryStore: true
    });
  }
}
