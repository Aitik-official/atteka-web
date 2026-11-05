import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DocketNumber, DocketSeriesConfig } from "@/models/DocketNumber";
import { memoryStore } from "@/lib/memoryStore";

async function ensureSeries() {
  let series = await DocketSeriesConfig.findOne({ seriesKey: "DEFAULT" });
  if (!series) {
    series = await DocketSeriesConfig.create({
      seriesKey: "DEFAULT",
      prefix: "ALC126",
      padLength: 4,
      nextSequence: 1,
      branchCode: "ALC1",
      isActive: true,
      description: "Primary CN / Docket stationery series"
    });
  }
  return series;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const includeSeries = searchParams.get("includeSeries") === "1";

  try {
    await connectToDatabase();
    const series = await ensureSeries();

    // Seed a small available pool if empty
    const availableCount = await DocketNumber.countDocuments({ status: "AVAILABLE" });
    if (availableCount === 0) {
      const seedBatch = [];
      for (let i = 0; i < 15; i++) {
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
      try {
        await DocketNumber.insertMany(seedBatch, { ordered: false });
      } catch {
        // ignore duplicate seed races
      }
      await series.save();
    }

    const query: any = {};
    if (status) query.status = status;
    const dockets = await DocketNumber.find(query).sort({ sequenceNo: 1 }).limit(200);

    return NextResponse.json({
      success: true,
      count: dockets.length,
      data: dockets,
      ...(includeSeries ? { series } : {})
    });
  } catch {
    const dockets = memoryStore.getDocketNumbers(status || undefined);
    return NextResponse.json({
      success: true,
      count: dockets.length,
      data: dockets,
      isMemoryStore: true,
      ...(includeSeries ? { series: memoryStore.docketSeries } : {})
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "generate";

    try {
      await connectToDatabase();
      const series = await ensureSeries();

      if (action === "updateSeries") {
        if (body.prefix) series.prefix = String(body.prefix).toUpperCase().trim();
        if (body.padLength) series.padLength = Number(body.padLength) || series.padLength;
        if (body.nextSequence) series.nextSequence = Number(body.nextSequence) || series.nextSequence;
        if (body.branchCode) series.branchCode = String(body.branchCode).toUpperCase();
        if (body.description !== undefined) series.description = body.description;
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
        const created = await DocketNumber.create({
          docketNo,
          seriesPrefix: series.prefix,
          sequenceNo: series.nextSequence,
          branchCode: body.branchCode || series.branchCode,
          status: "AVAILABLE",
          notes: body.notes || "Manual entry"
        });
        return NextResponse.json({ success: true, message: "Docket number added to master", data: created }, { status: 201 });
      }

      // Default: generate next available number(s) from series
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

      return NextResponse.json({
        success: true,
        message: `${created.length} docket number(s) generated from master series`,
        data: created,
        series
      }, { status: 201 });
    } catch {
      // Memory store fallback
      if (action === "updateSeries") {
        Object.assign(memoryStore.docketSeries, {
          ...(body.prefix ? { prefix: String(body.prefix).toUpperCase() } : {}),
          ...(body.padLength ? { padLength: Number(body.padLength) } : {}),
          ...(body.nextSequence ? { nextSequence: Number(body.nextSequence) } : {}),
          ...(body.branchCode ? { branchCode: String(body.branchCode).toUpperCase() } : {}),
          ...(body.description !== undefined ? { description: body.description } : {})
        });
        return NextResponse.json({ success: true, message: "Docket series updated", data: memoryStore.docketSeries, isMemoryStore: true });
      }

      if (action === "assign") {
        const assigned = memoryStore.assignDocketNumber(body.docketNo, body.cnId);
        if (!assigned) {
          return NextResponse.json({ error: "Docket not available in master" }, { status: 409 });
        }
        return NextResponse.json({ success: true, message: `Docket ${assigned.docketNo} assigned`, data: assigned, isMemoryStore: true });
      }

      if (action === "createManual") {
        const docketNo = String(body.docketNo || "").trim().toUpperCase();
        if (memoryStore.docketNumbers.some((d) => d.docketNo === docketNo)) {
          return NextResponse.json({ error: `Docket ${docketNo} already exists` }, { status: 409 });
        }
        const record = {
          _id: `dn-${Date.now()}`,
          docketNo,
          seriesPrefix: memoryStore.docketSeries.prefix,
          sequenceNo: memoryStore.docketSeries.nextSequence,
          branchCode: body.branchCode || memoryStore.docketSeries.branchCode,
          status: "AVAILABLE" as const,
          notes: body.notes || "Manual entry",
          createdAt: new Date().toISOString()
        };
        memoryStore.docketNumbers.unshift(record);
        return NextResponse.json({ success: true, data: record, isMemoryStore: true }, { status: 201 });
      }

      const created = memoryStore.generateDocketNumbers(Number(body.count) || 1);
      return NextResponse.json({
        success: true,
        message: `${created.length} docket number(s) generated`,
        data: created,
        series: memoryStore.docketSeries,
        isMemoryStore: true
      }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
