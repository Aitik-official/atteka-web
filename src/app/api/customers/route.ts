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
    if (search) {
      query.$or = [
        { customerCode: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { gstin: { $regex: search, $options: "i" } }
      ];
    }

    const customers = await Customer.find(query).sort({ name: 1 });
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
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const newCust = await Customer.create(parsed.data);
    return NextResponse.json({ success: true, message: "Customer created", data: newCust }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { _id, customerCode, ...updates } = body;

    const query = _id ? { _id } : { customerCode };
    const updated = await Customer.findOneAndUpdate(query, { $set: updates }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Customer updated", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

