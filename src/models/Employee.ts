import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmployee extends Document {
  employeeCode: string;
  employeePref?: string;
  employeeName: string;
  password?: string;
  gender?: string;
  dateOfBirth?: Date;
  empStatus?: string;
  qualification?: string;
  designation?: string;
  isActive: boolean;
  languageKnown?: string;
  managerId?: string;
  managerName?: string;
  currentLocationCode?: string;
  accessLocationCodes?: string[];
  dateStartingCurrentLocation?: Date;
  dateOfJoining?: Date;
  dateOfLeaving?: Date;
  residentialAddress?: string;
  email?: string;
  residentPhoneNo?: string;
  mobileNo?: string;
  additionalMobileNo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeCode: { type: String, required: true, unique: true, uppercase: true },
    employeePref: { type: String },
    employeeName: { type: String, required: true, uppercase: true },
    password: { type: String },
    gender: { type: String },
    dateOfBirth: { type: Date },
    empStatus: { type: String, default: "ACTIVE" },
    qualification: { type: String },
    designation: { type: String, uppercase: true },
    isActive: { type: Boolean, default: true },
    languageKnown: { type: String, default: "English" },
    managerId: { type: String, uppercase: true },
    managerName: { type: String },
    currentLocationCode: { type: String, uppercase: true },
    accessLocationCodes: { type: [String], default: [] },
    dateStartingCurrentLocation: { type: Date },
    dateOfJoining: { type: Date },
    dateOfLeaving: { type: Date },
    residentialAddress: { type: String },
    email: { type: String, uppercase: true },
    residentPhoneNo: { type: String },
    mobileNo: { type: String },
    additionalMobileNo: { type: String }
  },
  { timestamps: true }
);

export const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);
