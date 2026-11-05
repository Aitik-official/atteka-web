import mongoose, { Schema, Document } from "mongoose";

export interface ILedgerEntry extends Document {
  entryNumber: string;
  entryDate: Date;
  referenceType: "CN" | "BILL" | "MR" | "EXPENSE" | "JOURNAL";
  referenceId: string;
  accountCode: string;
  accountName: string;
  accountGroup: string;
  debit: number;
  credit: number;
  narration: string;
  branchCode: string;
  financialYear: string;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
  {
    entryNumber: { type: String, required: true, index: true },
    entryDate: { type: Date, default: Date.now },
    referenceType: { type: String, enum: ["CN", "BILL", "MR", "EXPENSE", "JOURNAL"], required: true },
    referenceId: { type: String, required: true, index: true },
    accountCode: { type: String, required: true, index: true },
    accountName: { type: String, required: true },
    accountGroup: { type: String, required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    narration: { type: String, default: "" },
    branchCode: { type: String, default: "ALC1" },
    financialYear: { type: String, default: "2026-2027" }
  },
  { timestamps: true }
);

export const LedgerEntry =
  mongoose.models.LedgerEntry || mongoose.model<ILedgerEntry>("LedgerEntry", LedgerEntrySchema);

