import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { CustomerSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const query: any = {};
    if (search && search.trim() !== "") {
      const s = search.trim();
      query.$or = [
        { customerCode: { $regex: s, $options: "i" } },
        { name: { $regex: s, $options: "i" } },
        { gstin: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
        { mobileNo: { $regex: s, $options: "i" } },
        { city: { $regex: s, $options: "i" } },
        { salesPerson: { $regex: s, $options: "i" } }
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1, name: 1 });
    return NextResponse.json({ success: true, count: customers.length, data: customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const parsed = CustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid customer data" }, { status: 400 });
    }

    const data = parsed.data;

    // Handle AUTO code generation
    if (!data.customerCode || data.customerCode.trim().toUpperCase() === "AUTO" || data.customerCode.trim() === "") {
      const count = await Customer.countDocuments();
      let generated = `CUST-${(count + 101).toString().padStart(4, "0")}`;
      let exists = await Customer.findOne({ customerCode: generated });
      let salt = 1;
      while (exists) {
        generated = `CUST-${(count + 101 + salt).toString().padStart(4, "0")}`;
        exists = await Customer.findOne({ customerCode: generated });
        salt++;
      }
      data.customerCode = generated;
    } else {
      data.customerCode = data.customerCode.trim().toUpperCase();
      const existing = await Customer.findOne({ customerCode: data.customerCode });
      if (existing) {
        return NextResponse.json({ error: `Customer code ${data.customerCode} already exists.` }, { status: 400 });
      }
    }

    // Sync aliases
    const customerPayload = {
      ...data,
      phone: data.mobileNo || data.phone || "",
      mobileNo: data.mobileNo || data.phone || "",
      pincode: data.pinCode || data.pincode || "",
      pinCode: data.pinCode || data.pincode || "",
      email: data.emailId1 || data.email || "",
      emailId1: data.emailId1 || data.email || "",
      isActive: data.activeFlag !== undefined ? data.activeFlag : (data.isActive !== undefined ? data.isActive : true),
      activeFlag: data.activeFlag !== undefined ? data.activeFlag : (data.isActive !== undefined ? data.isActive : true)
    };

    const newCust = await Customer.create(customerPayload);
    return NextResponse.json({ success: true, message: "Customer created successfully", data: newCust }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { _id, customerCode, ...updates } = body;

    if (!_id && !customerCode) {
      return NextResponse.json({ error: "Customer ID or Code required for update" }, { status: 400 });
    }

    const query = _id ? { _id } : { customerCode: (customerCode || "").toUpperCase() };

    // Sync aliases
    if (updates.mobileNo !== undefined || updates.phone !== undefined) {
      updates.phone = updates.mobileNo || updates.phone || "";
      updates.mobileNo = updates.phone;
    }
    if (updates.pinCode !== undefined || updates.pincode !== undefined) {
      updates.pincode = updates.pinCode || updates.pincode || "";
      updates.pinCode = updates.pincode;
    }
    if (updates.emailId1 !== undefined || updates.email !== undefined) {
      updates.email = updates.emailId1 || updates.email || "";
      updates.emailId1 = updates.email;
    }
    if (updates.activeFlag !== undefined) {
      updates.isActive = Boolean(updates.activeFlag);
    }

    const updated = await Customer.findOneAndUpdate(query, { $set: updates }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Customer updated successfully", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
