import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVendor extends Document {
  vendorCode: string;
  name: string;
  vendorType: string;
  gstNo?: string;
  pan?: string;
  address?: string;
  password?: string;
  vendorRating?: number;
  smsAlert?: boolean;
  whatsappAlert?: boolean;
  emailAlert?: boolean;
  locationName?: string;
  contactPerson?: string;
  city?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  accountNo?: string;
  ifscCode?: string;
  bankName?: string;
  bankAccountName?: string;
  bankBeneficiary?: string;
  autoPay?: boolean;
  sec194c6Received?: boolean;
  tdsApplicable: boolean;
  tdsRate: number;
  cancelledChequeCopy?: string;
  panDeclarationCopy?: string;
  msmeApplicable?: boolean;
  msmeNo?: string;
  msmeType?: string;
  remark?: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  isActive: boolean;
}

const VendorSchema = new Schema<IVendor>(
  {
    vendorCode: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true, uppercase: true },
    vendorType: { type: String, default: "MARKET" },
    gstNo: { type: String, uppercase: true },
    pan: { type: String, uppercase: true },
    address: { type: String },
    password: { type: String },
    vendorRating: { type: Number, default: 1 },
    smsAlert: { type: Boolean, default: true },
    whatsappAlert: { type: Boolean, default: true },
    emailAlert: { type: Boolean, default: true },
    locationName: { type: String },
    contactPerson: { type: String },
    city: { type: String },
    pincode: { type: String },
    phone: { type: String },
    email: { type: String, lowercase: true },
    accountNo: { type: String },
    ifscCode: { type: String, uppercase: true },
    bankName: { type: String, uppercase: true },
    bankAccountName: { type: String, uppercase: true },
    bankBeneficiary: { type: String },
    autoPay: { type: Boolean, default: true },
    sec194c6Received: { type: Boolean, default: true },
    tdsApplicable: { type: Boolean, default: true },
    tdsRate: { type: Number, default: 0 },
    cancelledChequeCopy: { type: String },
    panDeclarationCopy: { type: String },
    msmeApplicable: { type: Boolean, default: true },
    msmeNo: { type: String, uppercase: true },
    msmeType: { type: String },
    remark: { type: String },
    approvalStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Vendor: Model<IVendor> = mongoose.models.Vendor || mongoose.model<IVendor>("Vendor", VendorSchema);
