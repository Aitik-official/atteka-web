import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { TripSheet } from "@/models/TripSheet";

export type ExceptionalDoc = Record<string, string | number | boolean | null> & {
  id: string;
  documentNo: string;
};

function toDmy(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

function parseFlexibleDate(v: string): Date | null {
  const s = String(v || "").trim();
  if (!s) return null;
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const iso = new Date(s);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

function branchLabel(code: string) {
  const c = String(code || "").toUpperCase();
  const map: Record<string, string> = {
    ALC1: "ALC1 : Ateka Logistics",
    ALC2: "ALC2 : Bhiwandi Hub",
    ALC3: "ALC3 : Pune Hub",
    MUM: "MUM : Mumbai Central"
  };
  return map[c] || (c ? `${c} : Ateka Logistics` : "");
}

function extractBranchCode(v: string) {
  const s = String(v || "").trim().toUpperCase();
  const m = s.match(/^([A-Z0-9]+)/);
  return m ? m[1] : s;
}

function vendorParts(v: string) {
  const raw = String(v || "").trim();
  const m = raw.match(/^([A-Z0-9]+)\s*[:\-]\s*(.+)$/i);
  if (m) return { code: m[1].toUpperCase(), name: m[2].trim() };
  if (/^V\d+/i.test(raw)) return { code: raw.toUpperCase(), name: raw };
  return { code: "", name: raw };
}

function isPdcNo(no: string) {
  const n = no.toUpperCase();
  return (
    n.startsWith("DS") ||
    n.startsWith("PS") ||
    n.startsWith("DPDC") ||
    n.startsWith("PPDC") ||
    n.includes("PDC")
  );
}

function isThcNo(no: string) {
  const n = no.toUpperCase();
  return n.startsWith("THC") || n.includes("THC");
}

/** Upsert sample CN + TripSheet/PDC/THC rows so exceptional screens have durable docs. */
export async function ensureExceptionalSeedData() {
  await connectToDatabase();

  const cnSeeds = [
    {
      docketNo: "ALC12660615",
      bookingBranch: "ALC1",
      billingParty: "METRO LOGISTICS PARTNERS",
      billToPartyCode: "C00015",
      fromLocation: "BHIWANDI",
      toLocation: "HYDERABAD",
      nextLocation: "ALC1",
      route: "BHIWANDI-HYDERABAD",
      vehicleNo: "MH46CU4138",
      consignor: { name: "METRO LOGISTICS PARTNERS", city: "BHIWANDI" },
      consignee: { name: "GATEWAY DISTRIBUTION CO", city: "HYDERABAD" },
      packageDetails: {
        packageType: "BOX",
        productDescription: "General cargo",
        packagesCount: 1,
        actualWeight: 8000,
        chargedWeight: 8000
      },
      financials: {
        freightAmount: 28000,
        loadingCharge: 0,
        subTotal: 28000,
        gstRate: 12,
        gstAmount: 3360,
        grandTotal: 31360
      },
      documentationDetails: { poNo: "PO-7781" },
      status: "IN_TRANSIT" as const
    },
    {
      docketNo: "ALC12660616",
      bookingBranch: "ALC1",
      billingParty: "NORTHBOUND FREIGHT PVT LTD",
      billToPartyCode: "C00016",
      fromLocation: "BHIWANDI",
      toLocation: "CHENNAI",
      nextLocation: "ALC2",
      route: "BHIWANDI-CHENNAI",
      vehicleNo: "MH12AB4501",
      consignor: { name: "NORTHBOUND FREIGHT PVT LTD", city: "BHIWANDI" },
      consignee: { name: "NORTHBOUND FREIGHT PVT LTD", city: "CHENNAI" },
      packageDetails: {
        packageType: "BOX",
        productDescription: "Industrial goods",
        packagesCount: 2,
        actualWeight: 12500,
        chargedWeight: 12500
      },
      financials: {
        freightAmount: 42000,
        loadingCharge: 500,
        subTotal: 42500,
        gstRate: 12,
        gstAmount: 5100,
        grandTotal: 47600
      },
      documentationDetails: { poNo: "PO-8812" },
      status: "BOOKED" as const
    },
    {
      docketNo: "ALC12660617",
      bookingBranch: "ALC3",
      billingParty: "COASTAL CARGO SOLUTIONS",
      billToPartyCode: "C00017",
      fromLocation: "PUNE",
      toLocation: "NAGPUR",
      nextLocation: "ALC3",
      route: "PUNE-NAGPUR",
      vehicleNo: "MH46BU8250",
      consignor: { name: "COASTAL CARGO SOLUTIONS", city: "PUNE" },
      consignee: { name: "METRO LOGISTICS PARTNERS", city: "NAGPUR" },
      packageDetails: {
        packageType: "BOX",
        productDescription: "Retail cargo",
        packagesCount: 2,
        actualWeight: 6000,
        chargedWeight: 6000
      },
      financials: {
        freightAmount: 18500,
        loadingCharge: 0,
        subTotal: 18500,
        gstRate: 12,
        gstAmount: 2220,
        grandTotal: 20720
      },
      documentationDetails: { poNo: "PO-9920" },
      status: "IN_TRANSIT" as const
    },
    {
      docketNo: "ALC12660621",
      bookingBranch: "ALC1",
      billingParty: "NORTHBOUND FREIGHT PVT LTD",
      billToPartyCode: "C00021",
      fromLocation: "MUMBAI",
      toLocation: "BHIWANDI",
      nextLocation: "ALC1",
      route: "MUMBAI-BHIWANDI",
      vehicleNo: "MH04AB1234",
      consignor: { name: "NORTHBOUND FREIGHT PVT LTD", city: "MUMBAI" },
      consignee: { name: "NORTHBOUND FREIGHT PVT LTD", city: "BHIWANDI" },
      packageDetails: {
        packageType: "BOX",
        productDescription: "Local transfer",
        packagesCount: 1,
        actualWeight: 500,
        chargedWeight: 500
      },
      financials: {
        freightAmount: 4500,
        loadingCharge: 0,
        subTotal: 4500,
        gstRate: 12,
        gstAmount: 540,
        grandTotal: 5040
      },
      documentationDetails: { poNo: "" },
      status: "BOOKED" as const
    }
  ];

  for (const seed of cnSeeds) {
    await Consignment.updateOne(
      { docketNo: seed.docketNo },
      {
        $setOnInsert: {
          ...seed,
          bookingDate: new Date(),
          bookingType: "SYSTEM",
          paymentBasis: "TBB",
          serviceType: "FTL",
          mode: "Road"
        }
      },
      { upsert: true }
    );
  }

  const sheetSeeds = [
    {
      tripSheetNo: "DSALC12600573",
      sheetKind: "DELIVERY_PDC" as const,
      manualPdcNo: "",
      customerName: "GATEWAY FLEET CO",
      vendorCode: "V00009",
      vendorName: "GATEWAY FLEET CO",
      vehicleNo: "MH46BU8250",
      pickupLocation: "BHIWANDI",
      deliveryLocation: "HYDERABAD",
      route: "BHIWANDI-HYDERABAD",
      freight: 45000,
      advanceAmt: 15000,
      balanceAmt: 30000,
      pdcAmount: 45000,
      advancePayableBranch: "ALC2",
      location: "ALC1",
      status: "PREPARED" as const,
      dockets: [{ docketNo: "ALC12660615" }]
    },
    {
      tripSheetNo: "DSALC12600532",
      sheetKind: "DELIVERY_PDC" as const,
      manualPdcNo: "ALC12660575",
      customerName: "GATEWAY FLEET CO",
      vendorCode: "V00009",
      vendorName: "GATEWAY FLEET CO",
      vehicleNo: "MH12CD5678",
      pickupLocation: "BHIWANDI",
      deliveryLocation: "CHENNAI",
      route: "BHIWANDI-CHENNAI",
      freight: 62000,
      advanceAmt: 20000,
      balanceAmt: 42000,
      pdcAmount: 62000,
      advancePayableBranch: "ALC1",
      location: "ALC1",
      status: "PREPARED" as const,
      dockets: [{ docketNo: "ALC12660616" }]
    },
    {
      tripSheetNo: "PSALC12600410",
      sheetKind: "PICKUP_PDC" as const,
      manualPdcNo: "ALC12660410",
      customerName: "S.P LOGISTICS",
      vendorCode: "V00006",
      vendorName: "S.P LOGISTICS",
      vehicleNo: "MH04AB1234",
      pickupLocation: "SURAT",
      deliveryLocation: "BHIWANDI",
      route: "SURAT-BHIWANDI",
      freight: 38000,
      advanceAmt: 10000,
      balanceAmt: 28000,
      pdcAmount: 38000,
      advancePayableBranch: "ALC1",
      location: "ALC1",
      status: "PREPARED" as const,
      dockets: [{ docketNo: "ALC12660621" }]
    },
    {
      tripSheetNo: "DSALC12600601",
      sheetKind: "DELIVERY_PDC" as const,
      manualPdcNo: "",
      customerName: "GATEWAY FLEET CO",
      vendorCode: "V00009",
      vendorName: "GATEWAY FLEET CO",
      vehicleNo: "TN09EF9012",
      pickupLocation: "BHIWANDI",
      deliveryLocation: "BENGALURU",
      route: "BHIWANDI-BENGALURU",
      freight: 51000,
      advanceAmt: 18000,
      balanceAmt: 33000,
      pdcAmount: 51000,
      advancePayableBranch: "ALC3",
      location: "ALC1",
      status: "IN_TRANSIT" as const,
      dockets: [{ docketNo: "ALC12660617" }]
    },
    {
      tripSheetNo: "DSALC12600615",
      sheetKind: "DELIVERY_PDC" as const,
      manualPdcNo: "ALC12660615",
      customerName: "METRO HAULAGE PARTNERS",
      vendorCode: "V00002",
      vendorName: "METRO HAULAGE PARTNERS",
      vehicleNo: "MH46BM1234",
      pickupLocation: "BHIWANDI",
      deliveryLocation: "NAGPUR",
      route: "BHIWANDI-NAGPUR",
      freight: 72000,
      advanceAmt: 25000,
      balanceAmt: 47000,
      pdcAmount: 72000,
      advancePayableBranch: "ALC1",
      location: "ALC1",
      status: "PREPARED" as const,
      dockets: [{ docketNo: "ALC12660615" }]
    },
    {
      tripSheetNo: "DSALC12600533",
      sheetKind: "DELIVERY_PDC" as const,
      manualPdcNo: "ALC12660576",
      customerName: "METRO HAULAGE PARTNERS",
      vendorCode: "V00002",
      vendorName: "METRO HAULAGE PARTNERS",
      vehicleNo: "MH46CU4138",
      pickupLocation: "BHIWANDI",
      deliveryLocation: "HYDERABAD",
      route: "BHIWANDI-HYDERABAD",
      freight: 40000,
      advanceAmt: 10000,
      balanceAmt: 30000,
      pdcAmount: 40000,
      advancePayableBranch: "ALC1",
      location: "ALC1",
      status: "PREPARED" as const,
      dockets: [{ docketNo: "ALC12660616" }]
    },
    {
      tripSheetNo: "THCALC12600110",
      sheetKind: "THC" as const,
      manualTripSheetNo: "",
      customerName: "COMPANY VEHICLE",
      vendorCode: "V00001",
      vendorName: "COMPANY VEHICLE",
      vehicleNo: "MH12AB4501",
      pickupLocation: "BHIWANDI",
      deliveryLocation: "HYDERABAD",
      route: "BHIWANDI-HYDERABAD",
      freight: 28000,
      advanceAmt: 0,
      balanceAmt: 28000,
      location: "ALC1",
      status: "IN_TRANSIT" as const,
      dockets: [{ docketNo: "ALC12660615" }]
    },
    {
      tripSheetNo: "THCALC12600111",
      sheetKind: "THC" as const,
      manualTripSheetNo: "THC-MAN-111",
      customerName: "METRO HAULAGE PARTNERS",
      vendorCode: "V00002",
      vendorName: "METRO HAULAGE PARTNERS",
      vehicleNo: "MH46CU4138",
      pickupLocation: "BHIWANDI",
      deliveryLocation: "CHENNAI",
      route: "BHIWANDI-CHENNAI",
      freight: 42000,
      advanceAmt: 5000,
      balanceAmt: 37000,
      location: "ALC1",
      status: "PREPARED" as const,
      dockets: [{ docketNo: "ALC12660616" }]
    }
  ];

  for (const seed of sheetSeeds) {
    await TripSheet.updateOne(
      { tripSheetNo: seed.tripSheetNo },
      {
        $setOnInsert: {
          ...seed,
          tripDate: new Date(),
          startKm: 0
        }
      },
      { upsert: true }
    );
  }
}

function mapCn(cn: any): ExceptionalDoc {
  const no = String(cn.docketNo || "").toUpperCase();
  return {
    id: String(cn._id),
    documentNo: no,
    docType: "CN",
    bookingDateLabel: toDmy(cn.bookingDate),
    deliveryDateLabel: toDmy(cn.expectedDeliveryDate),
    destination: branchLabel(cn.toLocation || cn.bookingBranch),
    currentLocation: String(cn.bookingBranch || cn.fromLocation || ""),
    nextLocation: String(cn.nextLocation || cn.bookingBranch || ""),
    mode: String(cn.mode || "Road"),
    pkgs: String(cn.packageDetails?.packagesCount ?? 1),
    actWt: String(cn.packageDetails?.actualWeight ?? 0),
    consignor: String(cn.consignor?.name || ""),
    consignee: String(cn.consignee?.name || ""),
    billingParty: String(cn.billingParty || ""),
    currentParty: String(cn.billingParty || ""),
    billToPartyCode: String(cn.billToPartyCode || ""),
    gstin: String(cn.customerGstNo || cn.consignor?.gstin || ""),
    fromLocation: String(cn.fromLocation || ""),
    toLocation: String(cn.toLocation || ""),
    serviceType: String(cn.serviceType || "FTL"),
    typeOfFtl: String(cn.serviceFtl || ""),
    route: String(cn.route || `${cn.fromLocation || ""}-${cn.toLocation || ""}`),
    currentRoute: String(cn.route || `${cn.fromLocation || ""}-${cn.toLocation || ""}`),
    poNo: String(cn.documentationDetails?.poNo || ""),
    billingBranch: String(cn.billedAt || cn.bookingBranch || ""),
    manualDocumentNo: String(cn.manualDocumentNo || ""),
    manualNo: String(cn.manualDocumentNo || ""),
    reassignDeliveryTo: extractBranchCode(String(cn.toLocation || cn.bookingBranch || "ALC1")),
    reassignNextTo: extractBranchCode(String(cn.nextLocation || cn.bookingBranch || "ALC1")),
    remark: String(cn.exceptionalRemark || cn.remark || "")
  };
}

function mapSheet(ts: any, forcedType?: string): ExceptionalDoc {
  const no = String(ts.tripSheetNo || "").toUpperCase();
  const kind =
    forcedType ||
    ts.sheetKind ||
    (isThcNo(no) ? "THC" : isPdcNo(no) ? "PDC" : "TRIP");
  const docType = kind === "THC" ? "THC" : kind === "TRIP" ? "TRIP" : "PDC";
  const vendor =
    ts.vendorCode && ts.vendorName
      ? `${ts.vendorCode}: ${ts.vendorName}`
      : String(ts.vendorName || ts.customerName || "");

  return {
    id: String(ts._id),
    documentNo: no,
    docType,
    dateLabel: toDmy(ts.tripDate),
    pdcDate: toDmy(ts.tripDate),
    thcDate: toDmy(ts.tripDate),
    fromLocation: String(ts.pickupLocation || ""),
    toLocation: String(ts.deliveryLocation || ""),
    vendorName: String(ts.vendorName || ts.customerName || ""),
    vendor,
    vendorCode: String(ts.vendorCode || ""),
    vehicleNo: String(ts.vehicleNo || ""),
    route: String(ts.route || `${ts.pickupLocation || ""}-${ts.deliveryLocation || ""}`),
    currentRoute: String(ts.route || `${ts.pickupLocation || ""}-${ts.deliveryLocation || ""}`),
    manualPdcNo: String(ts.manualPdcNo || ""),
    manualThcNo: String(ts.manualTripSheetNo || ""),
    manualNo: String(ts.manualPdcNo || ts.manualTripSheetNo || ""),
    manualDocumentNo: String(ts.manualPdcNo || ts.manualTripSheetNo || ""),
    pdcLocation: String(ts.location || ts.advancePayableBranch || ""),
    thcLocation: String(ts.location || ""),
    noOfCns: String(Array.isArray(ts.dockets) ? ts.dockets.length : 0),
    weight: String(ts.pdcAmount || ts.freight || 0),
    cancelled: ts.status === "CANCELLED" ? "Y" : "N",
    cancelReason: String(ts.cancelReason || ""),
    advancePayableBranch: String(ts.advancePayableBranch || ts.location || ""),
    pdcAmount: Number(ts.pdcAmount || ts.freight || 0),
    advanceAmount: Number(ts.advanceAmt || 0),
    balanceAmount: Number(ts.balanceAmt || 0),
    remark: String(ts.exceptionalRemark || ts.specialInstructions || "")
  };
}

async function findCn(documentNo: string) {
  const no = documentNo.toUpperCase();
  return (
    (await Consignment.findOne({ docketNo: no })) ||
    (await Consignment.findOne({ docketNo: { $regex: no, $options: "i" } }))
  );
}

async function findSheet(documentNo: string, prefer?: "PDC" | "THC") {
  const no = documentNo.toUpperCase();
  let q: Record<string, unknown> = {
    $or: [
      { tripSheetNo: no },
      { tripSheetNo: { $regex: no, $options: "i" } },
      { manualPdcNo: no },
      { manualTripSheetNo: no }
    ]
  };
  if (prefer === "PDC") {
    q = {
      $and: [
        q,
        {
          $or: [
            { sheetKind: { $in: ["DELIVERY_PDC", "PICKUP_PDC"] } },
            { tripSheetNo: { $regex: /^(DS|PS|DPDC|PPDC)/i } }
          ]
        }
      ]
    };
  } else if (prefer === "THC") {
    q = {
      $and: [
        q,
        {
          $or: [{ sheetKind: "THC" }, { tripSheetNo: { $regex: /^THC/i } }]
        }
      ]
    };
  }
  return TripSheet.findOne(q);
}

export async function listExceptionalSamples(slug: string, docType?: string) {
  await ensureExceptionalSeedData();

  if (
    slug === "reassign-next-location" ||
    slug === "edit-billing-party" ||
    slug === "edit-billing-party-branch-po"
  ) {
    const rows = await Consignment.find({})
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      documentNo: String(r.docketNo),
      docType: "CN"
    }));
  }

  if (slug === "change-route") {
    const rows = await TripSheet.find({
      $or: [{ sheetKind: "THC" }, { tripSheetNo: { $regex: /^THC/i } }]
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      documentNo: String(r.tripSheetNo),
      docType: "THC"
    }));
  }

  if (slug === "edit-from-to-location" || slug === "edit-manual-document-number") {
    const prefer = String(docType || "").toUpperCase();
    const filter =
      prefer === "THC"
        ? { $or: [{ sheetKind: "THC" }, { tripSheetNo: { $regex: /^THC/i } }] }
        : prefer === "PDC"
          ? {
              $or: [
                { sheetKind: { $in: ["DELIVERY_PDC", "PICKUP_PDC"] } },
                { tripSheetNo: { $regex: /^(DS|PS|DPDC|PPDC)/i } }
              ]
            }
          : {};
    const rows = await TripSheet.find(filter).sort({ updatedAt: -1 }).limit(20).lean();
    return rows.map((r) => ({
      id: String(r._id),
      documentNo: String(r.tripSheetNo),
      docType: isThcNo(String(r.tripSheetNo)) ? "THC" : "PDC"
    }));
  }

  if (slug === "cancel-delivery-pdc" || slug === "edit-pdc-vendor-date-vehicle") {
    const rows = await TripSheet.find({
      $or: [
        { sheetKind: { $in: ["DELIVERY_PDC", "PICKUP_PDC"] } },
        { tripSheetNo: { $regex: /^(DS|PS|DPDC|PPDC)/i } }
      ]
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      documentNo: String(r.tripSheetNo),
      docType: "PDC"
    }));
  }

  if (slug === "edit-thc-vendor-date-vehicle") {
    const rows = await TripSheet.find({
      $or: [{ sheetKind: "THC" }, { tripSheetNo: { $regex: /^THC/i } }]
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      documentNo: String(r.tripSheetNo),
      docType: "THC"
    }));
  }

  return [];
}

