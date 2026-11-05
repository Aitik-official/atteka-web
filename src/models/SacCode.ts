import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISacCode extends Document {
  sacCode: string;
  description: string;
  used: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SacCodeSchema = new Schema<ISacCode>(
  {
    sacCode: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    used: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const SacCode: Model<ISacCode> =
  mongoose.models.SacCode || mongoose.model<ISacCode>("SacCode", SacCodeSchema);
