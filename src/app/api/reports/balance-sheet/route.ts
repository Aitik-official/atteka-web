import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { MoneyReceipt } from "@/models/MoneyReceipt";
import { memoryStore } from "@/lib/memoryStore";

type BsLine = {
  section: "SOURCE" | "APPLICATION";
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

function baseLines(): BsLine[] {
  return [
    // SOURCE OF FUNDS
    { section: "SOURCE", category: "CURRENT LIABILITIES", code: "LCL001", name: "LIABILITY FOR OTHERS", amount: 1845703.99, branch: "ALC1" },
    { section: "SOURCE", category: "CURRENT LIABILITIES", code: "LCL002", name: "SUNDRY CREDITORS", amount: 3000000, branch: "ALC1" },

    { section: "SOURCE", category: "DUTIES AND TAXES", code: "LDT001", name: "GOODS AND SERVICES TAX", amount: 7687725, branch: "ALC1" },

    { section: "SOURCE", category: "RESERVES & SURPLUS", code: "LRS001", name: "CAPITAL A/C PROPRIETOR", amount: 5000000, branch: "ALC1" },
    { section: "SOURCE", category: "RESERVES & SURPLUS", code: "LRS002", name: "RESERVES & SURPLUS", amount: 41086317.93, branch: "ALC1" },

    { section: "SOURCE", category: "SECURED LOANS", code: "LSL001", name: "HIRE PURCHASE LOAN", amount: -2134057.12, branch: "ALC1" },
    { section: "SOURCE", category: "SECURED LOANS", code: "LSL002", name: "WORKING CAPITAL LOAN", amount: -3000000, branch: "ALC1" },

    { section: "SOURCE", category: "UNSECURED LOANS", code: "LUL001", name: "LOANS FROM OTHERS", amount: 1838937, branch: "ALC1" },

    // APPLICATION OF FUNDS
    { section: "APPLICATION", category: "CURRENT ASSETS", code: "ACA001", name: "BANK BALANCES", amount: 2450000, branch: "ALC1" },
    { section: "APPLICATION", category: "CURRENT ASSETS", code: "ACA002", name: "CASH BALANCES", amount: 75000, branch: "ALC1" },
    { section: "APPLICATION", category: "CURRENT ASSETS", code: "ACA003", name: "STOCK IN HAND", amount: 120000, branch: "ALC1" },
    { section: "APPLICATION", category: "CURRENT ASSETS", code: "ACA004", name: "SUNDRY DEBTORS CONTROL ACCOUNTS", amount: 36732759.32, branch: "ALC1" },

    { section: "APPLICATION", category: "FIXED ASSETS", code: "AFA001", name: "CONTAINERS", amount: -9800000, branch: "ALC1" },
    { section: "APPLICATION", category: "FIXED ASSETS", code: "AFA002", name: "OFFICE EQUIPMENTS", amount: -2499148, branch: "ALC1" },

    { section: "APPLICATION", category: "LOANS & ADVANCES", code: "ALA001", name: "ADVANCE AGAINST EXPENSES", amount: 228000, branch: "ALC1" },
    { section: "APPLICATION", category: "LOANS & ADVANCES", code: "ALA002", name: "ADVANCE TAXES", amount: 198000, branch: "ALC1" },
    { section: "APPLICATION", category: "LOANS & ADVANCES", code: "ALA003", name: "GOODS SERVICE TAX", amount: 482000000, branch: "ALC1" },
    { section: "APPLICATION", category: "LOANS & ADVANCES", code: "ALA004", name: "OTHER ADVANCES", amount: 392454.52, branch: "ALC1" }
  ];
}

type Row = {
  groupName: string;
  subGroupName: string;
  amount: number | null;
  totalAmount: number | null;
  isSectionHeader?: boolean;
  isCategoryTotal?: boolean;
  isGrandTotal?: boolean;
  hrefCode?: string;
};

function buildSection(
  sectionLabel: string,
  lines: BsLine[],
  rows: Row[]
): number {
  rows.push({
    groupName: sectionLabel,
    subGroupName: "",
    amount: null,
    totalAmount: null,
    isSectionHeader: true
  });

  const categories = [...new Set(lines.map((l) => l.category))];
  let sectionTotal = 0;

  for (const cat of categories) {
    const catLines = lines.filter((l) => l.category === cat);
    let catTotal = 0;
    for (const l of catLines) {
      catTotal += l.amount;
      sectionTotal += l.amount;
      rows.push({
        groupName: "",
        subGroupName: l.name,
        amount: Number(l.amount.toFixed(2)),
        totalAmount: null,
        hrefCode: l.code
      });
    }
    rows.push({
      groupName: `Total ${cat}`,
      subGroupName: "",
      amount: null,
      totalAmount: Number(catTotal.toFixed(2)),
      isCategoryTotal: true
    });
  }

  rows.push({
    groupName: "Total",
    subGroupName: "",
    amount: null,
    totalAmount: Number(sectionTotal.toFixed(2)),
    isGrandTotal: true
  });

  return sectionTotal;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const branch = extractBranch(searchParams.get("branch") || "");

  let lines = baseLines();

  try {
    await connectToDatabase();
    const billQuery: any = { status: { $ne: "CANCELLED" } };
    const mrQuery: any = {};
    if (from || to) {
      billQuery.billDate = {};
      mrQuery.mrDate = {};
      if (from) {
        billQuery.billDate.$gte = from;
        mrQuery.mrDate.$gte = from;
      }
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        billQuery.billDate.$lte = end;
        mrQuery.mrDate.$lte = end;
      }
    }
    const [bills, mrs] = await Promise.all([
      CustomerBill.find(billQuery).select("grandTotal").lean().catch(() => []),
      MoneyReceipt.find(mrQuery).select("totalReceived").lean().catch(() => [])
    ]);
    const billTotal = (bills as any[]).reduce((s, b) => s + num(b.grandTotal), 0);
    const mrTotal = (mrs as any[]).reduce((s, m) => s + num(m.totalReceived), 0);
    const osApprox = Math.max(0, billTotal - mrTotal);
    if (osApprox > 0) {
      lines = lines.map((l) =>
        l.code === "ACA004" ? { ...l, amount: Number((l.amount + osApprox).toFixed(2)) } : l
      );
    }
  } catch {
    const memBills = memoryStore.bills || [];
    const memMrs = (memoryStore as any).moneyReceipts || [];
    const billTotal = memBills.reduce((s: number, b: any) => s + num(b.grandTotal), 0);
    const mrTotal = memMrs.reduce((s: number, m: any) => s + num(m.totalReceived), 0);
    const osApprox = Math.max(0, billTotal - mrTotal);
    if (osApprox > 0) {
      lines = lines.map((l) =>
        l.code === "ACA004" ? { ...l, amount: Number((l.amount + osApprox).toFixed(2)) } : l
      );
    }
  }

  if (branch) {
    lines = lines.filter((l) => l.branch === branch || l.branch === "ALC1");
  }

  const rows: Row[] = [];
  const sourceTotal = buildSection(
    "SOURCE OF FUNDS",
    lines.filter((l) => l.section === "SOURCE"),
    rows
  );
  const applicationTotal = buildSection(
    "APPLICATION OF FUNDS",
    lines.filter((l) => l.section === "APPLICATION"),
    rows
  );

  return NextResponse.json({
    success: true,
    count: rows.length,
    data: rows,
    totals: {
      sourceOfFunds: Number(sourceTotal.toFixed(2)),
      applicationOfFunds: Number(applicationTotal.toFixed(2))
    },
    filters: {
      from: from?.toISOString() || null,
      to: to?.toISOString() || null,
      branch: branch || "--Show All--"
    }
  });
}
