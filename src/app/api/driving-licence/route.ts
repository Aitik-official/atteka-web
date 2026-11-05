import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/memoryStore";

const SEED_DRIVERS = [
  {
    id: "dl-1",
    fullName: "RAJESH KUMAR YADAV",
    licence: "MH0220160049281",
    licenceValidFrom: "14-04-2016",
    licenceValidTo: "13-04-2031",
    dateOfBirth: "12-08-1988",
    address1: "FLAT 12, SHANTI NAGAR",
    address2: "ANDHERI WEST",
    address3: "MUMBAI - 400058",
    profilePicture: "",
    vehicleClasses: "LMV, TRANS, HMV",
    rto: "MH02 - MUMBAI WEST",
    status: "ACTIVE"
  },
  {
    id: "dl-2",
    fullName: "RAMESH PATIL",
    licence: "MH0420140077122",
    licenceValidFrom: "01-06-2014",
    licenceValidTo: "31-05-2029",
    dateOfBirth: "05-03-1985",
    address1: "B-204, SECTOR 15",
    address2: "VASHI",
    address3: "NAVI MUMBAI - 400703",
    profilePicture: "",
    vehicleClasses: "LMV, HMV",
    rto: "MH04 - THANE",
    status: "ACTIVE"
  },
  {
    id: "dl-3",
    fullName: "SURESH YADAV",
    licence: "MH1220180033411",
    licenceValidFrom: "20-01-2018",
    licenceValidTo: "19-01-2033",
    dateOfBirth: "22-11-1990",
    address1: "NEAR MARKET YARD",
    address2: "HADAPSAR",
    address3: "PUNE - 411028",
    profilePicture: "",
    vehicleClasses: "LMV",
    rto: "MH12 - PUNE",
    status: "ACTIVE"
  },
  {
    id: "dl-4",
    fullName: "VIJAY MORE",
    licence: "MH0420190088991",
    licenceValidFrom: "10-09-2019",
    licenceValidTo: "09-09-2034",
    dateOfBirth: "15-07-1992",
    address1: "ROOM 8, LABOUR CAMP",
    address2: "KALAMBOLI",
    address3: "RAIGAD - 410218",
    profilePicture: "",
    vehicleClasses: "LMV, TRANS",
    rto: "MH04 - THANE",
    status: "ACTIVE"
  }
];

function ensureDrivers() {
  if (!Array.isArray((memoryStore as any).drivingLicences) || (memoryStore as any).drivingLicences.length === 0) {
    (memoryStore as any).drivingLicences = [...SEED_DRIVERS];
  }
  return (memoryStore as any).drivingLicences as any[];
}

function normalizeDob(input: string) {
  const raw = String(input || "").trim();
  // Accept dd-mm-yyyy or yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-");
    return `${d}-${m}-${y}`;
  }
  return raw;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dob = normalizeDob(searchParams.get("dob") || "");
  const q = (searchParams.get("q") || searchParams.get("search") || "").trim().toLowerCase();
  const licence = (searchParams.get("licence") || "").trim().toUpperCase();

  const list = ensureDrivers();
  let results = [...list];

  if (dob) {
    results = results.filter((d) => d.dateOfBirth === dob);
  }
  if (licence) {
    results = results.filter((d) => String(d.licence).toUpperCase().includes(licence));
  }
  if (q) {
    results = results.filter(
      (d) =>
        String(d.fullName).toLowerCase().includes(q) ||
        String(d.licence).toLowerCase().includes(q) ||
        String(d.address1).toLowerCase().includes(q) ||
        String(d.address2).toLowerCase().includes(q) ||
        String(d.address3).toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
    isMemoryStore: true
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const list = ensureDrivers();
    const record = {
      id: `dl-${Date.now()}`,
      fullName: String(body.fullName || "").trim().toUpperCase(),
      licence: String(body.licence || "").trim().toUpperCase(),
      licenceValidFrom: body.licenceValidFrom || "",
      licenceValidTo: body.licenceValidTo || "",
      dateOfBirth: normalizeDob(body.dateOfBirth || ""),
      address1: body.address1 || "",
      address2: body.address2 || "",
      address3: body.address3 || "",
      profilePicture: body.profilePicture || "",
      vehicleClasses: body.vehicleClasses || "LMV",
      rto: body.rto || "",
      status: "ACTIVE"
    };
    if (!record.licence || !record.fullName) {
      return NextResponse.json({ error: "Full Name and Licence are required" }, { status: 400 });
    }
    list.unshift(record);
    return NextResponse.json({ success: true, message: "Driving licence record saved", data: record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
