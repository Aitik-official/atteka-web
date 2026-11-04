import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Vendor } from "@/models/Vendor";
import { VendorSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const query: any = {};
    if (search) {
      query.$or = [
        { vendorCode: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { pan: { $regex: search, $options: "i" } }
      ];
    }

    const vendors = await Vendor.find(query).sort({ name: 1 });
    return NextResponse.json({ success: true, count: vendors.length, data: vendors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

