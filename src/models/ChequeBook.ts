import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChequeBook extends Document {
  bookNo: string;
  entryLocation: string;
  bankAc: string;
  fromSrNo: number;
  toSrNo: number;
  leafCount: number;
  dateOfIssue: Date;
  status: "Issued" | "Exhausted" | "Cancelled";
  issuedBy?: string;
  payload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ChequeBookSchema = new Schema<IChequeBook>(
  {
    bookNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    entryLocation: { type: String, required: true, index: true },
    bankAc: { type: String, required: true },
    fromSrNo: { type: Number, required: true },
    toSrNo: { type: Number, required: true },
    leafCount: { type: Number, required: true },
    dateOfIssue: { type: Date, default: Date.now },
    status: { type: String, enum: ["Issued", "Exhausted", "Cancelled"], default: "Issued" },
    issuedBy: { type: String, default: "AL002" },
    payload: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const ChequeBook: Model<IChequeBook> =
  mongoose.models.ChequeBook || mongoose.model<IChequeBook>("ChequeBook", ChequeBookSchema);
