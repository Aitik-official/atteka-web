import { NextRequest, NextResponse } from "next/server";

type AdviceRow = {
  id: string;
  adviceNo: string;
  adviceTransaction: string;
  adviceStatus: "Pending" | "Accepted" | "Rejected" | "Generated";
  raisedBy: string;
  raisedOn: string;
  adviceAmount: number;
  generationDate: string;
  acceptedDate: string;
};

/** Fabricated debit advice print queue — not client production data. */
const DEMO_ROWS: AdviceRow[] = [
  {
    id: "da-1",
    adviceNo: "DA/ALC1/261101",
    adviceTransaction: "Freight Debit - North Corridor",
    adviceStatus: "Accepted",
    raisedBy: "AL002",
    raisedOn: "2026-11-10",
    adviceAmount: 48500,
    generationDate: "2026-11-10",
    acceptedDate: "2026-11-10"
  },
  {
    id: "da-2",
    adviceNo: "DA/ALC1/261102",
    adviceTransaction: "Detention / Halting Charges",
    adviceStatus: "Generated",
    raisedBy: "AL015",
    raisedOn: "2026-11-10",
    adviceAmount: 12500,
    generationDate: "2026-11-10",
    acceptedDate: ""
  },
  {
    id: "da-3",
    adviceNo: "DA/ALC1/261095",
    adviceTransaction: "Fuel Shortage Recovery",
    adviceStatus: "Accepted",
    raisedBy: "AL008",
    raisedOn: "2026-11-09",
    adviceAmount: 8750.5,
    generationDate: "2026-11-09",
    acceptedDate: "2026-11-09"
  },
  {
    id: "da-4",
    adviceNo: "DA/ALC2/261080",
    adviceTransaction: "Damage / Shortage Claim",
    adviceStatus: "Pending",
    raisedBy: "AL021",
    raisedOn: "2026-11-08",
    adviceAmount: 22000,
    generationDate: "2026-11-08",
    acceptedDate: ""
  },
  {
    id: "da-5",
    adviceNo: "DA/ALC1/261070",
    adviceTransaction: "Advance Adjustment Debit",
    adviceStatus: "Accepted",
    raisedBy: "AL002",
    raisedOn: "2026-11-07",
    adviceAmount: 15000,
    generationDate: "2026-11-07",
    acceptedDate: "2026-11-08"
  },
  {
    id: "da-6",
    adviceNo: "DA/ALC1/261055",
    adviceTransaction: "Loading / Unloading Debit",
    adviceStatus: "Rejected",
    raisedBy: "AL015",
    raisedOn: "2026-11-05",
    adviceAmount: 3500,
    generationDate: "2026-11-05",
    acceptedDate: ""
  },
  {
    id: "da-7",
    adviceNo: "DA/ALC3/261040",
    adviceTransaction: "Extra KM / Route Diversion",
    adviceStatus: "Accepted",
    raisedBy: "AL001",
    raisedOn: "2026-11-04",
    adviceAmount: 9800,
    generationDate: "2026-11-04",
    acceptedDate: "2026-11-04"
  },
  {
    id: "da-8",
    adviceNo: "DA/ALC1/261020",
    adviceTransaction: "Party Debit Note Settlement",
    adviceStatus: "Generated",
    raisedBy: "AL002",
    raisedOn: "2026-11-03",
    adviceAmount: 67500,
    generationDate: "2026-11-03",
    acceptedDate: ""
  }
];

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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") || "criteria").trim().toLowerCase();
  const dateMode = (searchParams.get("dateMode") || "today").trim().toLowerCase();
  const today = todayIso();
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

  let rows = [...DEMO_ROWS];

  if (mode === "number" || adviceNumber) {
    if (!adviceNumber) {
      return NextResponse.json({ error: "Enter Debit Advice Number" }, { status: 400 });
    }
    rows = DEMO_ROWS.filter((r) => r.adviceNo.toUpperCase().includes(adviceNumber));
    if (!rows.length) {
      rows = [
        {
          id: "da-lookup",
          adviceNo: adviceNumber,
          adviceTransaction: "Manual Debit Advice Lookup",
          adviceStatus: "Generated",
          raisedBy: "AL002",
          raisedOn: today,
          adviceAmount: 12500,
          generationDate: today,
          acceptedDate: ""
        }
      ];
    }
  } else {
    rows = DEMO_ROWS.filter((r) => r.raisedOn >= from && r.raisedOn <= to);
  }

  rows = rows.sort((a, b) => b.raisedOn.localeCompare(a.raisedOn) || a.adviceNo.localeCompare(b.adviceNo));

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r, idx) => ({
      ...r,
      srNo: idx + 1,
      raisedOnLabel: fmtDateLabel(r.raisedOn),
      generationDateLabel: fmtDateLabel(r.generationDate),
      acceptedDateLabel: fmtDateLabel(r.acceptedDate)
    })),
    meta: {
      mode: mode === "number" || adviceNumber ? "number" : "criteria",
      from: fmtDateLabel(from),
      to: fmtDateLabel(to),
      adviceNumber: adviceNumber || ""
    }
  });
}
