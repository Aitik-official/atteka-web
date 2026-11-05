import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Route } from "@/models/Route";
import { memoryStore } from "@/lib/memoryStore";

const FALLBACK_ROUTES = [
  {
    code: "RT001",
    stateName: "",
    destination: "NAGPUR+KOLKATA",
    latitude: "21.1458004",
    longitude: "79.0881546",
    geofencingKm: 2,
    origin: "NAGPUR",
    distanceKm: 0,
    isActive: true
  },
  {
    code: "RT002",
    stateName: "",
    destination: "RAIPUR+BHUBNESHWAR+KOLKATA",
    latitude: "21.2513844",
    longitude: "81.6296413",
    geofencingKm: 2,
    origin: "RAIPUR",
    distanceKm: 0,
    isActive: true
  },
  {
    code: "RT003",
    stateName: "",
    destination: "NAGPUR+RANCHI+PATNA+GUWATHI",
    latitude: "21.1458004",
    longitude: "79.0881546",
    geofencingKm: 2,
    origin: "NAGPUR",
    distanceKm: 0,
    isActive: true
  },
  {
    code: "RT004",
    stateName: "",
    destination: "NAGPUR+JABALPUR+VARANASI+PATNA",
    latitude: "21.1458004",
    longitude: "79.0881546",
    geofencingKm: 2,
    origin: "NAGPUR",
    distanceKm: 0,
    isActive: true
  },
  {
    code: "RT005",
    stateName: "",
    destination: "NAGPUR+BHILAI+RAIPUR",
    latitude: "21.1458004",
    longitude: "79.0881546",
    geofencingKm: 2,
    origin: "NAGPUR",
    distanceKm: 0,
    isActive: true
  },
  {
    code: "RT006",
    stateName: "",
    destination: "HYDERABAD+BANGALORE+CHENNAI",
    latitude: "17.385044",
    longitude: "78.486671",
    geofencingKm: 2,
    origin: "HYDERABAD",
    distanceKm: 0,
    isActive: true
  },
  {
    code: "RT007",
    stateName: "",
    destination: "MUMBAI CITY+PUNE+NASHIK",
    latitude: "19.07609",
    longitude: "72.877426",
    geofencingKm: 2,
    origin: "MUMBAI CITY",
    distanceKm: 0,
    isActive: true
  },
  {
    code: "RT008",
    stateName: "",
    destination: "DELHI+JAIPUR+AHMEDABAD",
    latitude: "28.613939",
    longitude: "77.209021",
    geofencingKm: 2,
    origin: "DELHI",
    distanceKm: 0,
    isActive: true
  },
  // Corridor-style rows still useful for From/To masters
  { code: "BOM-HYD", stateName: "Maharashtra", destination: "HYDERABAD", latitude: "17.385044", longitude: "78.486671", geofencingKm: 2, origin: "MUMBAI CITY", distanceKm: 675.38, transitHours: 24, isActive: true },
  { code: "BHI-HYD", stateName: "Maharashtra", destination: "HYDERABAD", latitude: "17.385044", longitude: "78.486671", geofencingKm: 2, origin: "BHIWANDI", distanceKm: 710, transitHours: 26, isActive: true },
  { code: "BOM-DEL", stateName: "Maharashtra", destination: "DELHI", latitude: "28.613939", longitude: "77.209021", geofencingKm: 2, origin: "MUMBAI", distanceKm: 1420, transitHours: 48, isActive: true },
  { code: "BOM-BLR", stateName: "Maharashtra", destination: "BANGALORE", latitude: "12.971599", longitude: "77.594566", geofencingKm: 2, origin: "MUMBAI", distanceKm: 980, transitHours: 36, isActive: true }
];

function ensureMemoryRoutes() {
  if (!Array.isArray((memoryStore as any).routes) || (memoryStore as any).routes.length === 0) {
    (memoryStore as any).routes = [...FALLBACK_ROUTES];
  }
  return (memoryStore as any).routes as any[];
}

