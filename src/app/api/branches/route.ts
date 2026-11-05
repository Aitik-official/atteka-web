import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Branch } from "@/models/Branch";
import { memoryStore } from "@/lib/memoryStore";

const FALLBACK_BRANCHES = [
  {
    _id: "br-alc1",
    locationHierarchy: "BRANCH",
    branchCode: "ALC1",
    branchName: "Ateka Logistics",
    state: "Maharashtra",
    city: "Kalamboli",
    pincode: "410218",
    gstin: "27HGTPS8288C1ZD",
    address: "C-342, 3RD FLOOR, DISHMA COMPLEX, STEEL MARKET, KALAMBOLI",
    phone: "9820012345",
    email: "alc1@atteka.com",
    isHub: true,
    isActive: true
  },
  {
    _id: "br-mum",
    locationHierarchy: "BRANCH",
    branchCode: "MUM",
    branchName: "MUMBAI CENTRAL",
    state: "Maharashtra",
    city: "Mumbai",
    pincode: "400001",
    gstin: "27AAAAA0000A1Z5",
    address: "Mumbai Central Hub",
    isHub: true,
    isActive: true
  },
  {
    _id: "br-del",
    locationHierarchy: "BRANCH",
    branchCode: "DEL",
    branchName: "DELHI REGIONAL",
    state: "Delhi",
    city: "Delhi",
    pincode: "110001",
    isHub: true,
    isActive: true
  },
  {
    _id: "br-blr",
    locationHierarchy: "BRANCH",
    branchCode: "BLR",
    branchName: "BANGALORE MAIN",
    state: "Karnataka",
    city: "Bangalore",
    pincode: "560001",
    isHub: false,
    isActive: true
  },
  {
    _id: "br-pun",
    locationHierarchy: "BRANCH",
    branchCode: "PUN",
    branchName: "PUNE HUB",
    state: "Maharashtra",
    city: "Pune",
    pincode: "411001",
    isHub: false,
    isActive: true
  }
];

function ensureMemoryBranches() {
  if (!Array.isArray((memoryStore as any).branches)) {
    (memoryStore as any).branches = [...FALLBACK_BRANCHES];
  }
  return (memoryStore as any).branches as any[];
}

function normalizeBranchPayload(body: any) {
  const branchCode = String(body.branchCode || "").trim().toUpperCase();
  const branchName = String(body.branchName || body.locationName || "").trim();
  return {
    locationHierarchy: String(body.locationHierarchy || "BRANCH").trim().toUpperCase(),
    branchCode,
    branchName,
    state: body.state || "",
    city: body.city || "",
    pincode: body.pincode || body.pinCode || "",
    gstin: String(body.gstin || body.gstNo || "").trim().toUpperCase(),
    gstRegistrationDate: body.gstRegistrationDate ? new Date(body.gstRegistrationDate) : undefined,
    address: body.address || "",
    latitude: body.latitude || "",
    longitude: body.longitude || "",
    stdCode: body.stdCode || "",
    telNo: body.telNo || "",
    faxNo: body.faxNo || "",
    phone: body.phone || body.mobileNo || "",
    email: body.email || body.emailId || "",
    branchSealUrl: body.branchSealUrl || "",
    regionBranch: body.regionBranch || "",
    esicCode: body.esicCode || "",
    isHub: body.locationHierarchy === "HUB" || body.isHub === true,
    isActive: body.isActive !== false && body.branchActive !== false
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    let branches = await Branch.find().sort({ branchName: 1 });
    if (branches.length === 0) {
      try {
        await Branch.insertMany(FALLBACK_BRANCHES.map(({ _id, ...rest }) => rest), { ordered: false });
      } catch {
        // ignore seed races
      }
      branches = await Branch.find().sort({ branchName: 1 });
    }
    if (branches.length === 0) {
      return NextResponse.json({ success: true, data: FALLBACK_BRANCHES, isFallback: true });
    }
    return NextResponse.json({ success: true, data: branches });
  } catch {
    const list = ensureMemoryBranches();
    return NextResponse.json({ success: true, data: list, isMemoryStore: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = normalizeBranchPayload(body);
    if (!payload.branchCode || !payload.branchName) {
      return NextResponse.json({ error: "Location Code and Location Name are required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const newBranch = await Branch.create(payload);
      // keep memory in sync
      const mem = ensureMemoryBranches();
      mem.unshift({ ...payload, _id: String(newBranch._id) });
      return NextResponse.json({ success: true, message: "Location saved", data: newBranch }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ error: "Location Code already exists" }, { status: 409 });
      }
      const mem = ensureMemoryBranches();
      if (mem.some((b) => b.branchCode === payload.branchCode)) {
        return NextResponse.json({ error: "Location Code already exists" }, { status: 409 });
      }
      const record = { ...payload, _id: `br-${Date.now()}` };
      mem.unshift(record);
      return NextResponse.json({
        success: true,
        message: "Location saved (Memory Store)",
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
    const payload = normalizeBranchPayload(body);
    if (!payload.branchCode && !_id) {
      return NextResponse.json({ error: "Location identifier is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const query = _id ? { _id } : { branchCode: payload.branchCode };
      const updated = await Branch.findOneAndUpdate(query, { $set: payload }, { new: true });
      if (!updated) {
        return NextResponse.json({ error: "Branch not found" }, { status: 404 });
      }
      const mem = ensureMemoryBranches();
      const idx = mem.findIndex((b) => b._id === String(updated._id) || b.branchCode === updated.branchCode);
      if (idx >= 0) mem[idx] = { ...mem[idx], ...payload, _id: String(updated._id) };
      return NextResponse.json({ success: true, message: "Location updated", data: updated });
    } catch {
      const mem = ensureMemoryBranches();
      const idx = mem.findIndex((b) => (_id && b._id === _id) || b.branchCode === payload.branchCode);
      if (idx === -1) {
        return NextResponse.json({ error: "Branch not found" }, { status: 404 });
      }
      mem[idx] = { ...mem[idx], ...payload };
      return NextResponse.json({
        success: true,
        message: "Location updated (Memory Store)",
        data: mem[idx],
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
