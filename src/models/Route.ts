import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoute extends Document {
  code: string;
  stateName?: string;
  destination: string;
  latitude?: string;
  longitude?: string;
  geofencingKm?: number;
  /** @deprecated kept for CN From/To corridor lookups */
  origin?: string;
  distanceKm?: number;
  transitHours?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RouteSchema = new Schema<IRoute>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    stateName: { type: String, trim: true },
    destination: { type: String, required: true, uppercase: true, trim: true },
    latitude: { type: String },
    longitude: { type: String },
    geofencingKm: { type: Number, default: 2 },
    origin: { type: String, uppercase: true, trim: true },
    distanceKm: { type: Number, min: 0, default: 0 },
    transitHours: { type: Number, default: 24 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

RouteSchema.index({ destination: 1 });
RouteSchema.index({ stateName: 1 });

export const Route: Model<IRoute> = mongoose.models.Route || mongoose.model<IRoute>("Route", RouteSchema);
