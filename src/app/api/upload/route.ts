import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/services/storageService";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { memoryStore } from "@/lib/memoryStore";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const docketNo = formData.get("docketNo") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await storageService.uploadFile(buffer, file.name, file.type);
    const cleanDocket = docketNo ? String(docketNo).trim().toUpperCase() : "";

    if (cleanDocket) {
      try {
        await connectToDatabase();
        await Consignment.findOneAndUpdate(
          { docketNo: cleanDocket },
          { $set: { podUrl: uploadResult.fileUrl, status: "DELIVERED" } }
        );
      } catch {
        memoryStore.updateConsignment(cleanDocket, {
          podUrl: uploadResult.fileUrl,
          status: "DELIVERED"
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      data: uploadResult
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
