import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { memoryStore } from "@/lib/memoryStore";

type PlLine = {
  group: string;
  category: string;
  code: string;
  name: string;
  amount: number;
  branch: string;
};

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseDate(value?: string | null) {
  if (!value) return null;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(value))) {
    const [dd, mm, yyyy] = String(value).split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function extractBranch(raw: string) {
  const t = raw.replace(/^-+|-+$/g, "").trim();
  if (!t || /show all/i.test(t) || /^select$/i.test(t)) return "";
  return (t.includes(" - ") ? t.split(" - ").pop()! : t).trim().toUpperCase();
}

function baseLines(): PlLine[] {
  return [
    // INCOME
    { group: "INCOME", category: "INCOME", code: "INC003", name: "NON-OPERATING INCOME", amount: 45318, branch: "ALC1" },
    { group: "INCOME", category: "INCOME", code: "INC002", name: "OPERATING INCOME", amount: 48329759.57, branch: "ALC1" },

    // EXPENSE — Administrative
    { group: "EXPENSE", category: "ADMINISTRATIVE EXPENSE", code: "EXP034", name: "OFFICE & ADMIN EXPENSES", amount: 42574, branch: "ALC1" },
    { group: "EXPENSE", category: "ADMINISTRATIVE EXPENSE", code: "EXP028", name: "REPAIRS & MAINTENANCE", amount: 72000, branch: "ALC1" },

    // EXPENSE — General / Expenses
    { group: "EXPENSE", category: "EXPENSES", code: "EXP035", name: "DIRECT EXPENSES", amount: 1700, branch: "ALC1" },
    { group: "EXPENSE", category: "EXPENSES", code: "EXP014", name: "FINANCIAL COST", amount: 96721, branch: "ALC1" },
    { group: "EXPENSE", category: "EXPENSES", code: "EXP024", name: "INDIRECT EXPENSES", amount: 446098.45, branch: "ALC1" },
    { group: "EXPENSE", category: "EXPENSES", code: "EXP015", name: "OTHER EXPENSES", amount: 8005, branch: "ALC1" },
    { group: "EXPENSE", category: "EXPENSES", code: "EXP005", name: "PERSONNEL COST", amount: 407218.76, branch: "ALC1" },

    // EXPENSE — Operating
    { group: "EXPENSE", category: "OPERATING EXPENSES", code: "EXP033", name: "OPERATING EXPENSES - CCFF", amount: 216466.11, branch: "ALC1" },
    { group: "EXPENSE", category: "OPERATING EXPENSES", code: "EXP004", name: "OTHER OPERATING EXPENSES", amount: 58943.24, branch: "ALC1" },
    { group: "EXPENSE", category: "OPERATING EXPENSES", code: "EXP003", name: "VEHICLE OPERATION COST", amount: 953289.54, branch: "ALC1" }
  ];
}

type Row = {
  groupName: string;
  subGroupName: string;
  amount: number | null;
  totalAmount: number | null;
  isCategoryHeader?: boolean;
  isSubTotal?: boolean;
  isSectionTotal?: boolean;
  isProfit?: boolean;
  hrefCode?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const branch = extractBranch(searchParams.get("branch") || "");

  let lines = baseLines();

  // Overlay operating income from bills in period when available
  try {
    await connectToDatabase();
    const query: any = { status: { $ne: "CANCELLED" } };
    if (from || to) {
      query.billDate = {};
      if (from) query.billDate.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.billDate.$lte = end;
      }
    }
    if (branch) query.billingBranch = new RegExp(branch, "i");
    const bills = await CustomerBill.find(query).select("grandTotal").lean();
    const billTotal = (bills as any[]).reduce((s, b) => s + num(b.grandTotal), 0);
    if (billTotal > 0) {
      lines = lines.map((l) =>
        l.code === "INC002" ? { ...l, amount: Number((l.amount + billTotal).toFixed(2)) } : l
      );
    }
  } catch {
    const mem = (memoryStore.bills || []).reduce((s: number, b: any) => s + num(b.grandTotal), 0);
    if (mem > 0) {
      lines = lines.map((l) =>
        l.code === "INC002" ? { ...l, amount: Number((l.amount + mem).toFixed(2)) } : l
      );
    }
  }

  if (branch) {
    lines = lines.filter((l) => l.branch === branch || l.branch === "ALC1");
  }

  const rows: Row[] = [];
  const incomeLines = lines.filter((l) => l.group === "INCOME");
  const expenseLines = lines.filter((l) => l.group === "EXPENSE");

  // INCOME section
  rows.push({
    groupName: "INCOME",
    subGroupName: "",
    amount: null,
    totalAmount: null,
    isCategoryHeader: true
  });

  let incomeTotal = 0;
  for (const l of incomeLines) {
    incomeTotal += l.amount;
    rows.push({
      groupName: "",
      subGroupName: `${l.name}~${l.code}`,
      amount: Number(l.amount.toFixed(2)),
      totalAmount: null,
      hrefCode: l.code
    });
  }
  rows.push({
    groupName: "",
    subGroupName: "Total INCOME",
    amount: null,
    totalAmount: Number(incomeTotal.toFixed(2)),
    isSubTotal: true
  });
  rows.push({
    groupName: "",
    subGroupName: "Total",
    amount: null,
    totalAmount: Number(incomeTotal.toFixed(2)),
    isSectionTotal: true
  });

  // EXPENSE section
  rows.push({
    groupName: "EXPENSE",
    subGroupName: "",
    amount: null,
    totalAmount: null,
    isCategoryHeader: true
  });

  const expenseCategories = [...new Set(expenseLines.map((l) => l.category))];
  let expenseGrand = 0;

  for (const cat of expenseCategories) {
    const catLines = expenseLines.filter((l) => l.category === cat);
    let catTotal = 0;
    // category label as first visual cue via empty group + bold handled on UI for isCategoryHeader on first of cat
    rows.push({
      groupName: "",
      subGroupName: cat,
      amount: null,
      totalAmount: null,
      isCategoryHeader: true
    });
    for (const l of catLines) {
      catTotal += l.amount;
      expenseGrand += l.amount;
      rows.push({
        groupName: "",
        subGroupName: `${l.name}~${l.code}`,
        amount: Number(l.amount.toFixed(2)),
        totalAmount: null,
        hrefCode: l.code
      });
    }
    rows.push({
      groupName: "",
      subGroupName: `Total ${cat}`,
      amount: null,
      totalAmount: Number(catTotal.toFixed(2)),
      isSubTotal: true
    });
  }

  rows.push({
    groupName: "",
    subGroupName: "Total",
    amount: null,
    totalAmount: Number(expenseGrand.toFixed(2)),
    isSectionTotal: true
  });

  const profit = Number((incomeTotal - expenseGrand).toFixed(2));
  rows.push({
    groupName: "PROFIT/(LOSS) BEFORE TAXATION",
    subGroupName: "",
    amount: null,
    totalAmount: profit,
    isProfit: true
  });

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows,
    totals: {
      income: Number(incomeTotal.toFixed(2)),
      expense: Number(expenseGrand.toFixed(2)),
      profitBeforeTax: profit
    },
    filters: {
      from: from?.toISOString() || null,
      to: to?.toISOString() || null,
      branch: branch || "--Show All--"
    }
  });
}
