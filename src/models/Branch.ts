import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBranch extends Document {
  branchCode: string;
  branchName: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  gstin?: string;
  isHub: boolean;
  isActive: boolean;
}

const BranchSchema = new Schema<IBranch>(
  {
    branchCode: { type: String, required: true, unique: true, uppercase: true },
    branchName: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    phone: { type: String },
    gstin: { type: String },
    isHub: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Branch: Model<IBranch> = mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);

