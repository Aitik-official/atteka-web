import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompanyVoucherPayment extends Document {
  voucherNo: string;
  accountType: string;
  voucherDate: Date;
  expenseType: string;
  gstNo?: string;
  fromDate?: Date;
  toDate?: Date;
  documentNo?: string;
  attachedDocument?: string;
  vendor?: string;
  panNo?: string;
  paidTo: string;
  amount: number;
  taxableAmount: number;
  igst: number;
  cgst: number;
  sgst: number;
  tdsType?: string;
  tdsRate: number;
  tdsAmount: number;
  totalAmount: number;
  netPayable: number;
  modeOfTransaction: string;
  cashBankAccount: string;
  chequeNo?: string;
  chequeDate?: Date;
  remark?: string;
  status: "SUBMITTED" | "PAID" | "CANCELLED";
  preparedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyVoucherPaymentSchema = new Schema<ICompanyVoucherPayment>(
  {
    voucherNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    accountType: { type: String, required: true },
    voucherDate: { type: Date, default: Date.now },
    expenseType: { type: String, required: true },
    gstNo: { type: String, uppercase: true },
    fromDate: { type: Date },
    toDate: { type: Date },
    documentNo: { type: String, uppercase: true },
    attachedDocument: { type: String },
    vendor: { type: String },
    panNo: { type: String, uppercase: true },
    paidTo: { type: String, required: true },
    amount: { type: Number, required: true },
    taxableAmount: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    tdsType: { type: String },
    tdsRate: { type: Number, default: 0 },
    tdsAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    modeOfTransaction: { type: String, required: true },
    cashBankAccount: { type: String, required: true },
    chequeNo: { type: String, uppercase: true },
    chequeDate: { type: Date },
    remark: { type: String },
    status: { type: String, enum: ["SUBMITTED", "PAID", "CANCELLED"], default: "SUBMITTED" },
    preparedBy: { type: String, default: "ANISHA OZARKAR" }
  },
  { timestamps: true }
);

export const CompanyVoucherPayment: Model<ICompanyVoucherPayment> =
  mongoose.models.CompanyVoucherPayment ||
  mongoose.model<ICompanyVoucherPayment>("CompanyVoucherPayment", CompanyVoucherPaymentSchema);
