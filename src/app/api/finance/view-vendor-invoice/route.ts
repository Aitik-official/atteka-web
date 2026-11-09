import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo vendor invoices — not client production data. */
type InvoiceRow = {
  voucherNo: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceDateIso: string;
  location: string;
  vendor: string;
  amount: number;
  tds: number;
  docRefno: string;
};

const DEMO_VENDORS = [
  "VND0001 - ATLAS SPARES TRADING",
  "VND0002 - METRO TYRE SUPPLIES",
  "VND0003 - COASTAL FUEL AGENCY",
  "VND0004 - GATEWAY WORKSHOP SERVICES"
];

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

function buildDemoRows(): InvoiceRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: InvoiceRow[] = [];
  for (let i = 0; i < 20; i++) {
    const iso = addDays(today, -((i % 10) + (i % 3 === 0 ? 0 : 1)));
    const amount = Number((4250 + (i % 8) * 875 + (i % 5) * 120.25).toFixed(2));
    const tds = Number((amount * (i % 3 === 0 ? 0.02 : 0)).toFixed(2));
    rows.push({
      voucherNo: `VIALC1${String(26106000 + i)}`,
      invoiceNo: `INV/ALC1/${String(2607000 + i).padStart(7, "0")}`,
      invoiceDate: fmtDate(iso),
      invoiceDateIso: iso,
      location: i % 4 === 0 ? "ALC2" : "ALC1",
      vendor: DEMO_VENDORS[i % DEMO_VENDORS.length],
      amount,
      tds,
      docRefno: `DR${String(88000 + i)}`
    });
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().slice(0, 10);
  const mode = (searchParams.get("mode") || "date").trim(); // date | invoice | voucher
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const vendor = (searchParams.get("vendor") || "").trim().toUpperCase();
  const invoiceNumber = (searchParams.get("invoiceNumber") || "").trim().toUpperCase();
  const voucherNumber = (searchParams.get("voucherNumber") || "").trim().toUpperCase();

  let rows = buildDemoRows();

  if (mode === "invoice" && invoiceNumber) {
    rows = rows.filter((r) => r.invoiceNo.toUpperCase().includes(invoiceNumber));
    if (!rows.length) {
      rows = [
        {
          voucherNo: `VIALC1${String(Date.now()).slice(-8)}`,
          invoiceNo: invoiceNumber.startsWith("INV")
            ? invoiceNumber
            : `INV/ALC1/${invoiceNumber.replace(/\D/g, "").padStart(7, "0")}`,
          invoiceDate: fmtDate(today),
          invoiceDateIso: today,
          location: "ALC1",
          vendor: DEMO_VENDORS[0],
          amount: 6750.5,
          tds: 135.01,
          docRefno: "DR89001"
        }
      ];
    }
  } else if (mode === "voucher" && voucherNumber) {
    rows = rows.filter((r) => r.voucherNo.toUpperCase().includes(voucherNumber));
    if (!rows.length) {
      rows = [
        {
          voucherNo: voucherNumber.startsWith("VI")
            ? voucherNumber
            : `VIALC1${voucherNumber.replace(/\D/g, "").padStart(8, "0")}`,
          invoiceNo: `INV/ALC1/${String(2607999).padStart(7, "0")}`,
          invoiceDate: fmtDate(today),
          invoiceDateIso: today,
          location: "ALC1",
          vendor: DEMO_VENDORS[1],
          amount: 5125,
          tds: 0,
          docRefno: "DR89002"
        }
      ];
    }
  } else {
    rows = rows.filter((r) => r.invoiceDateIso >= from && r.invoiceDateIso <= to);
    if (vendor) {
      rows = rows.filter((r) => r.vendor.toUpperCase().includes(vendor));
    }
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r, idx) => ({ srNo: idx + 1, ...r })),
    meta: { mode, from, to, vendor: vendor || null, invoiceNumber: invoiceNumber || null, voucherNumber: voucherNumber || null }
  });
}
