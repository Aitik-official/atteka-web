import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { TripSheet } from "@/models/TripSheet";
import { CompanyAdvancePayment } from "@/models/CompanyAdvancePayment";
import { ensureOpsTripSeeds } from "@/lib/operationsPdcEngine";

function toIso(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function toLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function paymentStatus(advance: number, balance: number, freight: number) {
  if (balance <= 0 && freight > 0) return "Closed";
  if (advance > 0) return "Part Paid";
  return "Open";
}

function pdcClause() {
  return {
    $or: [
      { sheetKind: { $in: ["DELIVERY_PDC", "PICKUP_PDC"] } },
      { tripSheetNo: { $regex: /^(DS|PS|DPDC|PPDC)/i } }
    ]
  };
}

function tripClause() {
  return {
    $or: [
      { sheetKind: { $in: ["TRIP", "THC"] } },
      { tripSheetNo: { $regex: /^(TS|THC)/i } }
    ]
  };
}

async function findSheetsByIdsOrNos(ids: string[]) {
  await connectToDatabase();
  const keys = ids.map((s) => String(s).trim()).filter(Boolean);
  if (!keys.length) return [];
  const objectIds = keys
    .filter((k) => mongoose.Types.ObjectId.isValid(k) && /^[a-f0-9]{24}$/i.test(k))
    .map((k) => new mongoose.Types.ObjectId(k));
  const or: Record<string, unknown>[] = [{ tripSheetNo: { $in: keys.map((k) => k.toUpperCase()) } }];
  if (objectIds.length) or.push({ _id: { $in: objectIds } });
  return TripSheet.find({ $or: or });
}

function mapPdcRow(ts: any, idx = 0) {
  const freight = Number(ts.pdcAmount || ts.freight || 0);
  const advance = Number(ts.advanceAmt || 0);
  const balance = Number(ts.balanceAmt ?? freight - advance);
  const pdcDate = toIso(ts.tripDate);
  return {
    id: String(ts._id),
    pdcNumber: String(ts.tripSheetNo || ""),
    pdcDate,
    pdcDateLabel: toLabel(pdcDate),
    pdcBranch: String(ts.advancePayableBranch || ts.location || "ALC1"),
    vendorCode: String(ts.vendorCode || ""),
    vendorName: String(ts.vendorName || ts.customerName || ""),
    vendorLabel: `${ts.vendorCode || ""} - ${ts.vendorName || ts.customerName || ""}`.replace(/^ - /, ""),
    vehicleNo: String(ts.vehicleNo || ""),
    totalHire: freight,
    advanceAmount: advance,
    balanceAmount: balance,
    balanceAmt: balance,
    status: paymentStatus(advance, balance, freight) as "Open" | "Part Paid" | "Closed" | "Ready for Balance",
    srNo: idx + 1,
    manualPdcNo: String(ts.manualPdcNo || ""),
    tripSheetNo: String(ts.tripSheetNo || ""),
    pdcAmount: freight,
    advanceAmt: advance,
    dcName: `${ts.location || "ALC1"} Delivery Center`,
    advanceVendorbillNo: String(ts.vendorBillNo || ""),
    vendorBillFinalized: Boolean(ts.vendorBillFinalized)
  };
}

function mapTripRow(ts: any, idx = 0) {
  const freight = Number(ts.freight || ts.pdcAmount || 0);
  const advance = Number(ts.advanceAmt || 0);
  const balance = Number(ts.balanceAmt ?? freight - advance);
  const pdcDate = toIso(ts.tripDate);
  const eligibleAdvance = Math.max(0, Math.round(freight * 0.3) - advance);
  return {
    id: String(ts._id),
    vehicleNo: String(ts.vehicleNo || ""),
    pdcNumber: String(ts.tripSheetNo || ""),
    manualPdcNo: String(ts.manualPdcNo || ts.manualTripSheetNo || ""),
    pdcDate,
    pdcDateLabel: toLabel(pdcDate),
    pdcBranch: String(ts.location || "ALC1"),
    vehType: String(ts.vehicleType || "FTL"),
    fromLocation: String(ts.pickupLocation || ""),
    toLocation: String(ts.deliveryLocation || ""),
    distance: Number(ts.startKm || 0),
    vendorType: String(ts.vendorCode || "").includes("00001") ? "Attached" : "Market",
    vendorCode: String(ts.vendorCode || ""),
    vendorName: String(ts.vendorName || ts.customerName || ""),
    vendorLabel: `${ts.vendorCode || ""} - ${ts.vendorName || ts.customerName || ""}`.replace(/^ - /, ""),
    tripSheetNo: String(ts.tripSheetNo || ""),
    advancePaid: advance,
    advanceEligible: Math.max(eligibleAdvance, balance > 0 ? Math.min(balance, Math.round(freight * 0.3)) : 0),
    balanceEligible: Math.max(0, balance),
    srNo: idx + 1
  };
}

export async function listPdcPaymentRows(filters: {
  from?: string;
  to?: string;
  pdcNo?: string;
  vendor?: string;
  forBalance?: boolean;
}) {
  await ensureOpsTripSeeds();
  const clauses: Record<string, unknown>[] = [pdcClause(), { status: { $ne: "CANCELLED" } }];

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

  if (filters.vendor) {
    const v = filters.vendor.toLowerCase();
    clauses.push({
      $or: [
        { vendorCode: { $regex: v, $options: "i" } },
        { vendorName: { $regex: v, $options: "i" } },
        { customerName: { $regex: v, $options: "i" } }
      ]
    });
  }

  let rows = await TripSheet.find({ $and: clauses }).sort({ tripDate: -1 }).limit(300);
  let mapped = rows.map((r, i) => mapPdcRow(r, i));

  if (filters.forBalance) {
    mapped = mapped
      .filter((r) => r.balanceAmount > 0 && r.advanceAmount > 0)
      .map((r) => ({ ...r, status: "Ready for Balance" as const }));
  }

  return mapped.map((r, i) => ({ ...r, srNo: i + 1 }));
}

export async function listTripPaymentRows(filters: {
  from?: string;
  to?: string;
  vendor?: string;
  tripSheetNo?: string;
  vehicle?: string;
  vendorType?: string;
  forBalance?: boolean;
}) {
  await ensureOpsTripSeeds();
  const clauses: Record<string, unknown>[] = [tripClause(), { status: { $ne: "CANCELLED" } }];

  if (filters.tripSheetNo) {
    clauses.push({ tripSheetNo: { $regex: filters.tripSheetNo, $options: "i" } });
  } else if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.$gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) range.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    clauses.push({ tripDate: range });
  }
  if (filters.vendor) {
    const v = filters.vendor.toLowerCase();
    clauses.push({
      $or: [
        { vendorCode: { $regex: v, $options: "i" } },
        { vendorName: { $regex: v, $options: "i" } },
        { customerName: { $regex: v, $options: "i" } }
      ]
    });
  }
  if (filters.vehicle) {
    clauses.push({ vehicleNo: { $regex: filters.vehicle, $options: "i" } });
  }

  let rows = await TripSheet.find({ $and: clauses }).sort({ tripDate: -1 }).limit(300);
  let mapped = rows.map((r, i) => mapTripRow(r, i));
  if (filters.vendorType && filters.vendorType !== "--Select--") {
    mapped = mapped.filter((r) => r.vendorType.toLowerCase() === filters.vendorType!.toLowerCase());
  }
  if (filters.forBalance) {
    mapped = mapped.filter((r) => r.balanceEligible > 0);
  } else {
    mapped = mapped.filter((r) => r.advanceEligible > 0 || r.balanceEligible > 0);
  }
  return mapped.map((r, i) => ({ ...r, srNo: i + 1 }));
}