export async function getExceptionalDocument(
  slug: string,
  documentNo: string,
  docType?: string
): Promise<ExceptionalDoc | null> {
  await ensureExceptionalSeedData();
  const no = documentNo.trim().toUpperCase();
  if (!no) return null;

  switch (slug) {
    case "reassign-next-location":
    case "edit-billing-party":
    case "edit-billing-party-branch-po": {
      const cn = await findCn(no);
      return cn ? mapCn(cn) : null;
    }
    case "change-route": {
      // UI is THC-oriented; prefer TripSheet/THC, then CN.
      const sheet = await findSheet(no, isThcNo(no) ? "THC" : undefined);
      if (sheet) {
        const mapped = mapSheet(sheet, isThcNo(String(sheet.tripSheetNo)) ? "THC" : undefined);
        return {
          ...mapped,
          newRoute: String(mapped.route || mapped.currentRoute || "")
        };
      }
      const cn = await findCn(no);
      if (!cn) return null;
      const mapped = mapCn(cn);
      return { ...mapped, newRoute: String(mapped.route || mapped.currentRoute || "") };
    }
    case "edit-from-to-location":
    case "edit-manual-document-number": {
      const prefer =
        String(docType || "").toUpperCase() === "THC"
          ? "THC"
          : String(docType || "").toUpperCase() === "PDC"
            ? "PDC"
            : isThcNo(no)
              ? "THC"
              : isPdcNo(no)
                ? "PDC"
                : undefined;
      const sheet = await findSheet(no, prefer);
      if (sheet) return mapSheet(sheet, prefer);
      const cn = await findCn(no);
      return cn ? mapCn(cn) : null;
    }
    case "cancel-delivery-pdc":
    case "edit-pdc-vendor-date-vehicle": {
      const sheet = await findSheet(no, "PDC");
      return sheet ? mapSheet(sheet, "PDC") : null;
    }
    case "edit-thc-vendor-date-vehicle": {
      const sheet = await findSheet(no, "THC");
      return sheet ? mapSheet(sheet, "THC") : null;
    }
    default:
      return null;
  }
}

