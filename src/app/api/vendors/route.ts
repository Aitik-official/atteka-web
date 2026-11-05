import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Vendor } from "@/models/Vendor";
import { VendorSchema } from "@/lib/validations";

const FALLBACK_VENDORS = [
  { _id: "v-001", vendorCode: "C001", name: "TEST TRANSPORT", vendorType: "ATTACHED_VEHICLE", isActive: true, approvalStatus: "APPROVED" },
  { _id: "v-002", vendorCode: "V002", name: "SHREE GANESH LOGISTICS", vendorType: "MARKET_VEHICLE", isActive: true, approvalStatus: "APPROVED" },
  { _id: "v-003", vendorCode: "V003", name: "OM SAI CARRIERS", vendorType: "ATTACHED_VEHICLE", isActive: true, approvalStatus: "APPROVED" },
  { _id: "v-004", vendorCode: "V004", name: "EAST WEST FLEET", vendorType: "MARKET_VEHICLE", isActive: true, approvalStatus: "APPROVED" }
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const query: any = { isActive: true };
    if (search) {
      query.$or = [
        { vendorCode: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { pan: { $regex: search, $options: "i" } }
      ];
    }

    let vendors = await Vendor.find(query).sort({ name: 1 });
    if (vendors.length === 0) {
      return NextResponse.json({ success: true, count: FALLBACK_VENDORS.length, data: FALLBACK_VENDORS, isFallback: true });
    }
    return NextResponse.json({ success: true, count: vendors.length, data: vendors });
  } catch {
    return NextResponse.json({
      success: true,
      count: FALLBACK_VENDORS.length,
      data: FALLBACK_VENDORS,
      isMemoryStore: true
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const parsed = VendorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const newVendor = await Vendor.create(parsed.data);
    return NextResponse.json({ success: true, message: "Vendor created", data: newVendor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { _id, vendorCode, ...updates } = body;

    const query = _id ? { _id } : { vendorCode };
    const updated = await Vendor.findOneAndUpdate(query, { $set: updates }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Vendor updated", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

