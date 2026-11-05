import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Branch } from "@/models/Branch";

export async function GET() {
  try {
    await connectToDatabase();
    let branches = await Branch.find({ isActive: true }).sort({ branchName: 1 });
    if (branches.length === 0) {
      // Default fallback branches
      branches = [
        { branchCode: "MUM", branchName: "MUMBAI CENTRAL", city: "Mumbai", isHub: true },
        { branchCode: "DEL", branchName: "DELHI REGIONAL", city: "Delhi", isHub: true },
        { branchCode: "BLR", branchName: "BANGALORE MAIN", city: "Bangalore", isHub: false },
        { branchCode: "PUN", branchName: "PUNE HUB", city: "Pune", isHub: false },
        { branchCode: "AHM", branchName: "AHMEDABAD HUB", city: "Ahmedabad", isHub: false }
      ] as any;
    }
    return NextResponse.json({ success: true, data: branches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const newBranch = await Branch.create(body);
    return NextResponse.json({ success: true, message: "Branch created", data: newBranch }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { _id, branchCode, ...updates } = body;
    const query = _id ? { _id } : { branchCode: branchCode?.toUpperCase() };
    const updated = await Branch.findOneAndUpdate(query, { $set: updates }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Branch updated", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

