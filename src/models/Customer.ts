import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  customerCode: string;
  name: string;
  gstin?: string;
  customerPassword?: string;
  customerCategory?: string;
  tanNo?: string;
  customerType: string;
  industry?: string;
  vendorCode?: string;
  serviceType?: string;
  creditLimit: number;
  creditPeriod: number;
  contract?: string;
  skipPod: boolean;
  billFormat?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pinCode?: string;
  contactPerson?: string;
  phone?: string;
  mobileNo?: string;
  location?: string;
  emailAlertEnabled: boolean;
  email?: string;
  emailId1?: string;
  emailId2?: string;
  salesPerson?: string;
  salesPersonEmail?: string;
  kamPerson?: string;
  isActive: boolean;
  activeFlag: boolean;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    gstin: { type: String, uppercase: true, trim: true },
    customerPassword: { type: String, default: "" },
    customerCategory: { type: String, default: "Corporate" },
    tanNo: { type: String, uppercase: true, trim: true },
    customerType: { type: String, default: "CORPORATE" },
    industry: { type: String, default: "" },
    vendorCode: { type: String, default: "" },
    serviceType: { type: String, default: "FTL" },
    creditLimit: { type: Number, default: 0 },
    creditPeriod: { type: Number, default: 30 },
    contract: { type: String, default: "Standard" },
    skipPod: { type: Boolean, default: false },
    billFormat: { type: String, default: "E-Invoice Bill Formate" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    pinCode: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    phone: { type: String, default: "" },
    mobileNo: { type: String, default: "" },
    location: { type: String, default: "MUMBAI" },
    emailAlertEnabled: { type: Boolean, default: true },
    email: { type: String, default: "" },
    emailId1: { type: String, default: "" },
    emailId2: { type: String, default: "" },
    salesPerson: { type: String, default: "" },
    salesPersonEmail: { type: String, default: "" },
    kamPerson: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    activeFlag: { type: Boolean, default: true }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Customer) {
  delete (mongoose.models as any).Customer;
}

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
