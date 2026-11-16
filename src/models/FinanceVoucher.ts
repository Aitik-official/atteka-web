import mongoose, { Schema, Document, Model } from "mongoose";

export type FinanceVoucherKind =
  | "DEBIT"
  | "CREDIT"
  | "CONTRA"
  | "JOURNAL"
  | "VENDOR_INVOICE"
  | "VENDOR_PAYMENT"
  | "DEBIT_NOTE"
  | "GSTR2B";

export type FinanceVoucherStatus = "Active" | "Cancelled" | "Booked" | "Paid" | "Submitted";

export interface IFinanceVoucher extends Document {
  voucherNumber: string;
  voucherKind: FinanceVoucherKind;
  voucherType: string;
  voucherDate: Date;
  branch: string;
  party: string;
  partyCode?: string;
  payTo?: string;
  amount: number;
  taxableAmount?: number;
  tdsAmount?: number;
  igst?: number;
  cgst?: number;
  sgst?: number;
  netPayable?: number;
  documentNo?: string;
  invoiceNo?: string;
  refNo?: string;
  narration?: string;
  modeOfTransaction?: string;
  cashBankAccount?: string;
  chequeNo?: string;
  chequeDate?: Date;
  gstNo?: string;
  panNo?: string;
  lines?: any[];
  accounts?: any[];
  payload?: any;
  status: FinanceVoucherStatus;
  preparedBy?: string;
  entryBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceVoucherSchema = new Schema<IFinanceVoucher>(
  {
    voucherNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    voucherKind: {
      type: String,
      enum: [
        "DEBIT",
        "CREDIT",
        "CONTRA",
        "JOURNAL",
        "VENDOR_INVOICE",
        "VENDOR_PAYMENT",
        "DEBIT_NOTE",
        "GSTR2B"
      ],
      required: true,
      index: true
    },
    voucherType: { type: String, default: "" },
    voucherDate: { type: Date, default: Date.now, index: true },
    branch: { type: String, default: "ALC1" },
    party: { type: String, default: "" },
    partyCode: { type: String, default: "" },
    payTo: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    tdsAmount: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    documentNo: { type: String, uppercase: true },
    invoiceNo: { type: String, uppercase: true },
    refNo: { type: String, uppercase: true },
    narration: { type: String, default: "" },
    modeOfTransaction: { type: String, default: "" },
    cashBankAccount: { type: String, default: "" },
    chequeNo: { type: String, uppercase: true },
    chequeDate: { type: Date },
    gstNo: { type: String, uppercase: true },
    panNo: { type: String, uppercase: true },
    lines: [{ type: Schema.Types.Mixed }],
    accounts: [{ type: Schema.Types.Mixed }],
    payload: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["Active", "Cancelled", "Booked", "Paid", "Submitted"],
      default: "Active",
      index: true
    },
    preparedBy: { type: String, default: "AL002" },
    entryBy: { type: String, default: "AL002" }
  },
  { timestamps: true }
);

export const FinanceVoucher: Model<IFinanceVoucher> =
  mongoose.models.FinanceVoucher ||
  mongoose.model<IFinanceVoucher>("FinanceVoucher", FinanceVoucherSchema);
