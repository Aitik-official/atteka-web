import { connectToDatabase } from "@/lib/mongodb";
import { TripSheet } from "@/models/TripSheet";
import { TripSettlement } from "@/models/TripSettlement";
import { CompanyAdvancePayment } from "@/models/CompanyAdvancePayment";
import { memoryStore } from "@/lib/memoryStore";

function toIso(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function fmtDate(d?: Date | string | null) {
  const iso = toIso(d);
  if (!iso) return "";
  const dt = new Date(iso);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function parseVoucherType(remark?: string) {
  const r = String(remark || "").trim();
  if (!r) return "Advance";
  if (/fuel\s*advance/i.test(r)) return "Fuel Advance";
  if (/diesel/i.test(r)) return "Diesel";
  if (/toll/i.test(r)) return "Toll";
  if (/parking/i.test(r)) return "Parking";
  if (/advance/i.test(r)) return "Advance";
  if (/balance/i.test(r)) return "Balance";
  const head = r.split("|")[0]?.trim() || "Advance";
  return head.slice(0, 40) || "Advance";
}

/** Company-vehicle trip advances only — skip vendor BAL / balance bookings */
function isTripAdvanceRow(a: any) {
  const doc = String(a.documentNo || "").toUpperCase();
  const remark = String(a.remark || "");
  const payMode = String(a.payMode || "").toUpperCase();
  if (/^BAL\//.test(doc) || /balance payment/i.test(remark)) return false;
  if (/^ADV\//.test(doc) && /balance/i.test(remark)) return false;
  // Prefer fleet company-advance style vouchers / cash-fuel-bank modes
  if (/^(DV|VCH|ADV-)/.test(doc)) return true;
  if (["CASH", "BANK", "CHEQUE", "FUEL", "NEFT", "RTGS"].includes(payMode)) return true;
  if (/diesel|toll|parking|fuel|advance|bpcl|cash|bank/i.test(remark)) return true;
  // Keep generic tripsheet-linked advances that aren't vendor balance
  return Boolean(String(a.tripsheetNo || "").trim());
}

export type SettlementAdvanceLine = {
  voucherNumber: string;
  voucherDate: string;
  voucherDateIso: string;
  voucherType: string;
  qty: number;
  rate: number;
  fuelType: string;
  openingKm: number;
  closingKm: number;
  totalKm: number;
  amount: number;
};

export type PendingTripRow = {
  documentNo: string;
  tripsheetNo: string;
  manualThcNo: string;
  vehicleNo: string;
  driverName: string;
  branch: string;
  documentDate: string;
  documentDateIso: string;
  fromLocation: string;
  toLocation: string;
  route: string;
  grossFreight: number;
  advancePaid: number;
  netPayable: number;
  status: string;
  startKm: number;
  endKm: number;
};

export type SettlementDetail = PendingTripRow & {
  advances: SettlementAdvanceLine[];
  tripClosedDate: string;
  tripSettlementDate: string;
};

function routeOf(ts: any) {
  const route = String(ts.route || "").trim();
  if (route) return route;
  const from = String(ts.pickupLocation || "").trim();
  const to = String(ts.deliveryLocation || "").trim();
  if (from || to) return `${from || "—"} → ${to || "—"}`;
  return "";
}

function mapTripBase(ts: any, advancePaid: number): PendingTripRow {
  const tripsheetNo = String(ts.tripSheetNo || ts.tripsheetNo || "").toUpperCase();
  const freight = Number(ts.freight || ts.grossFreight || 0) || 0;
  const adv = advancePaid || Number(ts.advanceAmt || 0) || 0;
  return {
    documentNo: tripsheetNo,
    tripsheetNo,
    manualThcNo: String(ts.manualTripSheetNo || ts.manualPdcNo || "").toUpperCase(),
    vehicleNo: String(ts.vehicleNo || "").toUpperCase(),
    driverName: String(ts.driverName || ""),
    branch: String(ts.location || ts.branch || "ALC1").toUpperCase(),
    documentDate: fmtDate(ts.tripDate || ts.documentDate),
    documentDateIso: toIso(ts.tripDate || ts.documentDate),
    fromLocation: String(ts.pickupLocation || "").toUpperCase() || "—",
    toLocation: String(ts.deliveryLocation || "").toUpperCase() || "—",
    route: routeOf(ts),
    grossFreight: freight,
    advancePaid: adv,
    netPayable: Number((freight - adv).toFixed(2)),
    status: String(ts.status || "PREPARED").toUpperCase(),
    startKm: Number(ts.startKm || 0) || 0,
    endKm: Number(ts.endKm || 0) || 0
  };
}

function mapAdvanceLine(a: any): SettlementAdvanceLine {
  const amt = Number(a.amount || 0) || 0;
  const open = Number(a.openKm ?? a.openingKm ?? 0) || 0;
  const close = Number(a.closingKm ?? open) || 0;
  return {
    voucherNumber: String(a.documentNo || "").toUpperCase(),
    voucherDate: fmtDate(a.documentDate),
    voucherDateIso: toIso(a.documentDate),
    voucherType: String(a.voucherType || parseVoucherType(a.remark)),
    qty: Number(a.qty || 0) || 0,
    rate: Number(a.rate || 0) || 0,
    fuelType: String(a.fuelType || "Petrol"),
    openingKm: open,
    closingKm: close,
    totalKm: Math.max(0, close - open),
    amount: amt
  };
}

async function settledTripsheetNos(): Promise<Set<string>> {
  const set = new Set<string>();
  try {
    await connectToDatabase();
    const rows = await TripSettlement.find({ status: "SETTLED" }).select("tripsheetNo documentNo").lean();
    for (const r of rows as any[]) {
      const a = String(r.tripsheetNo || "").toUpperCase();
      const b = String(r.documentNo || "").toUpperCase();
      if (a) set.add(a);
      if (b) set.add(b);
    }
  } catch {
    for (const r of memoryStore.tripSettlements || []) {
      if (String(r.status || "").toUpperCase() !== "SETTLED") continue;
      const a = String(r.tripsheetNo || "").toUpperCase();
      const b = String(r.documentNo || "").toUpperCase();
      if (a) set.add(a);
      if (b) set.add(b);
    }
  }
  return set;
}

async function loadAdvancesForTrip(tripsheetNo: string): Promise<SettlementAdvanceLine[]> {
  const no = tripsheetNo.toUpperCase();
  try {
    await connectToDatabase();
    const rows = await CompanyAdvancePayment.find({
      status: { $ne: "CANCELLED" },
      $or: [{ tripsheetNo: no }, { documentNo: { $regex: no, $options: "i" } }]
    })
      .sort({ documentDate: 1 })
      .lean();
    return (rows as any[])
      .filter(
        (r) =>
          (String(r.tripsheetNo || "").toUpperCase() === no ||
            String(r.documentNo || "").toUpperCase().includes(no)) &&
          isTripAdvanceRow(r)
      )
      .map(mapAdvanceLine);
  } catch {
    return (memoryStore.companyAdvances || [])
      .filter(
        (r) =>
          String(r.status || "").toUpperCase() !== "CANCELLED" &&
          (String(r.tripsheetNo || "").toUpperCase() === no ||
            String(r.documentNo || "").toUpperCase().includes(no)) &&
          isTripAdvanceRow(r)
      )
      .map(mapAdvanceLine);
  }
}

export async function listPendingTripsForSettlement(opts: {
  documentNo?: string;
  vehicleNo?: string;
  from?: string;
  to?: string;
}) {
  const settled = await settledTripsheetNos();
  const doc = String(opts.documentNo || "").trim().toUpperCase();
  const vehicle = String(opts.vehicleNo || "").trim().toUpperCase();
  const from = opts.from ? new Date(opts.from) : null;
  const to = opts.to ? new Date(opts.to) : null;
  if (to) to.setHours(23, 59, 59, 999);

  let sheets: any[] = [];
  try {
    await connectToDatabase();
    const q: any = { status: { $nin: ["CANCELLED"] } };
    if (doc) {
      q.$or = [
        { tripSheetNo: { $regex: doc, $options: "i" } },
        { manualTripSheetNo: { $regex: doc, $options: "i" } },
        { manualPdcNo: { $regex: doc, $options: "i" } }
      ];
    }
    if (vehicle && vehicle !== "SHOW ALL") q.vehicleNo = vehicle;
    if (from || to) {
      q.tripDate = {};
      if (from) q.tripDate.$gte = from;
      if (to) q.tripDate.$lte = to;
    }
    sheets = await TripSheet.find(q).sort({ tripDate: -1 }).limit(200).lean();
  } catch {
    sheets = (Array.isArray(memoryStore.tripSheets) ? memoryStore.tripSheets : []).filter((ts: any) => {
      if (String(ts.status || "").toUpperCase() === "CANCELLED") return false;
      const no = String(ts.tripSheetNo || "").toUpperCase();
      if (doc && !no.includes(doc) && !String(ts.manualTripSheetNo || "").toUpperCase().includes(doc)) {
        return false;
      }
      if (vehicle && vehicle !== "SHOW ALL" && String(ts.vehicleNo || "").toUpperCase() !== vehicle) {
        return false;
      }
      const d = new Date(ts.tripDate || Date.now());
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }

  const pending = sheets.filter((ts) => !settled.has(String(ts.tripSheetNo || "").toUpperCase()));
  const nos = pending.map((ts) => String(ts.tripSheetNo || "").toUpperCase()).filter(Boolean);

  // Batch-load advances for listed trips (avoid N+1)
  const advByTrip = new Map<string, number>();
  try {
    await connectToDatabase();
    const advRows = await CompanyAdvancePayment.find({
      status: { $ne: "CANCELLED" },
      tripsheetNo: { $in: nos }
    })
      .select("tripsheetNo documentNo amount remark payMode")
      .lean();
    for (const a of advRows as any[]) {
      if (!isTripAdvanceRow(a)) continue;
      const key = String(a.tripsheetNo || "").toUpperCase();
      if (!key) continue;
      advByTrip.set(key, (advByTrip.get(key) || 0) + (Number(a.amount) || 0));
    }
  } catch {
    for (const a of memoryStore.companyAdvances || []) {
      if (String(a.status || "").toUpperCase() === "CANCELLED") continue;
      if (!isTripAdvanceRow(a)) continue;
      const key = String(a.tripsheetNo || "").toUpperCase();
      if (!nos.includes(key)) continue;
      advByTrip.set(key, (advByTrip.get(key) || 0) + (Number(a.amount) || 0));
    }
  }

  return pending.map((ts) => {
    const no = String(ts.tripSheetNo || "").toUpperCase();
    const advSum = advByTrip.get(no) || 0;
    return mapTripBase(ts, advSum || Number(ts.advanceAmt || 0) || 0);
  });
}

export async function getSettlementDetail(tripsheetNo: string): Promise<SettlementDetail | null> {
  const no = String(tripsheetNo || "").trim().toUpperCase();
  if (!no) return null;

  let ts: any = null;
  try {
    await connectToDatabase();
    ts = await TripSheet.findOne({
      $or: [
        { tripSheetNo: no },
        { manualTripSheetNo: no },
        { manualPdcNo: no }
      ]
    }).lean();
  } catch {
    ts = (Array.isArray(memoryStore.tripSheets) ? memoryStore.tripSheets : []).find(
      (t: any) =>
        String(t.tripSheetNo || "").toUpperCase() === no ||
        String(t.manualTripSheetNo || "").toUpperCase() === no
    );
  }
  if (!ts) return null;

  const advances = await loadAdvancesForTrip(String(ts.tripSheetNo || no).toUpperCase());
  const advSum = advances.reduce((s, l) => s + Number(l.amount || 0), 0);
  const base = mapTripBase(ts, advSum || Number(ts.advanceAmt || 0) || 0);
  const today = toIso(new Date());
  return {
    ...base,
    advances,
    tripClosedDate: today,
    tripSettlementDate: today
  };
}

export function computeSettlementTotals(input: {
  dieselExpense?: number;
  tollExpense?: number;
  foodingExpense?: number;
  borderNakaCharges?: number;
  loadingExpense?: number;
  unloadingExpense?: number;
  rtoCharges?: number;
  parkingExpense?: number;
  repairMaintenance?: number;
  driverIncentive?: number;
  otherExpense?: number;
  lateDelivery?: number;
  penalty?: number;
  openingBalance?: number;
  tripAdvance?: number;
  cashReceivedPaid?: number;
}) {
  const expenses =
    Number(input.dieselExpense || 0) +
    Number(input.tollExpense || 0) +
    Number(input.foodingExpense || 0) +
    Number(input.borderNakaCharges || 0) +
    Number(input.loadingExpense || 0) +
    Number(input.unloadingExpense || 0) +
    Number(input.rtoCharges || 0) +
    Number(input.parkingExpense || 0) +
    Number(input.repairMaintenance || 0) +
    Number(input.driverIncentive || 0) +
    Number(input.otherExpense || 0);
  const deductions = Number(input.lateDelivery || 0) + Number(input.penalty || 0);
  const totalAmount = Number((expenses - deductions).toFixed(2));
  const tripAdvance = Number(input.tripAdvance || 0);
  const openingBalance = Number(input.openingBalance || 0);
  const tripExpense = Number((totalAmount - tripAdvance).toFixed(2));
  const netPayableReceivable = Number((openingBalance + totalAmount - tripAdvance).toFixed(2));
  const cashReceivedPaid = Number(input.cashReceivedPaid || 0);
  const balanceAmount = Number((netPayableReceivable - cashReceivedPaid).toFixed(2));
  return {
    tripExpense,
    totalAmount,
    tripAdvance,
    netPayableReceivable,
    balanceAmount,
    cashReceivedPaid,
    openingBalance
  };
}

export async function finalizeTripSettlement(body: any) {
  const tripsheetNo = String(body.tripsheetNo || body.documentNo || "").trim().toUpperCase();
  const vehicleNo = String(body.vehicleNo || "").trim().toUpperCase();
  if (!tripsheetNo) throw Object.assign(new Error("Tripsheet / Document No is required"), { status: 400 });
  if (!vehicleNo) throw Object.assign(new Error("Vehicle No is required"), { status: 400 });

  const advances = Array.isArray(body.advances) ? body.advances : [];
  const tripAdvance =
    body.tripAdvance !== undefined
      ? Number(body.tripAdvance)
      : advances.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);

  const totals = computeSettlementTotals({
    dieselExpense: body.dieselExpense,
    tollExpense: body.tollExpense,
    foodingExpense: body.foodingExpense,
    borderNakaCharges: body.borderNakaCharges,
    loadingExpense: body.loadingExpense,
    unloadingExpense: body.unloadingExpense ?? body.unloadingLabor,
    rtoCharges: body.rtoCharges,
    parkingExpense: body.parkingExpense,
    repairMaintenance: body.repairMaintenance,
    driverIncentive: body.driverIncentive,
    otherExpense: body.otherExpense,
    lateDelivery: body.lateDelivery,
    penalty: body.penalty,
    openingBalance: body.openingBalance,
    tripAdvance,
    cashReceivedPaid: body.cashReceivedPaid
  });

  const documentNo =
    String(body.documentNo || "").trim().toUpperCase() || `TSL-${tripsheetNo}`;

  const record: any = {
    documentNo,
    tripsheetNo,
    documentDate: body.documentDate ? new Date(body.documentDate) : new Date(),
    vehicleNo,
    driverName: String(body.driverName || "").trim(),
    branch: String(body.branch || "ALC1").trim(),
    route: String(body.route || "").trim(),
    fromLocation: String(body.fromLocation || "").trim(),
    toLocation: String(body.toLocation || "").trim(),
    manualThcNo: String(body.manualThcNo || "").trim().toUpperCase(),
    tripClosedDate: body.tripClosedDate ? new Date(body.tripClosedDate) : new Date(),
    tripSettlementDate: body.tripSettlementDate ? new Date(body.tripSettlementDate) : new Date(),
    grossFreight: Number(body.grossFreight) || 0,
    advancePaid: tripAdvance,
    dieselExpense: Number(body.dieselExpense) || 0,
    tollExpense: Number(body.tollExpense) || 0,
    foodingExpense: Number(body.foodingExpense) || 0,
    borderNakaCharges: Number(body.borderNakaCharges) || 0,
    loadingExpense: Number(body.loadingExpense) || 0,
    unloadingLabor: Number(body.unloadingExpense ?? body.unloadingLabor) || 0,
    rtoCharges: Number(body.rtoCharges) || 0,
    parkingExpense: Number(body.parkingExpense) || 0,
    repairMaintenance: Number(body.repairMaintenance) || 0,
    driverIncentive: Number(body.driverIncentive) || 0,
    otherExpense: Number(body.otherExpense) || 0,
    lateDelivery: Number(body.lateDelivery) || 0,
    penalty: Number(body.penalty) || 0,
    openingBalance: totals.openingBalance,
    tripExpense: totals.tripExpense,
    totalAmount: totals.totalAmount,
    cashReceivedPaid: totals.cashReceivedPaid,
    balanceAmount: totals.balanceAmount,
    netPayable: totals.netPayableReceivable,
    advances,
    remark: String(body.remark || "").trim(),
    status: "SETTLED",
    preparedBy: String(body.preparedBy || "AL002").trim()
  };

  let saved: any;
  try {
    await connectToDatabase();
    saved = await TripSettlement.findOneAndUpdate(
      { documentNo },
      { $set: record },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await TripSheet.updateOne(
      { tripSheetNo: tripsheetNo },
      {
        $set: {
          status: "COMPLETED",
          endKm: Number(body.endKm || 0) || undefined,
          advanceAmt: tripAdvance,
          balanceAmt: totals.balanceAmount
        }
      }
    );

    // Persist km edits on advance vouchers when provided
    for (const line of advances) {
      const vNo = String(line.voucherNumber || "").trim().toUpperCase();
      if (!vNo) continue;
      await CompanyAdvancePayment.updateOne(
        { documentNo: vNo },
        {
          $set: {
            remark: `${line.voucherType || "Advance"} | OpeningKm ${Number(line.openingKm) || 0} | ClosingKm ${Number(line.closingKm) || 0}`
          }
        }
      ).catch(() => {});
    }
  } catch {
    const memory = { ...record, _id: `tsl-${Date.now()}`, createdAt: new Date().toISOString() };
    const idx = memoryStore.tripSettlements.findIndex(
      (d) => String(d.documentNo || "").toUpperCase() === documentNo
    );
    if (idx >= 0) memoryStore.tripSettlements[idx] = { ...memoryStore.tripSettlements[idx], ...memory };
    else memoryStore.tripSettlements.unshift(memory);

    if (Array.isArray(memoryStore.tripSheets)) {
      const tIdx = memoryStore.tripSheets.findIndex(
        (t: any) => String(t.tripSheetNo || "").toUpperCase() === tripsheetNo
      );
      if (tIdx >= 0) {
        memoryStore.tripSheets[tIdx] = {
          ...memoryStore.tripSheets[tIdx],
          status: "COMPLETED",
          advanceAmt: tripAdvance,
          balanceAmt: totals.balanceAmount
        };
      }
    }
    saved = memory;
    return { saved, isMemoryStore: true };
  }

  return { saved, isMemoryStore: false };
}
