import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import {
  listDeliveryPdcsForUpdate,
  updateDeliveryPdc
} from "@/lib/operationsPdcEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    const tripSheetNo = (searchParams.get("tripSheetNo") || "").trim().toUpperCase();
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const pdcNo = (searchParams.get("pdcNo") || "").trim().toUpperCase();

    const result = await listDeliveryPdcsForUpdate({
      id: id || undefined,
      tripSheetNo: tripSheetNo || undefined,
      from: from || undefined,
      to: to || undefined,
      pdcNo: pdcNo || undefined
    });

    if (id || tripSheetNo) {
      if (!result.detail) {
        return NextResponse.json({ error: "TripSheet / PDC not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: result.detail, source: "db" });
    }

    return NextResponse.json({
      success: true,
      data: result.list,
      total: result.list.length,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load Delivery PDCs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.opsWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const result = await updateDeliveryPdc({
      tripSheetNo: String(body.tripSheetNo || ""),
      driverName: body.driverName,
      endKm: body.endKm,
      vehicleNo: body.vehicleNo,
      vendor: body.vendor,
      close: Boolean(body.close),
      lines: body.lines
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update Delivery PDC" },
      { status: Number(error?.status) || 500 }
    );
  }
}
