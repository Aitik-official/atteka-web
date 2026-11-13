import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TripSheet } from "@/models/TripSheet";
import { Consignment } from "@/models/Consignment";
import { memoryStore } from "@/lib/memoryStore";
import { RBAC, requireApiSession } from "@/lib/rbac";

function buildCnPatch(payload: any, docketLine?: any) {
  const party = String(payload.customerName || "").trim();
  const consignorName = String(docketLine?.consignorName || party).trim() || party;
  const consigneeName = String(docketLine?.consigneeName || party).trim() || party;
  return {
    status: "IN_TRANSIT",
    // New trip always needs a fresh POD before billing — clear any previous upload
    podUrl: "",
    podFileName: "",
    podUploadedAt: "",
    tripSheetNo: payload.tripSheetNo,
    vehicleNo: payload.vehicleNo,
    driverPhone: payload.driverMobile || undefined,
    billingParty: party,
    fromLocation: payload.pickupLocation || undefined,
    toLocation: payload.deliveryLocation || undefined,
    consignor: { name: consignorName },
    consignee: {
      name: consigneeName,
      address: docketLine?.deliveryAddress || undefined
    }
  };
}

function applyMemoryUpdates(payload: any, dockets: any[], docketNos: string[]) {
  if (!Array.isArray(memoryStore.tripSheets)) {
    (memoryStore as any).tripSheets = [];
  }
  memoryStore.tripSheets.unshift({
    ...payload,
    _id: `ts-${Date.now()}`,
    createdAt: new Date().toISOString()
  });

  for (const dn of docketNos) {
    const line = dockets.find((d) => String(d.docketNo || "").toUpperCase() === dn);
    const patch = buildCnPatch(payload, line);
    const existing = memoryStore.getConsignments().find((c) => c.docketNo?.toUpperCase() === dn);
    const updated = memoryStore.updateConsignment(dn, {
      ...patch,
      consignor: { ...(existing?.consignor || {}), ...patch.consignor },
      consignee: { ...(existing?.consignee || {}), ...patch.consignee }
    });
    // If CN only exists in Mongo (not memory), still seed a memory row so bill gen merge sees it
    if (!updated) {
      memoryStore.addConsignment({
        docketNo: dn,
        bookingDate: line?.refDate || new Date().toISOString().slice(0, 10),
        bookingType: "NORMAL",
        bookingBranch: "ALC1",
        billingParty: patch.billingParty,
        paymentBasis: "TBB",
        serviceType: "FTL",
        fromLocation: patch.fromLocation || "",
        toLocation: patch.toLocation || "",
        vehicleNo: patch.vehicleNo,
        driverPhone: patch.driverPhone,
        consignor: { name: patch.consignor.name },
        consignee: { name: patch.consignee.name, address: patch.consignee.address || "" },
        packageDetails: {
          packageType: "BOX",
          productDescription: "TRIP SHEET LOAD",
          packagesCount: Number(line?.pkgsTotal) || 1,
          actualWeight: Number(line?.weightTotal) || 0,
          chargedWeight: Number(line?.weightLoad) || Number(line?.weightTotal) || 0
        },
        financials: {
          freightAmount: Number(payload.freight) || 0,
          loadingCharge: 0,
          subTotal: Number(payload.freight) || 0,
          gstRate: 5,
          gstAmount: 0,
          grandTotal: Number(payload.freight) || 0
        },
        ewayBillNo: line?.ewayBillNo || "",
        status: patch.status,
        tripSheetNo: patch.tripSheetNo,
        podUrl: "",
        podFileName: "",
        podUploadedAt: ""
      });
    }
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const list = await TripSheet.find().sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch {
    const list = Array.isArray(memoryStore.tripSheets) ? memoryStore.tripSheets : [];
    return NextResponse.json({
      success: true,
      count: list.length,
      data: list,
      isMemoryStore: true
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireApiSession(req, RBAC.opsWrite);
    if ("error" in gate) return gate.error;

    const body = await req.json();
    const dockets = Array.isArray(body.dockets) ? body.dockets : [];
    const docketNos = dockets
      .map((d: any) => String(d.docketNo || "").trim().toUpperCase())
      .filter(Boolean);

    if (!body.customerName?.trim()) {
      return NextResponse.json({ error: "Customer Name is required" }, { status: 400 });
    }
    if (!body.vehicleNo?.trim()) {
      return NextResponse.json({ error: "Vehicle No is required" }, { status: 400 });
    }
    if (docketNos.length === 0) {
      return NextResponse.json({ error: "At least one docket is required" }, { status: 400 });
    }

    const tripSheetNo =
      String(body.tripSheetNo || "").trim().toUpperCase() ||
      `TS${Date.now().toString().slice(-8)}`;

    const customerName = String(body.customerName).trim();

    const payload = {
      tripSheetNo,
      manualTripSheetNo: body.manualTripSheetNo || "",
      customerName,
      tripDate: body.tripDate ? new Date(body.tripDate) : new Date(),
      tripTime: body.tripTime || "12:00",
      location: body.location || "",
      vendorName: body.vendorName || "",
      vendorCode: body.vendorCode || "Auto",
      vehicleNo: String(body.vehicleNo).trim().toUpperCase(),
      vehicleType: body.vehicleType || "",
      pickupLocation: body.pickupLocation || "",
      deliveryLocation: body.deliveryLocation || "",
      driverName: body.driverName || "",
      driverMobile: body.driverMobile || "",
      freight: Number(body.freight) || 0,
      advanceAmt: Number(body.advanceAmt) || 0,
      balanceAmt: Number(body.balanceAmt) || 0,
      startKm: Number(body.startKm) || 0,
      specialInstructions: body.specialInstructions || "",
      dockets: dockets.map((d: any) => {
        const consignorName = String(d.consignorName || customerName).trim() || customerName;
        const consigneeName = String(d.consigneeName || customerName).trim() || customerName;
        return {
          docketNo: String(d.docketNo || "").trim().toUpperCase(),
          ewayBillNo: d.ewayBillNo || "",
          refDate: d.refDate || "",
          consignorName,
          consigneeName,
          pkgsLoad: Number(d.pkgsLoad) || 0,
          pkgsTotal: Number(d.pkgsTotal) || 0,
          weightLoad: Number(d.weightLoad) || 0,
          weightTotal: Number(d.weightTotal) || 0,
          customerDockNo: d.customerDockNo || "",
          deliveryAddress: d.deliveryAddress || ""
        };
      }),
      status: "PREPARED" as const
    };

    let created: any = null;
    let mongoOk = false;

    try {
      await connectToDatabase();
      created = await TripSheet.create(payload);

      for (const line of payload.dockets) {
        const patch = buildCnPatch(payload, line);
        await Consignment.findOneAndUpdate(
          { docketNo: line.docketNo },
          {
            $set: {
              status: patch.status,
              tripSheetNo: patch.tripSheetNo,
              vehicleNo: patch.vehicleNo,
              driverPhone: patch.driverPhone,
              billingParty: patch.billingParty,
              fromLocation: patch.fromLocation,
              toLocation: patch.toLocation,
              "consignor.name": patch.consignor.name,
              "consignee.name": patch.consignee.name,
              ...(patch.consignee.address ? { "consignee.address": patch.consignee.address } : {}),
              // Force a fresh POD for this trip before bill generation
              podUrl: "",
              podFileName: "",
              podUploadedAt: ""
            }
          }
        );
      }
      mongoOk = true;
    } catch {
      mongoOk = false;
    }

    // Always sync memory store so bill gen sees tripSheetNo even if CN lives only in memory
    applyMemoryUpdates(payload, payload.dockets, docketNos);

    return NextResponse.json({
      success: true,
      message: `Loading Slip ${tripSheetNo} prepared with ${docketNos.length} docket(s)`,
      data: created || memoryStore.tripSheets[0],
      isMemoryStore: !mongoOk
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to prepare trip sheet" }, { status: 500 });
  }
}
