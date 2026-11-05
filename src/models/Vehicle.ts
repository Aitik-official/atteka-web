import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVehicle extends Document {
  srNo?: number;
  vendorName?: string;
  vehicleNumber: string;
  vehicleType: string;
  ownerType: "COMPANY" | "ATTACHED" | "MARKET";
  registrationDate?: Date;
  insurancePolicyNumber?: string;
  insuranceUpto?: Date;
  puccNumber?: string;
  puccUpto?: Date;
  nationalPermitNumber?: string;
  nationalPermitUpto?: Date;
  fitnessUpto?: Date;
  engineNo?: string;
  chassisNo?: string;
  vehicleModel?: string;
  noOfTyre?: number;
  vehicleSpeed?: string;
  rcNumber?: string;
  capacityTons: number;
  driverName?: string;
  driverPhone?: string;
  isActive: boolean;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    srNo: { type: Number },
    vendorName: { type: String, uppercase: true },
    vehicleNumber: { type: String, required: true, unique: true, uppercase: true },
    vehicleType: { type: String, default: "32 FT SXL", uppercase: true },
    ownerType: { type: String, enum: ["COMPANY", "ATTACHED", "MARKET"], default: "COMPANY" },
    registrationDate: { type: Date },
    insurancePolicyNumber: { type: String, uppercase: true },
    insuranceUpto: { type: Date },
    puccNumber: { type: String, uppercase: true },
    puccUpto: { type: Date },
    nationalPermitNumber: { type: String, uppercase: true },
    nationalPermitUpto: { type: Date },
    fitnessUpto: { type: Date },
    engineNo: { type: String, uppercase: true },
    chassisNo: { type: String, uppercase: true },
    vehicleModel: { type: String },
    noOfTyre: { type: Number, default: 0 },
    vehicleSpeed: { type: String, default: "Kmph" },
    rcNumber: { type: String },
    capacityTons: { type: Number, default: 9.0 },
    driverName: { type: String },
    driverPhone: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Vehicle: Model<IVehicle> = mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);
