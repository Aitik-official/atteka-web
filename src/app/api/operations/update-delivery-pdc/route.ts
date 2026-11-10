import { NextRequest, NextResponse } from "next/server";

type Line = {
  id: string;
  docketNo: string;
  payBasis: string;
  edd: string;
  consignorName: string;
  consigneeAddress: string;
  bookingBranch: string;
  pkgs: number;
  weight: number;
};

type Pdc = {
  id: string;
  tripSheetNo: string;
  manualTripSheetNo: string;
  deliveryLocation: string;
  tripSheetDate: string;
  tripSheetDateLabel: string;
  pdcDate: string;
  pdcDateLabel: string;
  pdcBranch: string;
  pdcType: string;
  manualPdcNo: string;
  pdcEntryDate: string;
  pdcEntryDateLabel: string;
  deliveryBy: string;
  entryBy: string;
  vendor: string;
  vendorType: string;
  vehicleNo: string;
  vehicleType: string;
  driverName: string;
  financialCompletionAt: string;
  startKm: number;
  endKm: number;
  lines: Line[];
};

/** Fabricated delivery PDC update queue — not client production data. */
const DEMO: Pdc[] = [
  {
    id: "udp-1",
    tripSheetNo: "DSALC12600532",
    manualTripSheetNo: "ALC12660575",
    deliveryLocation: "HYDERABAD",
    tripSheetDate: "2026-10-15",
    tripSheetDateLabel: "15 Oct 2026",
    pdcDate: "2026-10-15",
    pdcDateLabel: "15 Oct 2026",
    pdcBranch: "ALC1: Ateka Logistics",
    pdcType: "Delivery",
    manualPdcNo: "",
    pdcEntryDate: "2026-10-16",
    pdcEntryDateLabel: "16 Oct 2026",
    deliveryBy: "AL002",
    entryBy: "AL002: OFFICE USER",
    vendor: "COMPANY VEHICLE",
    vendorType: "O",
    vehicleNo: "MH04JK3515",
    vehicleType: "",
    driverName: "",
    financialCompletionAt: "ALC1: Ateka Logistics",
    startKm: 1,
    endKm: 0,
    lines: [
      {
        id: "l1",
        docketNo: "ALC12600616",
        payBasis: "TBB",
        edd: "05 Nov 2026",
        consignorName: "NORTHBOUND FREIGHT PVT LTD",
        consigneeAddress: "Hyderabad Hub",
        bookingBranch: "ALC1",
        pkgs: 1,
        weight: 6000
      }
    ]
  },
  {
    id: "udp-2",
    tripSheetNo: "DSALC12600533",
    manualTripSheetNo: "ALC12660576",
    deliveryLocation: "CHENNAI",
    tripSheetDate: "2026-10-13",
    tripSheetDateLabel: "13 Oct 2026",
    pdcDate: "2026-10-13",
    pdcDateLabel: "13 Oct 2026",
    pdcBranch: "ALC1: Ateka Logistics",
    pdcType: "Delivery",
    manualPdcNo: "",
    pdcEntryDate: "2026-10-14",
    pdcEntryDateLabel: "14 Oct 2026",
    deliveryBy: "AL002",
    entryBy: "AL002: OFFICE USER",
    vendor: "MARKET VENDOR",
    vendorType: "M",
    vehicleNo: "MH46BU8201",
    vehicleType: "20 MT CONTAINER",
    driverName: "RAMESH YADAV",
    financialCompletionAt: "ALC1: Ateka Logistics",
    startKm: 120,
    endKm: 480,
    lines: [
      {
        id: "l2",
        docketNo: "ALC12600620",
        payBasis: "TBB",
        edd: "14 Oct 2026",
        consignorName: "METRO LOGISTICS PARTNERS",
        consigneeAddress: "Chennai ICD",
        bookingBranch: "ALC1",
        pkgs: 2,
        weight: 8500
      }
    ]
  },
  {
    id: "udp-3",
    tripSheetNo: "DSALC12600534",
    manualTripSheetNo: "ALC12660577",
    deliveryLocation: "NAGPUR+RAIPUR+BHUBNESHWAR+KOLKATA",
    tripSheetDate: "2026-10-16",
    tripSheetDateLabel: "16 Oct 2026",
    pdcDate: "2026-10-16",
    pdcDateLabel: "16 Oct 2026",
    pdcBranch: "ALC1: Ateka Logistics",
    pdcType: "Delivery",
    manualPdcNo: "MPDC003",
    pdcEntryDate: "2026-10-17",
    pdcEntryDateLabel: "17 Oct 2026",
    deliveryBy: "AL002",
    entryBy: "AL002: OFFICE USER",
    vendor: "COMPANY VEHICLE",
    vendorType: "O",
    vehicleNo: "MH12AB4501",
    vehicleType: "32 FT CONTAINER",
    driverName: "",
    financialCompletionAt: "ALC1: Ateka Logistics",
    startKm: 10,
    endKm: 0,
    lines: [
      {
        id: "l3a",
        docketNo: "ALC12600621",
        payBasis: "Paid",
        edd: "18 Oct 2026",
        consignorName: "COASTAL CARGO SOLUTIONS",
        consigneeAddress: "Nagpur Hub",
        bookingBranch: "ALC1",
        pkgs: 1,
        weight: 7000
      },
      {
        id: "l3b",
        docketNo: "ALC12600622",
        payBasis: "TBB",
        edd: "19 Oct 2026",
        consignorName: "GATEWAY DISTRIBUTION CO",
        consigneeAddress: "Kolkata Hub",
        bookingBranch: "ALC2",
        pkgs: 1,
        weight: 9000
      }
    ]
  },
  {
    id: "udp-4",
    tripSheetNo: "DSALC12600535",
    manualTripSheetNo: "ALC12660578",
    deliveryLocation: "BANGLORE+CHENNAI",
    tripSheetDate: "2026-10-18",
    tripSheetDateLabel: "18 Oct 2026",
    pdcDate: "2026-10-18",
    pdcDateLabel: "18 Oct 2026",
    pdcBranch: "ALC1: Ateka Logistics",
    pdcType: "Delivery",
    manualPdcNo: "",
    pdcEntryDate: "2026-10-19",
    pdcEntryDateLabel: "19 Oct 2026",
    deliveryBy: "AL003",
    entryBy: "AL002: OFFICE USER",
    vendor: "ATTACHED FLEET",
    vendorType: "A",
    vehicleNo: "KA01CD2201",
    vehicleType: "TRAILER",
    driverName: "SANJAY PATIL",
    financialCompletionAt: "ALC1: Ateka Logistics",
    startKm: 50,
    endKm: 620,
    lines: [
      {
        id: "l4",
        docketNo: "ALC12600623",
        payBasis: "ToPay",
        edd: "20 Oct 2026",
        consignorName: "NORTHBOUND FREIGHT PVT LTD",
        consigneeAddress: "Bengaluru Whitefield",
        bookingBranch: "ALC1",
        pkgs: 1,
        weight: 6500
      }
    ]
  },
  {
    id: "udp-5",
    tripSheetNo: "DSALC12600573",
    manualTripSheetNo: "ALC12660616",
    deliveryLocation: "HYDERABAD",
    tripSheetDate: "2026-11-04",
    tripSheetDateLabel: "04 Nov 2026",
    pdcDate: "2026-11-04",
    pdcDateLabel: "04 Nov 2026",
    pdcBranch: "ALC1: Ateka Logistics",
    pdcType: "Delivery",
    manualPdcNo: "",
    pdcEntryDate: "2026-11-05",
    pdcEntryDateLabel: "05 Nov 2026",
    deliveryBy: "AL002",
    entryBy: "AL002: OFFICE USER",
    vendor: "COMPANY VEHICLE",
    vendorType: "O",
    vehicleNo: "MH04JK3515",
    vehicleType: "",
    driverName: "",
    financialCompletionAt: "ALC1: Ateka Logistics",
    startKm: 1,
    endKm: 0,
    lines: [
      {
        id: "l5",
        docketNo: "ALC12600616",
        payBasis: "TBB",
        edd: "05 Nov 2026",
        consignorName: "NORTHBOUND FREIGHT PVT LTD",
        consigneeAddress: "Hyderabad Hub",
        bookingBranch: "ALC1",
        pkgs: 1,
        weight: 6000
      }
    ]
  }
];

