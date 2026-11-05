import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SacCode } from "@/models/SacCode";
import { memoryStore } from "@/lib/memoryStore";
import { SAC_CODE_SEED } from "@/lib/sacCodeSeed";

function ensureMemory() {
  if (!Array.isArray((memoryStore as any).sacCodes) || (memoryStore as any).sacCodes.length === 0) {
    (memoryStore as any).sacCodes = SAC_CODE_SEED.map((s, idx) => ({
      _id: `sac-${idx}`,
      sacCode: s.sacCode,
      description: s.description,
      used: !!s.used,
      isActive: true
    }));
  }
  return (memoryStore as any).sacCodes as any[];
}

export async function GET() {
  try {
    await connectToDatabase();
    let list = await SacCode.find().sort({ sacCode: 1 });
    if (list.length === 0) {
      try {
        await SacCode.insertMany(
          SAC_CODE_SEED.map((s) => ({
            sacCode: s.sacCode,
            description: s.description,
            used: !!s.used,
            isActive: true
          })),
          { ordered: false }
        );
      } catch {
        // ignore seed races / duplicates
      }
      list = await SacCode.find().sort({ sacCode: 1 });
    }
    if (list.length === 0) {
      return NextResponse.json({ success: true, data: ensureMemory(), isFallback: true });
    }
    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch {
    const list = ensureMemory();
    return NextResponse.json({ success: true, count: list.length, data: list, isMemoryStore: true });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const sacCode = String(body.sacCode || "").trim();
    if (!sacCode) {
      return NextResponse.json({ error: "SAC Code is required" }, { status: 400 });
    }

    const updates: any = {};
    if (typeof body.used === "boolean") updates.used = body.used;
    if (typeof body.description === "string") updates.description = body.description;
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

    try {
      await connectToDatabase();
      const updated = await SacCode.findOneAndUpdate({ sacCode }, { $set: updates }, { new: true });
      if (!updated) {
        return NextResponse.json({ error: "SAC Code not found" }, { status: 404 });
      }
      const mem = ensureMemory();
      const idx = mem.findIndex((x) => x.sacCode === sacCode);
      if (idx >= 0) mem[idx] = { ...mem[idx], ...updates };
      return NextResponse.json({ success: true, message: "SAC Code updated", data: updated });
    } catch {
      const mem = ensureMemory();
      const idx = mem.findIndex((x) => x.sacCode === sacCode);
      if (idx === -1) {
        return NextResponse.json({ error: "SAC Code not found" }, { status: 404 });
      }
      mem[idx] = { ...mem[idx], ...updates };
      return NextResponse.json({
        success: true,
        message: "SAC Code updated (Memory Store)",
        data: mem[idx],
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Bulk mark used / unused for selected codes */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const codes: string[] = Array.isArray(body.sacCodes)
      ? body.sacCodes.map((c: any) => String(c).trim()).filter(Boolean)
      : [];
    const used = body.used !== false;

    if (codes.length === 0) {
      return NextResponse.json({ error: "Select at least one SAC code" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      await SacCode.updateMany({ sacCode: { $in: codes } }, { $set: { used } });
      const mem = ensureMemory();
      for (const c of codes) {
        const idx = mem.findIndex((x) => x.sacCode === c);
        if (idx >= 0) mem[idx].used = used;
      }
      return NextResponse.json({
        success: true,
        message: `${codes.length} SAC code(s) marked as ${used ? "Used" : "Unused"}`,
        count: codes.length
      });
    } catch {
      const mem = ensureMemory();
      let count = 0;
      for (const c of codes) {
        const idx = mem.findIndex((x) => x.sacCode === c);
        if (idx >= 0) {
          mem[idx].used = used;
          count++;
        }
      }
      return NextResponse.json({
        success: true,
        message: `${count} SAC code(s) marked as ${used ? "Used" : "Unused"} (Memory Store)`,
        count,
        isMemoryStore: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
