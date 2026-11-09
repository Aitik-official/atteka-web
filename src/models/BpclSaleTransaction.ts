import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBpclSaleTransaction extends Document {
  vehicleNo: string;
  cardNumber?: string;
  roName?: string;
  roLocation?: string;
  roContactNo?: string;
  transactionId: string;
  transactionDate: Date;
  transactionStatus?: string;
  productName?: string;
  productQty: number;
  rate: number;
  transactionAmount: number;
  cmsOpeningBal?: number;
  cmsClosingBal?: number;
  walletBalance?: number;
  tripSheetNo?: string;
  tripSheetDate?: Date;
  voucherNo?: string;
  voucherDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BpclSaleTransactionSchema = new Schema<IBpclSaleTransaction>(
  {
    vehicleNo: { type: String, required: true, uppercase: true, trim: true, index: true },
    cardNumber: { type: String, trim: true },
    roName: { type: String },
    roLocation: { type: String },
    roContactNo: { type: String },
    transactionId: { type: String, required: true, unique: true, trim: true },
    transactionDate: { type: Date, required: true, index: true },
    transactionStatus: { type: String, default: "SUCCESS" },
    productName: { type: String, default: "HSD / DIESEL" },
    productQty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    transactionAmount: { type: Number, default: 0 },
    cmsOpeningBal: { type: Number, default: 0 },
    cmsClosingBal: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    tripSheetNo: { type: String, uppercase: true },
    tripSheetDate: { type: Date },
    voucherNo: { type: String, uppercase: true },
    voucherDate: { type: Date }
  },
  { timestamps: true }
);

export const BpclSaleTransaction: Model<IBpclSaleTransaction> =
  mongoose.models.BpclSaleTransaction ||
  mongoose.model<IBpclSaleTransaction>("BpclSaleTransaction", BpclSaleTransactionSchema);
