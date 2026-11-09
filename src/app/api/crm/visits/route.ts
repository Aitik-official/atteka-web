import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CrmVisit } from "@/models/CrmVisit";
import { memoryStore } from "@/lib/memoryStore";

const FALLBACK_LEADS = [
  { leadCode: "L00001", customerName: "RELIANCE RETAIL LTD", contactPerson: "RAHUL SHARMA" },
  { leadCode: "L00002", customerName: "TATA MOTORS SPARE PARTS", contactPerson: "VIKRAM SHAH" },
  { leadCode: "L00003", customerName: "SUNIL GARMENTS", contactPerson: "SUNIL MEHTA" },
  { leadCode: "L00004", customerName: "APEX CHEM TRADE", contactPerson: "ANITA DESAI" }
];

function ensureLeads() {
  if (!Array.isArray(memoryStore.crmLeads) || memoryStore.crmLeads.length === 0) {
    memoryStore.crmLeads = [...FALLBACK_LEADS];
  }
  return memoryStore.crmLeads as any[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadCode = (searchParams.get("leadCode") || "").trim().toUpperCase();
    const wantLeads = searchParams.get("leads") === "1";

    if (wantLeads) {
      return NextResponse.json({ success: true, data: ensureLeads() });
    }

    try {
      await connectToDatabase();
      const query: any = {};
      if (leadCode) query.leadCode = leadCode;
      const data = await CrmVisit.find(query).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, count: data.length, data, source: "mongodb" });
    } catch {
      let list = [...(memoryStore.crmVisits || [])];
      if (leadCode) {
        list = list.filter((v) => String(v.leadCode || "").toUpperCase() === leadCode);
      }
      list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      return NextResponse.json({
        success: true,
        count: list.length,
        data: list,
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const leadCode = String(body.leadCode || "").trim().toUpperCase();
    const customerName = String(body.customerName || "").trim();
    const visitDateTime = String(body.visitDateTime || "").trim();
    const visitRemark = String(body.visitRemark || "").trim();

    if (!leadCode) {
      return NextResponse.json({ error: "Lead Code is required" }, { status: 400 });
    }
    if (!customerName) {
      return NextResponse.json({ error: "Customer Name is required" }, { status: 400 });
    }
    if (!visitDateTime) {
      return NextResponse.json({ error: "Visit Date & time is required" }, { status: 400 });
    }
    if (!visitRemark) {
      return NextResponse.json({ error: "Visit Remark is required" }, { status: 400 });
    }

    const record: any = {
      leadCode,
      customerName,
      contactPerson: String(body.contactPerson || "").trim(),
      prospectStatus: String(body.prospectStatus || "").trim(),
      visitDateTime,
      visitRemark,
      nextVisitDateTime: String(body.nextVisitDateTime || "").trim(),
      conveyanceExpenses: Number(body.conveyanceExpenses) || 0
    };

    try {
      await connectToDatabase();
      const saved = await CrmVisit.create(record);
      return NextResponse.json(
        { success: true, message: "Visit details saved successfully", data: saved, source: "mongodb" },
        { status: 201 }
      );
    } catch {
      const memory = { ...record, _id: `visit-${Date.now()}`, createdAt: new Date().toISOString() };
      if (!Array.isArray(memoryStore.crmVisits)) memoryStore.crmVisits = [];
      memoryStore.crmVisits.unshift(memory);
      return NextResponse.json(
        {
          success: true,
          message: "Visit details saved (Memory Store — Mongo unavailable)",
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
