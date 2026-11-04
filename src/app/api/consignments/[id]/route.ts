import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { memoryStore } from "@/lib/memoryStore";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const cleanId = (params.id || "").trim().toUpperCase();

  try {
    await connectToDatabase();
    
    // Safely query: check if params.id is a valid ObjectId before searching _id to prevent CastError
    const query = mongoose.Types.ObjectId.isValid(params.id)
      ? { $or: [{ _id: params.id }, { docketNo: cleanId }] }
      : { docketNo: cleanId };

    const doc = await Consignment.findOne(query);
    if (doc) {
      return NextResponse.json({ success: true, data: doc });
    }
  } catch (err: any) {
    console.error("Consignment fetch error:", err.message);
  }

  // Fallback to in-memory store
  const memoryItem = memoryStore
    .getConsignments()
    .find((c) => c.docketNo === cleanId || c._id === params.id);

  if (memoryItem) {
    return NextResponse.json({ success: true, data: memoryItem, isMemoryStore: true });
  }

  return NextResponse.json({ error: "Consignment not found" }, { status: 404 });
}
