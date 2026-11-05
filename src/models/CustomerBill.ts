import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomerBill extends Document {
  billNumber: string;
  billDate: Date;
  customerCode: string;
  customerName: string;
  customerGstin?: string;
  partyAddress?: string;
  destinationAddress?: string;
  city?: string;
  sacCode?: string;
  gstPercent?: number;
  collectionBranch?: string;
  billingBranch?: string;
  gstBranch?: string;
  remark?: string;
  dateFrom?: string;
  dateTo?: string;
  billType?: string;
  topsheetNo?: string;
  mrsNo?: string;
  mrsDate?: Date;
  consignments: string[];
  lineItems?: any[];
  totalFreight: number;
  taxAmount: number;
  igst?: number;
  cgst?: number;
  sgst?: number;
  grandTotal: number;
  irnDetails?: {
    irn: string;
    ackNo: string;
    ackDate: Date;
    status: string;
    isSimulated: boolean;
  };
  status: "GENERATED" | "SUBMITTED" | "PAID" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

const CustomerBillSchema = new Schema<ICustomerBill>(
  {
    billNumber: { type: String, required: true, unique: true },
    billDate: { type: Date, default: Date.now },
    customerCode: { type: String, required: true },
    customerName: { type: String, required: true },
    customerGstin: { type: String },
    partyAddress: { type: String },
    destinationAddress: { type: String },
    city: { type: String },
    sacCode: { type: String, default: "996511" },
    gstPercent: { type: Number, default: 5 },
    collectionBranch: { type: String },
    billingBranch: { type: String },
    gstBranch: { type: String },
    remark: { type: String },
    dateFrom: { type: String },
    dateTo: { type: String },
    billType: { type: String, default: "Freight Bill" },
    topsheetNo: { type: String },
    mrsNo: { type: String },
    mrsDate: { type: Date },
    consignments: [{ type: String }],
    lineItems: [{ type: Schema.Types.Mixed }],
    totalFreight: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    igst: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    irnDetails: {
      irn: { type: String },
      ackNo: { type: String },
      ackDate: { type: Date },
      status: { type: String },
      isSimulated: { type: Boolean, default: true }
    },
    status: { type: String, enum: ["GENERATED", "SUBMITTED", "PAID", "CANCELLED"], default: "GENERATED" }
  },
  { timestamps: true }
);

export const CustomerBill: Model<ICustomerBill> =
  mongoose.models.CustomerBill || mongoose.model<ICustomerBill>("CustomerBill", CustomerBillSchema);

