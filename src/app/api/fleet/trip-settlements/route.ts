import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TripSettlement } from "@/models/TripSettlement";
import { memoryStore } from "@/lib/memoryStore";

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentNo = (searchParams.get("documentNo") || "").trim().toUpperCase();
  const vehicleNo = (searchParams.get("vehicleNo") || "").trim().toUpperCase();
  const status = (searchParams.get("status") || "").trim().toUpperCase();
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));

  try {
    await connectToDatabase();
    const query: any = {};
    if (documentNo) {
      query.$or = [
        { documentNo: { $regex: documentNo, $options: "i" } },
        { tripsheetNo: { $regex: documentNo, $options: "i" } }
      ];
    }
    if (vehicleNo && vehicleNo !== "SHOW ALL") query.vehicleNo = vehicleNo;
    if (status) query.status = status;
    if (from || to) {
      query.documentDate = {};
      if (from) query.documentDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.documentDate.$lte = end;
      }
    }
    const data = await TripSettlement.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: data.length, data, source: "mongodb" });
  } catch {
    let list = [...(memoryStore.tripSettlements || [])];
    if (documentNo) {
      list = list.filter(
        (d) =>
          String(d.documentNo || "").toUpperCase().includes(documentNo) ||
          String(d.tripsheetNo || "").toUpperCase().includes(documentNo)
      );
    }
    if (vehicleNo && vehicleNo !== "SHOW ALL") {
      list = list.filter((d) => String(d.vehicleNo || "").toUpperCase() === vehicleNo);
    }
    if (status) list = list.filter((d) => String(d.status || "").toUpperCase() === status);
    return NextResponse.json({
      success: true,
      count: list.length,
      data: list,
      isMemoryStore: true
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vehicleNo = String(body.vehicleNo || "").trim().toUpperCase();
    const tripsheetNo = String(body.tripsheetNo || body.documentNo || "").trim().toUpperCase();
    if (!vehicleNo) {
      return NextResponse.json({ error: "Vehicle No is required" }, { status: 400 });
    }
    if (!tripsheetNo) {
      return NextResponse.json({ error: "Tripsheet / Document No is required" }, { status: 400 });
    }

    const grossFreight = Number(body.grossFreight) || 0;
    const advancePaid = Number(body.advancePaid) || 0;
    const dieselExpense = Number(body.dieselExpense) || 0;
    const tollExpense = Number(body.tollExpense) || 0;
    const unloadingLabor = Number(body.unloadingLabor) || 0;
    const otherExpense = Number(body.otherExpense) || 0;
    const netPayable =
      body.netPayable !== undefined
        ? Number(body.netPayable)
        : grossFreight - advancePaid - dieselExpense - tollExpense - unloadingLabor - otherExpense;

    const documentNo =
      String(body.documentNo || "").trim().toUpperCase() || tripsheetNo;

    const record: any = {
      documentNo,
      tripsheetNo,
      documentDate: body.documentDate ? new Date(body.documentDate) : new Date(),
      vehicleNo,
      driverName: String(body.driverName || "").trim(),
      branch: String(body.branch || "ALC1").trim(),
      route: String(body.route || "").trim(),
      grossFreight,
      advancePaid,
      dieselExpense,
      tollExpense,
      unloadingLabor,
      otherExpense,
      netPayable,
      remark: String(body.remark || "").trim(),
      status: String(body.status || "SETTLED").toUpperCase(),
      preparedBy: String(body.preparedBy || "ANISHA OZARKAR").trim()
    };

    try {
      await connectToDatabase();
      const saved = await TripSettlement.findOneAndUpdate(
        { documentNo },
        { $set: record },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json(
        { success: true, message: "Trip settlement saved", data: saved, source: "mongodb" },
        { status: 201 }
      );
    } catch (err: any) {
      const memory = { ...record, _id: `tsl-${Date.now()}`, createdAt: new Date().toISOString() };
      const idx = memoryStore.tripSettlements.findIndex(
        (d) => String(d.documentNo || "").toUpperCase() === documentNo
      );
      if (idx >= 0) memoryStore.tripSettlements[idx] = { ...memoryStore.tripSettlements[idx], ...memory };
      else memoryStore.tripSettlements.unshift(memory);
      return NextResponse.json(
        {
          success: true,
          message: "Trip settlement saved (Memory Store — Mongo unavailable)",
          data: memory,
          isMemoryStore: true
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
