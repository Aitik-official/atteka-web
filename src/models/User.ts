import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  userId: string;
  name: string;
  email?: string;
  passwordHash: string;
  role: "ADMIN" | "OPERATOR" | "ACCOUNTS" | "MANAGER" | "GUEST";
  branchCode: string;
  operatingLocation: string;
  financialYear: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    email: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "OPERATOR", "ACCOUNTS", "MANAGER", "GUEST"], default: "OPERATOR" },
    branchCode: { type: String, default: "MUM" },
    operatingLocation: { type: String, default: "MUMBAI CENTRAL" },
    financialYear: { type: String, default: "2024-2025" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

