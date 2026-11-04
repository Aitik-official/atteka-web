import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { memoryStore } from "@/lib/memoryStore";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const cleanId = params.id.toUpperCase();

  try {
    await connectToDatabase();
    const doc = await Consignment.findOne({
      $or: [{ _id: params.id }, { docketNo: cleanId }]
    });
    if (doc) {
      return NextResponse.json({ success: true, data: doc });
    }
  } catch {
    // Database fallback
  }

  const memoryItem = memoryStore.getConsignments().find((c) => c.docketNo === cleanId || c._id === params.id);
  if (memoryItem) {
    return NextResponse.json({ success: true, data: memoryItem, isMemoryStore: true });
  }

  return NextResponse.json({ error: "Consignment not found" }, { status: 404 });
}
