import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { VendorGst } from "@/models/VendorGst";
import { memoryStore } from "@/lib/memoryStore";

const GST_STATE_MAP: Record<string, string> = {
  "01": "JAMMU AND KASHMIR",
  "02": "HIMACHAL PRADESH",
  "03": "PUNJAB",
  "04": "CHANDIGARH",
  "05": "UTTARAKHAND",
  "06": "HARYANA",
  "07": "DELHI",
  "08": "RAJASTHAN",
  "09": "UTTAR PRADESH",
  "10": "BIHAR",
  "11": "SIKKIM",
  "12": "ARUNACHAL PRADESH",
  "13": "NAGALAND",
  "14": "MANIPUR",
  "15": "MIZORAM",
  "16": "TRIPURA",
  "17": "MEGHALAYA",
  "18": "ASSAM",
  "19": "WEST BENGAL",
  "20": "JHARKHAND",
  "21": "ODISHA",
  "22": "CHHATTISGARH",
  "23": "MADHYA PRADESH",
  "24": "GUJARAT",
  "26": "DADRA AND NAGAR HAVELI AND DAMAN AND DIU",
  "27": "MAHARASHTRA",
  "29": "KARNATAKA",
  "30": "GOA",
  "32": "KERALA",
  "33": "TAMIL NADU",
  "34": "PUDUCHERRY",
  "36": "TELANGANA",
  "37": "ANDHRA PRADESH"
};

const FALLBACK_VENDOR_GST = [
  {
    _id: "vgst-019",
    partyCode: "V00019",
    partyName: "WEBCOREVISION PRIVATE LIMITED",
    gstNo: "27AABCW1234D1Z5",
    panNo: "AABCW1234D",
    stateCode: "27",
    stateName: "27 - MAHARASHTRA",
    city: "Mumbai",
    pinCode: "400001",
    contactPerson: "RAHUL MEHTA",
    mobNo: "9820011122",
    address: "Andheri East, Mumbai, Maharashtra",
    isActive: true
  },
  {
    _id: "vgst-020",
    partyCode: "V00020",
    partyName: "ECO TYRES",
    gstNo: "29AAACE5678F1Z2",
    panNo: "AAACE5678F",
    stateCode: "29",
    stateName: "29 - KARNATAKA",
    city: "Bengaluru",
    pinCode: "560001",
    contactPerson: "-",
    mobNo: "-",
    address: "Peenya Industrial Area, Bengaluru, Karnataka",
    isActive: true
  },
  {
    _id: "vgst-021",
    partyCode: "V00021",
    partyName: "SHREE GANESH LOGISTICS",
    gstNo: "27AABCG5678K1Z8",
    panNo: "AABCG5678K",
    stateCode: "27",
    stateName: "27 - MAHARASHTRA",
    city: "Pune",
    pinCode: "411001",
    contactPerson: "SURESH PATIL",
    mobNo: "9811122233",
    address: "Hadapsar Industrial Estate, Pune, Maharashtra",
    isActive: true
  },
  {
    _id: "vgst-022",
    partyCode: "V00022",
    partyName: "OM SAI CARRIERS",
    gstNo: "24AAACO9988P1Z1",
    panNo: "AAACO9988P",
    stateCode: "24",
    stateName: "24 - GUJARAT",
    city: "Ahmedabad",
    pinCode: "380001",
    contactPerson: "KIRAN SHAH",
    mobNo: "9900011122",
    address: "Naroda GIDC, Ahmedabad, Gujarat",
    isActive: true
  }
];

function ensureMemory() {
  if (!Array.isArray((memoryStore as any).vendorGstList) || (memoryStore as any).vendorGstList.length === 0) {
    (memoryStore as any).vendorGstList = [...FALLBACK_VENDOR_GST];
  }
  return (memoryStore as any).vendorGstList as any[];
}