function collectLocations(routes: any[]) {
  const cities = new Set<string>();
  for (const r of routes) {
    if (r.origin) cities.add(String(r.origin).toUpperCase());
    String(r.destination || "")
      .split("+")
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean)
      .forEach((c) => cities.add(c));
  }
  const list = Array.from(cities).sort();
  return { origins: list, destinations: list };
}

function normalizePayload(body: any) {
  const destination = String(body.destination || "").trim().toUpperCase();
  const firstCity = destination.split("+")[0]?.trim() || "";
  const code =
    String(body.code || "").trim().toUpperCase() ||
    `RT${Date.now().toString().slice(-6)}`;

  return {
    code,
    stateName: body.stateName || body.state || "",
    destination,
    latitude: body.latitude != null ? String(body.latitude).trim() : "",
    longitude: body.longitude != null ? String(body.longitude).trim() : "",
    geofencingKm: Number(body.geofencingKm) || 2,
    origin: String(body.origin || firstCity).trim().toUpperCase(),
    distanceKm: Number(body.distanceKm) || 0,
    transitHours: Number(body.transitHours) || 24,
    isActive: body.isActive !== false && body.active !== false && body.active !== "N"
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    let routes = await Route.find().sort({ createdAt: -1 });

    if (routes.length === 0) {
      try {
        await Route.insertMany(FALLBACK_ROUTES, { ordered: false });
      } catch {
        // ignore seed races
      }
      routes = await Route.find().sort({ createdAt: -1 });
    }

    if (routes.length === 0) {
      const locations = collectLocations(FALLBACK_ROUTES);
      return NextResponse.json({
        success: true,
        count: FALLBACK_ROUTES.length,
        data: FALLBACK_ROUTES,
        locations,
        isFallback: true
      });
    }

    const locations = collectLocations(routes);
    return NextResponse.json({
      success: true,
      count: routes.length,
      data: routes,
      locations
    });
  } catch {
    const list = ensureMemoryRoutes();
    return NextResponse.json({
      success: true,
      count: list.length,
      data: list,
      locations: collectLocations(list),
      isMemoryStore: true
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = normalizePayload(body);
    if (!payload.destination) {
      return NextResponse.json({ error: "Destination is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const created = await Route.create(payload);
      const mem = ensureMemoryRoutes();
      mem.unshift({ ...payload, _id: String(created._id) });
      return NextResponse.json({ success: true, message: "Route created", data: created }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ error: "Route code already exists" }, { status: 409 });
      }
      const mem = ensureMemoryRoutes();
      const record = { ...payload, _id: `rt-${Date.now()}` };
      mem.unshift(record);
      return NextResponse.json({
        success: true,
        message: "Route created (Memory Store)",
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
    const payload = normalizePayload(body);
    if (!payload.destination && !_id) {
      return NextResponse.json({ error: "Route identifier is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const query = _id ? { _id } : { code: payload.code };
      const updated = await Route.findOneAndUpdate(query, { $set: payload }, { new: true });
      if (!updated) {
        return NextResponse.json({ error: "Route not found" }, { status: 404 });
      }
      const mem = ensureMemoryRoutes();
      const idx = mem.findIndex((r) => r._id === String(updated._id) || r.code === updated.code);
      if (idx >= 0) mem[idx] = { ...mem[idx], ...payload, _id: String(updated._id) };
      return NextResponse.json({ success: true, message: "Route updated", data: updated });
    } catch {
      const mem = ensureMemoryRoutes();
      const idx = mem.findIndex((r) => (_id && r._id === _id) || r.code === payload.code);
      if (idx === -1) {
        return NextResponse.json({ error: "Route not found" }, { status: 404 });
      }
      mem[idx] = { ...mem[idx], ...payload };
      return NextResponse.json({
        success: true,
        message: "Route updated (Memory Store)",
        data: mem[idx],
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
