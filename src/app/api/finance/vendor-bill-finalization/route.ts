import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import {
  finalizeVendorBills,
  listVendorBillRows,
  listVendorOptions
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
    if (searchParams.get("vendors") === "1") {
      const vendors = await listVendorOptions();
      return NextResponse.json({ success: true, data: vendors, source: "db" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const fromDefault = new Date();
    fromDefault.setDate(fromDefault.getDate() - 29);
    const from = parseIso(searchParams.get("from"), fromDefault.toISOString().slice(0, 10));
    const to = parseIso(searchParams.get("to"), today);
    const vendor = (searchParams.get("vendor") || "").trim();
    const tripSheetNo = (searchParams.get("tripSheetNo") || searchParams.get("systemNo") || "")
      .trim()
      .toUpperCase();
    const advanceVendorbillNo = (searchParams.get("advanceVendorbillNo") || "").trim().toUpperCase();
    const mode = (searchParams.get("mode") || "").trim();

    const rows = await listVendorBillRows({
      from: tripSheetNo || advanceVendorbillNo ? undefined : from,
      to: tripSheetNo || advanceVendorbillNo ? undefined : to,
      vendor: vendor || undefined,
      tripSheetNo: tripSheetNo || undefined,
      advanceVendorbillNo: advanceVendorbillNo || undefined
    });

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: {
        from: fmtDateLabel(from),
        to: fmtDateLabel(to),
        vendor: vendor || "",
        tripSheetNo: tripSheetNo || "",
        advanceVendorbillNo: advanceVendorbillNo || "",
        mode: mode || (tripSheetNo || advanceVendorbillNo ? "doc" : "criteria")
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load vendor bill rows" },
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
        : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Select at least one document to finalize" }, { status: 400 });
    }
    const result = await finalizeVendorBills(ids);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Vendor bill finalization failed" },
      { status: Number(error?.status) || 500 }
    );
  }
}
