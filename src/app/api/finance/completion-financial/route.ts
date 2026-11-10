import { NextRequest, NextResponse } from "next/server";

type Row = {
  id: string;
  cnNo: string;
  cnDate: string;
  bookingLocation: string;
  fromLocation: string;
  toLocation: string;
  payBasis: string;
  mode: string;
  billAt: string;
  billingPartyCode: string;
  billingPartyName: string;
  customerCode: string;
  customerName: string;
  status: "Pending" | "Completed";
};

/** Fabricated docket financial completion queue — not client production data. */
const DEMO_ROWS: Row[] = [
  {
    id: "cf-1",
    cnNo: "ALC126110001",
    cnDate: "2026-11-10",
    bookingLocation: "ALC1",
    fromLocation: "Pune",
    toLocation: "Ahmedabad",
    payBasis: "TBB",
    mode: "Road",
    billAt: "ALC1",
    billingPartyCode: "CUS1001",
    billingPartyName: "NORTHBOUND FREIGHT PVT LTD",
    customerCode: "CUS1001",
    customerName: "NORTHBOUND FREIGHT PVT LTD",
    status: "Pending"
  },
  {
    id: "cf-2",
    cnNo: "ALC126110002",
    cnDate: "2026-11-10",
    bookingLocation: "ALC1",
    fromLocation: "Mumbai",
    toLocation: "Nagpur",
    payBasis: "Paid",
    mode: "Road",
    billAt: "ALC1",
    billingPartyCode: "CUS1002",
    billingPartyName: "METRO LOGISTICS PARTNERS",
    customerCode: "CUS1002",
    customerName: "METRO LOGISTICS PARTNERS",
    status: "Pending"
  },
  {
    id: "cf-3",
    cnNo: "ALC226110003",
    cnDate: "2026-11-09",
    bookingLocation: "ALC2",
    fromLocation: "Surat",
    toLocation: "Indore",
    payBasis: "TBB",
    mode: "Road",
    billAt: "ALC2",
    billingPartyCode: "CUS1003",
    billingPartyName: "COASTAL CARGO SOLUTIONS",
    customerCode: "CUS1003",
    customerName: "COASTAL CARGO SOLUTIONS",
    status: "Pending"
  },
  {
    id: "cf-4",
    cnNo: "ALC126110004",
    cnDate: "2026-11-08",
    bookingLocation: "ALC1",
    fromLocation: "Nashik",
    toLocation: "Hyderabad",
    payBasis: "ToPay",
    mode: "Road",
    billAt: "ALC1",
    billingPartyCode: "CUS1001",
    billingPartyName: "NORTHBOUND FREIGHT PVT LTD",
    customerCode: "CUS1001",
    customerName: "NORTHBOUND FREIGHT PVT LTD",
    status: "Pending"
  },
  {
    id: "cf-5",
    cnNo: "ALC326110005",
    cnDate: "2026-11-07",
    bookingLocation: "ALC3",
    fromLocation: "Bhopal",
    toLocation: "Pune",
    payBasis: "TBB",
    mode: "Road",
    billAt: "ALC3",
    billingPartyCode: "CUS1004",
    billingPartyName: "GATEWAY DISTRIBUTION CO",
    customerCode: "CUS1004",
    customerName: "GATEWAY DISTRIBUTION CO",
    status: "Pending"
  },
  {
    id: "cf-6",
    cnNo: "ALC126110006",
    cnDate: "2026-11-06",
    bookingLocation: "ALC1",
    fromLocation: "Pune",
    toLocation: "Delhi",
    payBasis: "Paid",
    mode: "Road",
    billAt: "ALC1",
    billingPartyCode: "CUS1002",
    billingPartyName: "METRO LOGISTICS PARTNERS",
    customerCode: "CUS1002",
    customerName: "METRO LOGISTICS PARTNERS",
    status: "Completed"
  },
  {
    id: "cf-7",
    cnNo: "ALC226102007",
    cnDate: "2026-10-28",
    bookingLocation: "ALC2",
    fromLocation: "Ahmedabad",
    toLocation: "Jaipur",
    payBasis: "TBB",
    mode: "Road",
    billAt: "ALC2",
    billingPartyCode: "CUS1003",
    billingPartyName: "COASTAL CARGO SOLUTIONS",
    customerCode: "CUS1003",
    customerName: "COASTAL CARGO SOLUTIONS",
    status: "Pending"
  },
  {
    id: "cf-8",
    cnNo: "ALC126102008",
    cnDate: "2026-10-20",
    bookingLocation: "ALC1",
    fromLocation: "Mumbai",
    toLocation: "Bangalore",
    payBasis: "TBB",
    mode: "Road",
    billAt: "ALC1",
    billingPartyCode: "CUS1004",
    billingPartyName: "GATEWAY DISTRIBUTION CO",
    customerCode: "CUS1004",
    customerName: "GATEWAY DISTRIBUTION CO",
    status: "Pending"
  }
];

const DEMO_CUSTOMERS = Array.from(
  new Map(
    DEMO_ROWS.map((r) => [
      r.customerCode,
      {
        code: r.customerCode,
        name: r.customerName,
        label: `${r.customerCode} - ${r.customerName}`
      }
    ])
  ).values()
);

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
  const { searchParams } = new URL(req.url);

  if (searchParams.get("customers") === "1") {
    return NextResponse.json({ success: true, data: DEMO_CUSTOMERS });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), today);
  const to = parseIso(searchParams.get("to"), today);
  const customer = (searchParams.get("customer") || "").trim().toLowerCase();
  const docketNo = (searchParams.get("docketNo") || searchParams.get("cnNo") || "").trim().toUpperCase();

  let rows = [...DEMO_ROWS];

  if (docketNo) {
    rows = DEMO_ROWS.filter((r) => r.cnNo.toUpperCase().includes(docketNo));
    if (!rows.length) {
      rows = [
        {
          id: "cf-lookup",
          cnNo: docketNo,
          cnDate: today,
          bookingLocation: "ALC1",
          fromLocation: "Pune",
          toLocation: "Mumbai",
          payBasis: "TBB",
          mode: "Road",
          billAt: "ALC1",
          billingPartyCode: "CUS1001",
          billingPartyName: "NORTHBOUND FREIGHT PVT LTD",
          customerCode: "CUS1001",
          customerName: "NORTHBOUND FREIGHT PVT LTD",
          status: "Pending"
        }
      ];
    }
  } else {
    rows = DEMO_ROWS.filter((r) => r.cnDate >= from && r.cnDate <= to);
    if (customer) {
      rows = rows.filter(
        (r) =>
          r.customerCode.toLowerCase().includes(customer) ||
          r.customerName.toLowerCase().includes(customer) ||
          `${r.customerCode} - ${r.customerName}`.toLowerCase().includes(customer)
      );
    }
  }

  rows = rows.sort((a, b) => b.cnDate.localeCompare(a.cnDate) || a.cnNo.localeCompare(b.cnNo));

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r, idx) => ({
      ...r,
      srNo: idx + 1,
      cnDateLabel: fmtDateLabel(r.cnDate),
      billingParty: `${r.billingPartyCode} - ${r.billingPartyName}`,
      customerLabel: `${r.customerCode} - ${r.customerName}`
    })),
    meta: {
      from: fmtDateLabel(from),
      to: fmtDateLabel(to),
      customer: customer || "All",
      docketNo: docketNo || "",
      mode: docketNo ? "docket" : "criteria"
    }
  });
}
