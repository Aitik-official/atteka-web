import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Vehicle } from "@/models/Vehicle";

export async function GET() {
  try {
    await connectToDatabase();
    const vehicles = await Vehicle.find({ isActive: true }).sort({ vehicleNumber: 1 });
    return NextResponse.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const newVehicle = await Vehicle.create(body);
    return NextResponse.json({ success: true, message: "Vehicle added", data: newVehicle }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

