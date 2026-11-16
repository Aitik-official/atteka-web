import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITripSheetDocket {
  docketNo: string;
  ewayBillNo?: string;
  refDate?: string;
  consignorName?: string;
  consigneeName?: string;
  pkgsLoad?: number;
  pkgsTotal?: number;
  weightLoad?: number;
  weightTotal?: number;
  customerDockNo?: string;
  deliveryAddress?: string;
}

export interface ITripSheet extends Document {
  tripSheetNo: string;
  manualTripSheetNo?: string;
  customerName: string;
  tripDate: Date;
  tripTime?: string;
  location?: string;
  vendorName?: string;
  vendorCode?: string;
  vehicleNo: string;
  vehicleType?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  driverName?: string;
  driverMobile?: string;
  freight: number;
  advanceAmt: number;
  balanceAmt: number;
  startKm: number;
  endKm?: number;
  specialInstructions?: string;
  dockets: ITripSheetDocket[];
  status: "PREPARED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  /** Exceptional / PDC finance extensions */
  sheetKind?: "THC" | "PICKUP_PDC" | "DELIVERY_PDC" | "TRIP";
  manualPdcNo?: string;
  advancePayableBranch?: string;
  route?: string;
  cancelReason?: string;
  exceptionalRemark?: string;
  pdcAmount?: number;
  vendorBillFinalized?: boolean;
  vendorBillNo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TripSheetDocketSchema = new Schema<ITripSheetDocket>(
  {
    docketNo: { type: String, required: true, uppercase: true },
    ewayBillNo: { type: String },
    refDate: { type: String },
    consignorName: { type: String },
    consigneeName: { type: String },
    pkgsLoad: { type: Number },
    pkgsTotal: { type: Number },
    weightLoad: { type: Number },
    weightTotal: { type: Number },
    customerDockNo: { type: String },
    deliveryAddress: { type: String }
  },
  { _id: false }
);

const TripSheetSchema = new Schema<ITripSheet>(
  {
    tripSheetNo: { type: String, required: true, unique: true, uppercase: true },
    manualTripSheetNo: { type: String },
    customerName: { type: String, required: true },
    tripDate: { type: Date, required: true },
    tripTime: { type: String },
    location: { type: String },
    vendorName: { type: String },
    vendorCode: { type: String },
    vehicleNo: { type: String, required: true, uppercase: true },
    vehicleType: { type: String },
    pickupLocation: { type: String },
    deliveryLocation: { type: String },
    driverName: { type: String },
    driverMobile: { type: String },
    freight: { type: Number, default: 0 },
    advanceAmt: { type: Number, default: 0 },
    balanceAmt: { type: Number, default: 0 },
    startKm: { type: Number, default: 0 },
    endKm: { type: Number, default: 0 },
    specialInstructions: { type: String },
    dockets: { type: [TripSheetDocketSchema], default: [] },
    status: {
      type: String,
      enum: ["PREPARED", "IN_TRANSIT", "COMPLETED", "CANCELLED"],
      default: "PREPARED"
    },
    sheetKind: {
      type: String,
      enum: ["THC", "PICKUP_PDC", "DELIVERY_PDC", "TRIP"],
      default: "TRIP",
      index: true
    },
    manualPdcNo: { type: String, uppercase: true },
    advancePayableBranch: { type: String, uppercase: true },
    route: { type: String },
    cancelReason: { type: String },
    exceptionalRemark: { type: String },
    pdcAmount: { type: Number, default: 0 },
    vendorBillFinalized: { type: Boolean, default: false },
    vendorBillNo: { type: String, uppercase: true }
  },
  { timestamps: true }
);

export const TripSheet: Model<ITripSheet> =
  mongoose.models.TripSheet || mongoose.model<ITripSheet>("TripSheet", TripSheetSchema);
