import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo vendor invoice payments — not client production data. */
type PaymentRow = {
  voucherNo: string;
  voucherDate: string;
  voucherDateIso: string;
  location: string;
  vendor: string;
  paymentType: string;
  amount: number;
  tds: number;
  netAmount: number;
  invoiceNo: string;
};

const DEMO_VENDORS = [
  "VND0001 - ATLAS SPARES TRADING",
  "VND0002 - METRO TYRE SUPPLIES",
  "VND0003 - COASTAL FUEL AGENCY",
  "VND0004 - GATEWAY WORKSHOP SERVICES"
];

const PAYMENT_TYPES = ["NEFT", "RTGS", "Cheque", "Cash", "UPI"];

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildDemoRows(): PaymentRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: PaymentRow[] = [];
  for (let i = 0; i < 20; i++) {
    const iso = addDays(today, -((i % 10) + (i % 3 === 0 ? 0 : 1)));
    const amount = Number((3850 + (i % 8) * 925 + (i % 5) * 140.5).toFixed(2));
    const tds = Number((amount * (i % 3 === 0 ? 0.02 : 0)).toFixed(2));
    rows.push({
      voucherNo: `VPALC1${String(26107000 + i)}`,
      voucherDate: fmtDate(iso),
      voucherDateIso: iso,
      location: i % 4 === 0 ? "ALC2" : "ALC1",
      vendor: DEMO_VENDORS[i % DEMO_VENDORS.length],
      paymentType: PAYMENT_TYPES[i % PAYMENT_TYPES.length],
      amount,
      tds,
      netAmount: Number((amount - tds).toFixed(2)),
      invoiceNo: `INV/ALC1/${String(2607100 + i).padStart(7, "0")}`
    });
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().slice(0, 10);
  const mode = (searchParams.get("mode") || "date").trim();
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const vendor = (searchParams.get("vendor") || "").trim().toUpperCase();
  const invoiceNumber = (searchParams.get("invoiceNumber") || "").trim().toUpperCase();
  const voucherNumber = (searchParams.get("voucherNumber") || "").trim().toUpperCase();

  let rows = buildDemoRows();

  if (mode === "invoice" && invoiceNumber) {
    rows = rows.filter((r) => r.invoiceNo.toUpperCase().includes(invoiceNumber));
    if (!rows.length) {
      const amount = 6125.75;
      const tds = 122.52;
      rows = [
        {
          voucherNo: `VPALC1${String(Date.now()).slice(-8)}`,
          voucherDate: fmtDate(today),
          voucherDateIso: today,
          location: "ALC1",
          vendor: DEMO_VENDORS[0],
          paymentType: "NEFT",
          amount,
          tds,
          netAmount: Number((amount - tds).toFixed(2)),
          invoiceNo: invoiceNumber.startsWith("INV")
            ? invoiceNumber
            : `INV/ALC1/${invoiceNumber.replace(/\D/g, "").padStart(7, "0")}`
        }
      ];
    }
  } else if (mode === "voucher" && voucherNumber) {
    rows = rows.filter((r) => r.voucherNo.toUpperCase().includes(voucherNumber));
    if (!rows.length) {
      const amount = 4980;
      rows = [
        {
          voucherNo: voucherNumber.startsWith("VP")
            ? voucherNumber
            : `VPALC1${voucherNumber.replace(/\D/g, "").padStart(8, "0")}`,
          voucherDate: fmtDate(today),
          voucherDateIso: today,
          location: "ALC1",
          vendor: DEMO_VENDORS[1],
          paymentType: "Cheque",
          amount,
          tds: 0,
          netAmount: amount,
          invoiceNo: `INV/ALC1/${String(2607998).padStart(7, "0")}`
        }
      ];
    }
  } else {
    rows = rows.filter((r) => r.voucherDateIso >= from && r.voucherDateIso <= to);
    if (vendor) {
      rows = rows.filter((r) => r.vendor.toUpperCase().includes(vendor));
    }
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r, idx) => ({
      srNo: idx + 1,
      voucherNo: r.voucherNo,
      voucherDate: r.voucherDate,
      location: r.location,
      vendor: r.vendor,
      paymentType: r.paymentType,
      amount: r.amount,
      tds: r.tds,
      netAmount: r.netAmount,
      invoiceNo: r.invoiceNo
    })),
    meta: {
      mode,
      from,
      to,
      vendor: vendor || null,
      invoiceNumber: invoiceNumber || null,
      voucherNumber: voucherNumber || null
    }
  });
}
