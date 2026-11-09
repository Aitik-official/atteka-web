import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CrmQuotation } from "@/models/CrmQuotation";
import { memoryStore } from "@/lib/memoryStore";

const FALLBACK_CUSTOMERS = [
  { customerCode: "C001", name: "RELIANCE RETAIL LTD" },
  { customerCode: "C002", name: "TATA MOTORS SPARE PARTS" },
  { customerCode: "C003", name: "SUNIL GARMENTS" },
  { customerCode: "C004", name: "APEX CHEM TRADE" },
  { customerCode: "C005", name: "MARUTI SUZUKI INDIA LTD" }
];

function ensureCustomers() {
  if (!Array.isArray(memoryStore.crmQuoteCustomers) || memoryStore.crmQuoteCustomers.length === 0) {
    memoryStore.crmQuoteCustomers = [...FALLBACK_CUSTOMERS];
  }
  return memoryStore.crmQuoteCustomers as any[];
}

function flattenQuotes(list: any[], customerName?: string | null) {
  const rows: any[] = [];
  for (const q of list) {
    if (customerName && String(q.customerName || "").toUpperCase() !== customerName.toUpperCase()) continue;
    const lines = Array.isArray(q.lines) ? q.lines : [];
    lines.forEach((line: any, idx: number) => {
      rows.push({
        _id: `${q._id}-${idx}`,
        quotationId: q._id,
        lineIndex: idx,
        customerName: q.customerName,
        customerCode: q.customerCode || "",
        fromLocation: line.fromLocation || "",
        toLocation: line.toLocation || "",
        ftlType: line.vehicleType || line.ftlType || "",
        rate: Number(line.rate) || 0,
        quotedBy: q.quotedBy || "",
        validFrom: q.contractFrom || "",
        validTill: q.contractTo || "",
        service: line.serviceType || "",
        trip: line.trip || "ONE WAY",
        approxKm: Number(line.approxKm) || 0
      });
    });
  }
  return rows;
}