export async function listVendorBillRows(filters: {
  from?: string;
  to?: string;
  vendor?: string;
  tripSheetNo?: string;
  advanceVendorbillNo?: string;
}) {
  await ensureOpsTripSeeds();
  const clauses: Record<string, unknown>[] = [
    {
      $or: [
        { sheetKind: { $in: ["DELIVERY_PDC", "PICKUP_PDC", "TRIP", "THC"] } },
        { tripSheetNo: { $regex: /^(DS|PS|DPDC|PPDC|TS|THC)/i } }
      ]
    },
    { status: { $ne: "CANCELLED" } },
    { vendorBillFinalized: { $ne: true } }
  ];

  if (filters.tripSheetNo || filters.advanceVendorbillNo) {
    const or: Record<string, unknown>[] = [];
    if (filters.tripSheetNo) {
      or.push({ tripSheetNo: { $regex: filters.tripSheetNo, $options: "i" } });
    }
    if (filters.advanceVendorbillNo) {
      or.push({ vendorBillNo: { $regex: filters.advanceVendorbillNo, $options: "i" } });
    }
    clauses.push({ $or: or });
  } else if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.$gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) range.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    clauses.push({ tripDate: range });
  }
  if (filters.vendor) {
    const v = filters.vendor.toLowerCase();
    clauses.push({
      $or: [
        { vendorCode: { $regex: v, $options: "i" } },
        { vendorName: { $regex: v, $options: "i" } },
        { customerName: { $regex: v, $options: "i" } }
      ]
    });
  }

  const rows = await TripSheet.find({ $and: clauses }).sort({ tripDate: -1 }).limit(300);
  return rows.map((r, i) => mapPdcRow(r, i));
}

