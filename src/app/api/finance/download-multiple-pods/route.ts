import { NextRequest, NextResponse } from "next/server";

type Party = { code: string; name: string };

type Row = {
  id: string;
  docketNo: string;
  docketDate: string;
  docketDateLabel: string;
  fromLocation: string;
  toLocation: string;
  vehType: string;
  vehNo: string;
  customerCode: string;
  customer: string;
  consignee: string;
  consignor: string;
  pkgsNo: number;
  weight: number;
};

const DEMO_PARTIES: Party[] = [
  { code: "CUS1001", name: "NORTHBOUND FREIGHT PVT LTD" },
  { code: "CUS1002", name: "METRO LOGISTICS PARTNERS" },
  { code: "CUS1003", name: "COASTAL CARGO SOLUTIONS" },
  { code: "CUS1004", name: "GATEWAY DISTRIBUTION CO" }
];

/** Fabricated POD download dockets — not client production data. */
const DEMO_ROWS: Row[] = [
  {
    id: "pod-1",
    docketNo: "ALC12660571",
    docketDate: "2026-10-15",
    docketDateLabel: "10/15/2026 12:00:00 AM",
    fromLocation: "BHIWANDI",
    toLocation: "HYDERABAD",
    vehType: "20 MT CONTAINER",
    vehNo: "MH46BU8201",
    customerCode: "CUS1001",
    customer: "NORTHBOUND FREIGHT PVT LTD",
    consignee: "NORTHBOUND FREIGHT PVT LTD",
    consignor: "NORTHBOUND FREIGHT PVT LTD",
    pkgsNo: 1,
    weight: 8000
  },
  {
    id: "pod-2",
    docketNo: "ALC12660572",
    docketDate: "2026-10-18",
    docketDateLabel: "10/18/2026 12:00:00 AM",
    fromLocation: "BHIWANDI",
    toLocation: "CHENNAI",
    vehType: "20 MT CONTAINER",
    vehNo: "MH46BU8202",
    customerCode: "CUS1001",
    customer: "NORTHBOUND FREIGHT PVT LTD",
    consignee: "NORTHBOUND FREIGHT PVT LTD",
    consignor: "NORTHBOUND FREIGHT PVT LTD",
    pkgsNo: 1,
    weight: 8500
  },
  {
    id: "pod-3",
    docketNo: "ALC12660573",
    docketDate: "2026-10-20",
    docketDateLabel: "10/20/2026 12:00:00 AM",
    fromLocation: "BHIWANDI",
    toLocation: "NAGPUR+RAIPUR+BHUBNESHWAR+KOLKATA",
    vehType: "32 FT CONTAINER VEHICLE",
    vehNo: "MH04JK3301",
    customerCode: "CUS1001",
    customer: "NORTHBOUND FREIGHT PVT LTD",
    consignee: "NORTHBOUND FREIGHT PVT LTD",
    consignor: "NORTHBOUND FREIGHT PVT LTD",
    pkgsNo: 1,
    weight: 9000
  },
  {
    id: "pod-4",
    docketNo: "ALC12660574",
    docketDate: "2026-10-22",
    docketDateLabel: "10/22/2026 12:00:00 AM",
    fromLocation: "BHIWANDI",
    toLocation: "HYDERABAD",
    vehType: "20 MT CONTAINER",
    vehNo: "MH46BU8203",
    customerCode: "CUS1002",
    customer: "METRO LOGISTICS PARTNERS",
    consignee: "METRO LOGISTICS PARTNERS",
    consignor: "METRO LOGISTICS PARTNERS",
    pkgsNo: 1,
    weight: 7500
  },
  {
    id: "pod-5",
    docketNo: "ALC12660575",
    docketDate: "2026-10-25",
    docketDateLabel: "10/25/2026 12:00:00 AM",
    fromLocation: "PUNE",
    toLocation: "AHMEDABAD",
    vehType: "20 MT CONTAINER",
    vehNo: "MH12AB4501",
    customerCode: "CUS1002",
    customer: "METRO LOGISTICS PARTNERS",
    consignee: "METRO LOGISTICS PARTNERS",
    consignor: "METRO LOGISTICS PARTNERS",
    pkgsNo: 2,
    weight: 6200
  },
  {
    id: "pod-6",
    docketNo: "ALC12660576",
    docketDate: "2026-10-28",
    docketDateLabel: "10/28/2026 12:00:00 AM",
    fromLocation: "SURAT",
    toLocation: "INDORE",
    vehType: "32 FT CONTAINER VEHICLE",
    vehNo: "GJ05CD7801",
    customerCode: "CUS1003",
    customer: "COASTAL CARGO SOLUTIONS",
    consignee: "COASTAL CARGO SOLUTIONS",
    consignor: "COASTAL CARGO SOLUTIONS",
    pkgsNo: 1,
    weight: 7000
  },
  {
    id: "pod-7",
    docketNo: "ALC12660577",
    docketDate: "2026-11-02",
    docketDateLabel: "11/2/2026 12:00:00 AM",
    fromLocation: "NASHIK",
    toLocation: "BENGALURU",
    vehType: "20 MT CONTAINER",
    vehNo: "MH15EF1201",
    customerCode: "CUS1004",
    customer: "GATEWAY DISTRIBUTION CO",
    consignee: "GATEWAY DISTRIBUTION CO",
    consignor: "GATEWAY DISTRIBUTION CO",
    pkgsNo: 1,
    weight: 6000
  },
  {
    id: "pod-8",
    docketNo: "ALC12660578",
    docketDate: "2026-11-05",
    docketDateLabel: "11/5/2026 12:00:00 AM",
    fromLocation: "BHIWANDI",
    toLocation: "CHENNAI",
    vehType: "20 MT CONTAINER",
    vehNo: "MH46BU8204",
    customerCode: "CUS1001",
    customer: "NORTHBOUND FREIGHT PVT LTD",
    consignee: "NORTHBOUND FREIGHT PVT LTD",
    consignor: "NORTHBOUND FREIGHT PVT LTD",
    pkgsNo: 1,
    weight: 8800
  }
];

function parseDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("parties") === "1") {
    return NextResponse.json({
      success: true,
      data: DEMO_PARTIES.map((p) => ({
        ...p,
        label: `${p.code} - ${p.name}`
      }))
    });
  }

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const party = (searchParams.get("billingParty") || "").trim().toLowerCase();

  const fromTs = parseDate(from);
  const toTs = parseDate(to);
  if (fromTs) fromTs.setHours(0, 0, 0, 0);
  if (toTs) toTs.setHours(23, 59, 59, 999);

  const rows = DEMO_ROWS.filter((r) => {
    const dt = parseDate(r.docketDate);
    if (fromTs && dt && dt < fromTs) return false;
    if (toTs && dt && dt > toTs) return false;
    if (party) {
      const blob = `${r.customerCode} ${r.customer}`.toLowerCase();
      if (!blob.includes(party)) return false;
    }
    return true;
  });

  return NextResponse.json({ success: true, data: rows, total: rows.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Select at least one docket" }, { status: 400 });
    }
    const selected = DEMO_ROWS.filter((r) => ids.includes(r.id) || ids.includes(r.docketNo));
    return NextResponse.json({
      success: true,
      message: `POD download started for ${selected.length} docket(s) (demo)`,
      data: {
        count: selected.length,
        docketNos: selected.map((r) => r.docketNo),
        fileName: `POD_BUNDLE_${Date.now().toString().slice(-8)}.zip`
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to download PODs" },
      { status: 500 }
    );
  }
}
