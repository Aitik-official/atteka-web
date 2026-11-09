import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICrmQuotation extends Document {
  customerName: string;
  customerCode?: string;
  contractFrom?: string;
  contractTo?: string;
  quotedBy?: string;
  lines: {
    serviceType?: string;
    fromLocation?: string;
    toLocation?: string;
    vehicleType?: string;
    rate?: number;
    approxKm?: number;
    trip?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CrmQuotationSchema = new Schema<ICrmQuotation>(
  {
    customerName: { type: String, required: true },
    customerCode: { type: String },
    contractFrom: { type: String },
    contractTo: { type: String },
    quotedBy: { type: String, default: "ANISHA OZARKAR" },
    lines: [
      {
        serviceType: String,
        fromLocation: String,
        toLocation: String,
        vehicleType: String,
        rate: Number,
        approxKm: Number,
        trip: String
      }
    ]
  },
  { timestamps: true }
);

export const CrmQuotation: Model<ICrmQuotation> =
  mongoose.models.CrmQuotation || mongoose.model<ICrmQuotation>("CrmQuotation", CrmQuotationSchema);
