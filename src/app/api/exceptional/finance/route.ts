import { NextRequest, NextResponse } from "next/server";

type AdvancePdcRow = {
  id: string;
  documentNo: string;
  manualPdcNo: string;
  vehicleNo: string;
  vendorCode: string;
  vendorName: string;
  pdcAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  pdcDate: string; // DD/MM/YYYY
  advancePayableBranch: string;
};

/** Fabricated exceptional-finance PDCs — not client production data. */
const DEMO_ADVANCE_PDCS: AdvancePdcRow[] = [
  {
    id: "ef-ap-1",
    documentNo: "DSALC12600573",
    manualPdcNo: "",
    vehicleNo: "MH46BU8250",
    vendorCode: "V00009",
    vendorName: "GATEWAY FLEET CO",
    pdcAmount: 45000,
    advanceAmount: 15000,
    balanceAmount: 30000,
    pdcDate: "05/10/2026",
    advancePayableBranch: "ALC2"
  },
  {
    id: "ef-ap-2",
    documentNo: "DSALC12600532",
    manualPdcNo: "ALC12660575",
    vehicleNo: "MH12CD5678",
    vendorCode: "V00009",
    vendorName: "GATEWAY FLEET CO",
    pdcAmount: 62000,
    advanceAmount: 20000,
    balanceAmount: 42000,
    pdcDate: "12/10/2026",
    advancePayableBranch: "ALC1"
  },
  {
    id: "ef-ap-3",
    documentNo: "PSALC12600410",
    manualPdcNo: "ALC12660410",
    vehicleNo: "MH04AB1234",
    vendorCode: "V00006",
    vendorName: "S.P LOGISTICS",
    pdcAmount: 38000,
    advanceAmount: 10000,
    balanceAmount: 28000,
    pdcDate: "28/10/2026",
    advancePayableBranch: "ALC1"
  },
  {
    id: "ef-ap-4",
    documentNo: "DSALC12600601",
    manualPdcNo: "",
    vehicleNo: "TN09EF9012",
    vendorCode: "V00009",
    vendorName: "GATEWAY FLEET CO",
    pdcAmount: 51000,
    advanceAmount: 18000,
    balanceAmount: 33000,
    pdcDate: "02/11/2026",
    advancePayableBranch: "ALC3"
  },
  {
    id: "ef-ap-5",
    documentNo: "DSALC12600615",
    manualPdcNo: "ALC12660615",
    vehicleNo: "MH46BM1234",
    vendorCode: "V00002",
    vendorName: "METRO HAULAGE PARTNERS",
    pdcAmount: 72000,
    advanceAmount: 25000,
    balanceAmount: 47000,
    pdcDate: "07/11/2026",
    advancePayableBranch: "ALC1"
  }
];

function parseDmy(v: string) {
  const m = String(v || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function toDmy(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function inRange(pdcDate: string, from: string, to: string) {
  const d = parseDmy(pdcDate);
  const f = from ? new Date(from) : null;
  const t = to ? new Date(to) : null;
  if (!d) return true;
  if (f) {
    f.setHours(0, 0, 0, 0);
    if (d < f) return false;
  }
  if (t) {
    t.setHours(23, 59, 59, 999);
    if (d > t) return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = String(searchParams.get("slug") || "").trim();

  if (slug !== "edit-pdc-advance-payable-branch") {
    return NextResponse.json({ error: "Unknown exceptional finance module" }, { status: 404 });
  }

  const dateMode = String(searchParams.get("dateMode") || "range");
  const from = String(searchParams.get("from") || "");
  const to = String(searchParams.get("to") || "");
  const pdcNo = String(searchParams.get("pdcNo") || "")
    .trim()
    .toUpperCase();
  const vendorCode = String(searchParams.get("vendorCode") || "")
    .trim()
    .toUpperCase();
  const branch = String(searchParams.get("branch") || "")
    .trim()
    .toUpperCase();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let fromDate = from;
  let toDate = to;

  if (dateMode === "today") {
    fromDate = today.toISOString().slice(0, 10);
    toDate = fromDate;
  } else if (dateMode === "last7") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    fromDate = start.toISOString().slice(0, 10);
    toDate = today.toISOString().slice(0, 10);
  }

  let rows = [...DEMO_ADVANCE_PDCS];

  if (dateMode === "pdcNo") {
    if (!pdcNo) {
      return NextResponse.json({ error: "Enter PDC No" }, { status: 400 });
    }
    rows = rows.filter(
      (r) =>
        r.documentNo.includes(pdcNo) ||
        String(r.manualPdcNo || "")
          .toUpperCase()
          .includes(pdcNo)
    );
  } else {
    rows = rows.filter((r) => inRange(r.pdcDate, fromDate, toDate));
  }

  if (vendorCode) {
    rows = rows.filter((r) => r.vendorCode === vendorCode || r.vendorCode.includes(vendorCode));
  }

  // Optional: filter rows that currently belong to another branch (candidates to reassign)
  // Keep all matching vendor/date rows so user can select what to update.

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows,
    filters: {
      dateMode,
      from: fromDate,
      to: toDate,
      vendorCode: vendorCode || null,
      branch: branch || null
    },
    source: "demo",
    hint: `Demo PDC Nos: ${DEMO_ADVANCE_PDCS.map((r) => r.documentNo).join(" · ")}`
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug || "").trim();
  const documentNos: string[] = Array.isArray(body.documentNos)
    ? body.documentNos.map((n: string) => String(n).trim().toUpperCase()).filter(Boolean)
    : [];
  const newBranch = String(body.advancePayableBranch || "")
    .trim()
    .toUpperCase();

  if (slug !== "edit-pdc-advance-payable-branch") {
    return NextResponse.json({ error: "Unknown exceptional finance module" }, { status: 404 });
  }
  if (!documentNos.length) {
    return NextResponse.json({ error: "Select at least one PDC" }, { status: 400 });
  }
  if (!newBranch) {
    return NextResponse.json({ error: "Advance Payable Branch is required" }, { status: 400 });
  }

  const updated: AdvancePdcRow[] = [];
  for (const no of documentNos) {
    const idx = DEMO_ADVANCE_PDCS.findIndex((r) => r.documentNo === no);
    if (idx < 0) continue;
    DEMO_ADVANCE_PDCS[idx] = {
      ...DEMO_ADVANCE_PDCS[idx],
      advancePayableBranch: newBranch
    };
    updated.push(DEMO_ADVANCE_PDCS[idx]);
  }

  if (!updated.length) {
    return NextResponse.json({ error: "No matching PDC found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: `Advance payable branch set to ${newBranch} for ${updated.length} PDC(s) (demo)`,
    data: updated,
    source: "demo"
  });
}
