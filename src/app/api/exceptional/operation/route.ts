import { NextRequest, NextResponse } from "next/server";
import { getExceptionalOpModule } from "@/lib/exceptionalOperationModules";

type DemoDoc = Record<string, string> & { id: string; documentNo: string };

/** Fabricated exceptional-ops documents — not client production data. */
const DEMO_BY_SLUG: Record<string, DemoDoc[]> = {
  "reassign-next-location": [
    {
      id: "eo-rn-1",
      documentNo: "ALC12660621",
      bookingDateLabel: "05 Nov 2026",
      deliveryDateLabel: "",
      destination: "ALC1 : Ateka Logistics",
      nextLocation: "ALC1 : Ateka Logistics",
      mode: "Air",
      pkgs: "1",
      actWt: "0",
      consignor: "NORTHBOUND FREIGHT PVT LTD",
      consignee: "NORTHBOUND FREIGHT PVT LTD",
      reassignDeliveryTo: "ALC1",
      reassignNextTo: "ALC1"
    },
    {
      id: "eo-rn-2",
      documentNo: "ALC12660615",
      bookingDateLabel: "01 Nov 2026",
      deliveryDateLabel: "",
      destination: "ALC2 : Bhiwandi Hub",
      nextLocation: "ALC1 : Ateka Logistics",
      mode: "Road",
      pkgs: "1",
      actWt: "8000",
      consignor: "METRO LOGISTICS PARTNERS",
      consignee: "GATEWAY DISTRIBUTION CO",
      reassignDeliveryTo: "ALC2",
      reassignNextTo: "ALC1"
    },
    {
      id: "eo-rn-3",
      documentNo: "ALC12660617",
      bookingDateLabel: "02 Nov 2026",
      deliveryDateLabel: "",
      destination: "ALC3 : Pune Hub",
      nextLocation: "ALC3 : Pune Hub",
      mode: "Road",
      pkgs: "2",
      actWt: "6000",
      consignor: "COASTAL CARGO SOLUTIONS",
      consignee: "METRO LOGISTICS PARTNERS",
      reassignDeliveryTo: "ALC3",
      reassignNextTo: "ALC3"
    }
  ],
  "cancel-delivery-pdc": [
    {
      id: "eo-cd-1",
      documentNo: "DSALC12600573",
      manualPdcNo: "",
      pdcDate: "04/11/2026",
      pdcLocation: "ALC1",
      vehicleNo: "V00001",
      noOfCns: "COMPANY VEHICLE",
      weight: "1",
      cancelled: "N",
      cancelReason: ""
    },
    {
      id: "eo-cd-2",
      documentNo: "DSALC12600532",
      manualPdcNo: "ALC12660575",
      pdcDate: "15/10/2026",
      pdcLocation: "ALC1",
      vehicleNo: "MH46BU8250",
      noOfCns: "1",
      weight: "6000",
      cancelled: "N",
      cancelReason: ""
    },
    {
      id: "eo-cd-3",
      documentNo: "DSALC12600533",
      manualPdcNo: "ALC12660576",
      pdcDate: "13/10/2026",
      pdcLocation: "ALC1",
      vehicleNo: "MH46CU4138",
      noOfCns: "2",
      weight: "12500",
      cancelled: "N",
      cancelReason: ""
    }
  ],
  "edit-thc-vendor-date-vehicle": [
    {
      id: "eo-thc-1",
      documentNo: "THCALC12600110",
      manualThcNo: "",
      thcDate: "02/11/2026",
      thcLocation: "ALC1",
      vendor: "V00001: COMPANY VEHICLE",
      vendorCode: "V00001",
      vehicleNo: "MH12AB4501",
      route: "BHIWANDI-HYDERABAD",
      noOfCns: "1",
      weight: "8000"
    },
    {
      id: "eo-thc-2",
      documentNo: "THCALC12600111",
      manualThcNo: "THC-MAN-111",
      thcDate: "04/11/2026",
      thcLocation: "ALC1",
      vendor: "V00002: METRO HAULAGE PARTNERS",
      vendorCode: "V00002",
      vehicleNo: "MH46CU4138",
      route: "BHIWANDI-CHENNAI",
      noOfCns: "2",
      weight: "12500"
    },
    {
      id: "eo-thc-3",
      documentNo: "THCALC12600112",
      manualThcNo: "",
      thcDate: "05/11/2026",
      thcLocation: "ALC2",
      vendor: "V00006: S.P LOGISTICS",
      vendorCode: "V00006",
      vehicleNo: "MH04JK3515",
      route: "PUNE-NAGPUR",
      noOfCns: "1",
      weight: "7000"
    }
  ],
  "change-route": [
    {
      id: "eo-cr-1",
      documentNo: "THCALC12600110",
      manualThcNo: "",
      thcDate: "02/11/2026",
      thcLocation: "ALC1",
      vendor: "V00001: COMPANY VEHICLE",
      vehicleNo: "MH12AB4501",
      currentRoute: "BHIWANDI-HYDERABAD",
      newRoute: "BHIWANDI-HYDERABAD",
      noOfCns: "1",
      weight: "8000"
    },
    {
      id: "eo-cr-2",
      documentNo: "THCALC12600111",
      manualThcNo: "THC-MAN-111",
      thcDate: "04/11/2026",
      thcLocation: "ALC1",
      vendor: "V00002: METRO HAULAGE PARTNERS",
      vehicleNo: "MH46CU4138",
      currentRoute: "BHIWANDI-CHENNAI",
      newRoute: "BHIWANDI-CHENNAI",
      noOfCns: "2",
      weight: "12500"
    },
    {
      id: "eo-cr-3",
      documentNo: "THCALC12600112",
      manualThcNo: "",
      thcDate: "05/11/2026",
      thcLocation: "ALC2",
      vendor: "V00006: S.P LOGISTICS",
      vehicleNo: "MH04JK3515",
      currentRoute: "PUNE-NAGPUR",
      newRoute: "PUNE-NAGPUR",
      noOfCns: "1",
      weight: "7000"
    }
  ],
  "edit-billing-party": [
    {
      id: "eo-bp-1",
      documentNo: "ALC12660616",
      docketDateLabel: "04 Nov 2026",
      fromLocation: "BHIWANDI",
      toLocation: "HYDERABAD",
      typeOfFtl: "20 MT CONTAINER",
      billingParty: "NORTHBOUND FREIGHT PVT LTD",
      billToPartyCode: "P000002",
      gstin: "27AABCM2002B1Z8",
      serviceType: "FTL"
    },
    {
      id: "eo-bp-2",
      documentNo: "ALC12660615",
      docketDateLabel: "01 Nov 2026",
      fromLocation: "BHIWANDI",
      toLocation: "HYDERABAD",
      typeOfFtl: "32 FT SXL",
      billingParty: "METRO LOGISTICS PARTNERS",
      billToPartyCode: "P000001",
      gstin: "27AABCN1001A1Z5",
      serviceType: "FTL"
    },
    {
      id: "eo-bp-3",
      documentNo: "ALC12660617",
      docketDateLabel: "02 Nov 2026",
      fromLocation: "PUNE",
      toLocation: "NHAVASHEVA",
      typeOfFtl: "20 FT CONTAINER",
      billingParty: "COASTAL CARGO SOLUTIONS",
      billToPartyCode: "P000003",
      gstin: "24AABCC3003C1Z2",
      serviceType: "FTL"
    }
  ],
  "edit-manual-document-number": [
    {
      id: "eo-md-pdc-1",
      documentNo: "DSALC12600573",
      docType: "PDC",
      manualNo: "",
      dateLabel: "04 Nov 2026",
      branch: "ALC1 : Ateka Logistics",
      vehicleNo: "MH04JK3515",
      deliveryLocation: "HYDERABAD",
      contractAmt: "0",
      manualPrefix: "DSALC126",
      manualSuffix: ""
    },
    {
      id: "eo-md-pdc-2",
      documentNo: "DSALC12600532",
      docType: "PDC",
      manualNo: "ALC12660575",
      dateLabel: "15 Oct 2026",
      branch: "ALC1 : Ateka Logistics",
      vehicleNo: "MH46BU8250",
      deliveryLocation: "HYDERABAD",
      contractAmt: "0",
      manualPrefix: "DSALC126",
      manualSuffix: "00532"
    },
    {
      id: "eo-md-thc-1",
      documentNo: "THCALC12600110",
      docType: "THC",
      manualNo: "",
      dateLabel: "02 Nov 2026",
      branch: "ALC1 : Ateka Logistics",
      vehicleNo: "MH12AB4501",
      deliveryLocation: "",
      route: "BHIWANDI-HYDERABAD",
      contractAmt: "0",
      manualPrefix: "THCALC126",
      manualSuffix: ""
    },
    {
      id: "eo-md-thc-2",
      documentNo: "THCALC12600111",
      docType: "THC",
      manualNo: "THC-MAN-111",
      dateLabel: "04 Nov 2026",
      branch: "ALC1 : Ateka Logistics",
      vehicleNo: "MH46CU4138",
      deliveryLocation: "",
      route: "BHIWANDI-CHENNAI",
      contractAmt: "12500",
      manualPrefix: "THCALC126",
      manualSuffix: "00111"
    },
    {
      id: "eo-md-mf-1",
      documentNo: "MFALC12600021",
      docType: "Manifest",
      manualNo: "",
      dateLabel: "03 Nov 2026",
      branch: "ALC1 : Ateka Logistics",
      vehicleNo: "MH46BU8250",
      deliveryLocation: "HYDERABAD",
      contractAmt: "0",
      manualPrefix: "MFALC126",
      manualSuffix: ""
    },
    {
      id: "eo-md-mf-2",
      documentNo: "MFALC12600022",
      docType: "Manifest",
      manualNo: "",
      dateLabel: "05 Nov 2026",
      branch: "ALC2 : Bhiwandi Hub",
      vehicleNo: "MH04JK3515",
      deliveryLocation: "CHENNAI",
      contractAmt: "0",
      manualPrefix: "MFALC126",
      manualSuffix: ""
    },
    {
      id: "eo-md-bl-1",
      documentNo: "BLALC12600031",
      docType: "Bill",
      manualNo: "",
      dateLabel: "06 Nov 2026",
      branch: "ALC1 : Ateka Logistics",
      vehicleNo: "",
      partyName: "NORTHBOUND FREIGHT PVT LTD",
      deliveryLocation: "BHIWANDI",
      contractAmt: "18500",
      manualPrefix: "BLALC126",
      manualSuffix: ""
    },
    {
      id: "eo-md-bl-2",
      documentNo: "BLALC12600032",
      docType: "Bill",
      manualNo: "",
      dateLabel: "07 Nov 2026",
      branch: "ALC1 : Ateka Logistics",
      vehicleNo: "",
      partyName: "METRO LOGISTICS PARTNERS",
      deliveryLocation: "PUNE",
      contractAmt: "22000",
      manualPrefix: "BLALC126",
      manualSuffix: ""
    }
  ],
  "edit-pdc-vendor-date-vehicle": [
    {
      id: "eo-pv-1",
      documentNo: "DSALC12600573",
      manualPdcNo: "",
      pdcDate: "04/11/2026",
      pdcLocation: "ALC1",
      vendor: "V00001: COMPANY VEHICLE",
      vendorCode: "V00001",
      vehicleNo: "MH04JK3515",
      deliveryLocation: "HYDERABAD",
      noOfCns: "1",
      weight: "6000"
    },
    {
      id: "eo-pv-2",
      documentNo: "DSALC12600532",
      manualPdcNo: "ALC12660575",
      pdcDate: "15/10/2026",
      pdcLocation: "ALC1",
      vendor: "V00001: COMPANY VEHICLE",
      vendorCode: "V00001",
      vehicleNo: "MH46BU8250",
      deliveryLocation: "HYDERABAD",
      noOfCns: "1",
      weight: "6000"
    },
    {
      id: "eo-pv-3",
      documentNo: "PSALC12600410",
      manualPdcNo: "ALC12660615",
      pdcDate: "01/11/2026",
      pdcLocation: "ALC1",
      vendor: "V00002: METRO HAULAGE PARTNERS",
      vendorCode: "V00002",
      vehicleNo: "MH46BU8250",
      deliveryLocation: "HYDERABAD",
      noOfCns: "1",
      weight: "8000"
    }
  ],
  "edit-billing-party-branch-po": [
    {
      id: "eo-bbp-1",
      documentNo: "ALC12660616",
      docketDateLabel: "04 Nov 2026",
      consignor: "NORTHBOUND FREIGHT PVT LTD",
      pkgs: "1",
      actWt: "6000",
      chgWt: "6000",
      billPartyCode: "P000002",
      billPartyName: "P000002 : METRO LOGISTICS PARTNERS",
      deliveryLocation: "HYDERABAD",
      poNumber: "",
      shipmentNo: "",
      dnNumber: "",
      financialBranchCode: "ALC1",
      financialBranchName: "ALC1 : Ateka Logistics"
    },
    {
      id: "eo-bbp-2",
      documentNo: "ALC12660615",
      docketDateLabel: "01 Nov 2026",
      consignor: "METRO LOGISTICS PARTNERS",
      pkgs: "1",
      actWt: "8000",
      chgWt: "8000",
      billPartyCode: "P000001",
      billPartyName: "P000001 : NORTHBOUND FREIGHT PVT LTD",
      deliveryLocation: "HYDERABAD",
      poNumber: "PO/2026/1001",
      shipmentNo: "SHP-1001",
      dnNumber: "",
      financialBranchCode: "ALC1",
      financialBranchName: "ALC1 : Ateka Logistics"
    },
    {
      id: "eo-bbp-3",
      documentNo: "ALC12660617",
      docketDateLabel: "02 Nov 2026",
      consignor: "COASTAL CARGO SOLUTIONS",
      pkgs: "2",
      actWt: "6000",
      chgWt: "6000",
      billPartyCode: "P000003",
      billPartyName: "P000003 : COASTAL CARGO SOLUTIONS",
      deliveryLocation: "NHAVASHEVA",
      poNumber: "",
      shipmentNo: "",
      dnNumber: "DN-441",
      financialBranchCode: "ALC3",
      financialBranchName: "ALC3 : Pune Hub"
    }
  ],
  "edit-from-to-location": [
    {
      id: "eo-ft-pdc-1",
      documentNo: "DSALC12600573",
      docType: "PDC",
      dateLabel: "04 Nov 2026",
      fromLocation: "BHIWANDI",
      toLocation: "HYDERABAD",
      vendorName: "COMPANY VEHICLE"
    },
    {
      id: "eo-ft-pdc-2",
      documentNo: "DSALC12600532",
      docType: "PDC",
      dateLabel: "15 Oct 2026",
      fromLocation: "BHIWANDI",
      toLocation: "HYDERABAD",
      vendorName: "COMPANY VEHICLE"
    },
    {
      id: "eo-ft-pdc-3",
      documentNo: "PSALC12600410",
      docType: "PDC",
      dateLabel: "01 Nov 2026",
      fromLocation: "BHIWANDI",
      toLocation: "HYDERABAD",
      vendorName: "METRO HAULAGE PARTNERS"
    },
    {
      id: "eo-ft-thc-1",
      documentNo: "THCALC12600110",
      docType: "THC",
      dateLabel: "02 Nov 2026",
      fromLocation: "BHIWANDI",
      toLocation: "HYDERABAD",
      vendorName: "COMPANY VEHICLE"
    },
    {
      id: "eo-ft-thc-2",
      documentNo: "THCALC12600111",
      docType: "THC",
      dateLabel: "04 Nov 2026",
      fromLocation: "BHIWANDI",
      toLocation: "CHENNAI",
      vendorName: "METRO HAULAGE PARTNERS"
    }
  ]
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  const documentNo = (searchParams.get("documentNo") || "").trim().toUpperCase();
  const docType = (searchParams.get("docType") || "").trim();

  const mod = getExceptionalOpModule(slug);
  if (!mod) {
    return NextResponse.json({ error: "Unknown exceptional operation" }, { status: 404 });
  }

  let list = DEMO_BY_SLUG[slug] || [];
  if (
    (slug === "edit-manual-document-number" || slug === "edit-from-to-location") &&
    docType
  ) {
    list = list.filter((d) => String(d.docType || "").toUpperCase() === docType.toUpperCase());
  }

  if (!documentNo) {
    return NextResponse.json({
      success: true,
      data: list.map((d) => ({ id: d.id, documentNo: d.documentNo, docType: d.docType })),
      total: list.length,
      source: "demo"
    });
  }

  const found =
    list.find((d) => d.documentNo === documentNo || d.documentNo.includes(documentNo)) || null;
  if (!found) {
    return NextResponse.json(
      {
        error: docType
          ? `No ${docType} found for this System No`
          : "Document not found"
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: found, source: "demo" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug || "").trim();
  const documentNo = String(body.documentNo || "").trim().toUpperCase();
  const values = (body.values || {}) as Record<string, string>;

  const mod = getExceptionalOpModule(slug);
  if (!mod) {
    return NextResponse.json({ error: "Unknown exceptional operation" }, { status: 404 });
  }
  if (!documentNo) {
    return NextResponse.json({ error: "Document No. is required" }, { status: 400 });
  }

  const list = DEMO_BY_SLUG[slug] || [];
  const idx = list.findIndex(
    (d) => d.documentNo === documentNo || d.documentNo.includes(documentNo)
  );
  if (idx < 0) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const updated: DemoDoc = {
    ...list[idx],
    ...values,
    documentNo: list[idx].documentNo
  };

  // Keep display locations in sync when reassignment codes change.
  if (slug === "reassign-next-location") {
    if (values.reassignDeliveryTo) {
      updated.destination = `${values.reassignDeliveryTo} : Ateka Logistics`;
    }
    if (values.reassignNextTo) {
      updated.nextLocation = `${values.reassignNextTo} : Ateka Logistics`;
    }
  }

  if (slug === "edit-manual-document-number" && values.manualNo) {
    updated.manualNo = values.manualNo;
  }

  list[idx] = updated;

  return NextResponse.json({
    success: true,
    message: `${mod.title} saved for ${updated.documentNo} (demo)`,
    data: updated,
    source: "demo"
  });
}
