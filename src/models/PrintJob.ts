import mongoose, { Schema, Document, Model } from "mongoose";

export type PrintJobKind = "DOCKET" | "VOUCHER" | "DEBIT_ADVICE" | "PDC_FREIGHT_MEMO";

export interface IPrintJob extends Document {
  jobId: string;
  kind: PrintJobKind;
  documentNos: string[];
  count: number;
  printer: string;
  status: "Queued" | "Sent" | "Failed";
  message?: string;
  entryBy?: string;
  payload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PrintJobSchema = new Schema<IPrintJob>(
  {
    jobId: { type: String, required: true, unique: true },
    kind: {
      type: String,
      enum: ["DOCKET", "VOUCHER", "DEBIT_ADVICE", "PDC_FREIGHT_MEMO"],
      required: true,
      index: true
    },
    documentNos: { type: [String], default: [] },
    count: { type: Number, default: 0 },
    printer: { type: String, default: "Dot-Matrix (replica)" },
    status: { type: String, enum: ["Queued", "Sent", "Failed"], default: "Sent" },
    message: { type: String, default: "" },
    entryBy: { type: String, default: "AL002" },
    payload: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const PrintJob: Model<IPrintJob> =
  mongoose.models.PrintJob || mongoose.model<IPrintJob>("PrintJob", PrintJobSchema);
