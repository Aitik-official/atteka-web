import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listOnlinePaymentReport } from "@/lib/bankChequeEngine";
import { connectToDatabase } from "@/lib/mongodb";
import { Vendor } from "@/models/Vendor";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("vendors") === "1" || searchParams.get("lists") === "1") {
      await connectToDatabase();
      let vendors: { code: string; name: string; label: string }[] = [];
      try {
        const rows = await Vendor.find().sort({ vendorCode: 1 }).limit(80);
        vendors = rows.map((v: any) => {
          const code = String(v.vendorCode || v.code || "").trim();
          const name = String(v.name || v.vendorName || "Vendor").trim();
          return { code, name, label: code ? `${code} - ${name}` : name };
        });
      } catch {
        vendors = [];
      }
      return NextResponse.json({
        success: true,
        data: {
          vendors,
          statuses: ["All", "Success", "Pending", "Failed", "Reversed", "Approved", "Reprocessed"]
        },
        source: "db"
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const from = parseIso(searchParams.get("from"), today);
    const to = parseIso(searchParams.get("to"), today);
    const vendor = (searchParams.get("vendor") || "").trim();
    const status = (searchParams.get("status") || "All").trim();
    const rows = await listOnlinePaymentReport({ from, to, vendor: vendor || undefined, status });
    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "db",
      meta: { from, to, vendor: vendor || null, status }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
