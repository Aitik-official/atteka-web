import { NextRequest, NextResponse } from "next/server";
import { buildBranchProfitLoss } from "@/lib/booksEngine";

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function fmtRange(from: string, to: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };
  return `${new Date(from).toLocaleDateString("en-GB", opts)} To ${new Date(to).toLocaleDateString("en-GB", opts)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const y = new Date().getFullYear();
  const month = new Date().getMonth();
  const fyStart = month >= 3 ? y : y - 1;
  const from = parseIso(searchParams.get("from"), `${fyStart}-04-01`);
  const to = parseIso(searchParams.get("to"), `${fyStart + 1}-03-31`);
  const branchRaw = (searchParams.get("branch") || "--Show All--").trim();
  const branch =
    !branchRaw || /select|show all/i.test(branchRaw)
      ? ""
      : (branchRaw.includes(" - ") ? branchRaw.split(" - ").pop()! : branchRaw).trim().toUpperCase();

  const branchLabel =
    !branchRaw || /select|show all/i.test(branchRaw)
      ? "ALC1 - Ateka Logistics"
      : branchRaw.includes(" - ")
        ? `${branchRaw.split(" - ").pop()!.trim()} - ${branchRaw.split(" - ")[0].trim()}`
        : `${branchRaw.toUpperCase()} - Ateka Logistics`;

  const built = await buildBranchProfitLoss({ from, to, branch });
  const lines = built.lines;
  const incomeTotal = built.totalIncome;
  const expenseTotal = built.totalExpense;
  const profit = built.profitLoss;

  type Row = {
    branch: string;
    accountCategory: string;
    ledgerGroup: string;
    ledger: string;
    amount: number | null;
    total: number | null;
    isSectionTotal?: boolean;
    isProfit?: boolean;
  };

  const rows: Row[] = [];
  let showBranch = true;
  let lastCategory = "";
  let lastGroup = "";

  const pushLine = (line: (typeof lines)[number]) => {
    const showCategory = line.category !== lastCategory;
    const showGroup = showCategory || line.ledgerGroup !== lastGroup;
    rows.push({
      branch: showBranch ? branchLabel : "",
      accountCategory: showCategory ? line.category : "",
      ledgerGroup: showGroup ? line.ledgerGroup : "",
      ledger: line.ledger,
      amount: Number(line.amount.toFixed(2)),
      total: null
    });
    showBranch = false;
    lastCategory = line.category;
    lastGroup = line.ledgerGroup;
  };

  if (!lines.length) {
    rows.push({
      branch: branchLabel,
      accountCategory: "INCOME",
      ledgerGroup: "Operating Income",
      ledger: "No income posts in period",
      amount: 0,
      total: null
    });
  } else {
    for (const line of lines.filter((l) => l.category === "INCOME")) pushLine(line);
  }
  rows.push({
    branch: "",
    accountCategory: "",
    ledgerGroup: "",
    ledger: "TOTAL INCOME",
    amount: null,
    total: Number(incomeTotal.toFixed(2)),
    isSectionTotal: true
  });

  lastCategory = "";
  lastGroup = "";
  if (lines.some((l) => l.category === "EXPENSE")) {
    for (const line of lines.filter((l) => l.category === "EXPENSE")) pushLine(line);
  } else {
    rows.push({
      branch: "",
      accountCategory: "EXPENSE",
      ledgerGroup: "Operating Expenses",
      ledger: "No expense posts in period",
      amount: 0,
      total: null
    });
  }
  rows.push({
    branch: "",
    accountCategory: "",
    ledgerGroup: "",
    ledger: "TOTAL EXPENSE",
    amount: null,
    total: Number(expenseTotal.toFixed(2)),
    isSectionTotal: true
  });
  rows.push({
    branch: "",
    accountCategory: "",
    ledgerGroup: "",
    ledger: "PROFIT / LOSS",
    amount: null,
    total: profit,
    isProfit: true
  });

  return NextResponse.json({
    success: true,
    count: lines.length,
    data: rows,
    source: built.source === "db" ? "db" : "empty",
    meta: {
      branch: branchRaw && !/show all/i.test(branchRaw) ? branchRaw : "--Show All--",
      branchDisplay: branchLabel,
      dateRange: fmtRange(from, to),
      from,
      to,
      totalIncome: Number(incomeTotal.toFixed(2)),
      totalExpense: Number(expenseTotal.toFixed(2)),
      profitLoss: profit
    }
  });
}
