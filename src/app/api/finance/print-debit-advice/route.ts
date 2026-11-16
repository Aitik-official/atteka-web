import { NextRequest, NextResponse } from "next/server";
import { RBAC, requireApiSession } from "@/lib/rbac";
import { listVouchers } from "@/lib/vouchersEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function fmtDateLabel(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function mapStatus(status: string): "Pending" | "Accepted" | "Rejected" | "Generated" {
  const s = String(status || "").toLowerCase();
  if (s === "cancelled") return "Rejected";
  if (s === "paid" || s === "booked" || s === "submitted") return "Accepted";
  if (s === "active") return "Generated";
  return "Generated";
}

export async function GET(req: NextRequest) {
  const gate = await requireApiSession(req, RBAC.anyAuth);
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    const mode = (searchParams.get("mode") || "criteria").trim().toLowerCase();
    const dateMode = (searchParams.get("dateMode") || "today").trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    let from = parseIso(searchParams.get("from"), today);
    let to = parseIso(searchParams.get("to"), today);

    if (dateMode === "today") {
      from = today;
      to = today;
    } else if (dateMode === "last7") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      from = d.toISOString().slice(0, 10);
      to = today;
    }

    const adviceNumber = (searchParams.get("adviceNumber") || "").trim().toUpperCase();
    if ((mode === "number" || adviceNumber) && !adviceNumber) {
      return NextResponse.json({ error: "Enter Debit Advice Number" }, { status: 400 });
    }

    const rows = await listVouchers({
      kinds: ["DEBIT", "DEBIT_NOTE"],
      from: adviceNumber ? undefined : from,
      to: adviceNumber ? undefined : to,
      voucherNumber: adviceNumber || undefined,
      includeCancelled: true
    });

    const data = rows.map((r, idx) => {
      const iso = r.voucherDateIso || "";
      const status = mapStatus(r.status);
      return {
        id: r.id || r.voucherNumber,
        srNo: idx + 1,
        adviceNo: r.voucherNumber,
        adviceTransaction: r.voucherType || r.narration || "Debit Voucher",
        adviceStatus: status,
        raisedBy: r.entryBy || "AL002",
        raisedOn: iso,
        raisedOnLabel: fmtDateLabel(iso),
        adviceAmount: Number(r.totalAccountedAmount || r.amount || 0),
        generationDate: iso,
        generationDateLabel: fmtDateLabel(iso),
        acceptedDate: status === "Accepted" ? iso : "",
        acceptedDateLabel: status === "Accepted" ? fmtDateLabel(iso) : "—"
      };
    });

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      source: "db",
      meta: {
        mode: mode === "number" || adviceNumber ? "number" : "criteria",
        from: fmtDateLabel(from),
        to: fmtDateLabel(to),
        adviceNumber: adviceNumber || ""
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
