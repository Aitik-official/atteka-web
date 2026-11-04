import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBankOperation extends Document {
  transactionId: string;
  bankName: string;
  accountNumber: string;
  operationType: "ONLINE_PAYMENT" | "STATEMENT_IMPORT" | "RE_PROCESS";
  beneficiaryName: string;
  amount: number;
  utrNumber: string;
  status: "INITIATED" | "SUCCESS" | "FAILED" | "PENDING";
  isSimulated: boolean;
  notes?: string;
  createdAt: Date;
}

const BankOperationSchema = new Schema<IBankOperation>(
  {
    transactionId: { type: String, required: true, unique: true },
    bankName: { type: String, default: "IndusInd Bank" },
    accountNumber: { type: String, default: "201002938471" },
    operationType: { type: String, enum: ["ONLINE_PAYMENT", "STATEMENT_IMPORT", "RE_PROCESS"], required: true },
    beneficiaryName: { type: String, required: true },
    amount: { type: Number, required: true },
    utrNumber: { type: String, required: true },
    status: { type: String, enum: ["INITIATED", "SUCCESS", "FAILED", "PENDING"], default: "SUCCESS" },
    isSimulated: { type: Boolean, default: true },
    notes: { type: String }
  },
  { timestamps: true }
);

export const BankOperation: Model<IBankOperation> =
  mongoose.models.BankOperation || mongoose.model<IBankOperation>("BankOperation", BankOperationSchema);

