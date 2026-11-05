import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { ConsignmentSchema } from "@/lib/validations";
import { memoryStore } from "@/lib/memoryStore";
import { postConsignmentLedger } from "@/lib/booksEngine";

function applyListFilters(list: any[], search: string, status: string | null) {
  let next = [...list];
  if (search) {
    next = next.filter(
      (c) =>
        String(c.docketNo || "").toLowerCase().includes(search) ||
        String(c.billingParty || "").toLowerCase().includes(search) ||
        String(c.fromLocation || "").toLowerCase().includes(search) ||
        String(c.toLocation || "").toLowerCase().includes(search)
    );
  }
  if (status) next = next.filter((c) => c.status === status);
  return next;
}

/** Overlay memory trip/POD updates onto Mongo rows; keep memory-only CNs. */
function mergeWithMemory(mongoDocs: any[]) {
  const memory = memoryStore.getConsignments();
  const byDocket = new Map<string, any>();

  for (const doc of mongoDocs) {
    const key = String(doc.docketNo || "").toUpperCase();
    byDocket.set(key, typeof doc.toObject === "function" ? doc.toObject() : { ...doc });
  }

  for (const mem of memory) {
    const key = String(mem.docketNo || "").toUpperCase();
    const existing = byDocket.get(key);
    if (!existing) {
      byDocket.set(key, { ...mem });
      continue;
    }
    byDocket.set(key, {
      ...existing,
      ...mem,
      // Prefer memory for trip/POD lifecycle fields when set
      tripSheetNo: mem.tripSheetNo || existing.tripSheetNo,
      podUrl: mem.podUrl || existing.podUrl,
      status: mem.tripSheetNo || mem.podUrl ? mem.status : existing.status,
      billingParty: mem.billingParty || existing.billingParty,
      consignor: { ...(existing.consignor || {}), ...(mem.consignor || {}) },
      consignee: { ...(existing.consignee || {}), ...(mem.consignee || {}) }
    });
  }

  return Array.from(byDocket.values()).sort((a, b) => {
    const da = new Date(a.createdAt || a.bookingDate || 0).getTime();
    const db = new Date(b.createdAt || b.bookingDate || 0).getTime();
    return db - da;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").toLowerCase();
  const status = searchParams.get("status");

  try {
    await connectToDatabase();
    const query: any = {};
    if (status) query.status = status;

    const consignments = await Consignment.find(query).sort({ createdAt: -1 });
    const merged = applyListFilters(mergeWithMemory(consignments), search, null);
    return NextResponse.json({ success: true, count: merged.length, data: merged });
  } catch {
    const list = applyListFilters(memoryStore.getConsignments(), search, status);
    return NextResponse.json({ success: true, count: list.length, data: list, isMemoryStore: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ConsignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const freightAmount = Number(data.freightAmount) || 0;
    const loadingCharge = Number(data.loadingCharge) || 0;
    const subTotal = freightAmount + loadingCharge;
    const gstRate = 5;
    const gstAmount = Math.round((subTotal * gstRate) / 100);
    const grandTotal = subTotal + gstAmount;
    const status = data.status || "BOOKED";

    // Draft may be saved before a master docket is linked
    const resolvedDocketNo = (
      data.docketNo ||
      (status === "DRAFT" ? `TEMP-${Date.now()}` : "")
    ).trim().toUpperCase();

    if (!resolvedDocketNo) {
      return NextResponse.json({ error: "Docket number is required" }, { status: 400 });
    }

    const payload = {
      docketNo: resolvedDocketNo,
      bookingDate: new Date(),
      bookingType: data.bookingType,
      bookingBranch: data.bookingBranch,
      billingParty: data.billingParty,
      paymentBasis: data.paymentBasis,
      serviceType: data.serviceType,
      serviceFtl: (data as any).serviceFtl,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      buDescription: data.buDescription,
      mode: data.mode,
      billedAt: data.billedAt,
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
      isLocalCn: data.isLocalCn,
      vehicleNo: data.vehicleNo,
      driverNo: data.driverNo,
      approxKm: data.approxKm,
      customerGstNo: data.customerGstNo,
      consignor: {
        name: data.consignorName,
        gstin: data.consignorGstin,
        address: data.consignorAddress,
        city: data.consignorCity,
        pincode: data.consignorPincode,
        phone: data.consignorPhone
      },
      consignee: {
        name: data.consigneeName,
        gstin: data.consigneeGstin,
        address: data.consigneeAddress,
        city: data.consigneeCity,
        pincode: data.consigneePincode,
        phone: data.consigneePhone
      },
      documentationDetails: {
        riskType: data.riskType,
        policyNo: data.policyNo,
        policyDate: data.policyDate ? new Date(data.policyDate) : undefined,
        shipment: data.shipment,
        poNo: data.poNo,
        containerNumber: data.containerNumber,
        containerSize: data.containerSize
      },
      invoiceDetails: {
        invoiceBeNo: data.invoiceBeNo,
        invoiceBeDate: data.invoiceBeDate ? new Date(data.invoiceBeDate) : undefined,
        declaredValue: data.declaredValue,
        currency: data.currency
      },
      packageDetails: {
        packageType: data.packageType,
        productDescription: data.productDescription,
        packagesCount: data.packagesCount,
        actualWeight: data.actualWeight,
        chargedWeight: data.chargedWeight,
        sealNo: data.sealNo
      },
      financials: {
        freightAmount,
        loadingCharge,
        subTotal,
        gstRate,
        gstAmount,
        grandTotal
      },
      ewayBillNo: data.ewayBillNo,
      ewayBillExpiry: data.ewayBillExpiry ? new Date(data.ewayBillExpiry) : undefined,
      remark: data.specialInstructions || data.remark,
      specialInstructions: data.specialInstructions || data.remark,
      status
    };

    try {
      await connectToDatabase();
      let savedConsignment;

      // Prefer updating an existing draft by id / previous temp docket, then by docketNo
      const draftId = data.draftId;
      const previousDocketNo = data.previousDocketNo?.trim().toUpperCase();

      if (draftId) {
        savedConsignment = await Consignment.findByIdAndUpdate(draftId, { $set: payload }, { new: true });
      }

      if (!savedConsignment && previousDocketNo) {
        savedConsignment = await Consignment.findOneAndUpdate(
          { docketNo: previousDocketNo },
          { $set: payload },
          { new: true }
        );
      }

      if (!savedConsignment) {
        const existing = await Consignment.findOne({ docketNo: payload.docketNo });
        if (existing) {
          savedConsignment = await Consignment.findOneAndUpdate(
            { docketNo: payload.docketNo },
            { $set: payload },
            { new: true }
          );
        } else {
          savedConsignment = await Consignment.create(payload);
        }
      }

      // Auto-post double-entry General Ledger ONLY when finalized/booked
      if (payload.status === "BOOKED") {
        try {
          await postConsignmentLedger({
            cnNumber: payload.docketNo,
            consignorName: payload.consignor.name,
            totalFreight: freightAmount,
            gstAmount,
            grandTotal,
            branchCode: payload.bookingBranch
          });
        } catch (ledgerErr) {
          console.warn("Ledger auto-post error:", ledgerErr);
        }
      }

      return NextResponse.json({
        success: true,
        message:
          payload.status === "DRAFT"
            ? "CN details saved. Assign a docket number from master to finalize."
            : payload.status === "DOCKET_ALLOCATED"
              ? "Docket number linked to CN draft"
              : "Consignment finalized and booked successfully",
        data: savedConsignment
      }, { status: 201 });
    } catch {
      // Memory store fallback
      let saved = null as any;
      if (data.draftId || data.previousDocketNo) {
        saved = memoryStore.updateConsignment(data.draftId || data.previousDocketNo!, payload);
      }
      if (!saved) {
        saved = memoryStore.addConsignment(payload);
      }
      return NextResponse.json({
        success: true,
        message: payload.status === "DRAFT"
          ? "CN details saved (Memory Store). Assign a docket number to finalize."
          : "Consignment saved (Memory Store)",
        data: saved,
        isMemoryStore: true
      }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
