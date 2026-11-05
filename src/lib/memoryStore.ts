/**
 * In-Memory Mock Repository Fallback
 * Provides instant operational persistence when local MongoDB daemon is not active.
 */

export interface MockConsignment {
  _id: string;
  docketNo: string;
  bookingDate: string;
  bookingType: string;
  bookingBranch: string;
  billingParty: string;
  paymentBasis: string;
  serviceType: string;
  serviceFtl?: string;
  fromLocation: string;
  toLocation: string;
  vehicleNo?: string;
  driverPhone?: string;
  consignor: { name: string; address?: string; city?: string; pincode?: string };
  consignee: { name: string; address?: string; city?: string; pincode?: string };
  packageDetails: { packageType: string; productDescription: string; packagesCount: number; actualWeight: number; chargedWeight: number };
  financials: { freightAmount: number; loadingCharge: number; subTotal: number; gstRate: number; gstAmount: number; grandTotal: number };
  ewayBillNo?: string;
  status: string;
  podUrl?: string;
  tripSheetNo?: string;
}

const initialConsignments: MockConsignment[] = [
  {
    _id: "c-001",
    docketNo: "ALC126001",
    bookingDate: "2026-11-01",
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
    podUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80"
  },
  {
    _id: "c-002",
    docketNo: "ALC126002",
    bookingDate: "2026-11-02",
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
    status: "IN_TRANSIT"
  },
  {
    _id: "c-003",
    docketNo: "ALC126003",
    bookingDate: "2026-11-03",
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
    status: "BOOKED"
  }
];

export interface MockDocketNumber {
  _id: string;
  docketNo: string;
  seriesPrefix: string;
  sequenceNo: number;
  branchCode?: string;
  status: "AVAILABLE" | "RESERVED" | "ASSIGNED" | "CANCELLED";
  assignedToCnId?: string;
  assignedAt?: string;
  notes?: string;
  createdAt: string;
}

const seedDocketNumbers = (): MockDocketNumber[] => {
  const prefix = "ALC126";
  const list: MockDocketNumber[] = [];
  for (let i = 10; i <= 25; i++) {
    list.push({
      _id: `dn-${i}`,
      docketNo: `${prefix}${String(i).padStart(4, "0")}`,
      seriesPrefix: prefix,
      sequenceNo: i,
      branchCode: "ALC1",
      status: "AVAILABLE",
      createdAt: new Date().toISOString()
    });
  }
  return list;
};

class MemoryStore {
  consignments: MockConsignment[] = [...initialConsignments];
  bills: any[] = [];
  receipts: any[] = [];
  bankOps: any[] = [];
  tripSheets: any[] = [];
  branches: any[] = [];
  employees: any[] = [];
  routes: any[] = [];
  ftlTypes: any[] = [];
  vehicles: any[] = [];
  sacCodes: any[] = [];
  docketNumbers: MockDocketNumber[] = seedDocketNumbers();
  docketSeries = {
    seriesKey: "DEFAULT",
    prefix: "ALC126",
    padLength: 4,
    nextSequence: 26,
    branchCode: "ALC1",
    isActive: true,
    description: "Primary CN / Docket stationery series"
  };

  addConsignment(c: any) {
    const record = { ...c, _id: `c-${Date.now()}` };
    this.consignments.unshift(record);
    return record;
  }

  updateConsignment(idOrDocket: string, updates: any) {
    const clean = (idOrDocket || "").toUpperCase();
    const idx = this.consignments.findIndex(
      (c) => c._id === idOrDocket || c.docketNo?.toUpperCase() === clean
    );
    if (idx === -1) return null;
    this.consignments[idx] = { ...this.consignments[idx], ...updates };
    return this.consignments[idx];
  }

  getConsignments() {
    return this.consignments;
  }

  getDocketNumbers(status?: string) {
    if (!status) return this.docketNumbers;
    return this.docketNumbers.filter((d) => d.status === status);
  }

  generateDocketNumbers(count = 1) {
    const created: MockDocketNumber[] = [];
    for (let i = 0; i < count; i++) {
      const seq = this.docketSeries.nextSequence++;
      const docketNo = `${this.docketSeries.prefix}${String(seq).padStart(this.docketSeries.padLength, "0")}`;
      const record: MockDocketNumber = {
        _id: `dn-${Date.now()}-${seq}`,
        docketNo,
        seriesPrefix: this.docketSeries.prefix,
        sequenceNo: seq,
        branchCode: this.docketSeries.branchCode,
        status: "AVAILABLE",
        createdAt: new Date().toISOString()
      };
      this.docketNumbers.unshift(record);
      created.push(record);
    }
    return created;
  }

  assignDocketNumber(docketNo: string, cnId?: string) {
    const clean = docketNo.toUpperCase();
    const item = this.docketNumbers.find((d) => d.docketNo === clean);
    if (!item || item.status !== "AVAILABLE") return null;
    item.status = "ASSIGNED";
    item.assignedToCnId = cnId;
    item.assignedAt = new Date().toISOString();
    return item;
  }
}

declare global {
  var memoryStoreInstance: MemoryStore | undefined;
}

export const memoryStore = global.memoryStoreInstance || (global.memoryStoreInstance = new MemoryStore());

// Hot-reload may keep an older singleton that predates newer collections
if (!Array.isArray((memoryStore as any).tripSheets)) {
  (memoryStore as any).tripSheets = [];
}
if (!Array.isArray((memoryStore as any).branches)) {
  (memoryStore as any).branches = [];
}
if (!Array.isArray((memoryStore as any).employees)) {
  (memoryStore as any).employees = [];
}
if (!Array.isArray((memoryStore as any).routes)) {
  (memoryStore as any).routes = [];
}
if (!Array.isArray((memoryStore as any).ftlTypes)) {
  (memoryStore as any).ftlTypes = [];
}
if (!Array.isArray((memoryStore as any).vehicles)) {
  (memoryStore as any).vehicles = [];
}
if (!Array.isArray((memoryStore as any).sacCodes)) {
  (memoryStore as any).sacCodes = [];
}