async function recordPayment(ts: any, amount: number, kind: "ADVANCE" | "BALANCE") {
  const docNo = `${kind === "ADVANCE" ? "ADV" : "BAL"}/${ts.tripSheetNo}/${Date.now().toString().slice(-6)}`;
  await CompanyAdvancePayment.create({
    documentNo: docNo,
    documentDate: new Date(),
    tripsheetNo: ts.tripSheetNo,
    vehicleNo: ts.vehicleNo || "TBD",
    driverName: ts.driverName || "",
    branch: ts.advancePayableBranch || ts.location || "ALC1",
    payMode: "CASH",
    amount,
    remark: `${kind} payment for ${ts.tripSheetNo}`,
    status: "PAID",
    preparedBy: "SYSTEM"
  });
  return docNo;
}

export async function payPdcAdvance(ids: string[], amountPer?: number) {
  const sheets = await findSheetsByIdsOrNos(ids);
  if (!sheets.length) throw Object.assign(new Error("No matching PDC found"), { status: 404 });

  const paid: string[] = [];
  let total = 0;
  for (const sheet of sheets) {
    const freight = Number(sheet.pdcAmount || sheet.freight || 0);
    const currentAdv = Number(sheet.advanceAmt || 0);
    const balance = Number(sheet.balanceAmt ?? freight - currentAdv);
    if (balance <= 0) continue;
    const pay = Math.min(
      balance,
      amountPer && amountPer > 0 ? amountPer : Math.max(1, Math.round(freight * 0.3))
    );
    sheet.advanceAmt = currentAdv + pay;
    sheet.balanceAmt = Math.max(0, freight - sheet.advanceAmt);
    if (!sheet.pdcAmount) sheet.pdcAmount = freight;
    await sheet.save();
    await recordPayment(sheet, pay, "ADVANCE");
    paid.push(sheet.tripSheetNo);
    total += pay;
  }

  const batchRef = `MPADV-${Date.now().toString().slice(-8)}`;
  return {
    count: paid.length,
    totalAdvance: Number(total.toFixed(2)),
    totalBalance: Number(total.toFixed(2)),
    batchRef,
    pdcNumbers: paid,
    message: `${paid.length} PDC advance payment(s) posted`
  };
}

export async function payPdcBalance(ids: string[]) {
  const sheets = await findSheetsByIdsOrNos(ids);
  if (!sheets.length) throw Object.assign(new Error("No matching PDC found"), { status: 404 });

  const paid: string[] = [];
  let total = 0;
  for (const sheet of sheets) {
    const freight = Number(sheet.pdcAmount || sheet.freight || 0);
    const balance = Number(sheet.balanceAmt ?? freight - Number(sheet.advanceAmt || 0));
    if (balance <= 0) continue;
    sheet.advanceAmt = Number(sheet.advanceAmt || 0) + balance;
    sheet.balanceAmt = 0;
    if (sheet.status !== "CANCELLED") sheet.status = "COMPLETED";
    await sheet.save();
    await recordPayment(sheet, balance, "BALANCE");
    paid.push(sheet.tripSheetNo);
    total += balance;
  }

  return {
    count: paid.length,
    totalBalance: Number(total.toFixed(2)),
    batchRef: `MPBAL-${Date.now().toString().slice(-8)}`,
    pdcNumbers: paid,
    message: `${paid.length} PDC balance payment(s) posted`
  };
}

