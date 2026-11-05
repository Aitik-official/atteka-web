import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/memoryStore";

function getConfig() {
  if (!(memoryStore as any).emailConfig) {
    (memoryStore as any).emailConfig = { hostName: "", portNo: "" };
  }
  return (memoryStore as any).emailConfig as { hostName: string; portNo: string };
}

export async function GET() {
  return NextResponse.json({ success: true, data: getConfig() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const next = {
      hostName: String(body.hostName || "").trim(),
      portNo: String(body.portNo || "").trim()
    };
    (memoryStore as any).emailConfig = next;
    return NextResponse.json({
      success: true,
      message: "E-Mail configuration saved",
      data: next
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
