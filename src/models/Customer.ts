import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  customerCode: string;
  name: string;
  customerType: "CORPORATE" | "REGULAR" | "WALK_IN";
  pan?: string;
  creditPeriod: number;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerCode: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    customerType: { type: String, enum: ["CORPORATE", "REGULAR", "WALK_IN"], default: "REGULAR" },
    pan: { type: String, uppercase: true },
    creditPeriod: { type: Number, default: 30 },
    gstin: { type: String, uppercase: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    phone: { type: String },
    email: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

