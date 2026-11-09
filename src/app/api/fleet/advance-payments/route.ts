import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyAdvancePayment } from "@/models/CompanyAdvancePayment";
import { memoryStore } from "@/lib/memoryStore";

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentNo = (searchParams.get("documentNo") || "").trim().toUpperCase();
  const vehicleNo = (searchParams.get("vehicleNo") || "").trim().toUpperCase();
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));

  try {
    await connectToDatabase();
    const query: any = {};
    if (documentNo) {
      query.$or = [
        { documentNo: { $regex: documentNo, $options: "i" } },
        { tripsheetNo: { $regex: documentNo, $options: "i" } }
      ];
    }
    if (vehicleNo && vehicleNo !== "SHOW ALL") query.vehicleNo = vehicleNo;
    if (from || to) {
      query.documentDate = {};
      if (from) query.documentDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.documentDate.$lte = end;
      }
    }
    const data = await CompanyAdvancePayment.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: data.length, data, source: "mongodb" });
  } catch {
    let list = [...(memoryStore.companyAdvances || [])];
    if (documentNo) {
      list = list.filter(
        (d) =>
          String(d.documentNo || "").toUpperCase().includes(documentNo) ||
          String(d.tripsheetNo || "").toUpperCase().includes(documentNo)
      );
    }
    if (vehicleNo && vehicleNo !== "SHOW ALL") {
      list = list.filter((d) => String(d.vehicleNo || "").toUpperCase() === vehicleNo);
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
    const vehicleNo = String(body.vehicleNo || "").trim().toUpperCase();
    const amount = Number(body.amount) || 0;
    if (!vehicleNo) {
      return NextResponse.json({ error: "Vehicle No is required" }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Advance amount must be greater than 0" }, { status: 400 });
    }

    const documentNo =
      String(body.documentNo || "").trim().toUpperCase() ||
      `ADV-ALC1-${Date.now().toString().slice(-8)}`;

    const record: any = {
      documentNo,
      documentDate: body.documentDate ? new Date(body.documentDate) : new Date(),
      tripsheetNo: String(body.tripsheetNo || "").trim().toUpperCase(),
      vehicleNo,
      driverName: String(body.driverName || "").trim(),
      branch: String(body.branch || "ALC1").trim(),
      payMode: String(body.payMode || "CASH").trim().toUpperCase(),
      amount,
      remark: String(body.remark || "").trim(),
      status: String(body.status || "PAID").toUpperCase(),
      preparedBy: String(body.preparedBy || "ANISHA OZARKAR").trim()
    };

    try {
      await connectToDatabase();
      const saved = await CompanyAdvancePayment.create(record);
      return NextResponse.json(
        { success: true, message: "Company advance payment saved", data: saved, source: "mongodb" },
        { status: 201 }
      );
    } catch (err: any) {
      // Unique conflict from Mongo should surface; other failures fall back
      if (err?.code === 11000) {
        return NextResponse.json({ error: `Document No ${documentNo} already exists` }, { status: 409 });
      }
      const memory = { ...record, _id: `adv-${Date.now()}`, createdAt: new Date().toISOString() };
      memoryStore.companyAdvances.unshift(memory);
      return NextResponse.json(
        {
          success: true,
          message: "Company advance payment saved (Memory Store — Mongo unavailable)",
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
