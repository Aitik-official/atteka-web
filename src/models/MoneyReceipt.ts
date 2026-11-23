import mongoose, { Schema, Document, Model } from "mongoose";

export const MR_PAYMENT_MODES = [
  "DD",
  "CHEQUE",
  "NEFT",
  "RTGS",
  "CASH",
  "ONLINE",
  "Cheque",
  "Cash",
  "Online"
] as const;

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
  paymentMode: string;
  referenceNumber: string;
  totalReceived: number;
  tdsDeducted: number;
  rebateDiscount: number;
  remarks?: string;
  /** Extra rebate / payment / docket capture from Bill MR With Rebate flow */
  meta?: Record<string, any>;
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
    paymentMode: {
      type: String,
      enum: [...MR_PAYMENT_MODES],
      default: "NEFT"
    },
    referenceNumber: { type: String, required: true },
    totalReceived: { type: Number, required: true },
    tdsDeducted: { type: Number, default: 0 },
    rebateDiscount: { type: Number, default: 0 },
    remarks: { type: String },
    meta: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Hot-reload: drop cached model so enum updates (e.g. DD) take effect
if (mongoose.models.MoneyReceipt) {
  delete mongoose.models.MoneyReceipt;
}

export const MoneyReceipt: Model<IMoneyReceipt> = mongoose.model<IMoneyReceipt>(
  "MoneyReceipt",
  MoneyReceiptSchema
);