async function loadQuotesFromDb() {
  await connectToDatabase();
  return CrmQuotation.find().sort({ createdAt: -1 }).lean();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customer = (searchParams.get("customer") || "").trim();
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const wantCustomers = searchParams.get("customers") === "1";

    if (wantCustomers) {
      return NextResponse.json({ success: true, data: ensureCustomers() });
    }

    let list: any[] = [];
    let source = "mongodb";
    try {
      list = await loadQuotesFromDb();
    } catch {
      source = "memory";
      list = [...(memoryStore.crmQuotations || [])];
    }

    let rows = flattenQuotes(list, customer || null);
    if (search) {
      rows = rows.filter(
        (r) =>
          r.fromLocation.toLowerCase().includes(search) ||
          r.toLocation.toLowerCase().includes(search) ||
          r.ftlType.toLowerCase().includes(search) ||
          r.service.toLowerCase().includes(search) ||
          r.quotedBy.toLowerCase().includes(search) ||
          String(r.rate).includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
      source,
      isMemoryStore: source !== "mongodb"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerName = String(body.customerName || "").trim();
    const contractFrom = String(body.contractFrom || "").trim();
    const contractTo = String(body.contractTo || "").trim();
    const lines = Array.isArray(body.lines) ? body.lines : [];

    if (!customerName) {
      return NextResponse.json({ error: "Customer Name is required" }, { status: 400 });
    }
    if (!contractFrom || !contractTo) {
      return NextResponse.json({ error: "Contract period From / To is required" }, { status: 400 });
    }

    const normalizedLines = lines
      .map((l: any) => ({
        serviceType: String(l.serviceType || "").trim(),
        fromLocation: String(l.fromLocation || "").trim().toUpperCase(),
        toLocation: String(l.toLocation || "").trim().toUpperCase(),
        vehicleType: String(l.vehicleType || "").trim(),
        rate: Number(l.rate) || 0,
        approxKm: Number(l.approxKm) || 0,
        trip: String(l.trip || "ONE WAY").trim().toUpperCase()
      }))
      .filter((l: any) => l.serviceType && l.fromLocation && l.toLocation && l.vehicleType);

    if (normalizedLines.length === 0) {
      return NextResponse.json(
        { error: "Add at least one Rate Master row with Service, Locations & Vehicle Type" },
        { status: 400 }
      );
    }

    const customers = ensureCustomers();
    let customerCode = String(body.customerCode || "").trim();
    const existingCust = customers.find((c) => c.name.toUpperCase() === customerName.toUpperCase());
    if (existingCust) customerCode = existingCust.customerCode;
    else if (!customerCode) {
      customerCode = `C${String(customers.length + 1).padStart(3, "0")}`;
      customers.push({ customerCode, name: customerName.toUpperCase() });
    }

    const record: any = {
      customerName: customerName.toUpperCase(),
      customerCode,
      contractFrom,
      contractTo,
      quotedBy: String(body.quotedBy || "ANISHA OZARKAR").trim(),
      lines: normalizedLines
    };

    try {
      await connectToDatabase();
      const saved = await CrmQuotation.create(record);
      return NextResponse.json(
        { success: true, message: "Quotation Master saved successfully", data: saved, source: "mongodb" },
        { status: 201 }
      );
    } catch {
      const memory = { ...record, _id: `q-${Date.now()}`, createdAt: new Date().toISOString() };
      if (!Array.isArray(memoryStore.crmQuotations)) memoryStore.crmQuotations = [];
      memoryStore.crmQuotations.unshift(memory);
      return NextResponse.json(
        {
          success: true,
          message: "Quotation Master saved (Memory Store — Mongo unavailable)",
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const quotationId = String(body.quotationId || body._id || "").trim();
    if (!quotationId) {
      return NextResponse.json({ error: "Quotation ID is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const current: any = await CrmQuotation.findById(quotationId);
      if (!current) {
        return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
      }

      const lineIndex = Number(body.lineIndex);
      if (!Number.isNaN(lineIndex) && Array.isArray(current.lines) && current.lines[lineIndex]) {
        current.lines[lineIndex] = {
          ...current.lines[lineIndex].toObject?.() || current.lines[lineIndex],
          ...(body.line || {}),
          rate: body.line?.rate !== undefined ? Number(body.line.rate) : current.lines[lineIndex].rate,
          approxKm:
            body.line?.approxKm !== undefined ? Number(body.line.approxKm) : current.lines[lineIndex].approxKm
        };
        current.markModified("lines");
      }
      if (body.contractFrom) current.contractFrom = body.contractFrom;
      if (body.contractTo) current.contractTo = body.contractTo;
      if (body.quotedBy) current.quotedBy = body.quotedBy;
      await current.save();
      return NextResponse.json({
        success: true,
        message: "Quotation updated",
        data: current,
        source: "mongodb"
      });
    } catch (err: any) {
      if (err?.status === 404) throw err;
      const list = memoryStore.crmQuotations || [];
      const idx = list.findIndex((q) => String(q._id) === quotationId);
      if (idx < 0) {
        return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
      }
      const current = list[idx];
      const lineIndex = Number(body.lineIndex);
      if (!Number.isNaN(lineIndex) && Array.isArray(current.lines) && current.lines[lineIndex]) {
        current.lines[lineIndex] = {
          ...current.lines[lineIndex],
          ...(body.line || {}),
          rate: body.line?.rate !== undefined ? Number(body.line.rate) : current.lines[lineIndex].rate,
          approxKm:
            body.line?.approxKm !== undefined ? Number(body.line.approxKm) : current.lines[lineIndex].approxKm
        };
      }
      if (body.contractFrom) current.contractFrom = body.contractFrom;
      if (body.contractTo) current.contractTo = body.contractTo;
      if (body.quotedBy) current.quotedBy = body.quotedBy;
      list[idx] = current;
      return NextResponse.json({
        success: true,
        message: "Quotation updated (Memory Store)",
        data: current,
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
