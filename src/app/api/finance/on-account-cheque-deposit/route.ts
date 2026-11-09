import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo on-account cheques for deposit — not client production data. */
type ChequeRow = {
  chequeNo: string;
  chequeDate: string;
  chequeDateIso: string;
  entryLocation: string;
  customerCode: string;
  customerName: string;
  bankName: string;
  amount: number;
  status: "Pending" | "Deposited";
};

const CUSTOMERS = [
  { code: "CUS0001", name: "NORTHBOUND FREIGHT PVT LTD" },
  { code: "CUS0002", name: "COASTAL CARGO SOLUTIONS" },
  { code: "CUS0003", name: "METRO LOGISTICS PARTNERS" },
  { code: "CUS0004", name: "GATEWAY DISTRIBUTION CO" }
];

const LOCATIONS = ["ALC1", "ALC2", "PUNE", "NASHIK"];
const BANKS = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank"];

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

function buildDemoRows(): ChequeRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: ChequeRow[] = [];
  for (let i = 0; i < 14; i++) {
    const iso = addDays(today, -((i % 8) + (i % 3 === 0 ? 0 : 1)));
    const cust = CUSTOMERS[i % CUSTOMERS.length];
    rows.push({
      chequeNo: `CHQ${String(26120000 + i)}`,
      chequeDate: fmtDate(iso),
      chequeDateIso: iso,
      entryLocation: LOCATIONS[i % LOCATIONS.length],
      customerCode: cust.code,
      customerName: cust.name,
      bankName: BANKS[i % BANKS.length],
      amount: Number((8500 + (i % 6) * 1250 + (i % 4) * 175.5).toFixed(2)),
      status: "Pending"
    });
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("lists") === "1") {
    return NextResponse.json({
      success: true,
      data: {
        locations: ["--Show All--", ...LOCATIONS],
        customers: [
          { code: "", name: "--Show All--", label: "--Show All--" },
          ...CUSTOMERS.map((c) => ({
            code: c.code,
            name: c.name,
            label: `${c.code} - ${c.name}`
          }))
        ]
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const location = (searchParams.get("location") || "").trim();
  const customerCode = (searchParams.get("customerCode") || "").trim().toUpperCase();
  const chequeNumber = (searchParams.get("chequeNumber") || "").trim().toUpperCase();

  let rows = buildDemoRows();

  if (chequeNumber) {
    rows = rows.filter((r) => r.chequeNo.toUpperCase().includes(chequeNumber));
    if (!rows.length) {
      const cust = CUSTOMERS[0];
      rows = [
        {
          chequeNo: chequeNumber.startsWith("CHQ")
            ? chequeNumber
            : `CHQ${chequeNumber.replace(/\D/g, "").padStart(8, "0")}`,
          chequeDate: fmtDate(today),
          chequeDateIso: today,
          entryLocation: "ALC1",
          customerCode: cust.code,
          customerName: cust.name,
          bankName: BANKS[0],
          amount: 12500.5,
          status: "Pending"
        }
      ];
    }
  } else {
    rows = rows.filter((r) => r.chequeDateIso >= from && r.chequeDateIso <= to);
    if (location && location !== "--Show All--") {
      rows = rows.filter((r) => r.entryLocation === location);
    }
    if (customerCode && customerCode !== "--SHOW ALL--") {
      rows = rows.filter((r) => r.customerCode.toUpperCase() === customerCode);
    }
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r, idx) => ({ srNo: idx + 1, ...r })),
    meta: {
      from,
      to,
      location: location || null,
      customerCode: customerCode || null,
      chequeNumber: chequeNumber || null
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chequeNos = Array.isArray(body.chequeNos) ? body.chequeNos.map(String) : [];
    if (!chequeNos.length) {
      return NextResponse.json({ success: false, error: "Select at least one cheque" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: `${chequeNos.length} cheque(s) marked deposited (demo)`,
      data: { chequeNos, depositedAt: new Date().toISOString() }
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }
}
