import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Vehicle } from "@/models/Vehicle";
import { memoryStore } from "@/lib/memoryStore";

const FALLBACK_VEHICLES = [
  {
    _id: "veh-1",
    srNo: 1,
    vendorName: "COMPANY VEHICLE",
    vehicleNumber: "MH04JK3515",
    vehicleType: "20 MT CONTAINER",
    ownerType: "COMPANY",
    registrationDate: "2018-04-19",
    insurancePolicyNumber: "OG-27-1902-1803-00000801",
    puccNumber: "HR04704480003701",
    nationalPermitNumber: "MH2022-NP-5778A",
    chassisNo: "MAT508216J7A02015",
    engineNo: "497TC41ARY803281",
    vehicleSpeed: "Kmph",
    capacityTons: 20,
    driverName: "Vijay More",
    driverPhone: "9876543210",
    isActive: true
  },
  {
    _id: "veh-2",
    srNo: 2,
    vendorName: "COMPANY VEHICLE",
    vehicleNumber: "MH04AB1234",
    vehicleType: "32 FT SXL",
    ownerType: "COMPANY",
    registrationDate: "2019-06-12",
    insurancePolicyNumber: "OG-27-1902-1803-00000802",
    puccNumber: "MH04704480003702",
    nationalPermitNumber: "MH2021-NP-4412B",
    chassisNo: "MAT508216K8B03021",
    engineNo: "497TC41BRY904112",
    vehicleSpeed: "Kmph",
    capacityTons: 9,
    driverName: "Ramesh Patil",
    driverPhone: "9820012345",
    isActive: true
  },
  {
    _id: "veh-3",
    srNo: 3,
    vendorName: "ATTACHED FLEET",
    vehicleNumber: "MH12CD5678",
    vehicleType: "20 FT CONTAINER",
    ownerType: "ATTACHED",
    registrationDate: "2020-01-08",
    insurancePolicyNumber: "OG-27-1902-1803-00000803",
    puccNumber: "MH04704480003703",
    nationalPermitNumber: "MH2020-NP-9981C",
    chassisNo: "MAT508216L9C04033",
    engineNo: "497TC41CRY015223",
    vehicleSpeed: "Kmph",
    capacityTons: 7.5,
    driverName: "Suresh Yadav",
    driverPhone: "9820054321",
    isActive: true
  },
  {
    _id: "veh-4",
    srNo: 4,
    vendorName: "MARKET VEHICLE",
    vehicleNumber: "MH14EF9012",
    vehicleType: "TAURUS 10 TYRE",
    ownerType: "MARKET",
    registrationDate: "2017-11-22",
    insurancePolicyNumber: "OG-27-1902-1803-00000804",
    puccNumber: "MH04704480003704",
    nationalPermitNumber: "MH2019-NP-2201D",
    chassisNo: "MAT508216M0D05044",
    engineNo: "497TC41DRY126334",
    vehicleSpeed: "Kmph",
    capacityTons: 16,
    driverName: "Anil Kadam",
    driverPhone: "9811122233",
    isActive: true
  },
  {
    _id: "veh-5",
    srNo: 5,
    vendorName: "COMPANY VEHICLE",
    vehicleNumber: "GJ01GH4455",
    vehicleType: "32 FT CONTAINER VEHICLE",
    ownerType: "COMPANY",
    registrationDate: "2021-03-15",
    insurancePolicyNumber: "OG-27-1902-1803-00000805",
    puccNumber: "GJ04704480003705",
    nationalPermitNumber: "GJ2021-NP-3310E",
    chassisNo: "MAT508216N1E06055",
    engineNo: "497TC41ERY237445",
    vehicleSpeed: "Kmph",
    capacityTons: 32,
    driverName: "Imran Shaikh",
    driverPhone: "9900011122",
    isActive: true
  }
];

function ensureMemory() {
  if (!Array.isArray((memoryStore as any).vehicles) || (memoryStore as any).vehicles.length === 0) {
    (memoryStore as any).vehicles = [...FALLBACK_VEHICLES];
  }
  return (memoryStore as any).vehicles as any[];
}

