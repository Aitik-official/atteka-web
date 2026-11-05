import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Vendor } from "@/models/Vendor";
import { memoryStore } from "@/lib/memoryStore";

const FALLBACK_VENDORS = [
  {
    _id: "v-046",
    vendorCode: "V00046",
    name: "A S MOTORS",
    vendorType: "OWN Company vehicle",
    pan: "ABJFA8327Q",
    gstNo: "",
    accountNo: "",
    ifscCode: "",
    bankName: "",
    bankAccountName: "",
    phone: "",
    email: "",
    isActive: true,
    approvalStatus: "APPROVED",
    tdsApplicable: true
  },
  {
    _id: "v-009",
    vendorCode: "V00009",
    name: "ANISHA OZARKAR",
    vendorType: "MARKET",
    pan: "AGTPO8684R",
    gstNo: "",
    accountNo: "68020819453",
    ifscCode: "MAHB0001154",
    bankName: "BANK OF MAHARASHTRA",
    bankAccountName: "ANISHA OZARKAR",
    phone: "9820012345",
    email: "",
    isActive: true,
    approvalStatus: "APPROVED",
    tdsApplicable: true
  },
  {
    _id: "v-001",
    vendorCode: "C001",
    name: "TEST TRANSPORT",
    vendorType: "OWN Company vehicle",
    pan: "ABCDE1234F",
    gstNo: "27ABCDE1234F1Z5",
    accountNo: "123456789012",
    ifscCode: "SBIN0001234",
    bankName: "STATE BANK OF INDIA",
    bankAccountName: "TEST TRANSPORT",
    phone: "9876543210",
    email: "test@transport.com",
    city: "Mumbai",
    isActive: true,
    approvalStatus: "APPROVED",
    tdsApplicable: true
  },
  {
    _id: "v-002",
    vendorCode: "V00002",
    name: "SHREE GANESH LOGISTICS",
    vendorType: "OTHERS",
    pan: "AABCG5678K",
    gstNo: "",
    accountNo: "998877665544",
    ifscCode: "HDFC0001234",
    bankName: "HDFC BANK",
    bankAccountName: "SHREE GANESH LOGISTICS",
    phone: "9811122233",
    email: "",
    isActive: true,
    approvalStatus: "APPROVED",
    tdsApplicable: false
  },
  {
    _id: "v-003",
    vendorCode: "V00003",
    name: "OM SAI CARRIERS",
    vendorType: "MARKET",
    pan: "AAACO9988P",
    accountNo: "556677889900",
    ifscCode: "ICIC0000456",
    bankName: "ICICI BANK",
    bankAccountName: "OM SAI CARRIERS",
    phone: "9900011122",
    isActive: true,
    approvalStatus: "APPROVED",
    tdsApplicable: true
  },
  {
    _id: "v-004",
    vendorCode: "V00004",
    name: "EAST WEST FLEET",
    vendorType: "OWN Company vehicle",
    pan: "AAACE1122M",
    accountNo: "",
    ifscCode: "",
    bankName: "",
    bankAccountName: "",
    phone: "9887766554",
    isActive: true,
    approvalStatus: "APPROVED",
    tdsApplicable: true
  },
  {
    _id: "v-005",
    vendorCode: "V00005",
    name: "BLUE STAR TRANSPORT",
    vendorType: "OTHERS",
    pan: "AABCB3344N",
    accountNo: "112233445566",
    ifscCode: "PUNB0123456",
    bankName: "PUNJAB NATIONAL BANK",
    bankAccountName: "BLUE STAR TRANSPORT",
    phone: "",
    isActive: true,
    approvalStatus: "APPROVED",
    tdsApplicable: true
  },
  {
    _id: "v-pend-1",
    vendorCode: "V00051",
    name: "KALYAN ROADWAYS",
    vendorType: "MARKET",
    pan: "AABCK7788L",
    accountNo: "445566778899",
    ifscCode: "HDFC0002211",
    bankName: "HDFC BANK",
    bankAccountName: "KALYAN ROADWAYS",
    locationName: "Ateka Logistics - ALC1",
    contactPerson: "SURESH PATIL",
    phone: "9876501234",
    remark: "New market vendor — docs pending review",
    isActive: true,
    approvalStatus: "PENDING",
    tdsApplicable: true
  },
  {
    _id: "v-pend-2",
    vendorCode: "V00052",
    name: "NAVKAR LOGISTICS LLP",
    vendorType: "OTHERS",
    pan: "AADFN5566P",
    accountNo: "998800112233",
    ifscCode: "SBIN0007788",
    bankName: "STATE BANK OF INDIA",
    bankAccountName: "NAVKAR LOGISTICS LLP",
    locationName: "MUMBAI CENTRAL - MUM",
    contactPerson: "ANIL SHAH",
    phone: "9812345670",
    remark: "Awaiting cancelled cheque copy",
    isActive: true,
    approvalStatus: "PENDING",
    tdsApplicable: true
  }
];