// expand a few more list rows for pagination demo
for (let i = 6; i <= 52; i++) {
  const n = String(500 + i).padStart(5, "0");
  DEMO.push({
    id: `udp-${i}`,
    tripSheetNo: `DSALC1260${n}`,
    manualTripSheetNo: `ALC1266${n}`,
    deliveryLocation: i % 3 === 0 ? "CHENNAI" : i % 2 === 0 ? "HYDERABAD" : "PUNE",
    tripSheetDate: `2026-10-${String(10 + (i % 20)).padStart(2, "0")}`,
    tripSheetDateLabel: `${10 + (i % 20)} Oct 2026`,
    pdcDate: `2026-10-${String(10 + (i % 20)).padStart(2, "0")}`,
    pdcDateLabel: `${10 + (i % 20)} Oct 2026`,
    pdcBranch: "ALC1: Ateka Logistics",
    pdcType: "Delivery",
    manualPdcNo: "",
    pdcEntryDate: `2026-10-${String(11 + (i % 18)).padStart(2, "0")}`,
    pdcEntryDateLabel: `${11 + (i % 18)} Oct 2026`,
    deliveryBy: "AL002",
    entryBy: "AL002: OFFICE USER",
    vendor: "COMPANY VEHICLE",
    vendorType: "O",
    vehicleNo: `MH46BU${8200 + (i % 50)}`,
    vehicleType: "20 MT CONTAINER",
    driverName: "",
    financialCompletionAt: "ALC1: Ateka Logistics",
    startKm: i,
    endKm: 0,
    lines: [
      {
        id: `l${i}`,
        docketNo: `ALC12600${600 + i}`,
        payBasis: "TBB",
        edd: `${12 + (i % 15)} Oct 2026`,
        consignorName: "NORTHBOUND FREIGHT PVT LTD",
        consigneeAddress: "Demo Address",
        bookingBranch: "ALC1",
        pkgs: 1,
        weight: 5000 + (i % 10) * 100
      }
    ]
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const tripSheetNo = (searchParams.get("tripSheetNo") || "").trim().toUpperCase();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const pdcNo = (searchParams.get("pdcNo") || "").trim().toUpperCase();

  if (id || tripSheetNo) {
    const found = DEMO.find(
      (d) =>
        d.id === id ||
        d.tripSheetNo === tripSheetNo ||
        d.tripSheetNo.includes(tripSheetNo)
    );
    if (!found) {
      return NextResponse.json({ error: "TripSheet / PDC not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: found });
  }

  let rows = DEMO.map((d) => ({
    id: d.id,
    tripSheetNo: d.tripSheetNo,
    manualTripSheetNo: d.manualTripSheetNo,
    deliveryLocation: d.deliveryLocation,
    tripSheetDate: d.tripSheetDate,
    tripSheetDateLabel: d.tripSheetDateLabel
  }));

  if (pdcNo) {
    rows = rows.filter(
      (r) =>
        r.tripSheetNo.includes(pdcNo) ||
        r.manualTripSheetNo.includes(pdcNo)
    );
  } else if (from || to) {
    rows = rows.filter((r) => {
      if (from && r.tripSheetDate < from) return false;
      if (to && r.tripSheetDate > to) return false;
      return true;
    });
  }

  return NextResponse.json({ success: true, data: rows, total: rows.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tripSheetNo = String(body.tripSheetNo || "").trim();
    if (!tripSheetNo) {
      return NextResponse.json({ error: "TripSheet No required" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: body.close
        ? `Delivery PDC ${tripSheetNo} closed (demo)`
        : `Delivery PDC ${tripSheetNo} updated (demo)`,
      data: {
        tripSheetNo,
        driverName: body.driverName || "",
        endKm: Number(body.endKm || 0),
        lines: body.lines || [],
        closed: Boolean(body.close)
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update Delivery PDC" },
      { status: 500 }
    );
  }
}
