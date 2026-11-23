import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITripSettlementAdvance {
  voucherNumber: string;
  voucherDate?: string;
  voucherType?: string;
  qty?: number;
  rate?: number;
  fuelType?: string;
  openingKm?: number;
  closingKm?: number;
  totalKm?: number;
  amount: number;
}

export interface ITripSettlement extends Document {
  documentNo: string;
  tripsheetNo: string;
  documentDate: Date;
  vehicleNo: string;
  driverName?: string;
  branch?: string;
  route?: string;
  fromLocation?: string;
  toLocation?: string;
  manualThcNo?: string;
  tripClosedDate?: Date;
  tripSettlementDate?: Date;
  grossFreight: number;
  advancePaid: number;
  dieselExpense: number;
  tollExpense: number;
  foodingExpense: number;
  borderNakaCharges: number;
  loadingExpense: number;
  unloadingLabor: number;
  rtoCharges: number;
  parkingExpense: number;
  repairMaintenance: number;
  driverIncentive: number;
  otherExpense: number;
  lateDelivery: number;
  penalty: number;
  openingBalance: number;
  tripExpense: number;
  totalAmount: number;
  cashReceivedPaid: number;
  balanceAmount: number;
  netPayable: number;
  advances: ITripSettlementAdvance[];
  remark?: string;
  status: "PENDING" | "SETTLED" | "CANCELLED";
  preparedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdvanceLineSchema = new Schema<ITripSettlementAdvance>(
  {
    voucherNumber: { type: String, uppercase: true, trim: true },
    voucherDate: { type: String },
    voucherType: { type: String },
    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    fuelType: { type: String, default: "Petrol" },
    openingKm: { type: Number, default: 0 },
    closingKm: { type: Number, default: 0 },
    totalKm: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  { _id: false }
);

const TripSettlementSchema = new Schema<ITripSettlement>(
  {
    documentNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tripsheetNo: { type: String, required: true, uppercase: true, trim: true, index: true },
    documentDate: { type: Date, default: Date.now },
    vehicleNo: { type: String, required: true, uppercase: true, trim: true },
    driverName: { type: String },
    branch: { type: String, default: "ALC1" },
    route: { type: String },
    fromLocation: { type: String },
    toLocation: { type: String },
    manualThcNo: { type: String, uppercase: true },
    tripClosedDate: { type: Date },
    tripSettlementDate: { type: Date },
    grossFreight: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    dieselExpense: { type: Number, default: 0 },
    tollExpense: { type: Number, default: 0 },
    foodingExpense: { type: Number, default: 0 },
    borderNakaCharges: { type: Number, default: 0 },
    loadingExpense: { type: Number, default: 0 },
    unloadingLabor: { type: Number, default: 0 },
    rtoCharges: { type: Number, default: 0 },
    parkingExpense: { type: Number, default: 0 },
    repairMaintenance: { type: Number, default: 0 },
    driverIncentive: { type: Number, default: 0 },
    otherExpense: { type: Number, default: 0 },
    lateDelivery: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    tripExpense: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    cashReceivedPaid: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    advances: { type: [AdvanceLineSchema], default: [] },
    remark: { type: String },
    status: { type: String, enum: ["PENDING", "SETTLED", "CANCELLED"], default: "SETTLED" },
    preparedBy: { type: String, default: "AL002" }
  },
  { timestamps: true }
);

export const TripSettlement: Model<ITripSettlement> =
  mongoose.models.TripSettlement || mongoose.model<ITripSettlement>("TripSettlement", TripSettlementSchema);
