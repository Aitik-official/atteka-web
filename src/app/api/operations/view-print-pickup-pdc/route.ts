import { NextRequest, NextResponse } from "next/server";

type Line = {
  srNo: number;
  docketNo: string;
  consignorName: string;
  pkgsLoad: number;
  pkgsTotal: number;
  weightLoad: number;
  weightTotal: number;
  picked: boolean;
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
  toLocation: string;
  distance: number;
  driverName: string;
  remark: string;
  lines: Line[];
};

/** Fabricated pickup PDC print records — not client production data. */
const DEMO: Pdc[] = [
  {
    id: "vppp-1",
    pdcNo: "PSALC12600410",
    manualPdcNo: "ALC12660615",
    vehicleNo: "MH46BU8250",
    pdcDate: "2026-11-01",
    pdcDateLabel: "01 Nov 2026",
    pdcBranch: "Atteka Logistics-ALC1",
    mode: "Road",
    driverLicenseNo: "",
    preparedBy: "AL002: OFFICE USER",
    preparedAt: "ALC1: Ateka Logistics",
    preparedOn: "01 Nov 2026",
    vendor: "V00001: NORTHBOUND TRANSPORT",
    fromLocation: "BHIWANDI",
    toLocation: "HYDERABAD",
    distance: 0,
    driverName: "-",
    remark: "",
    lines: [
      {
        srNo: 1,
        docketNo: "ALC12660615",
        consignorName: "NORTHBOUND FREIGHT PVT LTD",
        pkgsLoad: 1,
        pkgsTotal: 1,
        weightLoad: 8000,
        weightTotal: 8000,
        picked: false,
        stampSign: false
      }
    ]
  },
  {
    id: "vppp-2",
    pdcNo: "PSALC12600411",
    manualPdcNo: "ALC12660616",
    vehicleNo: "MH46CU4138",
    pdcDate: "2026-11-01",
    pdcDateLabel: "01 Nov 2026",
    pdcBranch: "Atteka Logistics-ALC1",
    mode: "Road",
    driverLicenseNo: "MH1420110012345",
    preparedBy: "AL002: OFFICE USER",
    preparedAt: "ALC1: Ateka Logistics",
    preparedOn: "01 Nov 2026",
    vendor: "V00002: METRO HAULAGE PARTNERS",
    fromLocation: "BHIWANDI",
    toLocation: "HYDERABAD",
    distance: 0,
    driverName: "RAMESH YADAV",
    remark: "",
    lines: [
      {
        srNo: 1,
        docketNo: "ALC12660616",
        consignorName: "NORTHBOUND FREIGHT PVT LTD",
        pkgsLoad: 1,
        pkgsTotal: 1,
        weightLoad: 8500,
        weightTotal: 8500,
        picked: false,
        stampSign: false
      }
    ]
  },
  {
    id: "vppp-3",
    pdcNo: "PSALC12600412",
    manualPdcNo: "ALC12660617",
    vehicleNo: "MH12AB4501",
    pdcDate: "2026-11-02",
    pdcDateLabel: "02 Nov 2026",
    pdcBranch: "Atteka Logistics-ALC1",
    mode: "Road",
    driverLicenseNo: "",
    preparedBy: "AL002: OFFICE USER",
    preparedAt: "ALC1: Ateka Logistics",
    preparedOn: "02 Nov 2026",
    vendor: "V00006: S.P LOGISTICS",
    fromLocation: "PUNE",
    toLocation: "NHAVASHEVA",
    distance: 160,
    driverName: "SANJAY PATIL",
    remark: "",
    lines: [
      {
        srNo: 1,
        docketNo: "ALC12660617",
        consignorName: "METRO LOGISTICS PARTNERS",
        pkgsLoad: 1,
        pkgsTotal: 1,
        weightLoad: 6000,
        weightTotal: 6000,
        picked: true,
        stampSign: true
      }
    ]
  },
  {
    id: "vppp-4",
    pdcNo: "PSALC12600413",
    manualPdcNo: "ALC12660618",
    vehicleNo: "KA01CD2201",
    pdcDate: "2026-11-03",
    pdcDateLabel: "03 Nov 2026",
    pdcBranch: "Atteka Logistics-ALC1",
    mode: "Road",
    driverLicenseNo: "",
    preparedBy: "AL003: BRANCH USER",
    preparedAt: "ALC1: Ateka Logistics",
    preparedOn: "03 Nov 2026",
    vendor: "V00009: GATEWAY FLEET CO",
    fromLocation: "SURAT",
    toLocation: "BHIWANDI",
    distance: 280,
    driverName: "-",
    remark: "",
    lines: [
      {
        srNo: 1,
        docketNo: "ALC12660618",
        consignorName: "COASTAL CARGO SOLUTIONS",
        pkgsLoad: 1,
        pkgsTotal: 1,
        weightLoad: 9000,
        weightTotal: 9000,
        picked: false,
        stampSign: false
      }
    ]
  },
  {
    id: "vppp-5",
    pdcNo: "PSALC12600414",
    manualPdcNo: "ALC12660619",
    vehicleNo: "MH04JK3515",
    pdcDate: "2026-11-04",
    pdcDateLabel: "04 Nov 2026",
    pdcBranch: "Atteka Logistics-ALC1",
    mode: "Road",
    driverLicenseNo: "",
    preparedBy: "AL002: OFFICE USER",
    preparedAt: "ALC1: Ateka Logistics",
    preparedOn: "04 Nov 2026",
    vendor: "V00001: NORTHBOUND TRANSPORT",
    fromLocation: "NASHIK",
    toLocation: "HYDERABAD",
    distance: 0,
    driverName: "-",
    remark: "",
    lines: [
      {
        srNo: 1,
        docketNo: "ALC12660619",
        consignorName: "GATEWAY DISTRIBUTION CO",
        pkgsLoad: 1,
        pkgsTotal: 1,
        weightLoad: 7000,
        weightTotal: 7000,
        picked: false,
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
      return NextResponse.json({ error: "Pickup PDC not found" }, { status: 404 });
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
