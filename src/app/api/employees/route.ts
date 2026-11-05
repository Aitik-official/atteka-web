import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { memoryStore } from "@/lib/memoryStore";

const FALLBACK_EMPLOYEES = [
  {
    _id: "emp-al002",
    employeeCode: "AL002",
    employeePref: "Miss",
    employeeName: "ANISHA OZARKAR",
    password: "********",
    gender: "FeMale",
    dateOfBirth: "2003-02-03",
    empStatus: "",
    qualification: "graduate",
    designation: "ACCOUNT",
    isActive: true,
    languageKnown: "English",
    managerId: "AL001",
    managerName: "Anjani",
    currentLocationCode: "ALC1",
    accessLocationCodes: ["ALC1"],
    dateOfJoining: "2022-04-01",
    residentialAddress: "",
    email: "ANISHAOZARKAR@GMAIL.COM",
    residentPhoneNo: "",
    mobileNo: "",
    additionalMobileNo: "",
    companyEmailId: "",
    emailPassword: "",
    defaultPage: "Accounts"
  },
  {
    _id: "emp-al003",
    employeeCode: "AL003",
    employeePref: "Mr",
    employeeName: "JAVED ZAVI AHMAD",
    gender: "Male",
    dateOfBirth: "1984-01-01",
    empStatus: "ACTIVE",
    designation: "DIRECTER",
    isActive: true,
    languageKnown: "English",
    managerId: "AL001",
    managerName: "Anjani",
    currentLocationCode: "ALC1",
    accessLocationCodes: ["ALC1"],
    dateOfJoining: "2018-01-15",
    email: "",
    mobileNo: ""
  },
  {
    _id: "emp-al004",
    employeeCode: "AL004",
    employeePref: "Ms",
    employeeName: "SUJATA LAXMAN DANDILE",
    gender: "Female",
    dateOfBirth: "2005-03-15",
    empStatus: "ACTIVE",
    designation: "",
    isActive: true,
    languageKnown: "English",
    managerId: "AL003",
    managerName: "JAVED ZAVI AHMAD",
    currentLocationCode: "ALC1",
    accessLocationCodes: ["ALC1"],
    dateOfJoining: "2024-06-01",
    email: "",
    mobileNo: ""
  },
  {
    _id: "emp-al005",
    employeeCode: "AL005",
    employeePref: "Mr",
    employeeName: "ZAID",
    gender: "Male",
    dateOfBirth: "1989-01-02",
    empStatus: "ACTIVE",
    designation: "OFFICE MANAGAR",
    isActive: true,
    languageKnown: "English",
    managerId: "AL003",
    managerName: "JAVED ZAVI AHMAD",
    currentLocationCode: "ALC1",
    accessLocationCodes: ["ALC1"],
    dateOfJoining: "2020-08-10",
    email: "KAMALSINGH@ATEKALOGISTICS.COM",
    mobileNo: ""
  },
  {
    _id: "emp-al006",
    employeeCode: "AL006",
    employeePref: "Mr",
    employeeName: "MD AYAN",
    gender: "Male",
    dateOfBirth: "2005-01-01",
    empStatus: "ACTIVE",
    designation: "",
    isActive: true,
    languageKnown: "English",
    managerId: "",
    managerName: "",
    currentLocationCode: "ALC1",
    accessLocationCodes: ["ALC1"],
    dateOfJoining: "2025-01-01",
    email: "",
    mobileNo: ""
  },
  {
    _id: "emp-p0001",
    employeeCode: "P0001",
    employeePref: "Mr",
    employeeName: "UDAY",
    gender: "Male",
    dateOfBirth: "2025-10-01",
    empStatus: "ACTIVE",
    designation: "",
    isActive: true,
    languageKnown: "English",
    managerId: "",
    managerName: "",
    currentLocationCode: "ALC1",
    accessLocationCodes: ["ALC1"],
    dateOfJoining: "2025-10-01",
    email: "",
    mobileNo: ""
  }
];

function ensureMemoryEmployees() {
  if (!Array.isArray((memoryStore as any).employees) || (memoryStore as any).employees.length === 0) {
    (memoryStore as any).employees = [...FALLBACK_EMPLOYEES];
  }
  return (memoryStore as any).employees as any[];
}

