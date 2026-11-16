import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listPdcPaymentRows, listVendorOptions } from "@/lib/vendorBillingEngine";

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

    const mode = (searchParams.get("mode") || "criteria").trim().toLowerCase();
    const dateMode = (searchParams.get("dateMode") || "today").trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    let from = parseIso(searchParams.get("from"), today);
    let to = parseIso(searchParams.get("to"), today);

    if (dateMode === "today") {
      from = today;
      to = today;
    } else if (dateMode === "last7") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      from = d.toISOString().slice(0, 10);
      to = today;
    }

    const vendor = (searchParams.get("vendor") || "").trim();
    const pdcNumbersRaw = (searchParams.get("pdcNumbers") || searchParams.get("pdcNumber") || "").trim();

    let rows;
    if (mode === "pdc" || pdcNumbersRaw) {
      const codes = pdcNumbersRaw
        .split(",")
        .map((x) => x.trim().toUpperCase())
        .filter(Boolean);
      if (!codes.length) {
        return NextResponse.json({ error: "Enter at least one PDC Number" }, { status: 400 });
      }
      const all = [];
      for (const code of codes) {
        const part = await listPdcPaymentRows({ pdcNo: code });
        all.push(...part);
      }
      rows = all;
    } else {
      rows = await listPdcPaymentRows({
        from,
        to,
        vendor: vendor || undefined
      });
    }

    const data = rows.map((r: any, idx: number) => ({
      id: r.id,
      srNo: idx + 1,
      pdcNo: r.pdcNumber || r.tripSheetNo,
      manualThcNo: r.manualPdcNo || "",
      pdcDate: r.pdcDate,
      pdcDateLabel: r.pdcDateLabel || fmtDateLabel(r.pdcDate),
      vehicleNo: r.vehicleNo,
      vendorCode: r.vendorCode,
      vendorName: r.vendorName,
      vendorLabel: r.vendorLabel || `${r.vendorCode} - ${r.vendorName}`,
      advBranch: r.pdcBranch || "ALC1",
      totalHire: Number(r.totalHire || r.pdcAmount || 0),
      advance: Number(r.advanceAmount || r.advanceAmt || 0),
      voucher: r.advanceVendorbillNo || ""
    }));

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      source: "db",
      meta: {
        mode: mode === "pdc" || pdcNumbersRaw ? "pdc" : "criteria",
        from: fmtDateLabel(from),
        to: fmtDateLabel(to),
        vendor: vendor || "All",
        pdcNumbers: pdcNumbersRaw || ""
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
