import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { Consignment } from "@/models/Consignment";
import { memoryStore } from "@/lib/memoryStore";
import { postBillLedger } from "@/lib/booksEngine";
import { RBAC, requireApiSession } from "@/lib/rbac";

const SAMPLE_BILLS = [
  {
    billNumber: "BLALC12600586",
    billDate: new Date("2026-11-02"),
    customerCode: "P000002",
    customerName: "EXPEDITORS INTERNATIONAL (INDIA) PRIVATE LIMITED",
    customerGstin: "27AAACE2500A1ZX",
    partyAddress: "UNIT NO. 701, 7TH FLOOR, TOWER A, EMBASSY 247, L.B.S. MARG, VIKHROLI WEST, MUMBAI",
    city: "MUMBAI",
    sacCode: "996511",
    gstPercent: 18,
    billingBranch: "ALC1",
    billType: "Freight Bill",
    billFormat: "E-Invoice Bill Formate",
    remark: "OK",
    consignments: ["ALC12660615"],
    lineItems: [
      {
        docketNo: "ALC12660615",
        bookingDate: "01 Nov 2026",
        from: "MUMBAI",
        to: "DELHI",
        vehicleNo: "MH46BM1234",
        freight: 100000,
        totalPkgs: 12,
        totalWt: 2400,
        rateType: "FTL",
        particulars: "AS PER INVOICE"
      }
    ],
    totalFreight: 100000,
    taxAmount: 18000,
    cgst: 9000,
    sgst: 9000,
    igst: 0,
    grandTotal: 118000,
    preparedBy: "ANISHA OZARKAR",
    irnDetails: {
      irn: "0008ef131670a1b2c3d4e5f678901234567890abcdef",
      ackNo: "112233445566",
      ackDate: new Date("2026-11-02"),
      status: "ACT",
      isSimulated: true
    },
    status: "GENERATED"
  },
  {
    billNumber: "BLALC12600590",
    billDate: new Date("2026-11-03"),
    customerCode: "P000002",
    customerName: "EXPEDITORS INTERNATIONAL (INDIA) PRIVATE LIMITED",
    customerGstin: "27AAACE2500A1ZX",
    partyAddress: "UNIT NO. 701, 7TH FLOOR, TOWER A, EMBASSY 247, L.B.S. MARG, VIKHROLI WEST, MUMBAI",
    city: "MUMBAI",
    sacCode: "996511",
    gstPercent: 18,
    billingBranch: "ALC1",
    billType: "Freight Bill",
    billFormat: "Standard Bill Format",
    remark: "Billing period 01-Nov to 03-Nov · AIRPORT RETRIEVAL",
    consignments: ["ALC12660620"],
    customChargeColumns: [{ id: "extra1", particular: "AIRPORT RETRIEVAL" }],
    lineItems: [
      {
        docketNo: "ALC12660620",
        bookingDate: "02 Nov 2026",
        from: "MUMBAI",
        to: "BANGALORE",
        vehicleNo: "MH04CK9988",
        freight: 85000,
        totalPkgs: 8,
        totalWt: 1800,
        rateType: "FTL",
        particulars: "AS PER INVOICE",
        customCharges: { extra1: 5000 }
      }
    ],
    totalFreight: 90000,
    taxAmount: 16200,
    cgst: 8100,
    sgst: 8100,
    igst: 0,
    grandTotal: 106200,
    preparedBy: "ANISHA OZARKAR",
    irnDetails: {
      irn: "aabbccddeeff0011223344556677889900aabbccdd",
      ackNo: "998877665544",
      ackDate: new Date("2026-11-03"),
      status: "ACT",
      isSimulated: true
    },
    status: "GENERATED"
  },
  {
    billNumber: "BLALC12600587",
    billDate: new Date("2026-11-02"),
    customerCode: "P000002",
    customerName: "EXPEDITORS INTERNATIONAL (INDIA) PRIVATE LIMITED",
    customerGstin: "27AAACE2500A1ZX",
    partyAddress: "UNIT NO. 701, 7TH FLOOR, TOWER A, EMBASSY 247, L.B.S. MARG, VIKHROLI WEST, MUMBAI",
    city: "MUMBAI",
    sacCode: "996511",
    gstPercent: 18,
    billingBranch: "ALC1",
    billType: "Freight Bill",
    billFormat: "Thermal Format",
    consignments: ["ALC12660615", "ALC12660616"],
    lineItems: [
      {
        docketNo: "ALC12660615",
        bookingDate: "01 Nov 2026",
        from: "MUMBAI",
        to: "DELHI",
        vehicleNo: "MH46BM1234",
        freight: 50000,
        totalPkgs: 6,
        totalWt: 1200
      },
      {
        docketNo: "ALC12660616",
        bookingDate: "01 Nov 2026",
        from: "MUMBAI",
        to: "PUNE",
        vehicleNo: "MH12AB4455",
        freight: 50000,
        totalPkgs: 4,
        totalWt: 900
      }
    ],
    totalFreight: 100000,
    taxAmount: 18000,
    cgst: 9000,
    sgst: 9000,
    igst: 0,
    grandTotal: 118000,
    preparedBy: "ANISHA OZARKAR",
    irnDetails: {
      irn: "9988ff00112233445566778899aabbccddeeff0011",
      ackNo: "778899001122",
      ackDate: new Date("2026-11-02"),
      status: "ACT",
      isSimulated: true
    },
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
    const gate = await requireApiSession(req, RBAC.financeWrite);
    if ("error" in gate) return gate.error;

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
      customChargeColumns,
      billFormat,
      preparedBy,
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

    const docketNos = consignmentIds.map((d: string) => String(d).trim().toUpperCase()).filter(Boolean);

    // Resolve POD per docket — each must have its own unique POD before billing
    const memCns = memoryStore.getConsignments();
    let mongoCns: any[] = [];
    try {
      await connectToDatabase();
      mongoCns = await Consignment.find({ docketNo: { $in: docketNos } });
    } catch {
      mongoCns = [];
    }

    const podAttachments: { docketNo: string; podUrl: string; podFileName?: string }[] = [];
    const missingPod: string[] = [];
    const seenPod = new Map<string, string>();
    const duplicatePod: string[] = [];

    for (const dn of docketNos) {
      const mongo = mongoCns.find((c) => String(c.docketNo || "").toUpperCase() === dn);
      const mem = memCns.find((c) => String(c.docketNo || "").toUpperCase() === dn);
      // Prefer memory when it explicitly has podUrl (including cleared "")
      const podUrl = mem && Object.prototype.hasOwnProperty.call(mem, "podUrl")
        ? String(mem.podUrl || "").trim()
        : String(mongo?.podUrl || mem?.podUrl || "").trim();
      if (!podUrl) {
        missingPod.push(dn);
        continue;
      }
      const prev = seenPod.get(podUrl);
      if (prev) duplicatePod.push(`${dn} shares POD with ${prev}`);
      else seenPod.set(podUrl, dn);
      podAttachments.push({
        docketNo: dn,
        podUrl,
        podFileName: mem?.podFileName || mongo?.podFileName || ""
      });
    }

    if (missingPod.length > 0) {
      return NextResponse.json(
        {
          error: `POD required for each docket. Missing: ${missingPod.join(", ")}`
        },
        { status: 400 }
      );
    }
    if (duplicatePod.length > 0) {
      return NextResponse.json(
        {
          error: `Each docket must use a different POD. ${duplicatePod.join("; ")}`
        },
        { status: 400 }
      );
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
      consignments: docketNos,
      podAttachments,
      lineItems: lineItems || [],
      customChargeColumns: Array.isArray(customChargeColumns) ? customChargeColumns : [],
      billType: "Freight Bill",
      billFormat: billFormat || "E-Invoice Bill Formate",
      preparedBy: preparedBy || "ANISHA OZARKAR",
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
        { docketNo: { $in: docketNos } },
        { $set: { status: "BILLED" } }
      );

      await postBillLedger({
        billNumber: billRecord.billNumber,
        customerName: billRecord.customerName,
        totalFreight: billRecord.totalFreight,
        taxAmount: billRecord.taxAmount,
        grandTotal: billRecord.grandTotal,
        branchCode: billRecord.billingBranch
      });

      return NextResponse.json({
        success: true,
        message: "Transport bill generated",
        data: newBill,
        ledgerPosted: true
      }, { status: 201 });
    } catch {
      const memoryBill = { ...billRecord, _id: `b-${Date.now()}` };
      memoryStore.bills.unshift(memoryBill);

      // Update memory consignments status
      const cns = memoryStore.getConsignments();
      docketNos.forEach((docketNo: string) => {
        const idx = cns.findIndex((c) => c.docketNo?.toUpperCase() === docketNo);
        if (idx !== -1) cns[idx].status = "BILLED";
      });

      await postBillLedger({
        billNumber: billRecord.billNumber,
        customerName: billRecord.customerName,
        totalFreight: billRecord.totalFreight,
        taxAmount: billRecord.taxAmount,
        grandTotal: billRecord.grandTotal,
        branchCode: billRecord.billingBranch
      });

      return NextResponse.json({
        success: true,
        message: "Transport bill generated (Memory Store)",
        data: memoryBill,
        isMemoryStore: true,
        ledgerPosted: true
      }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
