const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  lines.forEach((l) => {
    const trimmed = l.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        process.env[k] = v;
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/atteka_replica";

async function seed() {
  console.log("Connecting to MongoDB:", MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
  } catch (err) {
    console.warn("MongoDB connection warning:", err.message);
    console.log("Tip: If MongoDB is running locally, ensure mongod is active. If using cloud MongoDB, set MONGODB_URI in .env.local.");
    console.log("The application built-in mock fallback will allow immediate local exploration.");
    process.exit(0);
  }

  console.log("Connected successfully. Seeding fictional demo records...");

  const db = mongoose.connection;

  // 1. Users
  const usersColl = db.collection("users");
  await usersColl.deleteMany({});
  const salt = bcrypt.genSaltSync(10);

  await usersColl.insertMany([
    {
      userId: "AL002",
      name: "ANISHA OZARKAR (DEMO)",
      email: "operator@atteka-demo.local",
      passwordHash: bcrypt.hashSync("demo123", salt),
      role: "OPERATOR",
      branchCode: "MUM",
      operatingLocation: "MUMBAI CENTRAL",
      financialYear: "2024-2025",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: "ADMIN01",
      name: "SYSTEM ADMINISTRATOR",
      email: "admin@atteka-demo.local",
      passwordHash: bcrypt.hashSync("admin123", salt),
      role: "ADMIN",
      branchCode: "MUM",
      operatingLocation: "MUMBAI CENTRAL",
      financialYear: "2024-2025",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  console.log("Seeded demo users (AL002: demo123, ADMIN01: admin123)");

  // 2. Branches
  const branchesColl = db.collection("branches");
  await branchesColl.deleteMany({});
  await branchesColl.insertMany([
    { branchCode: "MUM", branchName: "MUMBAI CENTRAL", city: "Mumbai", state: "Maharashtra", isHub: true, isActive: true },
    { branchCode: "DEL", branchName: "DELHI REGIONAL", city: "Delhi", state: "Delhi NCR", isHub: true, isActive: true },
    { branchCode: "BLR", branchName: "BANGALORE MAIN", city: "Bangalore", state: "Karnataka", isHub: false, isActive: true },
    { branchCode: "PUN", branchName: "PUNE HUB", city: "Pune", state: "Maharashtra", isHub: false, isActive: true },
    { branchCode: "AHM", branchName: "AHMEDABAD HUB", city: "Ahmedabad", state: "Gujarat", isHub: false, isActive: true }
  ]);
  console.log("Seeded 5 branches");

  // 3. Customers
  const custColl = db.collection("customers");
  await custColl.deleteMany({});
  await custColl.insertMany([
    {
      customerCode: "CUST-001",
      name: "TATA MOTORS LTD",
      customerType: "CORPORATE",
      pan: "AAACT2727Q",
      creditPeriod: 30,
      gstin: "27AAACT2727Q1ZW",
      city: "Mumbai",
      phone: "02266658282",
      isActive: true
    },
    {
      customerCode: "CUST-002",
      name: "RELIANCE INDUSTRIES LTD",
      customerType: "CORPORATE",
      pan: "AAACR5055K",
      creditPeriod: 45,
      gstin: "27AAACR5055K1Z8",
      city: "Navi Mumbai",
      phone: "02235555000",
      isActive: true
    },
    {
      customerCode: "CUST-003",
      name: "MAHINDRA & MAHINDRA",
      customerType: "CORPORATE",
      pan: "AAACM1234N",
      creditPeriod: 30,
      gstin: "27AAACM1234N1ZT",
      city: "Pune",
      phone: "02027473000",
      isActive: true
    },
    {
      customerCode: "CUST-004",
      name: "LARSEN & TOUBRO",
      customerType: "CORPORATE",
      pan: "AAACL5678P",
      creditPeriod: 60,
      gstin: "27AAACL5678P1ZQ",
      city: "Mumbai",
      phone: "02267525656",
      isActive: true
    }
  ]);
  console.log("Seeded 4 customers");

  // 4. Vendors
  const venColl = db.collection("vendors");
  await venColl.deleteMany({});
  await venColl.insertMany([
    {
      vendorCode: "VEN-001",
      name: "SHREE ROADWAYS",
      vendorType: "ATTACHED_VEHICLE",
      pan: "AAACS1234F",
      tdsApplicable: true,
      tdsRate: 1,
      approvalStatus: "APPROVED",
      bankName: "IndusInd Bank",
      accountNo: "201009876543",
      ifscCode: "INDB0000001",
      city: "Mumbai",
      isActive: true
    },
    {
      vendorCode: "VEN-002",
      name: "OM LOGISTICS FLEET",
      vendorType: "MARKET_VEHICLE",
      pan: "AAABO5678K",
      tdsApplicable: true,
      tdsRate: 2,
      approvalStatus: "APPROVED",
      bankName: "HDFC Bank",
      accountNo: "501002233445",
      ifscCode: "HDFC0000123",
      city: "Delhi",
      isActive: true
    }
  ]);
  console.log("Seeded 2 vendors");

  // 5. Vehicles
  const vehColl = db.collection("vehicles");
  await vehColl.deleteMany({});
  await vehColl.insertMany([
    { vehicleNumber: "MH04AB1234", vehicleType: "32 FT SXL", ownerType: "COMPANY", capacityTons: 9, driverName: "Ramesh Yadav", driverPhone: "9820012345", isActive: true },
    { vehicleNumber: "MH12CD5678", vehicleType: "20 FT CONTAINER", ownerType: "ATTACHED", capacityTons: 7, driverName: "Sanjay Patil", driverPhone: "9820054321", isActive: true },
    { vehicleNumber: "DL01EF9988", vehicleType: "14 FT EICHER", ownerType: "ATTACHED", capacityTons: 4, driverName: "Kuldeep Singh", driverPhone: "9811022334", isActive: true }
  ]);
  console.log("Seeded 3 vehicles");

  // 6. Consignments
  const conColl = db.collection("consignments");
  await conColl.deleteMany({});
  await conColl.insertMany([
    {
      docketNo: "ALC126001",
      bookingDate: new Date("2026-11-01"),
      bookingType: "NORMAL",
      bookingBranch: "MUM",
      billingParty: "TATA MOTORS LTD",
      paymentBasis: "TBB",
      serviceType: "FTL",
      serviceFtl: "32 FT SXL",
      fromLocation: "MUMBAI",
      toLocation: "DELHI",
      vehicleNo: "MH04AB1234",
      driverPhone: "9820012345",
      consignor: { name: "TATA MOTORS LOGISTICS DIV", address: "MIDC Bhosari", city: "PUNE", pincode: "411026" },
      consignee: { name: "MARUTI SUZUKI WAREHOUSE", address: "Udyog Vihar", city: "GURUGRAM", pincode: "122015" },
      packageDetails: { packageType: "BOX", productDescription: "AUTOMOBILE SPARE PARTS", packagesCount: 120, actualWeight: 4800, chargedWeight: 5000 },
      financials: { freightAmount: 42500, loadingCharge: 1500, subTotal: 44000, gstRate: 5, gstAmount: 2200, grandTotal: 46200 },
      ewayBillNo: "241098765432",
      status: "DELIVERED",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      docketNo: "ALC126002",
      bookingDate: new Date("2026-11-02"),
      bookingType: "NORMAL",
      bookingBranch: "MUM",
      billingParty: "RELIANCE INDUSTRIES LTD",
      paymentBasis: "TBB",
      serviceType: "FTL",
      serviceFtl: "20 FT CONTAINER",
      fromLocation: "MUMBAI",
      toLocation: "BANGALORE",
      vehicleNo: "MH12CD5678",
      driverPhone: "9820054321",
      consignor: { name: "RELIANCE POLYMERS", address: "Patalganga", city: "RAIGAD", pincode: "410220" },
      consignee: { name: "INFOSYS TECH PARK WAREHOUSE", address: "Electronic City", city: "BANGALORE", pincode: "560100" },
      packageDetails: { packageType: "PALLET", productDescription: "INDUSTRIAL CHEMICAL DRUMS", packagesCount: 40, actualWeight: 6500, chargedWeight: 7000 },
      financials: { freightAmount: 52000, loadingCharge: 2000, subTotal: 54000, gstRate: 5, gstAmount: 2700, grandTotal: 56700 },
      ewayBillNo: "241098765999",
      status: "IN_TRANSIT",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      docketNo: "ALC126003",
      bookingDate: new Date("2026-11-03"),
      bookingType: "NORMAL",
      bookingBranch: "MUM",
      billingParty: "MAHINDRA & MAHINDRA",
      paymentBasis: "TBB",
      serviceType: "FTL",
      serviceFtl: "32 FT SXL",
      fromLocation: "PUNE",
      toLocation: "DELHI",
      vehicleNo: "MH04AB1234",
      consignor: { name: "MAHINDRA CHAKAN PLANT", address: "Chakan Industrial Area", city: "PUNE" },
      consignee: { name: "MAHINDRA SPARES DEPOT", address: "Okhla Phase 3", city: "DELHI" },
      packageDetails: { packageType: "WOODEN_CRATE", productDescription: "TRACTOR TRANSMISSION UNITS", packagesCount: 15, actualWeight: 8200, chargedWeight: 8500 },
      financials: { freightAmount: 68000, loadingCharge: 2500, subTotal: 70500, gstRate: 5, gstAmount: 3525, grandTotal: 74025 },
      ewayBillNo: "241098765111",
      status: "BOOKED",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  console.log("Seeded 3 consignments");

  // 7. Bank Operations
  const bankColl = db.collection("bankoperations");
  await bankColl.deleteMany({});
  await bankColl.insertOne({
    transactionId: "TXN-1730725200",
    bankName: "IndusInd Bank",
    accountNumber: "201002938471",
    operationType: "ONLINE_PAYMENT",
    beneficiaryName: "SHREE ROADWAYS (ATTACHED VENDOR)",
    amount: 35000,
    utrNumber: "INDBR2026881923",
    status: "SUCCESS",
    isSimulated: true,
    notes: "Trip Advance - Mumbai to Delhi",
    createdAt: new Date()
  });
  console.log("Seeded simulated bank record");

  console.log("\nDATABASE SEEDING COMPLETED SUCCESSFULLY!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});