function normalizePayload(body: any) {
  const accessRaw = body.accessLocationCodes ?? body.locationAccess ?? [];
  const accessLocationCodes = Array.isArray(accessRaw)
    ? accessRaw.map((c: string) => String(c).trim().toUpperCase()).filter(Boolean)
    : String(accessRaw || "")
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

  return {
    employeeCode: String(body.employeeCode || "").trim().toUpperCase(),
    employeePref: body.employeePref || "",
    employeeName: String(body.employeeName || "").trim().toUpperCase(),
    password: body.password || undefined,
    gender: body.gender || "",
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
    empStatus: body.empStatus || "ACTIVE",
    qualification: body.qualification || "",
    designation: String(body.designation || "").trim().toUpperCase(),
    isActive: body.isActive !== false && body.employeeActive !== false,
    languageKnown: body.languageKnown || "English",
    managerId: String(body.managerId || "").trim().toUpperCase(),
    managerName: body.managerName || "",
    currentLocationCode: String(body.currentLocationCode || "").trim().toUpperCase(),
    accessLocationCodes,
    dateStartingCurrentLocation: body.dateStartingCurrentLocation
      ? new Date(body.dateStartingCurrentLocation)
      : undefined,
    dateOfJoining: body.dateOfJoining ? new Date(body.dateOfJoining) : undefined,
    dateOfLeaving: body.dateOfLeaving ? new Date(body.dateOfLeaving) : undefined,
    residentialAddress: body.residentialAddress || "",
    email: String(body.email || body.emailId || body.personalEmailId || "").trim().toUpperCase(),
    residentPhoneNo: body.residentPhoneNo || "",
    mobileNo: body.mobileNo || "",
    additionalMobileNo: body.additionalMobileNo || "",
    companyEmailId: String(body.companyEmailId || "").trim().toUpperCase(),
    emailPassword: body.emailPassword || undefined,
    defaultPage: body.defaultPage || "Accounts"
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    let list = await Employee.find().sort({ employeeCode: 1 });
    if (list.length === 0) {
      try {
        await Employee.insertMany(
          FALLBACK_EMPLOYEES.map(({ _id, ...rest }) => ({
            ...rest,
            dateOfBirth: rest.dateOfBirth ? new Date(rest.dateOfBirth) : undefined,
            dateOfJoining: rest.dateOfJoining ? new Date(rest.dateOfJoining) : undefined
          })),
          { ordered: false }
        );
      } catch {
        // ignore seed races
      }
      list = await Employee.find().sort({ employeeCode: 1 });
    }
    if (list.length === 0) {
      return NextResponse.json({ success: true, data: FALLBACK_EMPLOYEES, isFallback: true });
    }
    return NextResponse.json({ success: true, data: list });
  } catch {
    return NextResponse.json({
      success: true,
      data: ensureMemoryEmployees(),
      isMemoryStore: true
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = normalizePayload(body);
    if (!payload.employeeCode || !payload.employeeName) {
      return NextResponse.json({ error: "Employee Code and Employee Name are required" }, { status: 400 });
    }

    // Resolve manager name from managerId if needed
    if (payload.managerId && !payload.managerName) {
      try {
        await connectToDatabase();
        const mgr = await Employee.findOne({ employeeCode: payload.managerId });
        if (mgr) payload.managerName = mgr.employeeName;
      } catch {
        const mem = ensureMemoryEmployees();
        const mgr = mem.find((e) => e.employeeCode === payload.managerId);
        if (mgr) payload.managerName = mgr.employeeName;
      }
    }

    try {
      await connectToDatabase();
      const created = await Employee.create(payload);
      const mem = ensureMemoryEmployees();
      mem.unshift({ ...payload, _id: String(created._id) });
      return NextResponse.json({ success: true, message: "Employee saved", data: created }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ error: "Employee Code already exists" }, { status: 409 });
      }
      const mem = ensureMemoryEmployees();
      if (mem.some((e) => e.employeeCode === payload.employeeCode)) {
        return NextResponse.json({ error: "Employee Code already exists" }, { status: 409 });
      }
      const record = { ...payload, _id: `emp-${Date.now()}` };
      mem.unshift(record);
      return NextResponse.json({
        success: true,
        message: "Employee saved (Memory Store)",
        data: record,
        isMemoryStore: true
      }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { _id } = body;
    const payload = normalizePayload(body);
    if (!payload.employeeCode && !_id) {
      return NextResponse.json({ error: "Employee identifier is required" }, { status: 400 });
    }

    if (payload.managerId && !payload.managerName) {
      try {
        await connectToDatabase();
        const mgr = await Employee.findOne({ employeeCode: payload.managerId });
        if (mgr) payload.managerName = mgr.employeeName;
      } catch {
        const mem = ensureMemoryEmployees();
        const mgr = mem.find((e) => e.employeeCode === payload.managerId);
        if (mgr) payload.managerName = mgr.employeeName;
      }
    }

    // Don't overwrite password with empty
    if (!payload.password) delete (payload as any).password;

    try {
      await connectToDatabase();
      const query = _id ? { _id } : { employeeCode: payload.employeeCode };
      const updated = await Employee.findOneAndUpdate(query, { $set: payload }, { new: true });
      if (!updated) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      const mem = ensureMemoryEmployees();
      const idx = mem.findIndex((e) => e._id === String(updated._id) || e.employeeCode === updated.employeeCode);
      if (idx >= 0) mem[idx] = { ...mem[idx], ...payload, _id: String(updated._id) };
      return NextResponse.json({ success: true, message: "Employee updated", data: updated });
    } catch {
      const mem = ensureMemoryEmployees();
      const idx = mem.findIndex((e) => (_id && e._id === _id) || e.employeeCode === payload.employeeCode);
      if (idx === -1) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      mem[idx] = { ...mem[idx], ...payload };
      return NextResponse.json({
        success: true,
        message: "Employee updated (Memory Store)",
        data: mem[idx],
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
