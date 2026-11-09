import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITripSettlement extends Document {
  documentNo: string;
  tripsheetNo: string;
  documentDate: Date;
  vehicleNo: string;
  driverName?: string;
  branch?: string;
  route?: string;
  grossFreight: number;
  advancePaid: number;
  dieselExpense: number;
  tollExpense: number;
  unloadingLabor: number;
  otherExpense: number;
  netPayable: number;
  remark?: string;
  status: "PENDING" | "SETTLED" | "CANCELLED";
  preparedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TripSettlementSchema = new Schema<ITripSettlement>(
  {
    documentNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tripsheetNo: { type: String, required: true, uppercase: true, trim: true },
    documentDate: { type: Date, default: Date.now },
    vehicleNo: { type: String, required: true, uppercase: true, trim: true },
    driverName: { type: String },
    branch: { type: String, default: "ALC1" },
    route: { type: String },
    grossFreight: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    dieselExpense: { type: Number, default: 0 },
    tollExpense: { type: Number, default: 0 },
    unloadingLabor: { type: Number, default: 0 },
    otherExpense: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    remark: { type: String },
    status: { type: String, enum: ["PENDING", "SETTLED", "CANCELLED"], default: "SETTLED" },
    preparedBy: { type: String, default: "ANISHA OZARKAR" }
  },
  { timestamps: true }
);

export const TripSettlement: Model<ITripSettlement> =
  mongoose.models.TripSettlement || mongoose.model<ITripSettlement>("TripSettlement", TripSettlementSchema);
