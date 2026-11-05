import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomerGst extends Document {
  partyCode: string;
  partyName: string;
  gstNo: string;
  panNo: string;
  stateCode?: string;
  stateName?: string;
  city: string;
  pinCode: string;
  contactPerson: string;
  mobNo: string;
  address: string;
  isActive: boolean;
}

const CustomerGstSchema = new Schema<ICustomerGst>(
  {
    partyCode: { type: String, required: true, uppercase: true, trim: true },
    partyName: { type: String, required: true, trim: true },
    gstNo: { type: String, required: true, uppercase: true, trim: true },
    panNo: { type: String, uppercase: true, trim: true, default: "" },
    stateCode: { type: String, default: "" },
    stateName: { type: String, default: "" },
    city: { type: String, default: "" },
    pinCode: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    mobNo: { type: String, default: "" },
    address: { type: String, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.CustomerGst) {
  delete (mongoose.models as any).CustomerGst;
}

export const CustomerGst: Model<ICustomerGst> =
  mongoose.models.CustomerGst || mongoose.model<ICustomerGst>("CustomerGst", CustomerGstSchema);

