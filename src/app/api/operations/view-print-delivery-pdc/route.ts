import { NextRequest, NextResponse } from "next/server";

type Line = {
  srNo: number;
  docketNo: string;
  consigneeName: string;
  pkgsLoad: number;
  pkgsTotal: number;
  weightLoad: number;
  weightTotal: number;
  delivered: boolean;
  stampSign: boolean;
};

type Pdc = {
  id: string;
  pdcNo: string;
  manualPdcNo: string;
  vehicleNo: string;
  pdcDate: string;
  pdcDateLabel: string;
  pdcBranch: string;
  mode: string;
  driverLicenseNo: string;
  preparedBy: string;
  preparedAt: string;
  preparedOn: string;
  vendor: string;
  fromLocation: string;
  deliveryLocation: string;
  distance: number;
  driverName: string;
  remark: string;
  lines: Line[];
};

/** Fabricated delivery PDC print records — not client production data. */
const DEMO: Pdc[] = [
  {
    id: "vpdp-1",
    pdcNo: "DSALC12600532",
    manualPdcNo: "ALC12660575",
    vehicleNo: "MH46BU8250",
    pdcDate: "2026-10-15",
    pdcDateLabel: "15 Oct 2026",
    pdcBranch: "Atteka Logistics-ALC1",
    mode: "Road",
    driverLicenseNo: "",
    preparedBy: "AL002: OFFICE USER",
    preparedAt: "ALC1: Ateka Logistics",
    preparedOn: "15 Oct 2026",
    vendor: "V00001: COMPANY VEHICLE",
    fromLocation: "BHIWANDI",
    deliveryLocation: "HYDERABAD",
    distance: 0,
    driverName: "-",
    remark: "",
    lines: [
      {
        srNo: 1,
        docketNo: "ALC12660575",
        consigneeName: "NORTHBOUND FREIGHT PVT LTD",
        pkgsLoad: 1,
        pkgsTotal: 1,
        weightLoad: 6000,
        weightTotal: 6000,
        delivered: false,
        stampSign: false
      }
    ]
  },
  {
    id: "vpdp-2",
    pdcNo: "DSALC12600533",
    manualPdcNo: "ALC12660576",
    vehicleNo: "MH46CU4138",
    pdcDate: "2026-10-13",
    pdcDateLabel: "13 Oct 2026",
    pdcBranch: "Atteka Logistics-ALC1",
    mode: "Road",
    driverLicenseNo: "MH1420110012345",
    preparedBy: "AL002: OFFICE USER",
    preparedAt: "ALC1: Ateka Logistics",
    preparedOn: "13 Oct 2026",
    vendor: "V00002: METRO HAULAGE PARTNERS",
    fromLocation: "BHIWANDI",
    deliveryLocation: "CHENNAI",
    distance: 1320,
    driverName: "RAMESH YADAV",
    remark: "",
    lines: [
      {
        srNo: 1,
        docketNo: "ALC12660576",
        consigneeName: "METRO LOGISTICS PARTNERS",
        pkgsLoad: 1,
        pkgsTotal: 1,
        weightLoad: 8500,
        weightTotal: 8500,
        delivered: false,
        stampSign: false
      },
      {
        srNo: 2,
        docketNo: "ALC12660580",
        consigneeName: "METRO LOGISTICS PARTNERS",
        pkgsLoad: 2,
        pkgsTotal: 2,
        weightLoad: 4000,
        weightTotal: 4000,
        delivered: false,
        stampSign: false
      }
    ]
  },
  {
    id: "vpdp-3",
    pdcNo: "DSALC12600534",
    manualPdcNo: "ALC12660577",
    vehicleNo: "MH12AB4501",
    pdcDate: "2026-10-16",
    pdcDateLabel: "16 Oct 2026",
    pdcBranch: "Atteka Logistics-ALC1",
    mode: "Road",
    driverLicenseNo: "",
    preparedBy: "AL002: OFFICE USER",
    preparedAt: "ALC1: Ateka Logistics",
    preparedOn: "16 Oct 2026",
    vendor: "V00001: COMPANY VEHICLE",
    fromLocation: "PUNE",
    deliveryLocation: "NAGPUR",
    distance: 710,
    driverName: "SANJAY PATIL",
    remark: "MULTI DROP",
    lines: [
      {
        srNo: 1,
        docketNo: "ALC12660577",
        consigneeName: "COASTAL CARGO SOLUTIONS",
        pkgsLoad: 1,
        pkgsTotal: 1,
        weightLoad: 7000,
        weightTotal: 7000,
        delivered: true,
        stampSign: true
      }
    ]
  },
  {
    id: "vpdp-4",
    pdcNo: "DSALC12600535",
    manualPdcNo: "ALC12660578",
    vehicleNo: "KA01CD2201",
    pdcDate: "2026-10-18",
    pdcDateLabel: "18 Oct 2026",
    pdcBranch: "Atteka Logistics-ALC1",
    mode: "Road",
    driverLicenseNo: "",
    preparedBy: "AL003: BRANCH USER",
    preparedAt: "ALC1: Ateka Logistics",
    preparedOn: "18 Oct 2026",
    vendor: "V00009: GATEWAY FLEET CO",
    fromLocation: "BHIWANDI",
    deliveryLocation: "BENGALURU",
    distance: 980,
    driverName: "-",
    remark: "",
    lines: [
      {
        srNo: 1,
        docketNo: "ALC12660578",
        consigneeName: "GATEWAY DISTRIBUTION CO",
        pkgsLoad: 1,
        pkgsTotal: 1,
        weightLoad: 9000,
        weightTotal: 9000,
        delivered: false,
        stampSign: false
      }
    ]
  },
  {
    id: "vpdp-5",
    pdcNo: "DSALC12600573",
    manualPdcNo: "ALC12660616",
    vehicleNo: "MH04JK3515",
    pdcDate: "2026-11-04",
    pdcDateLabel: "04 Nov 2026",
    pdcBranch: "Atteka Logistics-ALC1",
    mode: "Road",
    driverLicenseNo: "",
    preparedBy: "AL002: OFFICE USER",
    preparedAt: "ALC1: Ateka Logistics",
    preparedOn: "04 Nov 2026",
    vendor: "V00001: COMPANY VEHICLE",
    fromLocation: "BHIWANDI",
    deliveryLocation: "HYDERABAD",
    distance: 0,
    driverName: "-",
    remark: "",
    lines: [
      {
        srNo: 1,
        docketNo: "ALC12600616",
        consigneeName: "NORTHBOUND FREIGHT PVT LTD",
        pkgsLoad: 1,
        pkgsTotal: 1,
        weightLoad: 6000,
        weightTotal: 6000,
        delivered: false,
        stampSign: false
      }
    ]
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const pdcNo = (searchParams.get("pdcNo") || "").trim().toUpperCase();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const systemPdcNo = (searchParams.get("systemPdcNo") || "").trim().toUpperCase();
  const manualPdcNo = (searchParams.get("manualPdcNo") || "").trim().toUpperCase();

  if (id || pdcNo) {
    const found = DEMO.find(
      (d) => d.id === id || d.pdcNo === pdcNo || d.pdcNo.includes(pdcNo)
    );
    if (!found) {
      return NextResponse.json({ error: "Delivery PDC not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: found });
  }

  let list = DEMO.map((d) => ({
    id: d.id,
    pdcNo: d.pdcNo,
    manualPdcNo: d.manualPdcNo,
    vehicleNo: d.vehicleNo,
    pdcDate: d.pdcDate,
    pdcDateLabel: d.pdcDateLabel,
    pdcBranch: d.pdcBranch
  }));

  if (systemPdcNo || manualPdcNo) {
    list = list.filter((r) => {
      if (systemPdcNo && !r.pdcNo.includes(systemPdcNo)) return false;
      if (manualPdcNo && !r.manualPdcNo.includes(manualPdcNo)) return false;
      return true;
    });
  } else if (from || to) {
    list = list.filter((r) => {
      if (from && r.pdcDate < from) return false;
      if (to && r.pdcDate > to) return false;
      return true;
    });
  }

  return NextResponse.json({ success: true, data: list, total: list.length });
}
