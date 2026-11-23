import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DocketNumber, DocketSeriesConfig } from "@/models/DocketNumber";
import { memoryStore } from "@/lib/memoryStore";
import {
  BUSINESS_LINES,
  BusinessLine,
  businessLineConfig,
  resolveBusinessLine
} from "@/lib/businessLines";

const SERIES_DEFS = [
  {
    seriesKey: "LOGISTICS",
    ...BUSINESS_LINES.LOGISTICS,
    padLength: 4,
    nextSequence: 1,
    isActive: true
  },
  {
    seriesKey: "ROAD_CARRIER",
    ...BUSINESS_LINES.ROAD_CARRIER,
    padLength: 4,
    nextSequence: 1,
    isActive: true
  }
];

async function ensureAllSeries() {
  const out = [];
  for (const def of SERIES_DEFS) {
    let series = await DocketSeriesConfig.findOne({ seriesKey: def.seriesKey });
    if (!series) {
      // Migrate legacy DEFAULT → LOGISTICS once
      if (def.seriesKey === "LOGISTICS") {
        const legacy = await DocketSeriesConfig.findOne({ seriesKey: "DEFAULT" });
        if (legacy) {
          legacy.seriesKey = "LOGISTICS";
          if (!legacy.prefix || String(legacy.prefix).toUpperCase().startsWith("ALC")) {
            legacy.prefix = BUSINESS_LINES.LOGISTICS.docketPrefix;
          }
          legacy.branchCode = legacy.branchCode || BUSINESS_LINES.LOGISTICS.branchCode;
          legacy.description = BUSINESS_LINES.LOGISTICS.description;
          await legacy.save();
          series = legacy;
        }
      }
    }
    if (!series) {
      series = await DocketSeriesConfig.create({
        seriesKey: def.seriesKey,
        prefix: def.docketPrefix,
        padLength: def.padLength,
        nextSequence: def.nextSequence,
        branchCode: def.branchCode,
        isActive: true,
        description: def.description
      });
    } else {
      // Keep prefixes aligned to business line initials
      const expected = def.docketPrefix;
      if (String(series.prefix || "").toUpperCase() !== expected) {
        // Only auto-fix if clearly wrong line (e.g. ARC series with ALC prefix)
        const p = String(series.prefix || "").toUpperCase();
        if (
          (def.seriesKey === "ROAD_CARRIER" && p.startsWith("ALC")) ||
          (def.seriesKey === "LOGISTICS" && p.startsWith("ARC")) ||
          !p
        ) {
          series.prefix = expected;
          series.branchCode = def.branchCode;
          series.description = def.description;
          await series.save();
        }
      }
    }
    out.push(series);
  }
  return out;
}

async function resolveSeries(seriesKeyOrLine?: string | null) {
  const line = resolveBusinessLine(seriesKeyOrLine);
  const cfg = businessLineConfig(line);
  await ensureAllSeries();
  let series = await DocketSeriesConfig.findOne({ seriesKey: line });
  if (!series) {
    series = await DocketSeriesConfig.create({
      seriesKey: line,
      prefix: cfg.docketPrefix,
      padLength: 4,
      nextSequence: 1,
      branchCode: cfg.branchCode,
      isActive: true,
      description: cfg.description
    });
  }
  return series;
}

