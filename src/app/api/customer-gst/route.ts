import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerGst } from "@/models/CustomerGst";

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

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const partyCode = searchParams.get("partyCode");

    const query: any = {};
    if (partyCode) {
      query.partyCode = partyCode.toUpperCase();
    }
    if (search && search.trim() !== "") {
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

    const records = await CustomerGst.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const partyCode = (body.partyCode || "").trim().toUpperCase();
    const partyName = (body.partyName || "").trim();
    const gstNo = (body.gstNo || "").trim().toUpperCase();

    if (!partyCode) {
      return NextResponse.json({ error: "Customer / Party Code is required" }, { status: 400 });
    }
    if (!partyName) {
      return NextResponse.json({ error: "Customer / Party Name is required" }, { status: 400 });
    }
    if (!gstNo || gstNo.length !== 15) {
      return NextResponse.json({ error: "Valid 15-digit GST No is required" }, { status: 400 });
    }

    // Auto extract PAN (chars 3 to 12)
    const panNo = body.panNo?.trim().toUpperCase() || gstNo.substring(2, 12);
    const stateCode = gstNo.substring(0, 2);
    const stateName = body.stateName || GST_STATE_MAP[stateCode] || "";

    // Check duplicate
    const existing = await CustomerGst.findOne({ gstNo });
    if (existing) {
      return NextResponse.json({ error: `GST No ${gstNo} already registered for ${existing.partyName} (${existing.partyCode})` }, { status: 400 });
    }

    const newRecord = await CustomerGst.create({
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
    });

    return NextResponse.json({ success: true, message: "GST details saved successfully", data: newRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { _id, ...updates } = body;

    if (!_id) {
      return NextResponse.json({ error: "Record ID is required for update" }, { status: 400 });
    }

    if (updates.gstNo) {
      updates.gstNo = updates.gstNo.trim().toUpperCase();
      if (updates.gstNo.length === 15) {
        if (!updates.panNo) {
          updates.panNo = updates.gstNo.substring(2, 12);
        }
        const stateCode = updates.gstNo.substring(0, 2);
        updates.stateCode = stateCode;
        if (!updates.stateName) {
          updates.stateName = GST_STATE_MAP[stateCode] || "";
        }
      }
    }

    const updated = await CustomerGst.findByIdAndUpdate(_id, { $set: updates }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "GST details updated successfully", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }
    await CustomerGst.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Record deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

