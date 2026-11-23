import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TripSettlement } from "@/models/TripSettlement";
import { memoryStore } from "@/lib/memoryStore";
import {
  finalizeTripSettlement,
  getSettlementDetail,
  listPendingTripsForSettlement
} from "@/lib/tripSettlementEngine";

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
  const pending = searchParams.get("pending") === "1" || searchParams.get("mode") === "pending";
  const detail = searchParams.get("detail") === "1";
  const tripsheetNo = (searchParams.get("tripsheetNo") || documentNo || "").trim().toUpperCase();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  // Settle screen detail: tripsheet header + company advance lines
  if (detail && tripsheetNo) {
    try {
      const data = await getSettlementDetail(tripsheetNo);
      if (!data) {
        return NextResponse.json({ error: `Tripsheet ${tripsheetNo} not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, data, source: "db" });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to load settlement detail" }, { status: 500 });
    }
  }

  // Search list: open trips awaiting settlement
  if (pending || !status) {
    try {
      const data = await listPendingTripsForSettlement({
        documentNo,
        vehicleNo,
        from,
        to
      });
      return NextResponse.json({
        success: true,
        count: data.length,
        data,
        source: "db"
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Failed to load pending trips" }, { status: 500 });
    }
  }

  // Explicit settled / historical list (view-print)
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
    const fromDt = parseDate(from);
    const toDt = parseDate(to);
    if (fromDt || toDt) {
      query.documentDate = {};
      if (fromDt) query.documentDate.$gte = fromDt;
      if (toDt) {
        const end = new Date(toDt);
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
    const result = await finalizeTripSettlement(body);
    return NextResponse.json(
      {
        success: true,
        message: result.isMemoryStore
          ? "Trip settlement finalized (Memory Store — Mongo unavailable)"
          : "Trip settlement finalized",
        data: result.saved,
        isMemoryStore: result.isMemoryStore || false,
        source: result.isMemoryStore ? "memory" : "mongodb"
      },
      { status: 201 }
    );
  } catch (error: any) {
    const status = Number(error?.status) || 500;
    return NextResponse.json({ error: error.message || "Failed to finalize trip settlement" }, { status });
  }
}
