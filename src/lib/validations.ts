import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(2, "User ID is required").max(10),
  password: z.string().min(4, "Password is required"),
  captcha: z.string().optional()
});

export const ConsignmentSchema = z.object({
  docketNo: z.string().min(3, "Docket number is required").optional(),
  draftId: z.string().optional(),
  previousDocketNo: z.string().optional(),
  bookingType: z.enum(["NORMAL", "SYSTEM"]).default("NORMAL"),
  bookingBranch: z.string().default("ALC1"),
  billingParty: z.string().min(1, "Billing party is required"),
  paymentBasis: z.enum(["PAID", "TO_PAY", "TBB"]).default("TBB"),
  serviceType: z.string().default("FTL"),
  serviceFtl: z.string().optional(),
  fromLocation: z.string().default("MUMBAI"),
  toLocation: z.string().default("DELHI"),
  consignorName: z.string().min(1, "Consignor name is required"),
  consignorGstin: z.string().optional(),
  consignorAddress: z.string().optional(),
  consignorCity: z.string().optional(),
  consignorPincode: z.string().optional(),
  consignorPhone: z.string().optional(),
  consigneeName: z.string().min(1, "Consignee name is required"),
  consigneeGstin: z.string().optional(),
  consigneeAddress: z.string().optional(),
  consigneeCity: z.string().optional(),
  consigneePincode: z.string().optional(),
  consigneePhone: z.string().optional(),
  packageType: z.string().default("BOX"),
  productDescription: z.string().default("General Goods"),
  packagesCount: z.coerce.number().min(0).default(0),
  actualWeight: z.coerce.number().min(0).default(0),
  chargedWeight: z.coerce.number().min(0).default(0),
  freightAmount: z.coerce.number().min(0, "Freight amount must be non-negative").default(0),
  loadingCharge: z.coerce.number().default(0),
  ewayBillNo: z.string().optional(),
  ewayBillExpiry: z.string().optional(),
  remark: z.string().optional(),
  specialInstructions: z.string().optional(),
  buDescription: z.string().optional(),
  mode: z.string().default("Road"),
  billedAt: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  isLocalCn: z.string().default("Yes"),
  vehicleNo: z.string().optional(),
  driverNo: z.string().optional(),
  approxKm: z.coerce.number().default(0),
  customerGstNo: z.string().optional(),
  riskType: z.string().default("Owner's Risk"),
  policyNo: z.string().optional(),
  policyDate: z.string().optional(),
  shipment: z.string().optional(),
  poNo: z.string().optional(),
  containerNumber: z.string().optional(),
  containerSize: z.string().optional(),
  invoiceBeNo: z.string().optional(),
  invoiceBeDate: z.string().optional(),
  declaredValue: z.coerce.number().default(0),
  currency: z.string().default("INR"),
  sealNo: z.string().optional(),
  status: z.enum(["DRAFT", "DOCKET_ALLOCATED", "BOOKED", "IN_TRANSIT", "ARRIVED", "DELIVERED", "BILLED", "CANCELLED"]).default("BOOKED")
}).superRefine((data, ctx) => {
  const status = data.status || "BOOKED";
  if (status === "DRAFT") {
    // Draft CN details may be saved before a master docket number is assigned
    return;
  }
  if (!data.docketNo || data.docketNo.trim().length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Docket number is required to finalize the CN",
      path: ["docketNo"]
    });
  }
});

export const CustomerSchema = z.object({
  customerCode: z.string().optional(),
  name: z.string().min(1, "Customer name is required"),
  customerType: z.string().default("CORPORATE"),
  pan: z.string().optional(),
  creditLimit: z.coerce.number().default(0),
  creditPeriod: z.coerce.number().default(30),
  gstin: z.string().optional(),
  customerPassword: z.string().optional(),
  customerCategory: z.string().optional(),
  tanNo: z.string().optional(),
  industry: z.string().optional(),
  vendorCode: z.string().optional(),
  serviceType: z.string().optional(),
  contract: z.string().optional(),
  skipPod: z.coerce.boolean().default(false),
  billFormat: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  pincode: z.string().optional(),
  contactPerson: z.string().optional(),
  mobileNo: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  emailAlertEnabled: z.coerce.boolean().default(true),
  email: z.string().optional(),
  emailId1: z.string().optional(),
  emailId2: z.string().optional(),
  salesPerson: z.string().optional(),
  salesPersonEmail: z.string().optional(),
  kamPerson: z.string().optional(),
  activeFlag: z.coerce.boolean().default(true),
  isActive: z.coerce.boolean().default(true)
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