function ensureMemory() {
  if (!Array.isArray((memoryStore as any).vendorsList) || (memoryStore as any).vendorsList.length === 0) {
    (memoryStore as any).vendorsList = [...FALLBACK_VENDORS];
  }
  return (memoryStore as any).vendorsList as any[];
}

function nextVendorCode(list: { vendorCode?: string }[]) {
  const nums = list
    .map((v) => String(v.vendorCode || "").match(/V0*(\d+)/i)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `V${String(next).padStart(5, "0")}`;
}

function normalize(body: any, vendorCode?: string) {
  return {
    vendorCode: String(body.vendorCode || vendorCode || "AUTO").trim().toUpperCase(),
    name: String(body.name || body.vendorName || "").trim().toUpperCase(),
    vendorType: String(body.vendorType || "MARKET").trim(),
    gstNo: String(body.gstNo || "").trim().toUpperCase(),
    pan: String(body.pan || body.panNo || "").trim().toUpperCase(),
    address: body.address || "",
    password: body.password || undefined,
    vendorRating: Number(body.vendorRating) || 1,
    smsAlert: body.smsAlert !== false,
    whatsappAlert: body.whatsappAlert !== false,
    emailAlert: body.emailAlert !== false,
    locationName: body.locationName || "",
    contactPerson: body.contactPerson || "",
    city: body.city || "",
    pincode: body.pincode || body.pinCode || "",
    phone: body.phone || body.mobile || body.contactNo || "",
    email: body.email || body.emailId || "",
    accountNo: body.accountNo || "",
    ifscCode: String(body.ifscCode || "").trim().toUpperCase(),
    bankName: String(body.bankName || "").trim().toUpperCase(),
    bankAccountName: String(body.bankAccountName || body.vendorNameBank || "").trim().toUpperCase(),
    bankBeneficiary: body.bankBeneficiary || body.beneficiary || "",
    autoPay: body.autoPay !== false,
    sec194c6Received: body.sec194c6Received !== false,
    tdsApplicable: body.tdsApplicable !== false,
    tdsRate: Number(body.tdsRate) || 0,
    cancelledChequeCopy: body.cancelledChequeCopy || "",
    panDeclarationCopy: body.panDeclarationCopy || "",
    msmeApplicable: body.msmeApplicable !== false,
    msmeNo: String(body.msmeNo || "").trim().toUpperCase(),
    msmeType: body.msmeType || "Micro",
    remark: body.remark || "",
    approvalStatus: body.approvalStatus || "PENDING",
    isActive: body.isActive !== false && body.active !== false
  };
}

/** Bulk approve / reject */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const codes: string[] = Array.isArray(body.vendorCodes)
      ? body.vendorCodes.map((c: any) => String(c).trim().toUpperCase()).filter(Boolean)
      : [];
    const status = String(body.approvalStatus || "").toUpperCase();
    if (codes.length === 0) {
      return NextResponse.json({ error: "Select at least one vendor" }, { status: 400 });
    }
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid approval status" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      await Vendor.updateMany({ vendorCode: { $in: codes } }, { $set: { approvalStatus: status } });
      const mem = ensureMemory();
      for (const c of codes) {
        const idx = mem.findIndex((v) => v.vendorCode === c);
        if (idx >= 0) mem[idx].approvalStatus = status;
      }
      return NextResponse.json({
        success: true,
        message: `${codes.length} vendor(s) marked ${status}`,
        count: codes.length
      });
    } catch {
      const mem = ensureMemory();
      let count = 0;
      for (const c of codes) {
        const idx = mem.findIndex((v) => v.vendorCode === c);
        if (idx >= 0) {
          mem[idx].approvalStatus = status;
          count++;
        }
      }
      return NextResponse.json({
        success: true,
        message: `${count} vendor(s) marked ${status} (Memory Store)`,
        count,
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function applyFilters(list: any[], search: string | null, status: string | null) {
  let next = [...list];
  if (status) {
    next = next.filter((v) => String(v.approvalStatus || "APPROVED").toUpperCase() === status.toUpperCase());
  }
  if (search) {
    const q = search.toLowerCase();
    next = next.filter(
      (v) =>
        v.vendorCode?.toLowerCase().includes(q) ||
        v.name?.toLowerCase().includes(q) ||
        v.pan?.toLowerCase().includes(q) ||
        v.gstNo?.toLowerCase().includes(q)
    );
  }
  return next;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const query: any = {};
    if (status) query.approvalStatus = status.toUpperCase();
    if (search) {
      query.$or = [
        { vendorCode: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { pan: { $regex: search, $options: "i" } },
        { gstNo: { $regex: search, $options: "i" } }
      ];
    }

    let vendors = await Vendor.find(query).sort({ name: 1 });
    if (vendors.length === 0 && !status && !search) {
      try {
        await Vendor.insertMany(
          FALLBACK_VENDORS.map(({ _id, ...rest }) => rest),
          { ordered: false }
        );
      } catch {
        // ignore
      }
      vendors = await Vendor.find(query).sort({ name: 1 });
    }
    if (vendors.length === 0) {
      const list = applyFilters(ensureMemory(), search, status);
      return NextResponse.json({ success: true, count: list.length, data: list, isFallback: true });
    }
    return NextResponse.json({ success: true, count: vendors.length, data: vendors });
  } catch {
    const { searchParams } = new URL(req.url);
    const list = applyFilters(ensureMemory(), searchParams.get("search"), searchParams.get("status"));
    return NextResponse.json({
      success: true,
      count: list.length,
      data: list,
      isMemoryStore: true
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!String(body.name || body.vendorName || "").trim()) {
      return NextResponse.json({ error: "Vendor Name is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const existing = await Vendor.find().select("vendorCode");
      const code =
        body.vendorCode && body.vendorCode !== "AUTO"
          ? String(body.vendorCode).toUpperCase()
          : nextVendorCode(existing);
      const payload = normalize(body, code);
      const created = await Vendor.create(payload);
      const mem = ensureMemory();
      mem.unshift({ ...payload, _id: String(created._id) });
      return NextResponse.json({ success: true, message: "Vendor saved", data: created }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ error: "Vendor Code already exists" }, { status: 409 });
      }
      const mem = ensureMemory();
      const code =
        body.vendorCode && body.vendorCode !== "AUTO"
          ? String(body.vendorCode).toUpperCase()
          : nextVendorCode(mem);
      const payload = normalize(body, code);
      const record = { ...payload, _id: `v-${Date.now()}` };
      mem.unshift(record);
      return NextResponse.json({
        success: true,
        message: "Vendor saved (Memory Store)",
        data: record,
        isMemoryStore: true
      }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id } = body;
    const payload = normalize(body, body.vendorCode);
    if (!payload.vendorCode && !_id) {
      return NextResponse.json({ error: "Vendor identifier is required" }, { status: 400 });
    }
    if (!payload.password) delete (payload as any).password;

    try {
      await connectToDatabase();
      const query = _id ? { _id } : { vendorCode: payload.vendorCode };
      const updated = await Vendor.findOneAndUpdate(query, { $set: payload }, { new: true });
      if (!updated) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
      }
      const mem = ensureMemory();
      const idx = mem.findIndex((v) => v._id === String(updated._id) || v.vendorCode === updated.vendorCode);
      if (idx >= 0) mem[idx] = { ...mem[idx], ...payload, _id: String(updated._id) };
      return NextResponse.json({ success: true, message: "Vendor updated", data: updated });
    } catch {
      const mem = ensureMemory();
      const idx = mem.findIndex((v) => (_id && v._id === _id) || v.vendorCode === payload.vendorCode);
      if (idx === -1) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
      }
      mem[idx] = { ...mem[idx], ...payload };
      return NextResponse.json({
        success: true,
        message: "Vendor updated (Memory Store)",
        data: mem[idx],
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
