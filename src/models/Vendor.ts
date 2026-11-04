import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVendor extends Document {
  vendorCode: string;
  name: string;
  vendorType: "ATTACHED_VEHICLE" | "MARKET_VEHICLE" | "COURIER" | "MAINTENANCE";
  pan?: string;
  tdsApplicable: boolean;
  tdsRate: number;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  city?: string;
  phone?: string;
  isActive: boolean;
}

const VendorSchema = new Schema<IVendor>(
  {
    vendorCode: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    vendorType: {
      type: String,
      enum: ["ATTACHED_VEHICLE", "MARKET_VEHICLE", "COURIER", "MAINTENANCE"],
      default: "ATTACHED_VEHICLE"
    },
    pan: { type: String, uppercase: true },
    tdsApplicable: { type: Boolean, default: false },
    tdsRate: { type: Number, default: 0 },
    approvalStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "APPROVED" },
    bankName: { type: String },
    accountNo: { type: String },
    ifscCode: { type: String, uppercase: true },
    city: { type: String },
    phone: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Vendor: Model<IVendor> = mongoose.models.Vendor || mongoose.model<IVendor>("Vendor", VendorSchema);

