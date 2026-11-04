import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(2, "User ID is required").max(10),
  password: z.string().min(4, "Password is required"),
  captcha: z.string().optional()
});

export const ConsignmentSchema = z.object({
  docketNo: z.string().min(3, "Docket number is required"),
  bookingType: z.enum(["NORMAL", "SYSTEM"]).default("NORMAL"),
  bookingBranch: z.string().min(1, "Booking branch is required"),
  billingParty: z.string().min(1, "Billing party is required"),
  paymentBasis: z.enum(["PAID", "TO_PAY", "TBB"]).default("TBB"),
  serviceType: z.string().default("FTL"),
  fromLocation: z.string().min(2, "From location is required"),
  toLocation: z.string().min(2, "To location is required"),
  consignorName: z.string().min(2, "Consignor name is required"),
  consignorAddress: z.string().optional(),
  consignorCity: z.string().optional(),
  consignorPhone: z.string().optional(),
  consigneeName: z.string().min(2, "Consignee name is required"),
  consigneeAddress: z.string().optional(),
  consigneeCity: z.string().optional(),
  consigneePhone: z.string().optional(),
  packageType: z.string().default("BOX"),
  productDescription: z.string().min(1, "Product description is required"),
  packagesCount: z.coerce.number().min(1, "At least 1 package is required"),
  actualWeight: z.coerce.number().min(0.1, "Actual weight is required"),
  chargedWeight: z.coerce.number().min(0.1, "Charged weight is required"),
  freightAmount: z.coerce.number().min(0, "Freight amount must be non-negative"),
  loadingCharge: z.coerce.number().default(0),
  ewayBillNo: z.string().optional(),
  remark: z.string().optional()
});

export const CustomerSchema = z.object({
  customerCode: z.string().min(2, "Customer code is required"),
  name: z.string().min(2, "Customer name is required"),
  customerType: z.enum(["CORPORATE", "REGULAR", "WALK_IN"]).default("REGULAR"),
  pan: z.string().optional(),
  creditPeriod: z.coerce.number().default(30),
  gstin: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal(""))
});

export const VendorSchema = z.object({
  vendorCode: z.string().min(2, "Vendor code is required"),
  name: z.string().min(2, "Vendor name is required"),
  vendorType: z.enum(["ATTACHED_VEHICLE", "MARKET_VEHICLE", "COURIER", "MAINTENANCE"]).default("ATTACHED_VEHICLE"),
  pan: z.string().optional(),
  tdsApplicable: z.boolean().default(false),
  tdsRate: z.coerce.number().default(0),
  bankName: z.string().optional(),
  accountNo: z.string().optional(),
  ifscCode: z.string().optional(),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("APPROVED")
});

