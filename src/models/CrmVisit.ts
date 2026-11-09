import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICrmVisit extends Document {
  leadCode: string;
  customerName: string;
  contactPerson?: string;
  prospectStatus?: string;
  visitDateTime: string;
  visitRemark?: string;
  nextVisitDateTime?: string;
  conveyanceExpenses?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CrmVisitSchema = new Schema<ICrmVisit>(
  {
    leadCode: { type: String, required: true, uppercase: true, trim: true },
    customerName: { type: String, required: true },
    contactPerson: { type: String },
    prospectStatus: { type: String },
    visitDateTime: { type: String, required: true },
    visitRemark: { type: String },
    nextVisitDateTime: { type: String },
    conveyanceExpenses: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const CrmVisit: Model<ICrmVisit> =
  mongoose.models.CrmVisit || mongoose.model<ICrmVisit>("CrmVisit", CrmVisitSchema);
