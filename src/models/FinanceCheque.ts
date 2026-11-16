import mongoose, { Schema, Document, Model } from "mongoose";

export type FinanceChequeStatus = "Pending" | "Deposited" | "Cleared" | "Bounced" | "Cancelled";

export interface IFinanceCheque extends Document {
  chequeNo: string;
  chequeDate: Date;
  amount: number;
  bankName: string;
  bankBranch?: string;
  receivedFrom?: string;
  customerCode?: string;
  customerName?: string;
  entryLocation: string;
  narration?: string;
  chequeReceivedAt?: string;
  status: FinanceChequeStatus;
  depositedAt?: Date;
  depositSlipNo?: string;
  payload?: any;
  entryBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceChequeSchema = new Schema<IFinanceCheque>(
  {
    chequeNo: { type: String, required: true, uppercase: true, trim: true, index: true },
    chequeDate: { type: Date, default: Date.now, index: true },
    amount: { type: Number, required: true },
    bankName: { type: String, default: "" },
    bankBranch: { type: String, default: "" },
    receivedFrom: { type: String, default: "" },
    customerCode: { type: String, default: "" },
    customerName: { type: String, default: "" },
    entryLocation: { type: String, default: "ALC1", index: true },
    narration: { type: String, default: "" },
    chequeReceivedAt: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Deposited", "Cleared", "Bounced", "Cancelled"],
      default: "Pending",
      index: true
    },
    depositedAt: { type: Date },
    depositSlipNo: { type: String, default: "" },
    payload: { type: Schema.Types.Mixed },
    entryBy: { type: String, default: "AL002" }
  },
  { timestamps: true }
);

FinanceChequeSchema.index({ chequeNo: 1, entryLocation: 1 }, { unique: true });

export const FinanceCheque: Model<IFinanceCheque> =
  mongoose.models.FinanceCheque || mongoose.model<IFinanceCheque>("FinanceCheque", FinanceChequeSchema);
