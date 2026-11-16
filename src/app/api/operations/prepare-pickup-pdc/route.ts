import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { Vendor } from "@/models/Vendor";

type VendorOpt = { code: string; name: string; label: string };

type CnRow = {
  id: string;
  cnNo: string;
  cnDate: string;
  cnDateLabel: string;
  payBasis: string;
  consignorName: string;
  consignorAddress: string;
  phoneNo: string;
  destination: string;
  pkgs: number;
  totalWt: number;
};

/** Fabricated pickup-PDC masters/rows — not client production data. */
const DEMO_VENDORS: VendorOpt[] = [
  { code: "V00001", name: "NORTHBOUND TRANSPORT", label: "V00001: NORTHBOUND TRANSPORT - V00001" },
  { code: "V00002", name: "METRO HAULAGE PARTNERS", label: "V00002: METRO HAULAGE PARTNERS - V00002" },
  { code: "V00006", name: "S.P LOGISTICS", label: "V00006: S.P LOGISTICS - V00006" },
  { code: "V00009", name: "GATEWAY FLEET CO", label: "V00009: GATEWAY FLEET CO - V00009" }
];

const DEMO_CNS: CnRow[] = [
  {
    id: "pp-1",
    cnNo: "ALC12660615",
    cnDate: "2026-11-01",
    cnDateLabel: "01 Nov 2026",
    payBasis: "TBB",
    consignorName: "NORTHBOUND FREIGHT PVT LTD",
    consignorAddress: "Bhiwandi Yard",
    phoneNo: "9876500001",
    destination: "HYDERABAD",
    pkgs: 1,
    totalWt: 8000
  },
  {
    id: "pp-2",
    cnNo: "ALC12660616",
    cnDate: "2026-11-01",
    cnDateLabel: "01 Nov 2026",
    payBasis: "TBB",
    consignorName: "NORTHBOUND FREIGHT PVT LTD",
    consignorAddress: "Bhiwandi Yard",
    phoneNo: "9876500001",
    destination: "HYDERABAD",
    pkgs: 1,
    totalWt: 8500
  },
  {
    id: "pp-3",
    cnNo: "ALC12660617",
    cnDate: "2026-11-02",
    cnDateLabel: "02 Nov 2026",
    payBasis: "TBB",
    consignorName: "METRO LOGISTICS PARTNERS",
    consignorAddress: "Pune MIDC",
    phoneNo: "9876500002",
    destination: "NHAVASHEVA",
    pkgs: 1,
    totalWt: 6000
  },
  {
    id: "pp-4",
    cnNo: "ALC12660618",
    cnDate: "2026-11-03",
    cnDateLabel: "03 Nov 2026",
    payBasis: "TBB",
    consignorName: "COASTAL CARGO SOLUTIONS",
    consignorAddress: "Surat Hub",
    phoneNo: "9876500003",
    destination: "BHIWANDI",
    pkgs: 1,
    totalWt: 9000
  },
  {
    id: "pp-5",
    cnNo: "ALC12660619",
    cnDate: "2026-11-04",
    cnDateLabel: "04 Nov 2026",
    payBasis: "TBB",
    consignorName: "GATEWAY DISTRIBUTION CO",
    consignorAddress: "Nashik Depot",
    phoneNo: "9876500004",
    destination: "HYDERABAD",
    pkgs: 1,
    totalWt: 7000
  },
  {
    id: "pp-6",
    cnNo: "ALC12660620",
    cnDate: "2026-11-05",
    cnDateLabel: "05 Nov 2026",
    payBasis: "Paid",
    consignorName: "NORTHBOUND FREIGHT PVT LTD",
    consignorAddress: "",
    phoneNo: "",
    destination: "BHIWANDI",
    pkgs: 1,
    totalWt: 0
  },
  {
    id: "pp-7",
    cnNo: "ALC12660621",
    cnDate: "2026-11-05",
    cnDateLabel: "05 Nov 2026",
    payBasis: "TBB",
    consignorName: "METRO LOGISTICS PARTNERS",
    consignorAddress: "",
    phoneNo: "",
    destination: "NHAVASHEVA",
    pkgs: 1,
    totalWt: 0
  },
  {
    id: "pp-8",
    cnNo: "ALC12660622",
    cnDate: "2026-11-05",
    cnDateLabel: "05 Nov 2026",
    payBasis: "TBB",
    consignorName: "COASTAL CARGO SOLUTIONS",
    consignorAddress: "Ahmedabad ICD",
    phoneNo: "9876500005",
    destination: "HYDERABAD",
    pkgs: 2,
    totalWt: 6500
  },
  {
    id: "pp-9",
    cnNo: "ALC12660623",
    cnDate: "2026-11-04",
    cnDateLabel: "04 Nov 2026",
    payBasis: "ToPay",
    consignorName: "GATEWAY DISTRIBUTION CO",
    consignorAddress: "Bengaluru Hub",
    phoneNo: "9876500006",
    destination: "BHIWANDI",
    pkgs: 1,
    totalWt: 7200
  },
  {
    id: "pp-10",
    cnNo: "ALC12660624",
    cnDate: "2026-11-03",
    cnDateLabel: "03 Nov 2026",
    payBasis: "TBB",
    consignorName: "NORTHBOUND FREIGHT PVT LTD",
    consignorAddress: "Bhiwandi Yard",
    phoneNo: "9876500001",
    destination: "HYDERABAD",
    pkgs: 1,
    totalWt: 8800
  }
];

