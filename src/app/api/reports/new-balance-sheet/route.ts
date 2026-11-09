import { NextRequest, NextResponse } from "next/server";

type Line = {
  section: "EQUITY" | "ASSETS";
  heading?: string;
  particulars: string;
  noteNo?: string;
  current: number;
  previous: number;
  isHeading?: boolean;
  isTotal?: boolean;
};

function extractBranch(raw: string) {
  const t = raw.replace(/^-+|-+$/g, "").trim();
  if (!t || /show all/i.test(t)) return "";
  return (t.includes(" - ") ? t.split(" - ").pop()! : t).trim().toUpperCase();
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function roundBy(value: number, roundFigure: string) {
  const v = Number(value) || 0;
  if (/thousand/i.test(roundFigure)) return Number((v / 1000).toFixed(2));
  if (/lakh/i.test(roundFigure)) return Number((v / 100000).toFixed(2));
  if (/crore/i.test(roundFigure)) return Number((v / 10000000).toFixed(2));
  return Number(v.toFixed(2));
}

function baseLines(): Line[] {
  return [
    { section: "EQUITY", particulars: "EQUITY AND LIABILITIES", current: 0, previous: 0, isHeading: true },
    { section: "EQUITY", heading: "Shareholders' Funds", particulars: "Shareholders' Funds", current: 0, previous: 0, isHeading: true },
    { section: "EQUITY", particulars: "RESERVES AND SURPLUS", noteNo: "1", current: 46086317.93, previous: 38500000 },

    { section: "EQUITY", heading: "Non-Current Liabilities", particulars: "Non-Current Liabilities", current: 0, previous: 0, isHeading: true },
    { section: "EQUITY", particulars: "OTHER NON CURRENT LIABILITIES", noteNo: "2", current: 850000, previous: 920000 },
    { section: "EQUITY", particulars: "LONG-TERM BORROWINGS", noteNo: "3", current: -5134057.12, previous: -2800000 },

    { section: "EQUITY", heading: "Current Liabilities", particulars: "Current Liabilities", current: 0, previous: 0, isHeading: true },
    { section: "EQUITY", particulars: "TRADE PAYABLES - OTHERS", noteNo: "4", current: 3000000, previous: 4250000 },
    { section: "EQUITY", particulars: "OTHER CURRENT LIABILITIES", noteNo: "5", current: 1845703.99 + 7687725, previous: 38145702.01 },

    {
      section: "EQUITY",
      particulars: "Total",
      current: 42605088.82,
      previous: 79015702.01,
      isTotal: true
    },

    { section: "ASSETS", particulars: "ASSETS", current: 0, previous: 0, isHeading: true },
    { section: "ASSETS", heading: "Non-Current Assets", particulars: "Non-Current Assets", current: 0, previous: 0, isHeading: true },
    { section: "ASSETS", particulars: "TANGIBLE ASSETS", noteNo: "6", current: -12299148, previous: -9800000 },

    { section: "ASSETS", heading: "Fixed Assets", particulars: "Fixed Assets", current: 0, previous: 0, isHeading: true },
    { section: "ASSETS", particulars: "NON-CURRENT INVESTMENTS", noteNo: "7", current: 250000, previous: 250000 },

    { section: "ASSETS", heading: "Current Assets", particulars: "Current Assets", current: 0, previous: 0, isHeading: true },
    { section: "ASSETS", particulars: "TRADE RECEIVABLES", noteNo: "8", current: 36732759.32, previous: 45200000 },
    { section: "ASSETS", particulars: "SHORT-TERM LOANS AND ADVANCES", noteNo: "9", current: 482818454.52 - 482000000, previous: 1250000 },
    { section: "ASSETS", particulars: "OTHER CURRENT ASSETS", noteNo: "10", current: 198000, previous: 175000 },
    { section: "ASSETS", particulars: "INVENTORIES", noteNo: "11", current: 120000, previous: 95000 },
    { section: "ASSETS", particulars: "CASH & CASH EQUIVALENTS", noteNo: "12", current: 2525000, previous: 2890959.81 },

    {
      section: "ASSETS",
      particulars: "Total",
      current: 42499588.82,
      previous: 75710959.81,
      isTotal: true
    }
  ];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const branch = extractBranch(searchParams.get("branch") || "");
  const roundFigure = (searchParams.get("roundFigure") || "Rs. in Unit (0)").trim();

  // Recompute totals from detail lines so rounding stays consistent
  let lines = baseLines().map((l) => {
    if (l.isHeading || l.isTotal) return { ...l };
    return {
      ...l,
      current: roundBy(l.current, roundFigure),
      previous: roundBy(l.previous, roundFigure)
    };
  });

  const sumSection = (section: "EQUITY" | "ASSETS", key: "current" | "previous") =>
    lines
      .filter((l) => l.section === section && !l.isHeading && !l.isTotal)
      .reduce((s, l) => s + l[key], 0);

  lines = lines.map((l) => {
    if (!l.isTotal) return l;
    return {
      ...l,
      current: Number(sumSection(l.section, "current").toFixed(2)),
      previous: Number(sumSection(l.section, "previous").toFixed(2))
    };
  });

  void branch;
  void from;

  const asAtCurrent = to
    ? to.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "31 March 2027";
  const prevYear = to ? new Date(to) : new Date(2027, 2, 31);
  prevYear.setFullYear(prevYear.getFullYear() - 1);
  const asAtPrevious = prevYear.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  return NextResponse.json({
    success: true,
    companyName: "Ateka Logistics",
    cinNo: "",
    branchLabel: branch || "All",
    roundFigure,
    asAtCurrent,
    asAtPrevious,
    currencyLabel: /thousand/i.test(roundFigure)
      ? "Rupees in Thousands"
      : /lakh/i.test(roundFigure)
        ? "Rupees in Lakhs"
        : /crore/i.test(roundFigure)
          ? "Rupees in Crores"
          : "Rupees",
    data: lines,
    from: from?.toISOString() || null,
    to: to?.toISOString() || null
  });
}
