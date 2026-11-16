import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import {
  listTripPaymentRows,
  listVendorOptions,
  payTripSheetBalance
} from "@/lib/vendorBillingEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function fmtDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("lists") === "1") {
      const vendors = await listVendorOptions();
      return NextResponse.json({
        success: true,
        data: { vendors, vendorTypes: ["Attached", "Market"] },
        source: "db"
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const fromDefault = new Date();
    fromDefault.setDate(fromDefault.getDate() - 29);
    const from = parseIso(searchParams.get("from"), fromDefault.toISOString().slice(0, 10));
    const to = parseIso(searchParams.get("to"), today);
    const tripSheetNo = (searchParams.get("tripSheetNo") || searchParams.get("systemNo") || "")
      .trim()
      .toUpperCase();
    const vendor = (searchParams.get("vendor") || "").trim();
    const vehicle = (searchParams.get("vehicle") || "").trim();
    const vendorType = (searchParams.get("vendorType") || "").trim();

    const rows = await listTripPaymentRows({
      from: tripSheetNo ? undefined : from,
      to: tripSheetNo ? undefined : to,
      tripSheetNo: tripSheetNo || undefined,
      vendor: vendor || undefined,
      vehicle: vehicle || undefined,
      vendorType: vendorType || undefined,
      forBalance: true
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: {
        from: fmtDateLabel(from),
        to: fmtDateLabel(to),
        tripSheetNo: tripSheetNo || "",
        vendor: vendor || ""
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load TripSheet balance rows" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.financeWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.map(String)
      : body.id
        ? [String(body.id)]
        : body.tripSheetNo
          ? [String(body.tripSheetNo)]
          : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Select at least one TripSheet" }, { status: 400 });
    }
    const result = await payTripSheetBalance(ids);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "TripSheet balance payment failed" },
      { status: Number(error?.status) || 500 }
    );
  }
}
