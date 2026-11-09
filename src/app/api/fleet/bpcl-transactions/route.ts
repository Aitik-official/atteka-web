import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { BpclSaleTransaction } from "@/models/BpclSaleTransaction";
import { memoryStore } from "@/lib/memoryStore";

const SEED = [
  {
    vehicleNo: "MH46BU8250",
    cardNumber: "7081620412344912",
    roName: "BPCL COCO VASHI",
    roLocation: "NAVI MUMBAI",
    roContactNo: "02227651234",
    transactionId: "BPCL-TXN-260001",
    transactionDate: new Date("2026-10-12T09:30:00"),
    transactionStatus: "SUCCESS",
    productName: "HSD / DIESEL",
    productQty: 120,
    rate: 89.45,
    transactionAmount: 10734,
    cmsOpeningBal: 50000,
    cmsClosingBal: 39266,
    walletBalance: 39266,
    tripSheetNo: "TS-2026-0042",
    tripSheetDate: new Date("2026-10-12"),
    voucherNo: "FV-260012",
    voucherDate: new Date("2026-10-13")
  },
  {
    vehicleNo: "MH46BU8250",
    cardNumber: "7081620412344912",
    roName: "BPCL GHOTI",
    roLocation: "IGATPURI HIGHWAY",
    roContactNo: "02553221456",
    transactionId: "BPCL-TXN-260002",
    transactionDate: new Date("2026-10-28T18:15:00"),
    transactionStatus: "SUCCESS",
    productName: "HSD / DIESEL",
    productQty: 150,
    rate: 89.2,
    transactionAmount: 13380,
    cmsOpeningBal: 39266,
    cmsClosingBal: 25886,
    walletBalance: 25886,
    tripSheetNo: "TS-2026-0048",
    tripSheetDate: new Date("2026-10-28"),
    voucherNo: "FV-260045",
    voucherDate: new Date("2026-10-29")
  },
  {
    vehicleNo: "MH04JK3515",
    cardNumber: "7081620499885021",
    roName: "BPCL AGRA BYPASS",
    roLocation: "AGRA EXPRESSWAY",
    roContactNo: "05622441122",
    transactionId: "BPCL-TXN-260003",
    transactionDate: new Date("2026-11-02T13:45:00"),
    transactionStatus: "SUCCESS",
    productName: "HSD / DIESEL",
    productQty: 95,
    rate: 88.9,
    transactionAmount: 8445.5,
    cmsOpeningBal: 30000,
    cmsClosingBal: 21554.5,
    walletBalance: 21554.5,
    tripSheetNo: "TS-2026-0051",
    tripSheetDate: new Date("2026-11-02"),
    voucherNo: "FV-260061",
    voucherDate: new Date("2026-11-03")
  },
  {
    vehicleNo: "MH04AB1234",
    cardNumber: "7081620477113344",
    roName: "BPCL KAMOTHE",
    roLocation: "NAVI MUMBAI",
    roContactNo: "02227441100",
    transactionId: "BPCL-TXN-260004",
    transactionDate: new Date("2026-11-05T08:20:00"),
    transactionStatus: "SUCCESS",
    productName: "HSD / DIESEL",
    productQty: 110,
    rate: 89.1,
    transactionAmount: 9801,
    cmsOpeningBal: 45000,
    cmsClosingBal: 35199,
    walletBalance: 35199,
    tripSheetNo: "TS-2026-0055",
    tripSheetDate: new Date("2026-11-05"),
    voucherNo: "",
    voucherDate: undefined
  }
];

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ensureMemory() {
  if (!Array.isArray((memoryStore as any).bpclTransactions) || (memoryStore as any).bpclTransactions.length === 0) {
    (memoryStore as any).bpclTransactions = SEED.map((s, i) => ({
      ...s,
      _id: `bpcl-${i + 1}`,
      createdAt: new Date().toISOString()
    }));
  }
  return (memoryStore as any).bpclTransactions as any[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vehicleNo = (searchParams.get("vehicleNo") || "").trim().toUpperCase();
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const useVehicleOnly = searchParams.get("mode") === "vehicle";

  try {
    await connectToDatabase();
    let count = await BpclSaleTransaction.countDocuments();
    if (count === 0) {
      try {
        await BpclSaleTransaction.insertMany(SEED, { ordered: false });
      } catch {
        // ignore seed races
      }
    }

    const query: any = {};
    if (useVehicleOnly && vehicleNo) {
      query.vehicleNo = vehicleNo;
    } else {
      if (vehicleNo) query.vehicleNo = vehicleNo;
      if (from || to) {
        query.transactionDate = {};
        if (from) query.transactionDate.$gte = from;
        if (to) {
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          query.transactionDate.$lte = end;
        }
      }
    }

    const data = await BpclSaleTransaction.find(query).sort({ transactionDate: -1 });
    const totals = data.reduce(
      (acc, row) => {
        acc.productQty += Number(row.productQty) || 0;
        acc.transactionAmount += Number(row.transactionAmount) || 0;
        return acc;
      },
      { productQty: 0, transactionAmount: 0 }
    );

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      totals,
      source: "mongodb"
    });
  } catch {
    let list = [...ensureMemory()];
    if (useVehicleOnly && vehicleNo) {
      list = list.filter((r) => String(r.vehicleNo || "").toUpperCase() === vehicleNo);
    } else {
      if (vehicleNo) list = list.filter((r) => String(r.vehicleNo || "").toUpperCase() === vehicleNo);
      if (from) list = list.filter((r) => new Date(r.transactionDate) >= from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        list = list.filter((r) => new Date(r.transactionDate) <= end);
      }
    }
    const totals = list.reduce(
      (acc, row) => {
        acc.productQty += Number(row.productQty) || 0;
        acc.transactionAmount += Number(row.transactionAmount) || 0;
        return acc;
      },
      { productQty: 0, transactionAmount: 0 }
    );
    return NextResponse.json({
      success: true,
      count: list.length,
      data: list,
      totals,
      isMemoryStore: true
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vehicleNo = String(body.vehicleNo || "").trim().toUpperCase();
    const transactionId =
      String(body.transactionId || "").trim() || `BPCL-TXN-${Date.now().toString().slice(-8)}`;
    const productQty = Number(body.productQty) || 0;
    const rate = Number(body.rate) || 0;
    const transactionAmount =
      body.transactionAmount !== undefined ? Number(body.transactionAmount) : productQty * rate;

    if (!vehicleNo) {
      return NextResponse.json({ error: "Vehicle No is required" }, { status: 400 });
    }

    const record: any = {
      vehicleNo,
      cardNumber: String(body.cardNumber || "").trim(),
      roName: String(body.roName || "").trim(),
      roLocation: String(body.roLocation || "").trim(),
      roContactNo: String(body.roContactNo || "").trim(),
      transactionId,
      transactionDate: body.transactionDate ? new Date(body.transactionDate) : new Date(),
      transactionStatus: String(body.transactionStatus || "SUCCESS").trim(),
      productName: String(body.productName || "HSD / DIESEL").trim(),
      productQty,
      rate,
      transactionAmount,
      cmsOpeningBal: Number(body.cmsOpeningBal) || 0,
      cmsClosingBal: Number(body.cmsClosingBal) || 0,
      walletBalance: Number(body.walletBalance) || 0,
      tripSheetNo: String(body.tripSheetNo || "").trim().toUpperCase(),
      tripSheetDate: body.tripSheetDate ? new Date(body.tripSheetDate) : undefined,
      voucherNo: String(body.voucherNo || "").trim().toUpperCase(),
      voucherDate: body.voucherDate ? new Date(body.voucherDate) : undefined
    };

    try {
      await connectToDatabase();
      const saved = await BpclSaleTransaction.create(record);
      return NextResponse.json(
        { success: true, message: "BPCL transaction saved", data: saved, source: "mongodb" },
        { status: 201 }
      );
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ error: `Transaction Id ${transactionId} already exists` }, { status: 409 });
      }
      const memory = { ...record, _id: `bpcl-${Date.now()}`, createdAt: new Date().toISOString() };
      ensureMemory().unshift(memory);
      return NextResponse.json(
        {
          success: true,
          message: "BPCL transaction saved (Memory Store — Mongo unavailable)",
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
