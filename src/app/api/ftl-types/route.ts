import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { FtlType } from "@/models/FtlType";
import { memoryStore } from "@/lib/memoryStore";

const FALLBACK_FTL_TYPES = [
  { _id: "ftl-24", srNo: 24, ftlType: "32 FT CONTAINER VEHICLE", maxWeight: 32000, approxMileage: 4, length: 0, breadth: 0, height: 0, isActive: true },
  { _id: "ftl-25", srNo: 25, ftlType: "20 MT CONTAINER", maxWeight: 6500, approxMileage: 7, length: 0, breadth: 0, height: 0, isActive: true },
  { _id: "ftl-1039", srNo: 1039, ftlType: "22 FEET CONTAINER", maxWeight: 6800, approxMileage: 0, length: 0, breadth: 0, height: 0, isActive: true },
  { _id: "ftl-1068", srNo: 1068, ftlType: "8.5 FEET", maxWeight: 1200, approxMileage: 0, length: 0, breadth: 0, height: 0, isActive: true },
  { _id: "ftl-1069", srNo: 1069, ftlType: "8 FEET CONTAINER", maxWeight: 1200, approxMileage: 0, length: 0, breadth: 0, height: 0, isActive: true },
  { _id: "ftl-1077", srNo: 1077, ftlType: "32FT MXL", maxWeight: 18000, approxMileage: 18000, length: 0, breadth: 0, height: 0, isActive: true }
];

function ensureMemory() {
  if (!Array.isArray((memoryStore as any).ftlTypes) || (memoryStore as any).ftlTypes.length === 0) {
    (memoryStore as any).ftlTypes = [...FALLBACK_FTL_TYPES];
  }
  return (memoryStore as any).ftlTypes as any[];
}

function nextSrNo(list: { srNo?: number }[]) {
  const nums = list.map((x) => Number(x.srNo) || 0);
  return (nums.length ? Math.max(...nums) : 1000) + 1;
}

function normalize(body: any, srNo?: number) {
  return {
    srNo: Number(body.srNo) || srNo || 0,
    ftlType: String(body.ftlType || body.vehicleType || "").trim().toUpperCase(),
    maxWeight: Number(body.maxWeight ?? body.maximumWeight) || 0,
    approxMileage: Number(body.approxMileage ?? body.mileage) || 0,
    length: Number(body.length) || 0,
    breadth: Number(body.breadth) || 0,
    height: Number(body.height) || 0,
    isActive: body.isActive === true || body.activeFlag === true || body.activeFlag === "Yes"
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    let list = await FtlType.find().sort({ srNo: 1 });
    if (list.length === 0) {
      try {
        await FtlType.insertMany(
          FALLBACK_FTL_TYPES.map(({ _id, ...rest }) => rest),
          { ordered: false }
        );
      } catch {
        // ignore seed races
      }
      list = await FtlType.find().sort({ srNo: 1 });
    }
    if (list.length === 0) {
      return NextResponse.json({ success: true, data: FALLBACK_FTL_TYPES, isFallback: true });
    }
    return NextResponse.json({ success: true, data: list });
  } catch {
    return NextResponse.json({ success: true, data: ensureMemory(), isMemoryStore: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!String(body.ftlType || body.vehicleType || "").trim()) {
      return NextResponse.json({ error: "FTL Type is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const existing = await FtlType.find().select("srNo");
      const srNo = Number(body.srNo) || nextSrNo(existing);
      const payload = normalize(body, srNo);
      const created = await FtlType.create(payload);
      const mem = ensureMemory();
      mem.unshift({ ...payload, _id: String(created._id) });
      return NextResponse.json({ success: true, message: "Vehicle type saved", data: created }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ error: "FTL Type / Sr.no already exists" }, { status: 409 });
      }
      const mem = ensureMemory();
      const payload = normalize(body, nextSrNo(mem));
      const record = { ...payload, _id: `ftl-${Date.now()}` };
      mem.unshift(record);
      return NextResponse.json({
        success: true,
        message: "Vehicle type saved (Memory Store)",
        data: record,
        isMemoryStore: true
      }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { _id, srNo } = body;
    const payload = normalize(body, Number(srNo) || undefined);
    if (!payload.ftlType && !_id && !srNo) {
      return NextResponse.json({ error: "FTL Type identifier is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const query = _id ? { _id } : { srNo: Number(srNo) };
      const updated = await FtlType.findOneAndUpdate(
        query,
        {
          $set: {
            ftlType: payload.ftlType,
            maxWeight: payload.maxWeight,
            approxMileage: payload.approxMileage,
            length: payload.length,
            breadth: payload.breadth,
            height: payload.height,
            isActive: payload.isActive
          }
        },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: "FTL Type not found" }, { status: 404 });
      }
      const mem = ensureMemory();
      const idx = mem.findIndex((x) => x._id === String(updated._id) || x.srNo === updated.srNo);
      if (idx >= 0) mem[idx] = { ...mem[idx], ...payload, _id: String(updated._id), srNo: updated.srNo };
      return NextResponse.json({ success: true, message: "Vehicle type updated", data: updated });
    } catch {
      const mem = ensureMemory();
      const idx = mem.findIndex((x) => (_id && x._id === _id) || x.srNo === Number(srNo));
      if (idx === -1) {
        return NextResponse.json({ error: "FTL Type not found" }, { status: 404 });
      }
      mem[idx] = { ...mem[idx], ...payload, srNo: mem[idx].srNo };
      return NextResponse.json({
        success: true,
        message: "Vehicle type updated (Memory Store)",
        data: mem[idx],
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
