import mongoose, { Schema, Document, Model } from "mongoose";

export type DocketNumberStatus = "AVAILABLE" | "RESERVED" | "ASSIGNED" | "CANCELLED";

export interface IDocketNumber extends Document {
  docketNo: string;
  seriesPrefix: string;
  sequenceNo: number;
  branchCode?: string;
  status: DocketNumberStatus;
  assignedToCnId?: string;
  assignedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocketSeriesConfig extends Document {
  seriesKey: string;
  prefix: string;
  padLength: number;
  nextSequence: number;
  branchCode?: string;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocketNumberSchema = new Schema<IDocketNumber>(
  {
    docketNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    seriesPrefix: { type: String, required: true, uppercase: true, trim: true },
    sequenceNo: { type: Number, required: true },
    branchCode: { type: String, uppercase: true },
    status: {
      type: String,
      enum: ["AVAILABLE", "RESERVED", "ASSIGNED", "CANCELLED"],
      default: "AVAILABLE",
      index: true
    },
    assignedToCnId: { type: String },
    assignedAt: { type: Date },
    notes: { type: String }
  },
  { timestamps: true }
);

const DocketSeriesConfigSchema = new Schema<IDocketSeriesConfig>(
  {
    seriesKey: { type: String, required: true, unique: true, default: "DEFAULT" },
    prefix: { type: String, required: true, uppercase: true, default: "ALC126" },
    padLength: { type: Number, default: 4 },
    nextSequence: { type: Number, default: 1 },
    branchCode: { type: String, uppercase: true },
    isActive: { type: Boolean, default: true },
    description: { type: String, default: "Primary CN / Docket stationery series" }
  },
  { timestamps: true }
);

export const DocketNumber: Model<IDocketNumber> =
  mongoose.models.DocketNumber || mongoose.model<IDocketNumber>("DocketNumber", DocketNumberSchema);

export const DocketSeriesConfig: Model<IDocketSeriesConfig> =
  mongoose.models.DocketSeriesConfig ||
  mongoose.model<IDocketSeriesConfig>("DocketSeriesConfig", DocketSeriesConfigSchema);