export async function saveExceptionalDocument(
  slug: string,
  documentNo: string,
  values: Record<string, string>
): Promise<{ data: ExceptionalDoc; message: string }> {
  await ensureExceptionalSeedData();
  const no = documentNo.trim().toUpperCase();
  const remark = String(values.remark || values.exceptionalRemark || "").trim();

  switch (slug) {
    case "edit-from-to-location": {
      const sheet = await findSheet(no, isThcNo(no) ? "THC" : "PDC");
      if (!sheet) throw Object.assign(new Error("Document not found"), { status: 404 });
      sheet.pickupLocation = String(values.fromLocation || sheet.pickupLocation || "").toUpperCase();
      sheet.deliveryLocation = String(values.toLocation || sheet.deliveryLocation || "").toUpperCase();
      sheet.route = `${sheet.pickupLocation}-${sheet.deliveryLocation}`;
      if (remark) sheet.exceptionalRemark = remark;
      await sheet.save();
      // Keep linked CNs in sync when possible
      const docketNos = (sheet.dockets || []).map((d) => d.docketNo).filter(Boolean);
      if (docketNos.length) {
        await Consignment.updateMany(
          { docketNo: { $in: docketNos } },
          {
            $set: {
              fromLocation: sheet.pickupLocation,
              toLocation: sheet.deliveryLocation,
              route: sheet.route
            }
          }
        );
      }
      return {
        data: mapSheet(sheet),
        message: `Locations updated for ${sheet.tripSheetNo}`
      };
    }

    case "reassign-next-location": {
      const cn = await findCn(no);
      if (!cn) throw Object.assign(new Error("Document not found"), { status: 404 });
      const deliveryTo = extractBranchCode(
        values.reassignDeliveryTo || values.destination || cn.toLocation || ""
      );
      const nextTo = extractBranchCode(
        values.reassignNextTo || values.nextLocation || cn.nextLocation || cn.bookingBranch || ""
      );
      if (deliveryTo) {
        cn.toLocation = deliveryTo;
        cn.billedAt = deliveryTo;
      }
      if (nextTo) cn.nextLocation = nextTo;
      if (remark) cn.exceptionalRemark = remark;
      await cn.save();
      return {
        data: mapCn(cn),
        message: `Location reassigned for ${cn.docketNo}`
      };
    }

    case "cancel-delivery-pdc": {
      const sheet = await findSheet(no, "PDC");
      if (!sheet) throw Object.assign(new Error("Document not found"), { status: 404 });
      if (sheet.status === "CANCELLED") {
        return {
          data: mapSheet(sheet, "PDC"),
          message: `Delivery PDC ${sheet.tripSheetNo} already cancelled`
        };
      }
      sheet.status = "CANCELLED";
      sheet.cancelReason = String(values.cancelReason || "Ops correction");
      if (remark) sheet.exceptionalRemark = remark;
      await sheet.save();
      return {
        data: mapSheet(sheet, "PDC"),
        message: `Delivery PDC ${sheet.tripSheetNo} cancelled`
      };
    }

    case "edit-thc-vendor-date-vehicle": {
      const sheet = await findSheet(no, "THC");
      if (!sheet) throw Object.assign(new Error("Document not found"), { status: 404 });
      const v = vendorParts(values.vendor || values.vendorName || "");
      if (v.code) sheet.vendorCode = v.code;
      if (v.name) {
        sheet.vendorName = v.name;
        sheet.customerName = v.name;
      }
      if (values.vehicleNo) sheet.vehicleNo = String(values.vehicleNo).toUpperCase();
      const dt = parseFlexibleDate(values.thcDate || values.pdcDate || "");
      if (dt) sheet.tripDate = dt;
      if (remark) sheet.exceptionalRemark = remark;
      sheet.sheetKind = "THC";
      await sheet.save();
      return {
        data: mapSheet(sheet, "THC"),
        message: `THC ${sheet.tripSheetNo} updated`
      };
    }

    case "edit-pdc-vendor-date-vehicle": {
      const sheet = await findSheet(no, "PDC");
      if (!sheet) throw Object.assign(new Error("Document not found"), { status: 404 });
      const v = vendorParts(values.vendor || values.vendorName || "");
      if (v.code) sheet.vendorCode = v.code;
      if (v.name) {
        sheet.vendorName = v.name;
        sheet.customerName = v.name;
      }
      if (values.vehicleNo) sheet.vehicleNo = String(values.vehicleNo).toUpperCase();
      const dt = parseFlexibleDate(values.pdcDate || values.thcDate || "");
      if (dt) sheet.tripDate = dt;
      if (remark) sheet.exceptionalRemark = remark;
      if (!sheet.sheetKind || sheet.sheetKind === "TRIP") sheet.sheetKind = "DELIVERY_PDC";
      await sheet.save();
      return {
        data: mapSheet(sheet, "PDC"),
        message: `PDC ${sheet.tripSheetNo} updated`
      };
    }

    case "change-route": {
      const newRoute = String(values.newRoute || values.route || "").toUpperCase();
      if (!newRoute) throw Object.assign(new Error("New route is required"), { status: 400 });
      const sheet = await findSheet(no, isThcNo(no) ? "THC" : undefined);
      if (sheet) {
        sheet.route = newRoute;
        const parts = newRoute.split("-");
        if (parts.length >= 2) {
          sheet.pickupLocation = parts[0];
          sheet.deliveryLocation = parts.slice(1).join("-");
        }
        if (remark) sheet.exceptionalRemark = remark;
        await sheet.save();
        const docketNos = (sheet.dockets || []).map((d) => d.docketNo).filter(Boolean);
        if (docketNos.length) {
          await Consignment.updateMany(
            { docketNo: { $in: docketNos } },
            {
              $set: {
                route: newRoute,
                ...(parts.length >= 2
                  ? { fromLocation: parts[0], toLocation: parts.slice(1).join("-") }
                  : {})
              }
            }
          );
        }
        const mapped = mapSheet(sheet, "THC");
        return {
          data: { ...mapped, newRoute },
          message: `Route updated for ${sheet.tripSheetNo}`
        };
      }
      const cn = await findCn(no);
      if (!cn) throw Object.assign(new Error("Document not found"), { status: 404 });
      cn.route = newRoute;
      const parts = newRoute.split("-");
      if (parts.length >= 2) {
        cn.fromLocation = parts[0];
        cn.toLocation = parts.slice(1).join("-");
      }
      if (remark) cn.exceptionalRemark = remark;
      await cn.save();
      const mapped = mapCn(cn);
      return {
        data: { ...mapped, newRoute },
        message: `Route updated for ${cn.docketNo}`
      };
    }

    case "edit-billing-party": {
      const cn = await findCn(no);
      if (!cn) throw Object.assign(new Error("Document not found"), { status: 404 });
      if (values.billingParty || values.newParty) {
        cn.billingParty = String(values.billingParty || values.newParty);
      }
      if (values.billToPartyCode) cn.billToPartyCode = String(values.billToPartyCode).toUpperCase();
      if (values.gstin) cn.customerGstNo = String(values.gstin).toUpperCase();
      if (values.fromLocation) cn.fromLocation = String(values.fromLocation).toUpperCase();
      if (values.toLocation) cn.toLocation = String(values.toLocation).toUpperCase();
      if (values.serviceType) cn.serviceType = String(values.serviceType);
      if (values.typeOfFtl) cn.serviceFtl = String(values.typeOfFtl);
      if (remark) cn.exceptionalRemark = remark;
      await cn.save();
      return { data: mapCn(cn), message: `Billing party updated for ${cn.docketNo}` };
    }

    case "edit-billing-party-branch-po": {
      const cn = await findCn(no);
      if (!cn) throw Object.assign(new Error("Document not found"), { status: 404 });
      if (values.billingParty) cn.billingParty = String(values.billingParty);
      if (values.billingBranch) {
        const br = extractBranchCode(values.billingBranch);
        cn.billedAt = br;
        cn.bookingBranch = br || cn.bookingBranch;
      }
      if (values.poNo !== undefined) {
        cn.documentationDetails = {
          ...(cn.documentationDetails || {}),
          poNo: String(values.poNo || "")
        };
      }
      if (remark) cn.exceptionalRemark = remark;
      await cn.save();
      return { data: mapCn(cn), message: `Billing party / branch / PO updated for ${cn.docketNo}` };
    }

    case "edit-manual-document-number": {
      const manual = String(values.manualDocumentNo || values.manualNo || "").trim().toUpperCase();
      if (!manual) throw Object.assign(new Error("Manual document number is required"), { status: 400 });
      const prefer =
        String(values.docType || "").toUpperCase() === "THC"
          ? "THC"
          : String(values.docType || "").toUpperCase() === "CN"
            ? undefined
            : isThcNo(no)
              ? "THC"
              : isPdcNo(no)
                ? "PDC"
                : undefined;
      if (prefer || isPdcNo(no) || isThcNo(no)) {
        const sheet = await findSheet(no, prefer === "THC" ? "THC" : prefer === "PDC" ? "PDC" : undefined);
        if (sheet) {
          if (prefer === "THC" || isThcNo(sheet.tripSheetNo)) sheet.manualTripSheetNo = manual;
          else sheet.manualPdcNo = manual;
          if (remark) sheet.exceptionalRemark = remark;
          await sheet.save();
          return {
            data: mapSheet(sheet),
            message: `Manual No saved for ${sheet.tripSheetNo}`
          };
        }
      }
      const cn = await findCn(no);
      if (!cn) throw Object.assign(new Error("Document not found"), { status: 404 });
      cn.manualDocumentNo = manual;
      if (remark) cn.exceptionalRemark = remark;
      await cn.save();
      return { data: mapCn(cn), message: `Manual No saved for ${cn.docketNo}` };
    }

    default:
      throw Object.assign(new Error("Unknown exceptional operation"), { status: 404 });
  }
}

