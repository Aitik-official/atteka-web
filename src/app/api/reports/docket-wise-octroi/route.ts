import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { memoryStore } from "@/lib/memoryStore";

function parseDate(value?: string | null) {
  if (!value) return null;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(value))) {
    const [dd, mm, yyyy] = String(value).split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-");
}

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function branchCode(code?: string) {
  return String(code || "ALC1").trim().toUpperCase() || "ALC1";
}

function extractCode(raw: string) {
  const t = raw.replace(/^-+|-+$/g, "").trim();
  if (!t || /show all/i.test(t)) return "";
  return (t.includes(" - ") ? t.split(" - ").pop()! : t).trim().toUpperCase();
}

function mapRow(c: any) {
  const octroiDate =
    c.octroiDate || c.deliveryDate || c.expectedDeliveryDate || c.updatedAt || c.bookingDate || c.createdAt || null;
  const octroiAmount = num(
    c.octroiAmount ?? c.financials?.octroiAmount ?? c.financials?.loadingCharge ?? 0
  );
  const formCharges = num(c.octroiFormCharges ?? c.formCharges ?? 0);
  const otherCharges = num(c.octroiOtherCharges ?? 0);
  const totalOctroi = Number((octroiAmount + formCharges + otherCharges).toFixed(2));
  const invoiceValue = num(
    c.invoiceDetails?.invoiceValue ?? c.invoiceDetails?.declaredValue ?? c.financials?.subTotal ?? 0
  );

  return {
    docketNo: String(c.docketNo || "").toUpperCase(),
    docketDate: c.bookingDate || c.createdAt || null,
    docketDateLabel: formatDate(c.bookingDate || c.createdAt),
    octroiDate,
    octroiDateLabel: formatDate(octroiDate),
    octroiBranch: branchCode(c.octroiBranch || c.bookingBranch || c.billedAt),
    partyCode: String(c.customerCode || "").toUpperCase(),
    partyName: String(c.billingParty || c.customerName || "").trim(),
    party: `${String(c.customerCode || "").trim()} - ${String(c.billingParty || c.customerName || "").trim()}`.replace(
      /^ - /,
      ""
    ),
    fromLocation: String(c.fromLocation || "").toUpperCase(),
    toLocation: String(c.toLocation || "").toUpperCase(),
    octroiAgent: String(c.octroiAgent || c.deliveryBoy || c.specialInstructions || "").trim(),
    octroiReceiptNo: String(c.octroiReceiptNo || c.ewayBillNo || "").toUpperCase(),
    invoiceNo: String(c.invoiceDetails?.invoiceBeNo || "").toUpperCase(),
    invoiceValue: Number(invoiceValue.toFixed(2)),
    actWt: num(c.packageDetails?.actualWeight),
    chrgWt: num(c.packageDetails?.chargedWeight),
    packages: num(c.packageDetails?.packagesCount ?? 1, 1),
    octroiAmount: Number(octroiAmount.toFixed(2)),
    formCharges: Number(formCharges.toFixed(2)),
    otherCharges: Number(otherCharges.toFixed(2)),
    totalOctroi,
    paidBy: String(c.octroiPaidBy || c.paymentMode || "TO PAY").toUpperCase(),
    remark: String(c.octroiRemark || c.remark || ""),
    status: String(c.status || ""),
    bkgBranch: branchCode(c.bookingBranch)
  };
}

function matchesFilters(
  row: ReturnType<typeof mapRow>,
  from: Date | null,
  to: Date | null,
  octroiBranch: string,
  party: string,
  octroiAgent: string
) {
  if (/CANCEL/i.test(row.status)) return false;

  const od = row.octroiDate ? new Date(row.octroiDate) : null;
  if (from && od && od < from) return false;
  if (to && od) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (od > end) return false;
  }

  const br = extractCode(octroiBranch);
  if (br && !row.octroiBranch.includes(br)) return false;

  if (party && party.trim() && !/show all/i.test(party)) {
    const q = party.replace(/^-+|-+$/g, "").toUpperCase();
    if (
      !row.partyName.toUpperCase().includes(q) &&
      !row.partyCode.toUpperCase().includes(q) &&
      !row.party.toUpperCase().includes(q)
    )
      return false;
  }

  if (octroiAgent && octroiAgent.trim()) {
    if (!row.octroiAgent.toUpperCase().includes(octroiAgent.trim().toUpperCase())) return false;
  }

  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const octroiBranch = (searchParams.get("octroiBranch") || "").trim();
  const party = (searchParams.get("party") || "").trim();
  const octroiAgent = (searchParams.get("octroiAgent") || "").trim();

  try {
    await connectToDatabase();
    // Pull broadly; date/branch/party filters applied in matchesFilters on mapped octroi date
    const consignments = await Consignment.find({ status: { $nin: ["CANCELLED", "DRAFT"] } })
      .sort({ updatedAt: -1, bookingDate: -1 })
      .lean();
    const byDocket = new Map<string, any>();
    for (const c of consignments as any[]) {
      byDocket.set(String(c.docketNo || "").toUpperCase(), c);
    }
    for (const m of memoryStore.getConsignments()) {
      const key = String(m.docketNo || "").toUpperCase();
      if (key && !byDocket.has(key)) byDocket.set(key, m);
    }

    const rows = Array.from(byDocket.values())
      .map(mapRow)
      .filter((r) => matchesFilters(r, from, to, octroiBranch, party, octroiAgent));

    const totals = {
      octroiAmount: Number(rows.reduce((s, r) => s + r.octroiAmount, 0).toFixed(2)),
      formCharges: Number(rows.reduce((s, r) => s + r.formCharges, 0).toFixed(2)),
      otherCharges: Number(rows.reduce((s, r) => s + r.otherCharges, 0).toFixed(2)),
      totalOctroi: Number(rows.reduce((s, r) => s + r.totalOctroi, 0).toFixed(2)),
      invoiceValue: Number(rows.reduce((s, r) => s + r.invoiceValue, 0).toFixed(2))
    };

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      totals,
      source: "mongodb"
    });
  } catch {
    const rows = memoryStore
      .getConsignments()
      .map(mapRow)
      .filter((r: any) => matchesFilters(r, from, to, octroiBranch, party, octroiAgent));

    const totals = {
      octroiAmount: Number(rows.reduce((s: number, r: any) => s + r.octroiAmount, 0).toFixed(2)),
      formCharges: Number(rows.reduce((s: number, r: any) => s + r.formCharges, 0).toFixed(2)),
      otherCharges: Number(rows.reduce((s: number, r: any) => s + r.otherCharges, 0).toFixed(2)),
      totalOctroi: Number(rows.reduce((s: number, r: any) => s + r.totalOctroi, 0).toFixed(2)),
      invoiceValue: Number(rows.reduce((s: number, r: any) => s + r.invoiceValue, 0).toFixed(2))
    };

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      totals,
      isMemoryStore: true
    });
  }
}