function applySearch(list: any[], search: string | null, partyCode: string | null) {
  let next = [...list];
  if (partyCode) {
    next = next.filter((r) => String(r.partyCode || "").toUpperCase() === partyCode.toUpperCase());
  }
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    next = next.filter(
      (r) =>
        String(r.partyCode || "").toLowerCase().includes(s) ||
        String(r.partyName || "").toLowerCase().includes(s) ||
        String(r.gstNo || "").toLowerCase().includes(s) ||
        String(r.panNo || "").toLowerCase().includes(s) ||
        String(r.city || "").toLowerCase().includes(s) ||
        String(r.mobNo || "").toLowerCase().includes(s)
    );
  }
  return next;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const partyCode = searchParams.get("partyCode");

    try {
      await connectToDatabase();
      const query: any = {};
      if (partyCode) query.partyCode = partyCode.toUpperCase();
      if (search && search.trim()) {
        const s = search.trim();
        query.$or = [
          { partyCode: { $regex: s, $options: "i" } },
          { partyName: { $regex: s, $options: "i" } },
          { gstNo: { $regex: s, $options: "i" } },
          { panNo: { $regex: s, $options: "i" } },
          { city: { $regex: s, $options: "i" } },
          { mobNo: { $regex: s, $options: "i" } }
        ];
      }
      const records = await VendorGst.find(query).sort({ createdAt: -1 });
      if (records.length > 0) {
        return NextResponse.json({ success: true, count: records.length, data: records });
      }
    } catch {
      // fall through to memory
    }

    const mem = applySearch(ensureMemory(), search, partyCode);
    return NextResponse.json({
      success: true,
      count: mem.length,
      data: mem,
      isMemoryStore: true
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const partyCode = (body.partyCode || "").trim().toUpperCase();
    const partyName = (body.partyName || "").trim();
    const gstNo = (body.gstNo || "").trim().toUpperCase();

    if (!partyCode) {
      return NextResponse.json({ error: "Vendor / Party Code is required" }, { status: 400 });
    }
    if (!partyName) {
      return NextResponse.json({ error: "Vendor / Party Name is required" }, { status: 400 });
    }
    if (!gstNo || gstNo.length !== 15) {
      return NextResponse.json({ error: "Valid 15-digit GST No is required" }, { status: 400 });
    }

    const panNo = body.panNo?.trim().toUpperCase() || gstNo.substring(2, 12);
    const stateCode = gstNo.substring(0, 2);
    const stateName =
      body.stateName ||
      (GST_STATE_MAP[stateCode] ? `${stateCode} - ${GST_STATE_MAP[stateCode]}` : stateCode);

    const payload = {
      partyCode,
      partyName,
      gstNo,
      panNo,
      stateCode,
      stateName,
      city: body.city || "",
      pinCode: body.pinCode || "",
      contactPerson: body.contactPerson || "",
      mobNo: body.mobNo || "",
      address: body.address || "",
      isActive: body.isActive !== undefined ? body.isActive : true
    };

    try {
      await connectToDatabase();
      const existing = await VendorGst.findOne({ gstNo });
      if (existing) {
        return NextResponse.json(
          {
            error: `GST No ${gstNo} already registered for ${existing.partyName} (${existing.partyCode})`
          },
          { status: 400 }
        );
      }
      const created = await VendorGst.create(payload);
      const mem = ensureMemory();
      mem.unshift({ ...payload, _id: String(created._id) });
      return NextResponse.json(
        { success: true, message: "Vendor GST details saved successfully", data: created },
        { status: 201 }
      );
    } catch {
      const mem = ensureMemory();
      if (mem.some((r) => r.gstNo === gstNo)) {
        return NextResponse.json({ error: `GST No ${gstNo} already registered` }, { status: 400 });
      }
      const record = { ...payload, _id: `vgst-${Date.now()}` };
      mem.unshift(record);
      return NextResponse.json(
        {
          success: true,
          message: "Vendor GST details saved successfully (Memory Store)",
          data: record,
          isMemoryStore: true
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, ...updates } = body;

    if (!_id) {
      return NextResponse.json({ error: "Record ID is required for update" }, { status: 400 });
    }

    if (updates.gstNo) {
      updates.gstNo = String(updates.gstNo).trim().toUpperCase();
      if (updates.gstNo.length === 15) {
        if (!updates.panNo) updates.panNo = updates.gstNo.substring(2, 12);
        const stateCode = updates.gstNo.substring(0, 2);
        updates.stateCode = stateCode;
        if (!updates.stateName) {
          updates.stateName = GST_STATE_MAP[stateCode]
            ? `${stateCode} - ${GST_STATE_MAP[stateCode]}`
            : stateCode;
        }
      }
    }
    if (updates.partyCode) updates.partyCode = String(updates.partyCode).trim().toUpperCase();
    if (updates.panNo) updates.panNo = String(updates.panNo).trim().toUpperCase();

    try {
      await connectToDatabase();
      const updated = await VendorGst.findByIdAndUpdate(_id, { $set: updates }, { new: true });
      if (updated) {
        const mem = ensureMemory();
        const idx = mem.findIndex((r) => String(r._id) === String(_id));
        if (idx >= 0) mem[idx] = { ...mem[idx], ...updates };
        return NextResponse.json({
          success: true,
          message: "Vendor GST details updated successfully",
          data: updated
        });
      }
    } catch {
      // fall through
    }

    const mem = ensureMemory();
    const idx = mem.findIndex((r) => String(r._id) === String(_id));
    if (idx < 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    mem[idx] = { ...mem[idx], ...updates };
    return NextResponse.json({
      success: true,
      message: "Vendor GST details updated successfully (Memory Store)",
      data: mem[idx],
      isMemoryStore: true
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      await VendorGst.findByIdAndDelete(id);
    } catch {
      // ignore
    }

    const mem = ensureMemory();
    (memoryStore as any).vendorGstList = mem.filter((r) => String(r._id) !== String(id));
    return NextResponse.json({ success: true, message: "Record deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