async function seedPoolForSeries(series: any, minAvailable = 10) {
  const availableCount = await DocketNumber.countDocuments({
    status: "AVAILABLE",
    seriesPrefix: series.prefix
  });
  if (availableCount >= minAvailable) return;
  const need = Math.max(0, minAvailable - availableCount);
  const seedBatch = [];
  for (let i = 0; i < need; i++) {
    const seq = series.nextSequence++;
    const docketNo = `${series.prefix}${String(seq).padStart(series.padLength, "0")}`;
    seedBatch.push({
      docketNo,
      seriesPrefix: series.prefix,
      sequenceNo: seq,
      branchCode: series.branchCode,
      status: "AVAILABLE"
    });
  }
  if (seedBatch.length) {
    try {
      await DocketNumber.insertMany(seedBatch, { ordered: false });
    } catch {
      // ignore duplicate seed races
    }
    await series.save();
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const includeSeries = searchParams.get("includeSeries") === "1";
  const seriesKey = searchParams.get("seriesKey") || searchParams.get("businessLine") || undefined;
  const prefixFilter = searchParams.get("prefix") || undefined;

  try {
    await connectToDatabase();
    const allSeries = await ensureAllSeries();
    const active = await resolveSeries(seriesKey || "LOGISTICS");

    // Seed both business-line pools
    for (const s of allSeries) {
      await seedPoolForSeries(s, 8);
    }

    const query: any = {};
    if (status) query.status = status;
    if (seriesKey) {
      const cfg = businessLineConfig(seriesKey);
      query.seriesPrefix = { $regex: `^${cfg.short}`, $options: "i" };
    } else if (prefixFilter) {
      query.seriesPrefix = { $regex: `^${String(prefixFilter).toUpperCase()}`, $options: "i" };
    }

    const dockets = await DocketNumber.find(query).sort({ seriesPrefix: 1, sequenceNo: 1 }).limit(400);

    return NextResponse.json({
      success: true,
      count: dockets.length,
      data: dockets,
      ...(includeSeries
        ? {
            series: active,
            seriesList: allSeries,
            businessLines: Object.values(BUSINESS_LINES)
          }
        : {})
    });
  } catch {
    memoryStore.ensureDocketSeries();
    let dockets = memoryStore.getDocketNumbers(status || undefined);
    if (seriesKey) {
      const cfg = businessLineConfig(seriesKey);
      dockets = dockets.filter((d) => String(d.seriesPrefix || "").startsWith(cfg.short));
    }
    const activeKey = resolveBusinessLine(seriesKey || "LOGISTICS");
    return NextResponse.json({
      success: true,
      count: dockets.length,
      data: dockets,
      isMemoryStore: true,
      ...(includeSeries
        ? {
            series: memoryStore.getDocketSeries(activeKey),
            seriesList: memoryStore.listDocketSeries(),
            businessLines: Object.values(BUSINESS_LINES)
          }
        : {})
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "generate";
    const line = resolveBusinessLine(body.seriesKey || body.businessLine || body.prefix || "LOGISTICS");

    try {
      await connectToDatabase();
      const series = await resolveSeries(line);

      if (action === "updateSeries") {
        if (body.prefix) series.prefix = String(body.prefix).toUpperCase().trim();
        if (body.padLength) series.padLength = Number(body.padLength) || series.padLength;
        if (body.nextSequence) series.nextSequence = Number(body.nextSequence) || series.nextSequence;
        if (body.branchCode) series.branchCode = String(body.branchCode).toUpperCase();
        if (body.description !== undefined) series.description = body.description;
        // Enforce line initials when prefix emptied / mismatched
        const cfg = businessLineConfig(line);
        if (!series.prefix || (line === "ROAD_CARRIER" && series.prefix.startsWith("ALC"))) {
          series.prefix = cfg.docketPrefix;
        }
        if (!series.branchCode) series.branchCode = cfg.branchCode;
        await series.save();
        return NextResponse.json({ success: true, message: "Docket series updated", data: series });
      }

      if (action === "assign") {
        const docketNo = String(body.docketNo || "").trim().toUpperCase();
        if (!docketNo) {
          return NextResponse.json({ error: "Docket number is required" }, { status: 400 });
        }
        const doc = await DocketNumber.findOne({ docketNo });
        if (!doc) {
          return NextResponse.json({ error: "Docket number not found in master" }, { status: 404 });
        }
        if (doc.status !== "AVAILABLE" && doc.status !== "RESERVED") {
          return NextResponse.json({ error: `Docket ${docketNo} is already ${doc.status}` }, { status: 409 });
        }
        doc.status = "ASSIGNED";
        doc.assignedToCnId = body.cnId || undefined;
        doc.assignedAt = new Date();
        await doc.save();
        return NextResponse.json({ success: true, message: `Docket ${docketNo} assigned`, data: doc });
      }

      if (action === "createManual") {
        const docketNo = String(body.docketNo || "").trim().toUpperCase();
        if (!docketNo || docketNo.length < 3) {
          return NextResponse.json({ error: "Valid docket number is required" }, { status: 400 });
        }
        const existing = await DocketNumber.findOne({ docketNo });
        if (existing) {
          return NextResponse.json({ error: `Docket ${docketNo} already exists in master` }, { status: 409 });
        }
        const inferred = resolveBusinessLine(docketNo);
        const target = await resolveSeries(inferred);
        const created = await DocketNumber.create({
          docketNo,
          seriesPrefix: target.prefix,
          sequenceNo: target.nextSequence,
          branchCode: body.branchCode || target.branchCode,
          status: "AVAILABLE",
          notes: body.notes || "Manual entry"
        });
        return NextResponse.json(
          { success: true, message: "Docket number added to master", data: created },
          { status: 201 }
        );
      }

      // Default: generate next available number(s) from selected business-line series
      const count = Math.min(Math.max(Number(body.count) || 1, 1), 50);
      const created = [];
      for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 20) {
          const seq = series.nextSequence++;
          const docketNo = `${series.prefix}${String(seq).padStart(series.padLength, "0")}`;
          const exists = await DocketNumber.findOne({ docketNo });
          if (!exists) {
            const doc = await DocketNumber.create({
              docketNo,
              seriesPrefix: series.prefix,
              sequenceNo: seq,
              branchCode: series.branchCode,
              status: "AVAILABLE"
            });
            created.push(doc);
            break;
          }
          attempts++;
        }
      }
      await series.save();

      return NextResponse.json(
        {
          success: true,
          message: `${created.length} ${businessLineConfig(line).short} docket number(s) generated`,
          data: created,
          series,
          businessLine: line as BusinessLine
        },
        { status: 201 }
      );
    } catch {
      memoryStore.ensureDocketSeries();
      if (action === "updateSeries") {
        const s = memoryStore.getDocketSeries(line);
        Object.assign(s, {
          ...(body.prefix ? { prefix: String(body.prefix).toUpperCase() } : {}),
          ...(body.padLength ? { padLength: Number(body.padLength) } : {}),
          ...(body.nextSequence ? { nextSequence: Number(body.nextSequence) } : {}),
          ...(body.branchCode ? { branchCode: String(body.branchCode).toUpperCase() } : {}),
          ...(body.description !== undefined ? { description: body.description } : {})
        });
        return NextResponse.json({
          success: true,
          message: "Docket series updated",
          data: s,
          isMemoryStore: true
        });
      }

      if (action === "assign") {
        const assigned = memoryStore.assignDocketNumber(body.docketNo, body.cnId);
        if (!assigned) {
          return NextResponse.json({ error: "Docket not available in master" }, { status: 409 });
        }
        return NextResponse.json({
          success: true,
          message: `Docket ${assigned.docketNo} assigned`,
          data: assigned,
          isMemoryStore: true
        });
      }

      if (action === "createManual") {
        const docketNo = String(body.docketNo || "").trim().toUpperCase();
        if (memoryStore.docketNumbers.some((d) => d.docketNo === docketNo)) {
          return NextResponse.json({ error: `Docket ${docketNo} already exists` }, { status: 409 });
        }
        const inferred = resolveBusinessLine(docketNo);
        const s = memoryStore.getDocketSeries(inferred);
        const record = {
          _id: `dn-${Date.now()}`,
          docketNo,
          seriesPrefix: s.prefix,
          sequenceNo: s.nextSequence,
          branchCode: body.branchCode || s.branchCode,
          status: "AVAILABLE" as const,
          notes: body.notes || "Manual entry",
          createdAt: new Date().toISOString()
        };
        memoryStore.docketNumbers.unshift(record);
        return NextResponse.json({ success: true, data: record, isMemoryStore: true }, { status: 201 });
      }

      const created = memoryStore.generateDocketNumbers(Number(body.count) || 1, line);
      return NextResponse.json(
        {
          success: true,
          message: `${created.length} docket number(s) generated`,
          data: created,
          series: memoryStore.getDocketSeries(line),
          businessLine: line,
          isMemoryStore: true
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
