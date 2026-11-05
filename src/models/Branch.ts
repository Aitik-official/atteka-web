import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBranch extends Document {
  locationHierarchy: string;
  branchCode: string;
  branchName: string;
  state?: string;
  city?: string;
  pincode?: string;
  gstin?: string;
  gstRegistrationDate?: Date;
  address?: string;
  latitude?: string;
  longitude?: string;
  stdCode?: string;
  telNo?: string;
  faxNo?: string;
  phone?: string;
  email?: string;
  branchSealUrl?: string;
  regionBranch?: string;
  esicCode?: string;
  isHub: boolean;
  isActive: boolean;
}

const BranchSchema = new Schema<IBranch>(
  {
    locationHierarchy: { type: String, default: "BRANCH" },
    branchCode: { type: String, required: true, unique: true, uppercase: true },
    branchName: { type: String, required: true },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
    gstin: { type: String, uppercase: true },
    gstRegistrationDate: { type: Date },
    address: { type: String },
    latitude: { type: String },
    longitude: { type: String },
    stdCode: { type: String },
    telNo: { type: String },
    faxNo: { type: String },
    phone: { type: String },
    email: { type: String, lowercase: true },
    branchSealUrl: { type: String },
    regionBranch: { type: String },
    esicCode: { type: String },
    isHub: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Branch: Model<IBranch> = mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);
