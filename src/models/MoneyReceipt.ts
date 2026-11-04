import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMoneyReceipt extends Document {
  mrNumber: string;
  mrDate: Date;
  customerCode: string;
  customerName: string;
  allocatedBills: {
    billNumber: string;
    amount: number;
    rebate: number;
  }[];
  paymentMode: "CHEQUE" | "NEFT" | "RTGS" | "CASH" | "ONLINE";
  referenceNumber: string;
  totalReceived: number;
  tdsDeducted: number;
  rebateDiscount: number;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MoneyReceiptSchema = new Schema<IMoneyReceipt>(
  {
    mrNumber: { type: String, required: true, unique: true },
    mrDate: { type: Date, default: Date.now },
    customerCode: { type: String, required: true },
    customerName: { type: String, required: true },
    allocatedBills: [
      {
        billNumber: { type: String, required: true },
        amount: { type: Number, required: true },
        rebate: { type: Number, default: 0 }
      }
    ],
    paymentMode: { type: String, enum: ["CHEQUE", "NEFT", "RTGS", "CASH", "ONLINE"], default: "NEFT" },
    referenceNumber: { type: String, required: true },
    totalReceived: { type: Number, required: true },
    tdsDeducted: { type: Number, default: 0 },
    rebateDiscount: { type: Number, default: 0 },
    remarks: { type: String }
  },
  { timestamps: true }
);

export const MoneyReceipt: Model<IMoneyReceipt> =
  mongoose.models.MoneyReceipt || mongoose.model<IMoneyReceipt>("MoneyReceipt", MoneyReceiptSchema);

