import { NextRequest, NextResponse } from "next/server";

type Line = {
  category: "INCOME" | "EXPENSE";
  ledgerGroup: string;
  ledger: string;
  amount: number;
};

/** Fabricated demo Branch P&L — column structure only; not client production figures. */
function demoLines(): Line[] {
  return [
    { category: "INCOME", ledgerGroup: "Non-Operating Income", ledger: "INSURANCE CLAIM RECEIVABLE", amount: 45000 },
    { category: "INCOME", ledgerGroup: "Non-Operating Income", ledger: "MISCELLANEOUS INCOME - OTHER", amount: 28500 },
    { category: "INCOME", ledgerGroup: "Operating Income", ledger: "FREIGHT INCOME (CN BOOKING - TBB)", amount: 1850000 },
    { category: "INCOME", ledgerGroup: "Operating Income", ledger: "FREIGHT INCOME (CN BOOKING - TO PAY)", amount: 125000 },
    { category: "INCOME", ledgerGroup: "Operating Income", ledger: "OTHER CHARGES (INCOME)", amount: 8500 },
    { category: "INCOME", ledgerGroup: "Operating Income", ledger: "VEHICLE DEMOBILIZATION CHARGES", amount: 42000 },

    { category: "EXPENSE", ledgerGroup: "Direct Expenses", ledger: "DRIVER SALARY", amount: 18500 },
    { category: "EXPENSE", ledgerGroup: "Financial Cost", ledger: "BANK CHARGES", amount: 12500 },
    { category: "EXPENSE", ledgerGroup: "Financial Cost", ledger: "INTEREST ON LOAN (EXPENSE)", amount: 35000 },
    { category: "EXPENSE", ledgerGroup: "Indirect Expenses", ledger: "OTHER EXPENSES", amount: 48500 },
    { category: "EXPENSE", ledgerGroup: "Indirect Expenses", ledger: "GENERAL EXPENSES", amount: 9200 },
    { category: "EXPENSE", ledgerGroup: "Office & Admin Expenses", ledger: "OFFICE EXPENCE", amount: 28500 },
    { category: "EXPENSE", ledgerGroup: "Operating Expenses - CCFF", ledger: "SERVICE CHARGE", amount: 55000 },
    { category: "EXPENSE", ledgerGroup: "Operating Expenses - CCFF", ledger: "DOCUMENT CHARGES", amount: 12000 },
    { category: "EXPENSE", ledgerGroup: "Other Operating Expenses", ledger: "DRIVER INCENTIVE", amount: 22500 },
    { category: "EXPENSE", ledgerGroup: "Other Operating Expenses", ledger: "COURIER CHARGES", amount: 8500 },
    { category: "EXPENSE", ledgerGroup: "Repairs & Maintenance", ledger: "COMPUTER SOFTWARE", amount: 20000 },
    { category: "EXPENSE", ledgerGroup: "Vehicle Operation Cost", ledger: "DIESEL EXPENSES", amount: 420000 },
    { category: "EXPENSE", ledgerGroup: "Vehicle Operation Cost", ledger: "TOLL EXPENSES", amount: 95000 },
    { category: "EXPENSE", ledgerGroup: "Vehicle Operation Cost", ledger: "REPAIR & MAINTENANCE VEHICLE", amount: 185000 },
    { category: "EXPENSE", ledgerGroup: "Vehicle Operation Cost", ledger: "TYRES & TUBES EXPENSES", amount: 28000 },
    { category: "EXPENSE", ledgerGroup: "Vehicle Operation Cost", ledger: "SPARE PARTS EXPENSE", amount: 18500 },
    { category: "EXPENSE", ledgerGroup: "Vehicle Operation Cost", ledger: "VEHICLE INSURANCE", amount: 38000 }
  ];
}

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

  const branchLabel =
    !branchRaw || /select|show all/i.test(branchRaw)
      ? "ALC1 - Ateka Logistics"
      : branchRaw.includes(" - ")
        ? `${branchRaw.split(" - ").pop()!.trim()} - ${branchRaw.split(" - ")[0].trim()}`
        : `${branchRaw.toUpperCase()} - Ateka Logistics`;

  const lines = demoLines();
  const incomeTotal = lines.filter((l) => l.category === "INCOME").reduce((s, l) => s + l.amount, 0);
  const expenseTotal = lines.filter((l) => l.category === "EXPENSE").reduce((s, l) => s + l.amount, 0);
  const profit = Number((incomeTotal - expenseTotal).toFixed(2));

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

  const pushLine = (line: Line) => {
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

  for (const line of lines.filter((l) => l.category === "INCOME")) pushLine(line);
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
  for (const line of lines.filter((l) => l.category === "EXPENSE")) pushLine(line);
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
