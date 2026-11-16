import mongoose, { Schema, Document, Model } from "mongoose";

export type OnlinePaymentStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Success"
  | "Failed"
  | "Reversed"
  | "Reprocessed";

export interface IOnlinePayment extends Document {
  paymentId: string;
  voucherNo: string;
  voucherDate: Date;
  documentNo?: string;
  paymentType: string;
  projectName?: string;
  paidTo: string;
  vendorCode?: string;
  vendorName?: string;
  amount: number;
  income?: number;
  expense?: number;
  bankName: string;
  acNoIfsc?: string;
  paymentMode: string;
  utrRef?: string;
  status: OnlinePaymentStatus;
  entryBy?: string;
  narration?: string;
  attachedFile?: string;
  hdfcRemark?: string;
  batchFileName?: string;
  ageingDays?: number;
  payload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const OnlinePaymentSchema = new Schema<IOnlinePayment>(
  {
    paymentId: { type: String, required: true, unique: true },
    voucherNo: { type: String, required: true, index: true },
    voucherDate: { type: Date, default: Date.now, index: true },
    documentNo: { type: String, default: "" },
    paymentType: { type: String, default: "F-Pay" },
    projectName: { type: String, default: "" },
    paidTo: { type: String, required: true },
    vendorCode: { type: String, default: "" },
    vendorName: { type: String, default: "" },
    amount: { type: Number, required: true },
    income: { type: Number, default: 0 },
    expense: { type: Number, default: 0 },
    bankName: { type: String, default: "INDUSIND BANK" },
    acNoIfsc: { type: String, default: "" },
    paymentMode: { type: String, default: "NEFT" },
    utrRef: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Success", "Failed", "Reversed", "Reprocessed"],
      default: "Pending",
      index: true
    },
    entryBy: { type: String, default: "AL002" },
    narration: { type: String, default: "" },
    attachedFile: { type: String, default: "" },
    hdfcRemark: { type: String, default: "" },
    batchFileName: { type: String, default: "", index: true },
    ageingDays: { type: Number, default: 0 },
    payload: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const OnlinePayment: Model<IOnlinePayment> =
  mongoose.models.OnlinePayment || mongoose.model<IOnlinePayment>("OnlinePayment", OnlinePaymentSchema);
