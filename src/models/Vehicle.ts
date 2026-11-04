import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVehicle extends Document {
  vehicleNumber: string;
  vehicleType: string;
  ownerType: "COMPANY" | "ATTACHED" | "MARKET";
  rcNumber?: string;
  capacityTons: number;
  driverName?: string;
  driverPhone?: string;
  isActive: boolean;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    vehicleNumber: { type: String, required: true, unique: true, uppercase: true },
    vehicleType: { type: String, default: "32 FT SXL" },
    ownerType: { type: String, enum: ["COMPANY", "ATTACHED", "MARKET"], default: "ATTACHED" },
    rcNumber: { type: String },
    capacityTons: { type: Number, default: 9.0 },
    driverName: { type: String },
    driverPhone: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Vehicle: Model<IVehicle> = mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);

