import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyVoucherPayment } from "@/models/CompanyVoucherPayment";
import { Vendor } from "@/models/Vendor";
import { memoryStore } from "@/lib/memoryStore";

function parseDate(value?: string | null) {
  if (!value) return null;
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

function mapRow(v: any, vendorByName: Map<string, any>, vendorByCode: Map<string, any>) {
  const vendorName = String(v.vendor || v.paidTo || "").trim();
  const vendorKey = vendorName.toUpperCase();
  const vendor =
    vendorByName.get(vendorKey) ||
    vendorByCode.get(String(v.vendorCode || "").toUpperCase()) ||
    null;
  const vendorCode = String(vendor?.vendorCode || vendor?.code || v.vendorCode || "").toUpperCase();
  const invoiceAmount = num(v.taxableAmount || v.amount);
  const igst = num(v.igst);
  const cgst = num(v.cgst);
  const sgst = num(v.sgst);
  const tds = num(v.tdsAmount);
  const amount = num(v.totalAmount || invoiceAmount + igst + cgst + sgst);
  const paid = /PAID/i.test(String(v.status || "")) ? num(v.netPayable || amount) : num(v.paidAmount);
  const osAmount = Math.max(0, amount - paid - tds);

  return {
    vendorCode: vendorCode || (vendorName ? "V00000" : ""),
    vendorName: String(vendor?.vendorName || vendor?.name || vendorName).toUpperCase(),
    branchCode: String(v.branchCode || v.location || "ALC1").toUpperCase(),
    invoiceNo: String(v.documentNo || v.invoiceNo || v.voucherNo || "").toUpperCase(),
    invoiceDate: v.voucherDate || v.invoiceDate || v.createdAt || null,
    invoiceDateLabel: formatDate(v.voucherDate || v.invoiceDate || v.createdAt),
    invoiceAmount,
    igst,
    cgst,
    sgst,
    tds,
    amount,
    osAmount,
    voucherNo: String(v.voucherNo || "").toUpperCase(),
    paidAmount: paid,
    remarks: String(v.remark || v.remarks || ""),
    status: v.status || ""
  };
}

function matchesFilters(row: ReturnType<typeof mapRow>, from: Date | null, to: Date | null, vendor: string) {
  const d = row.invoiceDate ? new Date(row.invoiceDate) : null;
  if (from && d && d < from) return false;
  if (to && d) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (d > end) return false;
  }
  if (vendor && vendor.trim() && !/^all/i.test(vendor) && !/^--/.test(vendor) && !/^vendor$/i.test(vendor)) {
    const q = vendor.replace(/^-+|-+$/g, "").toUpperCase();
    if (!row.vendorCode.includes(q) && !row.vendorName.includes(q)) return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const vendor = (searchParams.get("vendor") || "").trim();

  try {
    await connectToDatabase();
    const query: any = { status: { $ne: "CANCELLED" } };
    if (from || to) {
      query.voucherDate = {};
      if (from) query.voucherDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.voucherDate.$lte = end;
      }
    }
    if (vendor && !/^all/i.test(vendor) && !/^--/.test(vendor)) {
      const q = vendor.replace(/^-+|-+$/g, "");
      query.$or = [
        { vendor: new RegExp(q, "i") },
        { paidTo: new RegExp(q, "i") },
        { vendorCode: new RegExp(q, "i") }
      ];
    }

    const [vouchers, vendors] = await Promise.all([
      CompanyVoucherPayment.find(query).sort({ voucherDate: -1, createdAt: -1 }).lean(),
      Vendor.find().select("vendorCode name").lean().catch(() => [])
    ]);

    const vendorByName = new Map<string, any>();
    const vendorByCode = new Map<string, any>();
    for (const v of vendors as any[]) {
      const name = String(v.name || v.vendorName || "").toUpperCase();
      const code = String(v.vendorCode || v.code || "").toUpperCase();
      if (name) vendorByName.set(name, { ...v, vendorName: v.name || v.vendorName });
      if (code) vendorByCode.set(code, { ...v, vendorName: v.name || v.vendorName });
    }

    const byNo = new Map<string, any>();
    for (const v of vouchers as any[]) {
      byNo.set(String(v.voucherNo || "").toUpperCase(), v);
    }
    for (const m of memoryStore.companyVouchers || []) {
      const key = String(m.voucherNo || "").toUpperCase();
      if (key && !byNo.has(key)) byNo.set(key, m);
    }

    const rows = Array.from(byNo.values())
      .map((v) => mapRow(v, vendorByName, vendorByCode))
      .filter((r) => matchesFilters(r, from, to, vendor));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source: "mongodb"
    });
  } catch {
    const vendorByName = new Map<string, any>();
    const vendorByCode = new Map<string, any>();
    for (const v of (memoryStore as any).vendorsList || []) {
      const name = String(v.vendorName || v.name || "").toUpperCase();
      const code = String(v.vendorCode || v.code || "").toUpperCase();
      if (name) vendorByName.set(name, v);
      if (code) vendorByCode.set(code, v);
    }

    const rows = (memoryStore.companyVouchers || [])
      .map((v: any) => mapRow(v, vendorByName, vendorByCode))
      .filter((r: ReturnType<typeof mapRow>) => matchesFilters(r, from, to, vendor));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      isMemoryStore: true
    });
  }
}
