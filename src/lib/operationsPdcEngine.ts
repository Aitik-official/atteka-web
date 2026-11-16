import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { TripSheet } from "@/models/TripSheet";
import { ensureExceptionalSeedData } from "@/lib/exceptionalOpsEngine";
import { RBAC, requireApiSession } from "@/lib/rbac";
import type { NextRequest } from "next/server";

export { requireApiSession, RBAC };

function toIso(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function toLabel(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function parseDate(v?: string | null) {
  if (!v) return new Date();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function vendorParts(v: string) {
  const raw = String(v || "").trim();
  const m = raw.match(/^([A-Z0-9]+)\s*[:\-]\s*(.+)$/i);
  if (m) return { code: m[1].toUpperCase(), name: m[2].replace(/\s*-\s*[A-Z0-9]+$/i, "").trim() };
  return { code: "", name: raw };
}

function nextPdcNo(kind: "PICKUP" | "DELIVERY") {
  const prefix = kind === "PICKUP" ? "PSALC1" : "DSALC1";
  return `${prefix}${Date.now().toString().slice(-7)}`;
}

async function ensureOpsTripSeeds() {
  await ensureExceptionalSeedData();
  await connectToDatabase();

  const tripSeeds = [
    {
      tripSheetNo: "TS12600601",
      sheetKind: "TRIP" as const,
      customerName: "NORTHBOUND FREIGHT PVT LTD",
      vendorCode: "V00001",
      vendorName: "COMPANY VEHICLE",
      vehicleNo: "MH04JK3315",
      pickupLocation: "BHIWANDI",
      deliveryLocation: "HYDERABAD",
      route: "BHIWANDI-HYDERABAD",
      freight: 15000,
      advanceAmt: 0,
      balanceAmt: 15000,
      location: "ALC1",
      status: "PREPARED" as const,
      dockets: [{ docketNo: "ALC12660615", consignorName: "NORTHBOUND FREIGHT PVT LTD" }]
    },
    {
      tripSheetNo: "TS12600602",
      sheetKind: "TRIP" as const,
      customerName: "METRO LOGISTICS PARTNERS",
      vendorCode: "V00002",
      vendorName: "METRO HAULAGE PARTNERS",
      vehicleNo: "MH46BU8201",
      pickupLocation: "MUMBAI",
      deliveryLocation: "NHAVASHEVA",
      route: "MUMBAI-NHAVASHEVA",
      freight: 4000,
      advanceAmt: 4000,
      balanceAmt: 0,
      location: "ALC1",
      status: "IN_TRANSIT" as const,
      dockets: [{ docketNo: "ALC12660616", consignorName: "METRO LOGISTICS PARTNERS" }]
    },
    {
      tripSheetNo: "TS12600603",
      sheetKind: "TRIP" as const,
      customerName: "COASTAL CARGO SOLUTIONS",
      vendorCode: "V00006",
      vendorName: "S.P LOGISTICS",
      vehicleNo: "MH12AB4501",
      pickupLocation: "BHIWANDI",
      deliveryLocation: "CHENNAI",
      route: "BHIWANDI-CHENNAI",
      freight: 12000,
      advanceAmt: 3000,
      balanceAmt: 9000,
      location: "ALC1",
      status: "PREPARED" as const,
      dockets: [{ docketNo: "ALC12660617", consignorName: "COASTAL CARGO SOLUTIONS" }]
    }
  ];

  for (const seed of tripSeeds) {
    await TripSheet.updateOne(
      { tripSheetNo: seed.tripSheetNo },
      { $setOnInsert: { ...seed, tripDate: new Date(), startKm: 0 } },
      { upsert: true }
    );
  }
}

export async function createPickupPdc(body: {
  selectedCnNos: string[];
  vendor: string;
  vehicleNo?: string;
  manualPdcNo?: string;
  pdcDate?: string;
  pickup?: string;
  drop?: string;
  distanceTraveled?: number;
  contractAmount?: number;
  remark?: string;
  financialAt?: string;
  financialType?: string;
}) {
  await ensureOpsTripSeeds();
  const selected = (body.selectedCnNos || []).map((n) => String(n).trim().toUpperCase()).filter(Boolean);
  if (!selected.length) throw Object.assign(new Error("Select at least one CN"), { status: 400 });
  if (!String(body.vendor || "").trim()) {
    throw Object.assign(new Error("Select / enter Vendor"), { status: 400 });
  }

  const cns = await Consignment.find({ docketNo: { $in: selected } });
  if (!cns.length) throw Object.assign(new Error("No matching consignments found"), { status: 404 });

  const v = vendorParts(body.vendor);
  const pdcNo = nextPdcNo("PICKUP");
  const tripDate = parseDate(body.pdcDate);
  const freight = Number(body.contractAmount || 0) || cns.reduce((s, c) => s + Number(c.financials?.freightAmount || 0), 0);
  const from = String(body.pickup || cns[0].fromLocation || "").toUpperCase();
  const to = String(body.drop || cns[0].toLocation || "").toUpperCase();

  const sheet = await TripSheet.create({
    tripSheetNo: pdcNo,
    manualPdcNo: String(body.manualPdcNo || "").trim().toUpperCase() || undefined,
    sheetKind: "PICKUP_PDC",
    customerName: v.name || cns[0].billingParty || "VENDOR",
    vendorCode: v.code || undefined,
    vendorName: v.name || undefined,
    vehicleNo: String(body.vehicleNo || cns[0].vehicleNo || "TBD").toUpperCase(),
    tripDate,
    pickupLocation: from,
    deliveryLocation: to,
    route: `${from}-${to}`,
    freight,
    advanceAmt: 0,
    balanceAmt: freight,
    pdcAmount: freight,
    advancePayableBranch: String(body.financialAt || "ALC1").toUpperCase().split(":")[0].trim(),
    location: "ALC1",
    startKm: Number(body.distanceTraveled || 0),
    specialInstructions: body.remark || "",
    exceptionalRemark: body.financialType ? `FinancialType=${body.financialType}` : "",
    status: "PREPARED",
    dockets: cns.map((c) => ({
      docketNo: c.docketNo,
      consignorName: c.consignor?.name,
      consigneeName: c.consignee?.name,
      pkgsTotal: c.packageDetails?.packagesCount,
      weightTotal: c.packageDetails?.actualWeight,
      deliveryAddress: c.toLocation
    }))
  });

  await Consignment.updateMany(
    { docketNo: { $in: selected } },
    {
      $set: {
        tripSheetNo: sheet.tripSheetNo,
        status: "IN_TRANSIT",
        vehicleNo: sheet.vehicleNo
      }
    }
  );

  return {
    pdcNo: sheet.tripSheetNo,
    manualPdcNo: sheet.manualPdcNo || "",
    vendor: body.vendor,
    vehicleNo: sheet.vehicleNo,
    pdcDate: toIso(sheet.tripDate),
    pdcType: "Pickup PDC",
    financialType: body.financialType || "Financial",
    selectedCnNos: selected,
    contractAmount: freight,
    distanceTraveled: Number(body.distanceTraveled || 0),
    source: "db" as const,
    message: `Pickup PDC ${sheet.tripSheetNo} prepared with ${selected.length} CN(s)`
  };
}

export async function createDeliveryPdc(body: {
  selected: Array<{ docketNo?: string } | string>;
  vendor?: string;
  vehicleNo?: string;
  manualPdcNo?: string;
  pdcDate?: string;
  pdcTime?: string;
  deliveryBy?: string;
  deliveryLocation?: string;
  remark?: string;
}) {
  await ensureOpsTripSeeds();
  const selected = (body.selected || [])
    .map((s) => (typeof s === "string" ? s : String(s?.docketNo || "")).trim().toUpperCase())
    .filter(Boolean);
  if (!selected.length) throw Object.assign(new Error("Select at least one docket"), { status: 400 });
  if (!String(body.vendor || "").trim() && !String(body.vehicleNo || "").trim()) {
    throw Object.assign(new Error("Enter Vendor or Vehicle No."), { status: 400 });
  }

  const cns = await Consignment.find({ docketNo: { $in: selected } });
  if (!cns.length) throw Object.assign(new Error("No matching consignments found"), { status: 404 });

  const v = vendorParts(body.vendor || "");
  const pdcNo = nextPdcNo("DELIVERY");
  const tripDate = parseDate(body.pdcDate);
  const freight = cns.reduce((s, c) => s + Number(c.financials?.freightAmount || 0), 0);
  const from = String(cns[0].fromLocation || "").toUpperCase();
  const to = String(body.deliveryLocation || cns[0].toLocation || "").toUpperCase();

  const sheet = await TripSheet.create({
    tripSheetNo: pdcNo,
    manualPdcNo: String(body.manualPdcNo || "").trim().toUpperCase() || undefined,
    sheetKind: "DELIVERY_PDC",
    customerName: v.name || cns[0].billingParty || "VENDOR",
    vendorCode: v.code || undefined,
    vendorName: v.name || undefined,
    vehicleNo: String(body.vehicleNo || cns[0].vehicleNo || "TBD").toUpperCase(),
    tripDate,
    tripTime: body.pdcTime || "",
    pickupLocation: from,
    deliveryLocation: to,
    route: `${from}-${to}`,
    freight,
    advanceAmt: Math.round(freight * 0.3),
    balanceAmt: freight - Math.round(freight * 0.3),
    pdcAmount: freight,
    advancePayableBranch: "ALC1",
    location: "ALC1",
    driverName: body.deliveryBy || "",
    specialInstructions: body.remark || "",
    status: "PREPARED",
    startKm: 0,
    dockets: cns.map((c) => ({
      docketNo: c.docketNo,
      consignorName: c.consignor?.name,
      consigneeName: c.consignee?.name,
      pkgsTotal: c.packageDetails?.packagesCount,
      weightTotal: c.packageDetails?.actualWeight,
      deliveryAddress: c.consignee?.address || c.toLocation,
      ewayBillNo: c.ewayBillNo
    }))
  });

  await Consignment.updateMany(
    { docketNo: { $in: selected } },
    {
      $set: {
        tripSheetNo: sheet.tripSheetNo,
        status: "IN_TRANSIT",
        vehicleNo: sheet.vehicleNo
      }
    }
  );

  return {
    pdcNo: sheet.tripSheetNo,
    manualPdcNo: sheet.manualPdcNo || "",
    pdcDate: toIso(sheet.tripDate),
    pdcTime: sheet.tripTime || "",
    vendor: body.vendor || sheet.vendorName || "",
    vehicleNo: sheet.vehicleNo,
    deliveryBy: body.deliveryBy || "",
    selected,
    source: "db" as const,
    message: `Delivery PDC ${sheet.tripSheetNo} prepared with ${selected.length} docket(s)`
  };
}

function mapUpdateListRow(ts: any) {
  return {
    id: String(ts._id),
    tripSheetNo: String(ts.tripSheetNo || ""),
    manualTripSheetNo: String(ts.manualPdcNo || ts.manualTripSheetNo || ""),
    deliveryLocation: String(ts.deliveryLocation || ""),
    tripSheetDate: toIso(ts.tripDate),
    tripSheetDateLabel: toLabel(ts.tripDate)
  };
}

function mapUpdateDetail(ts: any, cnsByNo: Map<string, any>) {
  const lines = (Array.isArray(ts.dockets) ? ts.dockets : []).map((d: any, idx: number) => {
    const cn = cnsByNo.get(String(d.docketNo || "").toUpperCase());
    return {
      id: `${ts._id}-${idx}`,
      docketNo: String(d.docketNo || "").toUpperCase(),
      payBasis: String(cn?.paymentBasis || "TBB"),
      edd: toLabel(cn?.expectedDeliveryDate),
      consignorName: String(d.consignorName || cn?.consignor?.name || ""),
      consigneeAddress: String(d.deliveryAddress || cn?.consignee?.address || cn?.toLocation || ""),
      bookingBranch: String(cn?.bookingBranch || "ALC1"),
      pkgs: Number(d.pkgsTotal || cn?.packageDetails?.packagesCount || 1),
      weight: Number(d.weightTotal || cn?.packageDetails?.actualWeight || 0)
    };
  });

  return {
    id: String(ts._id),
    tripSheetNo: String(ts.tripSheetNo || ""),
    manualTripSheetNo: String(ts.manualPdcNo || ts.manualTripSheetNo || ""),
    deliveryLocation: String(ts.deliveryLocation || ""),
    tripSheetDate: toIso(ts.tripDate),
    tripSheetDateLabel: toLabel(ts.tripDate),
    pdcDate: toIso(ts.tripDate),
    pdcDateLabel: toLabel(ts.tripDate),
    pdcBranch: `${ts.location || "ALC1"}: Ateka Logistics`,
    pdcType: "Delivery",
    manualPdcNo: String(ts.manualPdcNo || ""),
    pdcEntryDate: toIso(ts.updatedAt || ts.tripDate),
    pdcEntryDateLabel: toLabel(ts.updatedAt || ts.tripDate),
    deliveryBy: String(ts.driverName || ""),
    entryBy: "SYSTEM",
    vendor: String(ts.vendorName || ts.customerName || ""),
    vendorType: String(ts.vendorCode || "").startsWith("V00001") ? "O" : "M",
    vehicleNo: String(ts.vehicleNo || ""),
    vehicleType: String(ts.vehicleType || ""),
    driverName: String(ts.driverName || ""),
    financialCompletionAt: `${ts.advancePayableBranch || ts.location || "ALC1"}: Ateka Logistics`,
    startKm: Number(ts.startKm || 0),
    endKm: Number(ts.endKm || 0),
    status: String(ts.status || ""),
    lines
  };
}

export async function listDeliveryPdcsForUpdate(filters: {
  id?: string;
  tripSheetNo?: string;
  from?: string;
  to?: string;
  pdcNo?: string;
}) {
  await ensureOpsTripSeeds();

  if (filters.id || filters.tripSheetNo) {
    const no = String(filters.tripSheetNo || "").toUpperCase();
    const sheet = filters.id
      ? await TripSheet.findById(filters.id)
      : await TripSheet.findOne({
          $or: [
            { tripSheetNo: no },
            { tripSheetNo: { $regex: no, $options: "i" } },
            { manualPdcNo: no }
          ]
        });
    if (!sheet) return { detail: null, list: [] };
    const docketNos = (sheet.dockets || []).map((d) => d.docketNo);
    const cns = await Consignment.find({ docketNo: { $in: docketNos } });
    const map = new Map(cns.map((c) => [c.docketNo, c]));
    return { detail: mapUpdateDetail(sheet, map), list: [] };
  }

  const clauses: Record<string, unknown>[] = [
    {
      $or: [
        { sheetKind: "DELIVERY_PDC" },
        { tripSheetNo: { $regex: /^(DS|DPDC)/i } }
      ]
    }
  ];

  if (filters.pdcNo) {
    const no = filters.pdcNo.toUpperCase();
    clauses.push({
      $or: [
        { tripSheetNo: { $regex: no, $options: "i" } },
        { manualPdcNo: { $regex: no, $options: "i" } }
      ]
    });
  } else if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.$gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) range.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    clauses.push({ tripDate: range });
  }

  const rows = await TripSheet.find({ $and: clauses }).sort({ tripDate: -1 }).limit(200);
  return { detail: null, list: rows.map(mapUpdateListRow) };
}

export async function updateDeliveryPdc(body: {
  tripSheetNo: string;
  driverName?: string;
  endKm?: number;
  vehicleNo?: string;
  vendor?: string;
  close?: boolean;
  lines?: Array<{ docketNo?: string; pkgs?: number; weight?: number }>;
}) {
  await ensureOpsTripSeeds();
  const no = String(body.tripSheetNo || "").trim().toUpperCase();
  if (!no) throw Object.assign(new Error("TripSheet No required"), { status: 400 });

  const sheet = await TripSheet.findOne({
    $or: [{ tripSheetNo: no }, { tripSheetNo: { $regex: no, $options: "i" } }, { manualPdcNo: no }]
  });
  if (!sheet) throw Object.assign(new Error("TripSheet / PDC not found"), { status: 404 });

  if (body.driverName !== undefined) sheet.driverName = String(body.driverName || "");
  if (body.vehicleNo) sheet.vehicleNo = String(body.vehicleNo).toUpperCase();
  if (body.vendor) {
    const v = vendorParts(body.vendor);
    if (v.code) sheet.vendorCode = v.code;
    if (v.name) {
      sheet.vendorName = v.name;
      sheet.customerName = v.name;
    }
  }
  if (body.endKm !== undefined) {
    sheet.endKm = Number(body.endKm || 0);
  }
  if (Array.isArray(body.lines) && body.lines.length) {
    sheet.dockets = sheet.dockets.map((d) => {
      const match = body.lines!.find(
        (l) => String(l.docketNo || "").toUpperCase() === String(d.docketNo || "").toUpperCase()
      );
      if (!match) return d;
      return {
        ...d,
        pkgsTotal: match.pkgs ?? d.pkgsTotal,
        weightTotal: match.weight ?? d.weightTotal
      };
    });
  }

  if (body.close) {
    sheet.status = "COMPLETED";
    const docketNos = (sheet.dockets || []).map((d) => d.docketNo).filter(Boolean);
    if (docketNos.length) {
      await Consignment.updateMany(
        { docketNo: { $in: docketNos } },
        { $set: { status: "DELIVERED" } }
      );
    }
  }

  await sheet.save();

  const cns = await Consignment.find({
    docketNo: { $in: (sheet.dockets || []).map((d) => d.docketNo) }
  });
  const map = new Map(cns.map((c) => [c.docketNo, c]));

  return {
    message: body.close
      ? `Delivery PDC ${sheet.tripSheetNo} closed`
      : `Delivery PDC ${sheet.tripSheetNo} updated`,
    data: mapUpdateDetail(sheet, map),
    source: "db" as const
  };
}

function mapPrintListRow(ts: any) {
  const iso = toIso(ts.tripDate);
  return {
    id: String(ts._id),
    pdcNo: String(ts.tripSheetNo || ""),
    manualPdcNo: String(ts.manualPdcNo || ts.manualTripSheetNo || ""),
    vehicleNo: String(ts.vehicleNo || ""),
    pdcDate: iso,
    pdcDateLabel: toLabel(ts.tripDate),
    pdcBranch: `Atteka Logistics-${ts.location || "ALC1"}`
  };
}

function mapPrintDetail(ts: any, kind: "PICKUP" | "DELIVERY") {
  const iso = toIso(ts.tripDate);
  const label = toLabel(ts.tripDate);
  const completed = String(ts.status || "").toUpperCase() === "COMPLETED";
  const lines = (Array.isArray(ts.dockets) ? ts.dockets : []).map((d: any, idx: number) => {
    const pkgs = Number(d.pkgsTotal || d.pkgsLoad || 1);
    const weight = Number(d.weightTotal || d.weightLoad || 0);
    if (kind === "PICKUP") {
      return {
        srNo: idx + 1,
        docketNo: String(d.docketNo || "").toUpperCase(),
        consignorName: String(d.consignorName || ""),
        pkgsLoad: pkgs,
        pkgsTotal: pkgs,
        weightLoad: weight,
        weightTotal: weight,
        picked: completed,
        stampSign: completed
      };
    }
    return {
      srNo: idx + 1,
      docketNo: String(d.docketNo || "").toUpperCase(),
      consigneeName: String(d.consigneeName || d.consignorName || ""),
      pkgsLoad: pkgs,
      pkgsTotal: pkgs,
      weightLoad: weight,
      weightTotal: weight,
      delivered: completed,
      stampSign: completed
    };
  });

  const vendorCode = String(ts.vendorCode || "");
  const vendorName = String(ts.vendorName || ts.customerName || "");
  const vendor = vendorCode ? `${vendorCode}: ${vendorName}` : vendorName;

  return {
    ...mapPrintListRow(ts),
    mode: "Road",
    driverLicenseNo: "",
    preparedBy: "AL002: OFFICE USER",
    preparedAt: `${ts.location || "ALC1"}: Ateka Logistics`,
    preparedOn: label,
    vendor,
    fromLocation: String(ts.pickupLocation || ""),
    toLocation: String(ts.deliveryLocation || ""),
    deliveryLocation: String(ts.deliveryLocation || ""),
    distance: Number(ts.startKm || 0),
    driverName: String(ts.driverName || "-"),
    remark: String(ts.specialInstructions || ""),
    lines
  };
}

export async function listViewPrintPdcs(
  kind: "PICKUP" | "DELIVERY",
  filters: {
    id?: string;
    from?: string;
    to?: string;
    systemPdcNo?: string;
    manualPdcNo?: string;
  }
) {
  await ensureOpsTripSeeds();
  const sheetKind = kind === "PICKUP" ? "PICKUP_PDC" : "DELIVERY_PDC";
  const prefix = kind === "PICKUP" ? /^(PS|PPDC)/i : /^(DS|DPDC)/i;

  if (filters.id) {
    const sheet = await TripSheet.findById(filters.id);
    if (!sheet) return { list: [], detail: null };
    return { list: [], detail: mapPrintDetail(sheet, kind) };
  }

  const systemNo = String(filters.systemPdcNo || "").trim().toUpperCase();
  const manualNo = String(filters.manualPdcNo || "").trim().toUpperCase();
  if (systemNo || manualNo) {
    const sheet = await TripSheet.findOne({
      $and: [
        { $or: [{ sheetKind }, { tripSheetNo: { $regex: prefix } }] },
        {
          $or: [
            ...(systemNo
              ? [
                  { tripSheetNo: systemNo },
                  { tripSheetNo: { $regex: systemNo, $options: "i" } }
                ]
              : []),
            ...(manualNo
              ? [
                  { manualPdcNo: manualNo },
                  { manualPdcNo: { $regex: manualNo, $options: "i" } }
                ]
              : [])
          ]
        }
      ]
    });
    if (!sheet) return { list: [], detail: null };
    return { list: [mapPrintListRow(sheet)], detail: mapPrintDetail(sheet, kind) };
  }

  const clauses: Record<string, unknown>[] = [
    { $or: [{ sheetKind }, { tripSheetNo: { $regex: prefix } }] }
  ];
  if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.$gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) range.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    clauses.push({ tripDate: range });
  }

  const rows = await TripSheet.find({ $and: clauses }).sort({ tripDate: -1 }).limit(200);
  return { list: rows.map(mapPrintListRow), detail: null };
}

export async function requireOpsWrite(req?: NextRequest) {
  return requireApiSession(req, RBAC.opsWrite);
}

export { ensureOpsTripSeeds };
