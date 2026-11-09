import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompanyAdvancePayment extends Document {
  documentNo: string;
  documentDate: Date;
  tripsheetNo?: string;
  vehicleNo: string;
  driverName?: string;
  branch?: string;
  payMode: string;
  amount: number;
  remark?: string;
  status: "OPEN" | "PARTIAL" | "PAID" | "CANCELLED";
  preparedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyAdvancePaymentSchema = new Schema<ICompanyAdvancePayment>(
  {
    documentNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    documentDate: { type: Date, default: Date.now },
    tripsheetNo: { type: String, uppercase: true, trim: true },
    vehicleNo: { type: String, required: true, uppercase: true, trim: true },
    driverName: { type: String },
    branch: { type: String, default: "ALC1" },
    payMode: { type: String, default: "CASH" },
    amount: { type: Number, required: true },
    remark: { type: String },
    status: { type: String, enum: ["OPEN", "PARTIAL", "PAID", "CANCELLED"], default: "PAID" },
    preparedBy: { type: String, default: "ANISHA OZARKAR" }
  },
  { timestamps: true }
);

export const CompanyAdvancePayment: Model<ICompanyAdvancePayment> =
  mongoose.models.CompanyAdvancePayment ||
  mongoose.model<ICompanyAdvancePayment>("CompanyAdvancePayment", CompanyAdvancePaymentSchema);