function fmtCnDate(d: Date | string | undefined) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function mapCn(doc: any): CnRow {
  const raw = doc.bookingDate || doc.createdAt || new Date();
  return {
    id: String(doc._id || doc.docketNo),
    cnNo: String(doc.docketNo || "").toUpperCase(),
    cnDate: toIso(new Date(raw)),
    cnDateLabel: fmtCnDate(raw),
    payBasis: String(doc.paymentBasis || "TBB").replace("TO_PAY", "ToPay"),
    consignorName: String(doc.consignor?.name || doc.billingParty || "").toUpperCase(),
    consignorAddress: String(doc.consignor?.address || ""),
    phoneNo: String(doc.consignor?.phone || ""),
    destination: String(doc.toLocation || "").toUpperCase(),
    pkgs: Number(doc.packageDetails?.packagesCount || 1),
    totalWt: Number(doc.packageDetails?.actualWeight || doc.packageDetails?.chargedWeight || 0)
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("vendors") === "1") {
    try {
      await connectToDatabase();
      const docs = await Vendor.find({ isActive: { $ne: false } }).limit(100);
      if (docs.length) {
        return NextResponse.json({
          success: true,
          data: docs.map((v: any) => {
            const code = String(v.vendorCode || v.code || "");
            const name = String(v.name || "");
            return { code, name, label: `${code}: ${name} - ${code}` };
          })
        });
      }
    } catch {
      /* demo fallback */
    }
    return NextResponse.json({ success: true, data: DEMO_VENDORS });
  }

  const mode = (searchParams.get("mode") || "date").toLowerCase();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const docketNos = (searchParams.get("docketNos") || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const vendor = (searchParams.get("vendor") || "").trim().toLowerCase();

  try {
    await connectToDatabase();
    const query: any = { status: { $nin: ["CANCELLED", "BILLED"] } };

    if (mode === "docket" && docketNos.length) {
      query.docketNo = { $in: docketNos };
    } else if (from || to) {
      query.bookingDate = {};
      if (from) query.bookingDate.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) query.bookingDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const docs = await Consignment.find(query).sort({ bookingDate: -1 }).limit(200);
    let rows = docs.map(mapCn);

    if (vendor) {
      rows = rows.filter((r) => r.consignorName.toLowerCase().includes(vendor));
    }

    if (!rows.length) {
      const { ensureExceptionalSeedData } = await import("@/lib/exceptionalOpsEngine");
      await ensureExceptionalSeedData();
      const seeded = await Consignment.find(query).sort({ bookingDate: -1 }).limit(200);
      rows = seeded.map(mapCn);
      if (vendor) {
        rows = rows.filter((r) => r.consignorName.toLowerCase().includes(vendor));
      }
    }

    return NextResponse.json({ success: true, data: rows, total: rows.length, source: "db" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load CNs", data: [], total: 0, source: "db" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { RBAC, requireApiSession } = await import("@/lib/rbac");
    const gate = await requireApiSession(req, RBAC.opsWrite);
    if ("error" in gate) return gate.error;

    const body = await req.json();
    const { createPickupPdc } = await import("@/lib/operationsPdcEngine");
    const result = await createPickupPdc({
      selectedCnNos: Array.isArray(body.selectedCnNos) ? body.selectedCnNos : [],
      vendor: String(body.vendor || ""),
      vehicleNo: body.vehicleNo,
      manualPdcNo: body.manualPdcNo,
      pdcDate: body.pdcDate,
      pickup: body.pickup,
      drop: body.drop,
      distanceTraveled: Number(body.distanceTraveled || 0),
      contractAmount: Number(body.contractAmount || 0),
      remark: body.remark,
      financialAt: body.financialAt,
      financialType: body.financialType
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
      source: "db"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to prepare Pickup PDC" },
      { status: Number(error?.status) || 500 }
    );
  }
}
