import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomerBill extends Document {
  billNumber: string;
  billDate: Date;
  customerCode: string;
  customerName: string;
  consignments: string[];
  totalFreight: number;
  taxAmount: number;
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
    consignments: [{ type: String }],
    totalFreight: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
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

