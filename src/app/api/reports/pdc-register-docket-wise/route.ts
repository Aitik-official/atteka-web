import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TripSheet } from "@/models/TripSheet";
import { Consignment } from "@/models/Consignment";
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

function formatTime(value?: string | Date | null) {
  if (!value) return "00:00";
  if (typeof value === "string" && /^\d{1,2}:\d{2}/.test(value)) return value.slice(0, 5);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "00:00";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function detectPdcType(t: any): string {
  const explicit = String(t.pdcType || t.type || "").trim();
  if (explicit) return explicit;
  const no = String(t.tripSheetNo || "").toUpperCase();
  if (no.startsWith("PPDC") || no.startsWith("P")) return "Pickup";
  if (no.startsWith("DS") || no.startsWith("DPDC") || no.startsWith("D")) return "Delivery";
  return "Delivery";
}

function sheetMeta(t: any) {
  const tripNo = String(t.tripSheetNo || "").toUpperCase();
  const pdcNumber =
    tripNo.startsWith("DS") || tripNo.startsWith("PPDC") || tripNo.startsWith("DPDC")
      ? tripNo
      : tripNo
        ? `DS${tripNo}`
        : "";
  const manualPdc =
    String(t.manualTripSheetNo || t.manualPdc || "").toUpperCase() || tripNo.replace(/^DS/, "");
  const pdcDate = t.tripDate || t.pdcDate || t.createdAt || null;
  return {
    pdcNumber,
    manualPdc,
    pdcDate,
    pdcDateLabel: formatPdcDate(pdcDate),
    pdcTime: formatTime(t.tripTime || t.pdcTime || null),
    pdcType: detectPdcType(t),
    mode: String(t.mode || t.transportMode || "Road"),
    delyLocation: String(t.deliveryLocation || t.toLocation || "").toUpperCase(),
    vehicleNo: String(t.vehicleNo || "").toUpperCase(),
    vendorCode: String(t.vendorCode || "V00001").toUpperCase(),
    vendorName: String(t.vendorName || "COMPANY VEHICLE").toUpperCase(),
    tripBranch: String(t.location || t.tripBranch || t.bookingBranch || "ALC1").toUpperCase()
  };
}

function mapDocketRows(t: any, cnByDocket: Map<string, any>) {
  const meta = sheetMeta(t);
  const dockets = Array.isArray(t.dockets) ? t.dockets : [];

  if (!dockets.length) {
    return [
      {
        ...meta,
        wayBill: "",
        docket: "",
        docketDate: null,
        docketDateLabel: "",
        orgncd: meta.tripBranch || "ALC1",
        actWt: 0,
        chrgWt: 0,
        pkgs: 0,
        pkgsDly: 0
      }
    ];
  }

  return dockets.map((d: any) => {
    const docketNo = String(d.docketNo || "").toUpperCase();
    const cn = cnByDocket.get(docketNo);
    const actWt = Number(
      d.weightLoad ?? d.actualWeight ?? cn?.packageDetails?.actualWeight ?? cn?.actualWeight ?? 0
    );
    const chrgWt = Number(
      d.weightTotal ?? d.chargedWeight ?? cn?.packageDetails?.chargedWeight ?? cn?.chargedWeight ?? actWt
    );
    const pkgs = Number(d.pkgsLoad ?? d.pkgsTotal ?? cn?.packageDetails?.packagesCount ?? 0);
    const delivered = /DELIVER|BILLED/i.test(String(cn?.status || t.status || ""));
    const pkgsDly = Number(d.pkgsDly ?? (delivered ? pkgs : 0));
    const docketDate = d.refDate || cn?.bookingDate || meta.pdcDate || null;
    const wayBill = String(d.ewayBillNo || cn?.ewayBillNo || t.wayBill || "").toUpperCase();
    const orgncd = String(
      cn?.bookingBranch || d.orgncd || t.location || meta.tripBranch || "ALC1"
    ).toUpperCase();

    return {
      ...meta,
      wayBill,
      docket: docketNo,
      docketDate,
      docketDateLabel: formatPdcDate(docketDate),
      orgncd,
      actWt,
      chrgWt,
      pkgs,
      pkgsDly
    };
  });
}

function matchesFilters(
  row: any,
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
    if (!String(row.mode || "").toUpperCase().includes(transportMode.replace(/^-+|-+$/g, "").toUpperCase()))
      return false;
  }
  if (tripBranch && !/show all/i.test(tripBranch)) {
    const code = tripBranch
      .replace(/^-+|-+$/g, "")
      .replace(/atteka logistics[-\s]*/i, "")
      .trim()
      .toUpperCase();
    if (code && !String(row.tripBranch || "").includes(code) && !String(row.pdcNumber || "").includes(code))
      return false;
  }
  if (vendor && !/show all/i.test(vendor) && vendor.trim()) {
    const raw = vendor.trim().toUpperCase();
    const codePart = raw.split(/\s*[-–]\s*/)[0].trim();
    if (
      !String(row.vendorCode || "").includes(codePart) &&
      !String(row.vendorName || "").includes(raw) &&
      !raw.includes(String(row.vendorCode || ""))
    )
      return false;
  }
  if (pdcType && !/show all/i.test(pdcType) && !/--select--/i.test(pdcType)) {
    if (!String(row.pdcType || "").toUpperCase().includes(pdcType.replace(/^-+|-+$/g, "").toUpperCase()))
      return false;
  }
  return true;
}

async function buildCnMap(docketNos: string[]) {
  const map = new Map<string, any>();
  if (!docketNos.length) return map;
  try {
    const list = await Consignment.find({ docketNo: { $in: docketNos } }).lean();
    for (const c of list as any[]) {
      map.set(String(c.docketNo || "").toUpperCase(), c);
    }
  } catch {
    /* memory only */
  }
  for (const m of memoryStore.getConsignments()) {
    const key = String(m.docketNo || "").toUpperCase();
    if (key && !map.has(key)) map.set(key, m);
  }
  return map;
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
      const vendorQ = vendor
        .replace(/^-+|-+$/g, "")
        .split(/\s*[-–]\s*/)[0]
        .trim();
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

    const allSheets = Array.from(byNo.values());
    const docketNos = allSheets.flatMap((t) =>
      (t.dockets || []).map((d: any) => String(d.docketNo || "").toUpperCase()).filter(Boolean)
    );
    const cnByDocket = await buildCnMap([...new Set(docketNos)]);

    const rows = allSheets
      .flatMap((t) => mapDocketRows(t, cnByDocket))
      .filter((r) => matchesFilters(r, from, to, transportMode, tripBranch, vendor, pdcType));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "mongodb"
    });
  } catch {
    const sheets = memoryStore.tripSheets || [];
    const docketNos = sheets.flatMap((t: any) =>
      (t.dockets || []).map((d: any) => String(d.docketNo || "").toUpperCase()).filter(Boolean)
    );
    const cnByDocket = new Map<string, any>();
    for (const m of memoryStore.getConsignments()) {
      const key = String(m.docketNo || "").toUpperCase();
      if (key) cnByDocket.set(key, m);
    }
    void docketNos;

    const rows = sheets
      .flatMap((t: any) => mapDocketRows(t, cnByDocket))
      .filter((r) => matchesFilters(r, from, to, transportMode, tripBranch, vendor, pdcType));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      isMemoryStore: true
    });
  }
}
