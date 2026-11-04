import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGstOperation extends Document {
  referenceDocNumber: string;
  gstin: string;
  operationType: "E_INVOICE_IRN" | "GSTR_2B_PULL" | "CREDIT_NOTE_IRN" | "CANCEL_IRN";
  irnNumber?: string;
  ackNumber?: string;
  status: "GENERATED" | "CANCELLED" | "FAILED" | "SUCCESS";
  isSimulated: boolean;
  responsePayload: Record<string, any>;
  createdAt: Date;
}

const GstOperationSchema = new Schema<IGstOperation>(
  {
    referenceDocNumber: { type: String, required: true },
    gstin: { type: String, required: true },
    operationType: {
      type: String,
      enum: ["E_INVOICE_IRN", "GSTR_2B_PULL", "CREDIT_NOTE_IRN", "CANCEL_IRN"],
      required: true
    },
    irnNumber: { type: String },
    ackNumber: { type: String },
    status: { type: String, enum: ["GENERATED", "CANCELLED", "FAILED", "SUCCESS"], default: "GENERATED" },
    isSimulated: { type: Boolean, default: true },
    responsePayload: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const GstOperation: Model<IGstOperation> =
  mongoose.models.GstOperation || mongoose.model<IGstOperation>("GstOperation", GstOperationSchema);

