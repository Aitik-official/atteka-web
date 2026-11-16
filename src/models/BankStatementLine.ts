import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBankStatementLine extends Document {
  lineId: string;
  channel: "MANUAL" | "IMPORT" | "API";
  bank: string;
  accountNo: string;
  txnDate: Date;
  valueDate: Date;
  narration: string;
  chqRefNo: string;
  debit: number;
  credit: number;
  balance: number;
  voucherNo?: string;
  docNo?: string;
  status: "Posted" | "Pending" | "Reversed";
  importBatchId?: string;
  payload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const BankStatementLineSchema = new Schema<IBankStatementLine>(
  {
    lineId: { type: String, required: true, unique: true },
    channel: { type: String, enum: ["MANUAL", "IMPORT", "API"], default: "MANUAL", index: true },
    bank: { type: String, default: "INDUSIND BANK", index: true },
    accountNo: { type: String, default: "201002938471", index: true },
    txnDate: { type: Date, required: true, index: true },
    valueDate: { type: Date, required: true },
    narration: { type: String, default: "" },
    chqRefNo: { type: String, default: "" },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    voucherNo: { type: String, default: "" },
    docNo: { type: String, default: "" },
    status: { type: String, enum: ["Posted", "Pending", "Reversed"], default: "Posted" },
    importBatchId: { type: String, default: "" },
    payload: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const BankStatementLine: Model<IBankStatementLine> =
  mongoose.models.BankStatementLine ||
  mongoose.model<IBankStatementLine>("BankStatementLine", BankStatementLineSchema);
