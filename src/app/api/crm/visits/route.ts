import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memoryStore";

const FALLBACK_LEADS = [
  { leadCode: "L00001", customerName: "RELIANCE RETAIL LTD", contactPerson: "RAHUL SHARMA" },
  { leadCode: "L00002", customerName: "TATA MOTORS SPARE PARTS", contactPerson: "VIKRAM SHAH" },
  { leadCode: "L00003", customerName: "SUNIL GARMENTS", contactPerson: "SUNIL MEHTA" },
  { leadCode: "L00004", customerName: "APEX CHEM TRADE", contactPerson: "ANITA DESAI" }
];

const FALLBACK_VISITS = [
  {
    _id: "visit-1",
    leadCode: "L00001",
    customerName: "RELIANCE RETAIL LTD",
    contactPerson: "RAHUL SHARMA",
    prospectStatus: "Hot",
    visitDateTime: "04/11/2026 11:30",
    visitRemark: "Annual contract renewal & rate revision discussion",
    nextVisitDateTime: "15/11/2026 10:00",
    conveyanceExpenses: 450,
    createdAt: "2026-11-04T11:30:00.000Z"
  },
  {
    _id: "visit-2",
    leadCode: "L00002",
    customerName: "TATA MOTORS SPARE PARTS",
    contactPerson: "VIKRAM SHAH",
    prospectStatus: "Warm",
    visitDateTime: "02/11/2026 16:15",
    visitRemark: "Bhiwandi to Pune daily shuttle quote follow-up",
    nextVisitDateTime: "08/11/2026 14:00",
    conveyanceExpenses: 320,
    createdAt: "2026-11-02T16:15:00.000Z"
  }
];

function ensureVisits() {
  if (!Array.isArray((memoryStore as any).crmVisits) || (memoryStore as any).crmVisits.length === 0) {
    (memoryStore as any).crmVisits = [...FALLBACK_VISITS];
  }
  return (memoryStore as any).crmVisits as any[];
}

function ensureLeads() {
  if (!Array.isArray((memoryStore as any).crmLeads) || (memoryStore as any).crmLeads.length === 0) {
    (memoryStore as any).crmLeads = [...FALLBACK_LEADS];
  }
  return (memoryStore as any).crmLeads as any[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadCode = (searchParams.get("leadCode") || "").trim().toUpperCase();
    const wantLeads = searchParams.get("leads") === "1";

    if (wantLeads) {
      return NextResponse.json({ success: true, data: ensureLeads() });
    }

    let list = [...ensureVisits()];
    if (leadCode) {
      list = list.filter((v) => String(v.leadCode || "").toUpperCase() === leadCode);
    }
    list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    return NextResponse.json({ success: true, count: list.length, data: list });
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

    const record = {
      _id: `visit-${Date.now()}`,
      leadCode,
      customerName,
      contactPerson: String(body.contactPerson || "").trim(),
      prospectStatus: String(body.prospectStatus || "").trim(),
      visitDateTime,
      visitRemark,
      nextVisitDateTime: String(body.nextVisitDateTime || "").trim(),
      conveyanceExpenses: Number(body.conveyanceExpenses) || 0,
      createdAt: new Date().toISOString()
    };

    const list = ensureVisits();
    list.unshift(record);

    return NextResponse.json(
      { success: true, message: "Visit details saved successfully", data: record },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
