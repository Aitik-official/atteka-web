import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyVoucherPayment } from "@/models/CompanyVoucherPayment";
import { memoryStore } from "@/lib/memoryStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const voucherNo = (searchParams.get("voucherNo") || searchParams.get("documentNo") || "")
    .trim()
    .toUpperCase();

  try {
    await connectToDatabase();
    const query: any = {};
    if (voucherNo) {
      query.$or = [
        { voucherNo: { $regex: voucherNo, $options: "i" } },
        { documentNo: { $regex: voucherNo, $options: "i" } }
      ];
    }
    const data = await CompanyVoucherPayment.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: data.length, data, source: "mongodb" });
  } catch {
    let list = [...(memoryStore.companyVouchers || [])];
    if (voucherNo) {
      list = list.filter(
        (d) =>
          String(d.voucherNo || "").toUpperCase().includes(voucherNo) ||
          String(d.documentNo || "").toUpperCase().includes(voucherNo)
      );
    }
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
    const body = await req.json();
    const accountType = String(body.accountType || "").trim();
    const expenseType = String(body.expenseType || "").trim();
    const paidTo = String(body.paidTo || "").trim();
    const modeOfTransaction = String(body.modeOfTransaction || "").trim();
    const cashBankAccount = String(body.cashBankAccount || "").trim();
    const amount = Number(body.amount) || 0;

    if (!accountType || accountType === "--Select--") {
      return NextResponse.json({ error: "Select Account Type" }, { status: 400 });
    }
    if (!expenseType || expenseType === "--Select--") {
      return NextResponse.json({ error: "Select Expense Type" }, { status: 400 });
    }
    if (!paidTo) {
      return NextResponse.json({ error: "Paid To is required" }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }
    if (!modeOfTransaction || modeOfTransaction === "--Select--") {
      return NextResponse.json({ error: "Select Mode of Transaction" }, { status: 400 });
    }
    if (!cashBankAccount || cashBankAccount === "--Select--") {
      return NextResponse.json({ error: "Select Cash / Bank Account" }, { status: 400 });
    }

    const voucherNo =
      String(body.voucherNo || body.documentNo || "").trim().toUpperCase() ||
      `VP-${Date.now().toString().slice(-8)}`;

    const record: any = {
      voucherNo,
      accountType,
      voucherDate: body.voucherDate ? new Date(body.voucherDate) : new Date(),
      expenseType,
      gstNo: String(body.gstNo || "").trim().toUpperCase(),
      fromDate: body.fromDate ? new Date(body.fromDate) : undefined,
      toDate: body.toDate ? new Date(body.toDate) : undefined,
      documentNo: String(body.documentNo || "").trim().toUpperCase(),
      attachedDocument: String(body.attachedDocument || "").trim(),
      vendor: String(body.vendor || "").trim(),
      panNo: String(body.panNo || "").trim().toUpperCase(),
      paidTo,
      amount,
      taxableAmount: Number(body.taxableAmount) || amount,
      igst: Number(body.igst) || 0,
      cgst: Number(body.cgst) || 0,
      sgst: Number(body.sgst) || 0,
      tdsType: String(body.tdsType || "").trim(),
      tdsRate: Number(body.tdsRate) || 0,
      tdsAmount: Number(body.tdsAmount) || 0,
      totalAmount: Number(body.totalAmount) || 0,
      netPayable: Number(body.netPayable) || amount,
      modeOfTransaction,
      cashBankAccount,
      chequeNo: String(body.chequeNo || "").trim().toUpperCase(),
      chequeDate: body.chequeDate ? new Date(body.chequeDate) : undefined,
      remark: String(body.remark || "").trim(),
      status: "SUBMITTED",
      preparedBy: String(body.preparedBy || "ANISHA OZARKAR").trim()
    };

    try {
      await connectToDatabase();
      const saved = await CompanyVoucherPayment.create(record);
      return NextResponse.json(
        { success: true, message: "Voucher payment saved", data: saved, source: "mongodb" },
        { status: 201 }
      );
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ error: `Voucher No ${voucherNo} already exists` }, { status: 409 });
      }
      const memory = { ...record, _id: `vp-${Date.now()}`, createdAt: new Date().toISOString() };
      memoryStore.companyVouchers.unshift(memory);
      return NextResponse.json(
        {
          success: true,
          message: "Voucher payment saved (Memory Store — Mongo unavailable)",
          data: memory,
          isMemoryStore: true
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
