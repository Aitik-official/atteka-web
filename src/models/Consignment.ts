import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConsignment extends Document {
  docketNo: string;
  bookingDate: Date;
  bookingType: "NORMAL" | "SYSTEM";
  bookingBranch: string;
  billingParty: string;
  paymentBasis: "PAID" | "TO_PAY" | "TBB";
  serviceType: string;
  serviceFtl?: string;
  fromLocation: string;
  toLocation: string;
  vehicleNo?: string;
  driverPhone?: string;
  driverNo?: string;
  approxKm?: number;
  buDescription?: string;
  mode?: string;
  billedAt?: string;
  expectedDeliveryDate?: Date;
  isLocalCn?: string;
  customerGstNo?: string;
  consignor: {
    name: string;
    gstin?: string;
    address?: string;
    city?: string;
    pincode?: string;
    phone?: string;
    email?: string;
  };
  consignee: {
    name: string;
    gstin?: string;
    address?: string;
    city?: string;
    pincode?: string;
    phone?: string;
    email?: string;
  };
  documentationDetails?: {
    riskType?: string;
    policyNo?: string;
    policyDate?: Date;
    shipment?: string;
    poNo?: string;
    containerNumber?: string;
    containerSize?: string;
  };
  invoiceDetails?: {
    invoiceBeNo?: string;
    invoiceBeDate?: Date;
    declaredValue?: number;
    currency?: string;
  };
  packageDetails: {
    packageType: string;
    productDescription: string;
    packagesCount: number;
    actualWeight: number;
    chargedWeight: number;
    sealNo?: string;
  };
  financials: {
    freightAmount: number;
    loadingCharge: number;
    subTotal: number;
    gstRate: number;
    gstAmount: number;
    grandTotal: number;
  };
  ewayBillNo?: string;
  ewayBillExpiry?: Date;
  remark?: string;
  specialInstructions?: string;
  status: "DRAFT" | "DOCKET_ALLOCATED" | "BOOKED" | "IN_TRANSIT" | "ARRIVED" | "DELIVERED" | "BILLED" | "CANCELLED";
  podUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConsignmentSchema = new Schema<IConsignment>(
  {
    docketNo: { type: String, required: true, unique: true, uppercase: true },
    bookingDate: { type: Date, default: Date.now },
    bookingType: { type: String, enum: ["NORMAL", "SYSTEM"], default: "NORMAL" },
    bookingBranch: { type: String, required: true },
    billingParty: { type: String, required: true },
    paymentBasis: { type: String, enum: ["PAID", "TO_PAY", "TBB"], default: "TBB" },
    serviceType: { type: String, default: "FTL" },
    serviceFtl: { type: String },
    fromLocation: { type: String, required: true },
    toLocation: { type: String, required: true },
    vehicleNo: { type: String },
    driverPhone: { type: String },
    driverNo: { type: String },
    approxKm: { type: Number, default: 0 },
    buDescription: { type: String },
    mode: { type: String, default: "Road" },
    billedAt: { type: String },
    expectedDeliveryDate: { type: Date },
    isLocalCn: { type: String, default: "Yes" },
    customerGstNo: { type: String },
    consignor: {
      name: { type: String, required: true },
      gstin: { type: String },
      address: { type: String },
      city: { type: String },
      pincode: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    consignee: {
      name: { type: String, required: true },
      gstin: { type: String },
      address: { type: String },
      city: { type: String },
      pincode: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    documentationDetails: {
      riskType: { type: String, default: "Owner's Risk" },
      policyNo: { type: String },
      policyDate: { type: Date },
      shipment: { type: String },
      poNo: { type: String },
      containerNumber: { type: String },
      containerSize: { type: String }
    },
    invoiceDetails: {
      invoiceBeNo: { type: String },
      invoiceBeDate: { type: Date },
      declaredValue: { type: Number, default: 0 },
      currency: { type: String, default: "INR" }
    },
    packageDetails: {
      packageType: { type: String, default: "BOX" },
      productDescription: { type: String, required: true },
      packagesCount: { type: Number, default: 1 },
      actualWeight: { type: Number, required: true },
      chargedWeight: { type: Number, required: true },
      sealNo: { type: String }
    },
    financials: {
      freightAmount: { type: Number, required: true },
      loadingCharge: { type: Number, default: 0 },
      subTotal: { type: Number, required: true },
      gstRate: { type: Number, default: 5 },
      gstAmount: { type: Number, required: true },
      grandTotal: { type: Number, required: true }
    },
    ewayBillNo: { type: String },
    ewayBillExpiry: { type: Date },
    remark: { type: String },
    specialInstructions: { type: String },
    status: {
      type: String,
      enum: ["DRAFT", "DOCKET_ALLOCATED", "BOOKED", "IN_TRANSIT", "ARRIVED", "DELIVERED", "BILLED", "CANCELLED"],
      default: "BOOKED"
    },
    podUrl: { type: String }
  },
  { timestamps: true }
);

export const Consignment: Model<IConsignment> =
  mongoose.models.Consignment || mongoose.model<IConsignment>("Consignment", ConsignmentSchema);

