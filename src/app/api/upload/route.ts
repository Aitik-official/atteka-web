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

    const cleanDocket = docketNo ? String(docketNo).trim().toUpperCase() : "";
    if (!cleanDocket) {
      return NextResponse.json(
        { error: "Docket No is required — each POD must be linked to a specific docket" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Embed docket in filename so every upload is uniquely tied to that CN
    const original = file.name || "pod.bin";
    const ext = original.includes(".") ? original.slice(original.lastIndexOf(".")) : "";
    const base = original.slice(0, original.length - ext.length) || "pod";
    const uniqueName = `POD_${cleanDocket}_${Date.now()}_${base}${ext}`;

    const uploadResult = await storageService.uploadFile(buffer, uniqueName, file.type);

    const patch = {
      podUrl: uploadResult.fileUrl,
      podFileName: uploadResult.fileName || uniqueName,
      podUploadedAt: new Date().toISOString(),
      status: "DELIVERED"
    };

    let mongoUpdated = false;
    try {
      await connectToDatabase();
      const updated = await Consignment.findOneAndUpdate(
        { docketNo: cleanDocket },
        { $set: patch },
        { new: true }
      );
      mongoUpdated = !!updated;
    } catch {
      mongoUpdated = false;
    }

    // Always sync memory — trip-sheet CNs often live only in memory
    const memUpdated = memoryStore.updateConsignment(cleanDocket, patch);
    if (!memUpdated && !mongoUpdated) {
      // Create a minimal memory row so bill gen can see this POD
      memoryStore.addConsignment({
        docketNo: cleanDocket,
        bookingDate: new Date().toISOString().slice(0, 10),
        bookingType: "NORMAL",
        bookingBranch: "ALC1",
        billingParty: "",
        paymentBasis: "TBB",
        serviceType: "FTL",
        fromLocation: "",
        toLocation: "",
        consignor: { name: "" },
        consignee: { name: "" },
        packageDetails: {
          packageType: "BOX",
          productDescription: "",
          packagesCount: 0,
          actualWeight: 0,
          chargedWeight: 0
        },
        financials: {
          freightAmount: 0,
          loadingCharge: 0,
          subTotal: 0,
          gstRate: 5,
          gstAmount: 0,
          grandTotal: 0
        },
        status: patch.status,
        podUrl: patch.podUrl,
        podFileName: patch.podFileName,
        podUploadedAt: patch.podUploadedAt
      });
    }

    return NextResponse.json({
      success: true,
      message: `POD uploaded for docket ${cleanDocket}`,
      data: {
        ...uploadResult,
        docketNo: cleanDocket,
        fileUrl: uploadResult.fileUrl
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
