import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Consignment } from "@/models/Consignment";
import { ConsignmentSchema } from "@/lib/validations";
import { memoryStore } from "@/lib/memoryStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").toLowerCase();
  const status = searchParams.get("status");

  try {
    await connectToDatabase();
    const query: any = {};
    if (search) {
      query.$or = [
        { docketNo: { $regex: search, $options: "i" } },
        { billingParty: { $regex: search, $options: "i" } }
      ];
    }
    if (status) query.status = status;

    const consignments = await Consignment.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: consignments.length, data: consignments });
  } catch {
    // Graceful fallback to memory store
    let list = memoryStore.getConsignments();
    if (search) {
      list = list.filter(
        (c) =>
          c.docketNo.toLowerCase().includes(search) ||
          c.billingParty.toLowerCase().includes(search) ||
          c.fromLocation.toLowerCase().includes(search) ||
          c.toLocation.toLowerCase().includes(search)
      );
    }
    if (status) {
      list = list.filter((c) => c.status === status);
    }
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

    const payload = {
      docketNo: data.docketNo.toUpperCase(),
      bookingDate: new Date(),
      bookingType: data.bookingType,
      bookingBranch: data.bookingBranch,
      billingParty: data.billingParty,
      paymentBasis: data.paymentBasis,
      serviceType: data.serviceType,
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
      status: "BOOKED"
    };

    try {
      await connectToDatabase();
      const newConsignment = await Consignment.create(payload);
      return NextResponse.json({ success: true, message: "Consignment created successfully", data: newConsignment }, { status: 201 });
    } catch {
      // Memory store fallback
      const saved = memoryStore.addConsignment(payload);
      return NextResponse.json({ success: true, message: "Consignment created (Memory Store)", data: saved, isMemoryStore: true }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
