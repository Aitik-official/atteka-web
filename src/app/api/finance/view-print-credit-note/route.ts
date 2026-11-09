import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo credit notes for View / Print — not client production data. */
type CnRow = {
  creditNoteNo: string;
  creditNoteDate: string;
  creditNoteDateIso: string;
  creditNoteLocation: string;
  mrNo: string;
  billNo: string;
  amount: number;
};

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildDemoRows(): CnRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows: CnRow[] = [];
  for (let i = 0; i < 18; i++) {
    const iso = addDays(today, -((i % 14) + (i % 3 === 0 ? 0 : 2)));
    const amount = Number((3250 + (i % 9) * 1875 + (i % 5) * 240.25).toFixed(2));
    rows.push({
      creditNoteNo: `CNALC1${String(26031000 + i)}`,
      creditNoteDate: fmtDate(iso),
      creditNoteDateIso: iso,
      creditNoteLocation: "Ateka Logistics",
      mrNo: `MRALC1${String(26042000 + i)}`,
      billNo: `BLALC1${String(26053000 + i)}`,
      amount
    });
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), addDays(today, -364));
  const to = parseIso(searchParams.get("to"), today);
  const creditNoteNo = (searchParams.get("creditNoteNo") || "").trim().toUpperCase();
  const mrNo = (searchParams.get("mrNo") || "").trim().toUpperCase();
  const billNo = (searchParams.get("billNo") || "").trim().toUpperCase();

  let rows = buildDemoRows();

  if (creditNoteNo) {
    rows = rows.filter(
      (r) =>
        r.creditNoteNo.toUpperCase().includes(creditNoteNo) ||
        creditNoteNo.includes(r.creditNoteNo.slice(-6))
    );
    if (!rows.length) {
      rows = [
        {
          creditNoteNo: creditNoteNo.startsWith("CN")
            ? creditNoteNo
            : `CNALC1${creditNoteNo.replace(/\D/g, "").padStart(8, "0")}`,
          creditNoteDate: fmtDate(today),
          creditNoteDateIso: today,
          creditNoteLocation: "Ateka Logistics",
          mrNo: "MRALC126042100",
          billNo: "BLALC126053100",
          amount: 8750.5
        }
      ];
    }
  } else if (mrNo) {
    rows = rows.filter(
      (r) => r.mrNo.toUpperCase().includes(mrNo) || mrNo.includes(r.mrNo.slice(-6))
    );
    if (!rows.length) {
      rows = [
        {
          creditNoteNo: "CNALC126031999",
          creditNoteDate: fmtDate(today),
          creditNoteDateIso: today,
          creditNoteLocation: "Ateka Logistics",
          mrNo: mrNo.startsWith("MR") ? mrNo : `MRALC1${mrNo.replace(/\D/g, "").padStart(8, "0")}`,
          billNo: "BLALC126053199",
          amount: 6400
        }
      ];
    }
  } else if (billNo) {
    rows = rows.filter(
      (r) => r.billNo.toUpperCase().includes(billNo) || billNo.includes(r.billNo.slice(-6))
    );
    if (!rows.length) {
      rows = [
        {
          creditNoteNo: "CNALC126031998",
          creditNoteDate: fmtDate(today),
          creditNoteDateIso: today,
          creditNoteLocation: "Ateka Logistics",
          mrNo: "MRALC126042198",
          billNo: billNo.startsWith("BL")
            ? billNo
            : `BLALC1${billNo.replace(/\D/g, "").padStart(8, "0")}`,
          amount: 5125.75
        }
      ];
    }
  } else {
    rows = rows.filter((r) => r.creditNoteDateIso >= from && r.creditNoteDateIso <= to);
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows.map((r, idx) => ({
      srNo: idx + 1,
      creditNoteNo: r.creditNoteNo,
      creditNoteDate: r.creditNoteDate,
      creditNoteDateIso: r.creditNoteDateIso,
      creditNoteLocation: r.creditNoteLocation,
      mrNo: r.mrNo,
      billNo: r.billNo,
      amount: r.amount
    })),
    meta: {
      from,
      to,
      creditNoteNo: creditNoteNo || null,
      mrNo: mrNo || null,
      billNo: billNo || null
    }
  });
}
