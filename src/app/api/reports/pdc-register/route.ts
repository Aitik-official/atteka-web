import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TripSheet } from "@/models/TripSheet";
import { memoryStore } from "@/lib/memoryStore";

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatPdcDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-");
}

function sumDockets(dockets: any[], keyLoad: string, keyTotal: string) {
  return (dockets || []).reduce((sum, d) => {
    const v = Number(d?.[keyLoad] ?? d?.[keyTotal] ?? 0);
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);
}

function detectPdcType(t: any): string {
  const explicit = String(t.pdcType || t.type || "").trim();
  if (explicit) return explicit;
  const no = String(t.tripSheetNo || "").toUpperCase();
  if (no.startsWith("PPDC") || no.startsWith("P")) return "Pickup";
  if (no.startsWith("DS") || no.startsWith("DPDC") || no.startsWith("D")) return "Delivery";
  return "Delivery";
}

function mapRow(t: any) {
  const dockets = Array.isArray(t.dockets) ? t.dockets : [];
  const tripNo = String(t.tripSheetNo || "").toUpperCase();
  const pdcNumber = tripNo.startsWith("DS") || tripNo.startsWith("PPDC") || tripNo.startsWith("DPDC")
    ? tripNo
    : tripNo
      ? `DS${tripNo}`
      : "";
  const manualPdc = String(t.manualTripSheetNo || t.manualPdc || "").toUpperCase() || tripNo.replace(/^DS/, "");
  const openingKm = Number(t.startKm ?? t.openingKm ?? 0);
  const closingKm = Number(t.endKm ?? t.closingKm ?? (openingKm > 0 ? openingKm : 0));
  const totalKm = Number(t.totalKm ?? Math.max(0, closingKm - openingKm));
  const freight = Number(t.freight ?? t.pdcAmount ?? 0);
  const advancePaid = Number(t.advanceAmt ?? t.advancePaid ?? 0);
  const balanceAmt = Number(t.balanceAmt ?? Math.max(0, freight - advancePaid));
  const completed = /COMPLETE|CLOSE|SETTLE/i.test(String(t.status || ""));
  const balancePaid = Number(t.balancePaid ?? (completed ? balanceAmt : 0));
  const balancePending = Math.max(0, balanceAmt - balancePaid);
  const svcTax = Number(t.svcTax ?? t.serviceTax ?? (freight > 0 ? Number((freight * 0.05).toFixed(2)) : 0));
  const tds = Number(t.tds ?? 0);
  const tdsOnBalance = Number(t.tdsOnBalance ?? 0);
  const pdcDate = t.tripDate || t.pdcDate || t.createdAt || null;
  const advanceDate = t.advanceDate || (advancePaid > 0 ? pdcDate : null);
  const balanceDate = t.balanceDate || (balancePaid > 0 ? t.updatedAt || pdcDate : null);

  return {
    pdcNumber,
    manualPdc,
    pdcDate,
    pdcDateLabel: formatPdcDate(pdcDate),
    pdcType: detectPdcType(t),
    mode: String(t.mode || t.transportMode || "Road"),
    fromLocation: String(t.pickupLocation || t.fromLocation || "").toUpperCase(),
    toLocation: String(t.deliveryLocation || t.toLocation || "").toUpperCase(),
    vehicleNo: String(t.vehicleNo || "").toUpperCase(),
    vehicleType: String(t.vehicleType || "").toUpperCase(),
    vendorCode: String(t.vendorCode || "V00001").toUpperCase(),
    vendorName: String(t.vendorName || "COMPANY VEHICLE").toUpperCase(),
    brokerName: String(t.brokerName || ""),
    customerName: String(t.customerName || ""),
    totalCns: dockets.length || Number(t.totalCns || 0),
    pkgs: sumDockets(dockets, "pkgsLoad", "pkgsTotal") || Number(t.pkgs || 0),
    weight: sumDockets(dockets, "weightLoad", "weightTotal") || Number(t.weight || 0),
    openingKm,
    closingKm,
    totalKm,
    pdcAmount: freight,
    svcTaxCess: svcTax,
    tds,
    advancePaid,
    advanceDate,
    advanceDateLabel: formatPdcDate(advanceDate),
    balancePaid,
    balancePending,
    tdsOnBalance,
    balanceDocNo: String(t.balanceDocNo || ""),
    balanceDate,
    balanceDateLabel: formatPdcDate(balanceDate),
    remark: String(t.specialInstructions || t.remark || ""),
    tripBranch: String(t.location || t.tripBranch || t.bookingBranch || "ALC1").toUpperCase(),
    status: t.status || ""
  };
}

function matchesFilters(
  row: ReturnType<typeof mapRow>,
  from: Date | null,
  to: Date | null,
  transportMode: string,
  tripBranch: string,
  vendor: string,
  pdcType: string
) {
  const booked = row.pdcDate ? new Date(row.pdcDate) : null;
  if (from && booked && booked < from) return false;
  if (to && booked) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (booked > end) return false;
  }
  if (transportMode && !/show all/i.test(transportMode)) {
    if (!row.mode.toUpperCase().includes(transportMode.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  if (tripBranch && !/show all/i.test(tripBranch)) {
    const code = tripBranch.replace(/^-+|-+$/g, "").replace(/atteka logistics[-\s]*/i, "").trim().toUpperCase();
    if (code && !row.tripBranch.includes(code) && !row.pdcNumber.includes(code)) return false;
  }
  if (vendor && !/show all/i.test(vendor) && vendor.trim()) {
    const raw = vendor.trim().toUpperCase();
    const codePart = raw.split(/\s*[-–]\s*/)[0].trim();
    if (!row.vendorCode.includes(codePart) && !row.vendorName.includes(raw) && !raw.includes(row.vendorCode))
      return false;
  }
  if (pdcType && !/show all/i.test(pdcType) && !/--select--/i.test(pdcType)) {
    if (!row.pdcType.toUpperCase().includes(pdcType.replace(/^-+|-+$/g, "").toUpperCase())) return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const transportMode = (searchParams.get("transportMode") || "").trim();
  const tripBranch = (searchParams.get("tripBranch") || "").trim();
  const vendor = (searchParams.get("vendor") || "").trim();
  const pdcType = (searchParams.get("pdcType") || "").trim();

  try {
    await connectToDatabase();
    const query: any = {};
    if (from || to) {
      query.tripDate = {};
      if (from) query.tripDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.tripDate.$lte = end;
      }
    }
    if (vendor && !/show all/i.test(vendor)) {
      const vendorQ = vendor.replace(/^-+|-+$/g, "").split(/\s*[-–]\s*/)[0].trim();
      query.$or = [
        { vendorCode: new RegExp(vendorQ, "i") },
        { vendorName: new RegExp(vendor.replace(/^-+|-+$/g, ""), "i") }
      ];
    }

    const sheets = await TripSheet.find(query).sort({ tripDate: -1, createdAt: -1 }).lean();
    const byNo = new Map<string, any>();
    for (const t of sheets as any[]) {
      byNo.set(String(t.tripSheetNo || "").toUpperCase(), t);
    }
    for (const m of memoryStore.tripSheets || []) {
      const key = String(m.tripSheetNo || "").toUpperCase();
      if (key && !byNo.has(key)) byNo.set(key, m);
    }

    const rows = Array.from(byNo.values())
      .map(mapRow)
      .filter((r) => matchesFilters(r, from, to, transportMode, tripBranch, vendor, pdcType));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "mongodb"
    });
  } catch {
    const rows = (memoryStore.tripSheets || [])
      .map(mapRow)
      .filter((r) => matchesFilters(r, from, to, transportMode, tripBranch, vendor, pdcType));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      isMemoryStore: true
    });
  }
}
