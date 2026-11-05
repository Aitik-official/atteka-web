import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { Consignment } from "@/models/Consignment";
import { memoryStore } from "@/lib/memoryStore";

const SAMPLE_BILLS = [
  {
    billNumber: "BLALC12600586",
    billDate: new Date("2026-11-02"),
    customerCode: "P000002",
    customerName: "EXPEDITORS INTERNATIONAL (INDIA) PRIVATE LIMITED",
    billingBranch: "ALC1",
    billType: "Freight Bill",
    consignments: ["ALC12660615"],
    totalFreight: 100000,
    taxAmount: 18000,
    grandTotal: 118000,
    irnDetails: { irn: "0008ef131670a1b2c3d4e5f678901234567890abcdef", ackNo: "112233", ackDate: new Date(), status: "ACT", isSimulated: true },
    status: "GENERATED"
  },
  {
    billNumber: "BLALC12600537",
    billDate: new Date("2026-11-02"),
    customerCode: "P000002",
    customerName: "EXPEDITORS INTERNATIONAL (INDIA) PRIVATE LIMITED",
    billingBranch: "ALC1",
    billType: "Freight Bill",
    consignments: ["ALC12660616"],
    totalFreight: 168000,
    taxAmount: 30240,
    grandTotal: 198240,
    irnDetails: { irn: "1122ab44556677889900ccddeeff00112233445566", ackNo: "445566", ackDate: new Date(), status: "ACT", isSimulated: true },
    status: "GENERATED"
  },
  {
    billNumber: "BLALC12600587",
    billDate: new Date("2026-11-02"),
    customerCode: "P000002",
    customerName: "EXPEDITORS INTERNATIONAL (INDIA) PRIVATE LIMITED",
    billingBranch: "ALC1",
    billType: "Freight Bill",
    consignments: ["ALC12660615", "ALC12660616"],
    totalFreight: 100000,
    taxAmount: 18000,
    grandTotal: 118000,
    irnDetails: { irn: "9988ff00112233445566778899aabbccddeeff0011", ackNo: "778899", ackDate: new Date(), status: "ACT", isSimulated: true },
    status: "GENERATED"
  }
];

export async function GET() {
  try {
    await connectToDatabase();
    let bills = await CustomerBill.find().sort({ createdAt: -1 });
    if (bills.length === 0) {
      try {
        await CustomerBill.insertMany(SAMPLE_BILLS, { ordered: false });
      } catch {
        // ignore seed races / schema extras
      }
      bills = await CustomerBill.find().sort({ createdAt: -1 });
    }
    if (bills.length === 0) {
      return NextResponse.json({ success: true, data: SAMPLE_BILLS, isFallback: true });
    }
    return NextResponse.json({ success: true, data: bills });
  } catch {
    const bills = memoryStore.bills.length > 0 ? memoryStore.bills : SAMPLE_BILLS;
    return NextResponse.json({ success: true, data: bills, isMemoryStore: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerCode,
      customerName,
      customerGstin,
      partyAddress,
      destinationAddress,
      city,
      sacCode,
      gstPercent,
      manualBillNo,
      billDate,
      collectionBranch,
      billingBranch,
      remark,
      gstBranch,
      dateFrom,
      dateTo,
      consignmentIds,
      lineItems,
      totalFreight,
      taxAmount,
      igst,
      cgst,
      sgst,
      grandTotal
    } = body;

    if (!customerName) {
      return NextResponse.json({ error: "Billing party is required" }, { status: 400 });
    }
    if (!Array.isArray(consignmentIds) || consignmentIds.length === 0) {
      return NextResponse.json({ error: "Select at least one CN / docket" }, { status: 400 });
    }

    const billNumber = (manualBillNo && String(manualBillNo).trim()) || `TBILL-${Date.now().toString().slice(-6)}`;

    const billRecord: any = {
      billNumber: String(billNumber).toUpperCase(),
      billDate: billDate ? new Date(billDate) : new Date(),
      customerCode: customerCode || "CUST-001",
      customerName,
      customerGstin: customerGstin || "",
      partyAddress: partyAddress || "",
      destinationAddress: destinationAddress || "",
      city: city || "",
      sacCode: sacCode || "996511",
      gstPercent: Number(gstPercent) || 5,
      collectionBranch: collectionBranch || "ALC1",
      billingBranch: billingBranch || "ALC1",
      gstBranch: gstBranch || "",
      remark: remark || "",
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      consignments: consignmentIds,
      lineItems: lineItems || [],
      billType: "Freight Bill",
      totalFreight: Number(totalFreight) || 0,
      taxAmount: Number(taxAmount) || 0,
      igst: Number(igst) || 0,
      cgst: Number(cgst) || 0,
      sgst: Number(sgst) || 0,
      grandTotal: Number(grandTotal) || 0,
      status: "GENERATED"
    };

    try {
      await connectToDatabase();
      const newBill = await CustomerBill.create(billRecord);

      // Mark linked consignments as BILLED
      await Consignment.updateMany(
        { docketNo: { $in: consignmentIds.map((d: string) => String(d).toUpperCase()) } },
        { $set: { status: "BILLED" } }
      );

      return NextResponse.json({
        success: true,
        message: "Transport bill generated",
        data: newBill
      }, { status: 201 });
    } catch {
      const memoryBill = { ...billRecord, _id: `b-${Date.now()}` };
      memoryStore.bills.unshift(memoryBill);

      // Update memory consignments status
      const cns = memoryStore.getConsignments();
      consignmentIds.forEach((docketNo: string) => {
        const idx = cns.findIndex((c) => c.docketNo?.toUpperCase() === String(docketNo).toUpperCase());
        if (idx !== -1) cns[idx].status = "BILLED";
      });

      return NextResponse.json({
        success: true,
        message: "Transport bill generated (Memory Store)",
        data: memoryBill,
        isMemoryStore: true
      }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