export async function payTripSheetAdvance(ids: string[]) {
  const sheets = await findSheetsByIdsOrNos(ids);
  if (!sheets.length) throw Object.assign(new Error("No matching TripSheet found"), { status: 404 });

  const paid: string[] = [];
  let total = 0;
  for (const sheet of sheets) {
    const freight = Number(sheet.freight || sheet.pdcAmount || 0);
    const currentAdv = Number(sheet.advanceAmt || 0);
    const balance = Number(sheet.balanceAmt ?? freight - currentAdv);
    const eligible = Math.min(balance, Math.max(0, Math.round(freight * 0.3) - currentAdv));
    const pay = eligible > 0 ? eligible : Math.min(balance, Math.round(freight * 0.3));
    if (pay <= 0) continue;
    sheet.advanceAmt = currentAdv + pay;
    sheet.balanceAmt = Math.max(0, freight - sheet.advanceAmt);
    await sheet.save();
    await recordPayment(sheet, pay, "ADVANCE");
    paid.push(sheet.tripSheetNo);
    total += pay;
  }

  return {
    count: paid.length,
    totalAdvance: Number(total.toFixed(2)),
    batchRef: `TSADV-${Date.now().toString().slice(-8)}`,
    tripSheetNos: paid,
    message: `${paid.length} TripSheet advance payment(s) posted`
  };
}

export async function payTripSheetBalance(ids: string[]) {
  const sheets = await findSheetsByIdsOrNos(ids);
  if (!sheets.length) throw Object.assign(new Error("No matching TripSheet found"), { status: 404 });

  const paid: string[] = [];
  let total = 0;
  for (const sheet of sheets) {
    const freight = Number(sheet.freight || sheet.pdcAmount || 0);
    const balance = Number(sheet.balanceAmt ?? freight - Number(sheet.advanceAmt || 0));
    if (balance <= 0) continue;
    sheet.advanceAmt = Number(sheet.advanceAmt || 0) + balance;
    sheet.balanceAmt = 0;
    if (sheet.status !== "CANCELLED") sheet.status = "COMPLETED";
    await sheet.save();
    await recordPayment(sheet, balance, "BALANCE");
    paid.push(sheet.tripSheetNo);
    total += balance;
  }

  return {
    count: paid.length,
    totalBalance: Number(total.toFixed(2)),
    batchRef: `TSBAL-${Date.now().toString().slice(-8)}`,
    tripSheetNos: paid,
    message: `${paid.length} TripSheet balance payment(s) posted`
  };
}

export async function finalizeVendorBills(ids: string[]) {
  const sheets = await findSheetsByIdsOrNos(ids);
  if (!sheets.length) throw Object.assign(new Error("No matching vendor bill rows found"), { status: 404 });

  const batchRef = `VBF-${Date.now().toString().slice(-8)}`;
  const finalized: string[] = [];
  let totalBalance = 0;

  for (const sheet of sheets) {
    const freight = Number(sheet.pdcAmount || sheet.freight || 0);
    const balance = Number(sheet.balanceAmt ?? freight - Number(sheet.advanceAmt || 0));
    totalBalance += balance;
    sheet.vendorBillFinalized = true;
    sheet.vendorBillNo = `AVB/${sheet.location || "ALC1"}/${batchRef.slice(-5)}`;
    if (balance > 0) {
      // Finalization settles outstanding hire for vendor bill books.
      sheet.advanceAmt = Number(sheet.advanceAmt || 0) + balance;
      sheet.balanceAmt = 0;
      await recordPayment(sheet, balance, "BALANCE");
    }
    if (sheet.status !== "CANCELLED") sheet.status = "COMPLETED";
    await sheet.save();
    finalized.push(sheet.tripSheetNo);
  }

  return {
    count: finalized.length,
    totalBalance: Number(totalBalance.toFixed(2)),
    batchRef,
    pdcNumbers: finalized,
    message: `${finalized.length} vendor bill(s) finalized`
  };
}

export async function listVendorOptions() {
  await ensureOpsTripSeeds();
  const rows = await TripSheet.aggregate([
    {
      $match: {
        vendorCode: { $exists: true, $ne: "" }
      }
    },
    {
      $group: {
        _id: "$vendorCode",
        name: { $first: "$vendorName" }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 100 }
  ]);
  return rows.map((r) => ({
    code: String(r._id || ""),
    name: String(r.name || r._id || ""),
    label: `${r._id}: ${r.name || r._id}`
  }));
}
