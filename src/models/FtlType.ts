import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFtlType extends Document {
  srNo: number;
  ftlType: string;
  maxWeight: number;
  approxMileage: number;
  length: number;
  breadth: number;
  height: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FtlTypeSchema = new Schema<IFtlType>(
  {
    srNo: { type: Number, required: true, unique: true },
    ftlType: { type: String, required: true, uppercase: true, trim: true },
    maxWeight: { type: Number, default: 0 },
    approxMileage: { type: Number, default: 0 },
    length: { type: Number, default: 0 },
    breadth: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const FtlType: Model<IFtlType> =
  mongoose.models.FtlType || mongoose.model<IFtlType>("FtlType", FtlTypeSchema);