export type AdvancePdcRow = {
  id: string;
  documentNo: string;
  manualPdcNo: string;
  vehicleNo: string;
  vendorCode: string;
  vendorName: string;
  pdcAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  pdcDate: string;
  advancePayableBranch: string;
};

export async function listAdvancePayablePdcs(filters: {
  dateMode: string;
  from?: string;
  to?: string;
  pdcNo?: string;
  vendorCode?: string;
}): Promise<AdvancePdcRow[]> {
  await ensureExceptionalSeedData();

  const clauses: Record<string, unknown>[] = [
    {
      $or: [
        { sheetKind: { $in: ["DELIVERY_PDC", "PICKUP_PDC"] } },
        { tripSheetNo: { $regex: /^(DS|PS|DPDC|PPDC)/i } }
      ]
    },
    { status: { $ne: "CANCELLED" } }
  ];

  if (filters.dateMode === "pdcNo") {
    const no = String(filters.pdcNo || "").trim().toUpperCase();
    if (!no) return [];
    clauses.push({
      $or: [
        { tripSheetNo: { $regex: no, $options: "i" } },
        { manualPdcNo: { $regex: no, $options: "i" } }
      ]
    });
  } else {
    const from = filters.from ? new Date(filters.from) : null;
    const to = filters.to ? new Date(filters.to) : null;
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) {
        from.setHours(0, 0, 0, 0);
        range.$gte = from;
      }
      if (to) {
        to.setHours(23, 59, 59, 999);
        range.$lte = to;
      }
      clauses.push({ tripDate: range });
    }
  }

  if (filters.vendorCode) {
    clauses.push({ vendorCode: String(filters.vendorCode).trim().toUpperCase() });
  }

  const rows = await TripSheet.find({ $and: clauses }).sort({ tripDate: -1 }).limit(200).lean();
  return rows.map((ts) => ({
    id: String(ts._id),
    documentNo: String(ts.tripSheetNo),
    manualPdcNo: String(ts.manualPdcNo || ""),
    vehicleNo: String(ts.vehicleNo || ""),
    vendorCode: String(ts.vendorCode || ""),
    vendorName: String(ts.vendorName || ts.customerName || ""),
    pdcAmount: Number(ts.pdcAmount || ts.freight || 0),
    advanceAmount: Number(ts.advanceAmt || 0),
    balanceAmount: Number(ts.balanceAmt || 0),
    pdcDate: toDmy(ts.tripDate),
    advancePayableBranch: String(ts.advancePayableBranch || ts.location || "ALC1")
  }));
}

export async function updateAdvancePayableBranch(
  documentNos: string[],
  newBranch: string
): Promise<AdvancePdcRow[]> {
  await ensureExceptionalSeedData();
  const branch = newBranch.trim().toUpperCase();
  const nos = documentNos.map((n) => n.trim().toUpperCase()).filter(Boolean);
  const updated: AdvancePdcRow[] = [];

  for (const no of nos) {
    const sheet = await findSheet(no, "PDC");
    if (!sheet) continue;
    sheet.advancePayableBranch = branch;
    await sheet.save();
    updated.push({
      id: String(sheet._id),
      documentNo: String(sheet.tripSheetNo),
      manualPdcNo: String(sheet.manualPdcNo || ""),
      vehicleNo: String(sheet.vehicleNo || ""),
      vendorCode: String(sheet.vendorCode || ""),
      vendorName: String(sheet.vendorName || sheet.customerName || ""),
      pdcAmount: Number(sheet.pdcAmount || sheet.freight || 0),
      advanceAmount: Number(sheet.advanceAmt || 0),
      balanceAmount: Number(sheet.balanceAmt || 0),
      pdcDate: toDmy(sheet.tripDate),
      advancePayableBranch: branch
    });
  }

  return updated;
}