function nextSr(list: { srNo?: number }[]) {
  const nums = list.map((x) => Number(x.srNo) || 0);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

function toDate(v: any) {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function normalize(body: any, srNo?: number) {
  const vendorName = String(body.vendorName || "COMPANY VEHICLE").trim().toUpperCase();
  let ownerType: "COMPANY" | "ATTACHED" | "MARKET" = body.ownerType || "COMPANY";
  if (!body.ownerType) {
    if (vendorName.includes("ATTACH")) ownerType = "ATTACHED";
    else if (vendorName.includes("MARKET")) ownerType = "MARKET";
    else ownerType = "COMPANY";
  }

  return {
    srNo: Number(body.srNo) || srNo || undefined,
    vendorName,
    vehicleNumber: String(body.vehicleNumber || body.vehicleNo || "").trim().toUpperCase(),
    vehicleType: String(body.vehicleType || "").trim().toUpperCase(),
    ownerType,
    registrationDate: toDate(body.registrationDate || body.vehicleRegistrationDate),
    insurancePolicyNumber: String(body.insurancePolicyNumber || "").trim().toUpperCase(),
    insuranceUpto: toDate(body.insuranceUpto),
    puccNumber: String(body.puccNumber || "").trim().toUpperCase(),
    puccUpto: toDate(body.puccUpto || body.puccUptoDate),
    nationalPermitNumber: String(body.nationalPermitNumber || body.permitNumber || "").trim().toUpperCase(),
    nationalPermitUpto: toDate(body.nationalPermitUpto),
    fitnessUpto: toDate(body.fitnessUpto || body.fitnessUpTo),
    engineNo: String(body.engineNo || "").trim().toUpperCase(),
    chassisNo: String(body.chassisNo || body.chasisNo || "").trim().toUpperCase(),
    vehicleModel: body.vehicleModel || "",
    noOfTyre: Number(body.noOfTyre) || 0,
    vehicleSpeed: body.vehicleSpeed || "Kmph",
    capacityTons: Number(body.capacityTons) || 0,
    driverName: body.driverName || "",
    driverPhone: body.driverPhone || "",
    isActive: body.isActive !== false && body.active !== false
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    let vehicles = await Vehicle.find().sort({ srNo: 1, vehicleNumber: 1 });

    if (vehicles.length === 0) {
      try {
        await Vehicle.insertMany(
          FALLBACK_VEHICLES.map(({ _id, ...rest }) => ({
            ...rest,
            registrationDate: rest.registrationDate ? new Date(rest.registrationDate) : undefined
          })),
          { ordered: false }
        );
      } catch {
        // ignore seed races
      }
      vehicles = await Vehicle.find().sort({ srNo: 1, vehicleNumber: 1 });
    }

    if (vehicles.length === 0) {
      return NextResponse.json({
        success: true,
        count: FALLBACK_VEHICLES.length,
        data: FALLBACK_VEHICLES,
        isFallback: true
      });
    }

    return NextResponse.json({ success: true, count: vehicles.length, data: vehicles });
  } catch {
    const list = ensureMemory();
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
    if (!String(body.vehicleNumber || body.vehicleNo || "").trim()) {
      return NextResponse.json({ error: "Vehicle No is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const existing = await Vehicle.find().select("srNo");
      const payload = normalize(body, nextSr(existing));
      const created = await Vehicle.create(payload);
      const mem = ensureMemory();
      mem.unshift({ ...payload, _id: String(created._id) });
      return NextResponse.json({ success: true, message: "Vehicle added", data: created }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ error: "Vehicle No already exists" }, { status: 409 });
      }
      const mem = ensureMemory();
      const payload = normalize(body, nextSr(mem));
      const record = { ...payload, _id: `veh-${Date.now()}` };
      mem.unshift(record);
      return NextResponse.json({
        success: true,
        message: "Vehicle added (Memory Store)",
        data: record,
        isMemoryStore: true
      }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id } = body;
    const payload = normalize(body, Number(body.srNo) || undefined);
    if (!payload.vehicleNumber && !_id) {
      return NextResponse.json({ error: "Vehicle identifier is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const query = _id ? { _id } : { vehicleNumber: payload.vehicleNumber };
      const updated = await Vehicle.findOneAndUpdate(query, { $set: payload }, { new: true });
      if (!updated) {
        return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
      }
      const mem = ensureMemory();
      const idx = mem.findIndex(
        (v) => v._id === String(updated._id) || v.vehicleNumber === updated.vehicleNumber
      );
      if (idx >= 0) mem[idx] = { ...mem[idx], ...payload, _id: String(updated._id) };
      return NextResponse.json({ success: true, message: "Vehicle updated", data: updated });
    } catch {
      const mem = ensureMemory();
      const idx = mem.findIndex(
        (v) => (_id && v._id === _id) || v.vehicleNumber === payload.vehicleNumber
      );
      if (idx === -1) {
        return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
      }
      mem[idx] = { ...mem[idx], ...payload };
      return NextResponse.json({
        success: true,
        message: "Vehicle updated (Memory Store)",
        data: mem[idx],
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
