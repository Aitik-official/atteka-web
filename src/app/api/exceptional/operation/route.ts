import { NextRequest, NextResponse } from "next/server";
import { getExceptionalOpModule } from "@/lib/exceptionalOperationModules";
import { RBAC, requireApiSession } from "@/lib/rbac";
import {
  getExceptionalDocument,
  listExceptionalSamples,
  saveExceptionalDocument
} from "@/lib/exceptionalOpsEngine";

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  const documentNo = (searchParams.get("documentNo") || "").trim().toUpperCase();
  const docType = (searchParams.get("docType") || "").trim();

  const mod = getExceptionalOpModule(slug);
  if (!mod) {
    return NextResponse.json({ error: "Unknown exceptional operation" }, { status: 404 });
  }

  try {
    if (!documentNo) {
      const list = await listExceptionalSamples(slug, docType);
      return NextResponse.json({
        success: true,
        data: list,
        total: list.length,
        source: "db",
        hint: list.length
          ? `Sample Nos: ${list
              .slice(0, 5)
              .map((d) => d.documentNo)
              .join(" · ")}`
          : undefined
      });
    }

    const found = await getExceptionalDocument(slug, documentNo, docType);
    if (!found) {
      return NextResponse.json(
        {
          error: docType
            ? `No ${docType} found for this System No`
            : "Document not found"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: found, source: "db" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load exceptional document" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.exceptionalWrite);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || "").trim();
    const documentNo = String(body.documentNo || "").trim().toUpperCase();
    const values = (body.values || {}) as Record<string, string>;

    const mod = getExceptionalOpModule(slug);
    if (!mod) {
      return NextResponse.json({ error: "Unknown exceptional operation" }, { status: 404 });
    }
    if (!documentNo) {
      return NextResponse.json({ error: "Document No. is required" }, { status: 400 });
    }

    const result = await saveExceptionalDocument(slug, documentNo, values);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
      source: "db"
    });
  } catch (error: any) {
    const status = Number(error?.status) || 500;
    return NextResponse.json(
      { error: error?.message || "Failed to save exceptional document" },
      { status }
    );
  }
}
