import { NextRequest, NextResponse } from "next/server";

type Acc = {
  group: string;
  subGroup: string;
  code: string;
  name: string;
  od: number;
  oc: number;
  cd: number;
  cc: number;
};

function closing(od: number, oc: number, cd: number, cc: number) {
  const net = od - oc + cd - cc;
  return {
    closingDebit: net > 0 ? Number(net.toFixed(2)) : 0,
    closingCredit: net < 0 ? Number(Math.abs(net).toFixed(2)) : 0
  };
}

/** Demo chart of accounts — fabricated amounts only (not client production data). */
function demoAccounts(): Acc[] {
  return [
    // ASSETS
    { group: "ASSETS", subGroup: "ADVANCE AGAINST EXPENSES", code: "ALA0001", name: "TRIP ADVANCE", od: 0, oc: 0, cd: 125000, cc: 45000 },
    { group: "ASSETS", subGroup: "ADVANCE AGAINST EXPENSES", code: "ALA0002", name: "FUEL ADVANCE", od: 0, oc: 0, cd: 850000, cc: 120000 },
    { group: "ASSETS", subGroup: "ADVANCE AGAINST EXPENSES", code: "ALA0004", name: "VENDOR FUEL ADVANCE", od: 0, oc: 0, cd: 15000, cc: 0 },
    { group: "ASSETS", subGroup: "ADVANCE AGAINST EXPENSES", code: "ALA0005", name: "TOLL ADVANCE", od: 0, oc: 0, cd: 220000, cc: 15000 },
    { group: "ASSETS", subGroup: "ADVANCE AGAINST EXPENSES", code: "ALA0008", name: "PETRO ADVANCE", od: 0, oc: 0, cd: 8000, cc: 0 },

    { group: "ASSETS", subGroup: "ADVANCE TAXES", code: "CLA0014", name: "TDS ON FREIGHT INCOME", od: 0, oc: 0, cd: 45000, cc: 0 },

    { group: "ASSETS", subGroup: "BANK BALANCES", code: "AFB0051", name: "PRIMARY BANK A/C", od: 0, oc: 0, cd: 350000, cc: 120000 },
    { group: "ASSETS", subGroup: "BANK BALANCES", code: "AFB0047", name: "CURRENT BANK A/C", od: 0, oc: 0, cd: 2100000, cc: 1950000 },
    { group: "ASSETS", subGroup: "BANK BALANCES", code: "AFB0048", name: "OPERATIONS BANK A/C", od: 0, oc: 0, cd: 480000, cc: 410000 },
    { group: "ASSETS", subGroup: "BANK BALANCES", code: "AFB0049", name: "COLLECTION BANK A/C", od: 0, oc: 0, cd: 55000, cc: 5000 },

    { group: "ASSETS", subGroup: "CASH BALANCES", code: "CAS0002", name: "CASH IN HAND", od: 0, oc: 0, cd: 25000, cc: 10000 },

    { group: "ASSETS", subGroup: "CONTAINERS", code: "AFC0022", name: "VEHICLE ASSET - UNIT 1", od: 0, oc: 0, cd: 56000, cc: 0 },
    { group: "ASSETS", subGroup: "CONTAINERS", code: "AFC0009", name: "COMMERCIAL VEHICLE", od: 0, oc: 0, cd: 0, cc: 450000 },

    { group: "ASSETS", subGroup: "CONTROL ACCOUNTS", code: "ACC0006", name: "PAID RECEIVABLE", od: 0, oc: 0, cd: 0, cc: 100000 },
    { group: "ASSETS", subGroup: "CONTROL ACCOUNTS", code: "ACC0001", name: "TO PAY RECEIVABLE", od: 0, oc: 0, cd: 100000, cc: 0 },

    { group: "ASSETS", subGroup: "GOODS SERVICE TAX", code: "GST0002", name: "CENTRAL GST (INPUT CREDIT)", od: 0, oc: 0, cd: 18500, cc: 0 },
    { group: "ASSETS", subGroup: "GOODS SERVICE TAX", code: "GST0003", name: "STATE GST (INPUT CREDIT)", od: 0, oc: 0, cd: 18500, cc: 0 },

    { group: "ASSETS", subGroup: "OFFICE EQUIPMENTS", code: "AFO0001", name: "MOBILE/TELEPHONE EQUIPMENTS", od: 0, oc: 0, cd: 40000, cc: 0 },
    { group: "ASSETS", subGroup: "OFFICE EQUIPMENTS", code: "AFO0003", name: "MOBILE HANDSET", od: 0, oc: 0, cd: 20000, cc: 0 },

    { group: "ASSETS", subGroup: "OTHER ADVANCES", code: "ACA0029", name: "PREPAID INSURANCE", od: 0, oc: 0, cd: 35000, cc: 0 },

    { group: "ASSETS", subGroup: "STOCK IN HAND", code: "SIH0001", name: "TYRES & TUBES", od: 0, oc: 0, cd: 185000, cc: 42000 },
    { group: "ASSETS", subGroup: "STOCK IN HAND", code: "SIH0005", name: "BATTERIES", od: 0, oc: 0, cd: 7300, cc: 0 },
    { group: "ASSETS", subGroup: "STOCK IN HAND", code: "SIH0006", name: "SPARE PARTS", od: 0, oc: 0, cd: 4900, cc: 0 },

    { group: "ASSETS", subGroup: "SUNDRY DEBTORS CONTROL ACCOUNTS", code: "P000001", name: "DEMO CUSTOMER ALPHA PVT LTD", od: 0, oc: 0, cd: 1250000, cc: 980000 },
    { group: "ASSETS", subGroup: "SUNDRY DEBTORS CONTROL ACCOUNTS", code: "P000002", name: "DEMO CUSTOMER BETA LLP", od: 0, oc: 0, cd: 85000, cc: 85000 },
    { group: "ASSETS", subGroup: "SUNDRY DEBTORS CONTROL ACCOUNTS", code: "P000003", name: "DEMO CUSTOMER GAMMA LTD", od: 0, oc: 0, cd: 210000, cc: 150000 },

    // EXPENSE
    { group: "EXPENSE", subGroup: "DIRECT EXPENSES", code: "DEX0015", name: "DRIVER SALARY", od: 0, oc: 0, cd: 1700, cc: 0 },
    { group: "EXPENSE", subGroup: "FINANCIAL COST", code: "ADM0006", name: "BANK CHARGES", od: 0, oc: 0, cd: 12000, cc: 0 },
    { group: "EXPENSE", subGroup: "FINANCIAL COST", code: "FIN0010", name: "INTEREST ON LOAN (EXPENSE)", od: 0, oc: 0, cd: 18000, cc: 0 },
    { group: "EXPENSE", subGroup: "INDIRECT EXPENSES", code: "IND0008", name: "LOAN PROCESSING CHARGES", od: 0, oc: 0, cd: 25000, cc: 0 },
    { group: "EXPENSE", subGroup: "INDIRECT EXPENSES", code: "MIS0002", name: "OTHER EXPENSES", od: 0, oc: 0, cd: 42000, cc: 0 },
    { group: "EXPENSE", subGroup: "OFFICE & ADMIN EXPENSES", code: "EXP0001", name: "OFFICE EXPENCE", od: 0, oc: 0, cd: 18500, cc: 0 },
    { group: "EXPENSE", subGroup: "OPERATING EXPENSES - CCFF", code: "EOC0063", name: "SERVICE CHARGE", od: 0, oc: 0, cd: 55000, cc: 0 },
    { group: "EXPENSE", subGroup: "OPERATING EXPENSES - CCFF", code: "EOC0033", name: "DOCUMENT CHARGES", od: 0, oc: 0, cd: 8000, cc: 0 },
    { group: "EXPENSE", subGroup: "OTHER EXPENSES", code: "OOC0017", name: "TOLL TAX & PARKING CHARGES", od: 0, oc: 0, cd: 4500, cc: 0 },
    { group: "EXPENSE", subGroup: "OTHER OPERATING EXPENSES", code: "OOC0030", name: "DRIVER INCENTIVE", od: 0, oc: 0, cd: 12000, cc: 0 },
    { group: "EXPENSE", subGroup: "OTHER OPERATING EXPENSES", code: "EOC0088", name: "COURIER CHARGES", od: 0, oc: 0, cd: 6500, cc: 0 },
    { group: "EXPENSE", subGroup: "PERSONNEL COST", code: "EPC0001", name: "SALARY (BASIC)", od: 0, oc: 0, cd: 171000, cc: 0 },
    { group: "EXPENSE", subGroup: "PERSONNEL COST", code: "EPC0035", name: "INSURANCE", od: 0, oc: 0, cd: 48000, cc: 0 },
    { group: "EXPENSE", subGroup: "REPAIRS & MAINTENANCE", code: "ADM0036", name: "COMPUTER EXPENSES", od: 0, oc: 0, cd: 15000, cc: 0 },
    { group: "EXPENSE", subGroup: "VEHICLE OPERATION COST", code: "VOC0013", name: "ENROUTE EXPENSES", od: 0, oc: 0, cd: 22000, cc: 0 },
    { group: "EXPENSE", subGroup: "VEHICLE OPERATION COST", code: "VOC0017", name: "BATTERY EXPENSES", od: 0, oc: 0, cd: 7500, cc: 0 },
    { group: "EXPENSE", subGroup: "VEHICLE OPERATION COST", code: "VOC0010", name: "REPAIR & MAINTENANCE VEHICLE", od: 0, oc: 0, cd: 185000, cc: 0 },
    { group: "EXPENSE", subGroup: "VEHICLE OPERATION COST", code: "VOC0007", name: "DIESEL EXPENSES", od: 0, oc: 0, cd: 95000, cc: 0 },
    { group: "EXPENSE", subGroup: "VEHICLE OPERATION COST", code: "OTH0010", name: "TOLL EXPENSES", od: 0, oc: 0, cd: 20000, cc: 5000 },
    { group: "EXPENSE", subGroup: "VEHICLE OPERATION COST", code: "VOC0003", name: "SPARE PARTS EXPENSE", od: 0, oc: 0, cd: 14000, cc: 0 },
    { group: "EXPENSE", subGroup: "VEHICLE OPERATION COST", code: "VOC0004", name: "TYRES & TUBES EXPENSES", od: 0, oc: 0, cd: 48000, cc: 0 },
    { group: "EXPENSE", subGroup: "VEHICLE OPERATION COST", code: "VOC0005", name: "VEHICLE GOODS TAX", od: 0, oc: 0, cd: 12000, cc: 0 },

    // INCOME
    { group: "INCOME", subGroup: "NON-OPERATING INCOME", code: "CLA0009", name: "INSURANCE CLAIM RECEIVABLE", od: 0, oc: 0, cd: 0, cc: 15000 },
    { group: "INCOME", subGroup: "NON-OPERATING INCOME", code: "IOT0007", name: "MISCELLANEOUS INCOME - OTHER", od: 0, oc: 0, cd: 0, cc: 12500 },
    { group: "INCOME", subGroup: "OPERATING INCOME", code: "IOI0115", name: "VEHICLE DEMOBILIZATION", od: 0, oc: 0, cd: 0, cc: 20000 },
    { group: "INCOME", subGroup: "OPERATING INCOME", code: "IOI0003", name: "FREIGHT INCOME(CN BOOKING - TBB )", od: 0, oc: 0, cd: 50000, cc: 2850000 },
    { group: "INCOME", subGroup: "OPERATING INCOME", code: "IOI0114", name: "AIRPORT RETRIEVAL CHARGES", od: 0, oc: 0, cd: 170, cc: 0 },
    { group: "INCOME", subGroup: "OPERATING INCOME", code: "IOI0026", name: "OTHER CHARGES (INCOME)", od: 0, oc: 0, cd: 0, cc: 2500 },

    // LIABILITIES
    { group: "LIABILITIES", subGroup: "CAPITAL A/C-PROPRIETOR", code: "PCA0001", name: "PROPRIETOR CAPITAL A/C", od: 0, oc: 0, cd: 8000, cc: 0 },
    { group: "LIABILITIES", subGroup: "GOODS AND SERVICES TAX", code: "GST0004", name: "CENTRAL GST PAYABLE", od: 0, oc: 0, cd: 12000, cc: 185000 },
    { group: "LIABILITIES", subGroup: "GOODS AND SERVICES TAX", code: "GST0005", name: "STATE GST PAYABLE", od: 0, oc: 0, cd: 15000, cc: 185000 },
    { group: "LIABILITIES", subGroup: "GOODS AND SERVICES TAX", code: "GST0006", name: "INTEGRATED GST PAYABLE", od: 0, oc: 0, cd: 3000, cc: 28000 },
    { group: "LIABILITIES", subGroup: "HIRE PURCHSE LOAN", code: "LSH0001", name: "VEHICLE LOAN - BANK A", od: 0, oc: 0, cd: 185000, cc: 45000 },
    { group: "LIABILITIES", subGroup: "HIRE PURCHSE LOAN", code: "LSH0002", name: "VEHICLE LOAN - BANK B", od: 0, oc: 0, cd: 162000, cc: 38000 },
    { group: "LIABILITIES", subGroup: "HIRE PURCHSE LOAN", code: "LSH0003", name: "VEHICLE LOAN - NBFC", od: 0, oc: 0, cd: 98000, cc: 22000 },
    { group: "LIABILITIES", subGroup: "LIABILITY FOR OTHERS", code: "CLO0061", name: "GST PAYABLE CLEARING", od: 0, oc: 0, cd: 125000, cc: 0 },
    { group: "LIABILITIES", subGroup: "LIABILITY FOR OTHERS", code: "CLO0049", name: "MOBILE CHARGES PAYABLE", od: 0, oc: 0, cd: 555, cc: 0 },
    { group: "LIABILITIES", subGroup: "LOANS FROM OTHERS", code: "LUL0005", name: "INTER-COMPANY LOAN", od: 0, oc: 0, cd: 50000, cc: 280000 },
    { group: "LIABILITIES", subGroup: "SUNDRY CREDITORS", code: "V00001", name: "DEMO VENDOR FUEL CO", od: 0, oc: 0, cd: 450000, cc: 450000 },
    { group: "LIABILITIES", subGroup: "SUNDRY CREDITORS", code: "V00002", name: "DEMO VENDOR PARTS", od: 0, oc: 0, cd: 85000, cc: 85000 },
    { group: "LIABILITIES", subGroup: "SUNDRY CREDITORS", code: "V00003", name: "DEMO VENDOR SERVICES", od: 0, oc: 0, cd: 32000, cc: 32000 },
    { group: "LIABILITIES", subGroup: "SUNDRY CREDITORS", code: "LCL0004", name: "S.CREDITORS-OTHERS", od: 0, oc: 0, cd: 210000, cc: 210000 },
    { group: "LIABILITIES", subGroup: "WORKING CAPITAL LOAN", code: "LSW0003", name: "WORKING CAPITAL - LENDER A", od: 0, oc: 0, cd: 95000, cc: 25000 },
    { group: "LIABILITIES", subGroup: "WORKING CAPITAL LOAN", code: "LSW0004", name: "WORKING CAPITAL - LENDER B", od: 0, oc: 0, cd: 88000, cc: 30000 }
  ];
}

function extractBranch(raw: string) {
  const t = raw.replace(/^-+|-+$/g, "").trim();
  if (!t || /show all/i.test(t) || /^select$/i.test(t)) return "";
  return (t.includes(" - ") ? t.split(" - ").pop()! : t).trim().toUpperCase();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fy = (searchParams.get("fy") || "").trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const branch = extractBranch(searchParams.get("branch") || "");
  const transactionMode = (searchParams.get("transactionMode") || "").trim();

  let accounts = demoAccounts();

  // Transaction mode adjusts which columns are meaningful (demo behaviour)
  if (/opening only/i.test(transactionMode)) {
    accounts = accounts.map((a) => ({ ...a, cd: 0, cc: 0 }));
  } else if (/current only/i.test(transactionMode)) {
    accounts = accounts.map((a) => ({ ...a, od: 0, oc: 0 }));
  }

  type Row = {
    group: string;
    subGroup: string;
    accountName: string;
    accountCode: string;
    openingDebit: number;
    openingCredit: number;
    currentDebit: number;
    currentCredit: number;
    closingDebit: number;
    closingCredit: number;
    isSubTotal?: boolean;
    isDiff?: boolean;
    isGrandTotal?: boolean;
  };

  const rows: Row[] = [];
  const bySub = new Map<string, Acc[]>();
  for (const a of accounts) {
    const key = `${a.group}||${a.subGroup}`;
    const list = bySub.get(key) || [];
    list.push(a);
    bySub.set(key, list);
  }

  const grand = { od: 0, oc: 0, cd: 0, cc: 0, cld: 0, clc: 0 };

  for (const [, list] of bySub) {
    const sub = { od: 0, oc: 0, cd: 0, cc: 0, cld: 0, clc: 0 };
    list.forEach((a, idx) => {
      const cl = closing(a.od, a.oc, a.cd, a.cc);
      rows.push({
        group: idx === 0 ? a.group : "",
        subGroup: idx === 0 ? a.subGroup : "",
        accountName: `${a.code} - ${a.name}`,
        accountCode: a.code,
        openingDebit: a.od,
        openingCredit: a.oc,
        currentDebit: a.cd,
        currentCredit: a.cc,
        closingDebit: cl.closingDebit,
        closingCredit: cl.closingCredit
      });
      sub.od += a.od;
      sub.oc += a.oc;
      sub.cd += a.cd;
      sub.cc += a.cc;
      sub.cld += cl.closingDebit;
      sub.clc += cl.closingCredit;
    });
    const first = list[0];
    rows.push({
      group: "",
      subGroup: "",
      accountName: `Total ${first.subGroup}`,
      accountCode: "",
      openingDebit: Number(sub.od.toFixed(2)),
      openingCredit: Number(sub.oc.toFixed(2)),
      currentDebit: Number(sub.cd.toFixed(2)),
      currentCredit: Number(sub.cc.toFixed(2)),
      closingDebit: Number(sub.cld.toFixed(2)),
      closingCredit: Number(sub.clc.toFixed(2)),
      isSubTotal: true
    });
    grand.od += sub.od;
    grand.oc += sub.oc;
    grand.cd += sub.cd;
    grand.cc += sub.cc;
    grand.cld += sub.cld;
    grand.clc += sub.clc;
  }

  const diffCd = Number(Math.max(0, grand.cc - grand.cd).toFixed(2));
  const diffCc = Number(Math.max(0, grand.cd - grand.cc).toFixed(2));
  const diffCld = Number(Math.max(0, grand.clc - grand.cld).toFixed(2));
  const diffClc = Number(Math.max(0, grand.cld - grand.clc).toFixed(2));

  // Keep a small balancing line like WCV "Diff in Balances"
  rows.push({
    group: "",
    subGroup: "",
    accountName: "Diff in Balances",
    accountCode: "",
    openingDebit: 0,
    openingCredit: 0,
    currentDebit: diffCd || 1050,
    currentCredit: diffCc,
    closingDebit: diffCld || 1050,
    closingCredit: diffClc,
    isDiff: true
  });

  grand.cd += diffCd || 1050;
  grand.cld += diffCld || 1050;

  rows.push({
    group: "",
    subGroup: "",
    accountName: "Total",
    accountCode: "",
    openingDebit: Number(grand.od.toFixed(2)),
    openingCredit: Number(grand.oc.toFixed(2)),
    currentDebit: Number(grand.cd.toFixed(2)),
    currentCredit: Number(grand.cc.toFixed(2)),
    closingDebit: Number(grand.cld.toFixed(2)),
    closingCredit: Number(grand.clc.toFixed(2)),
    isGrandTotal: true
  });

  return NextResponse.json({
    success: true,
    count: rows.filter((r) => !r.isSubTotal && !r.isDiff && !r.isGrandTotal).length,
    data: rows,
    filters: {
      fy: fy || null,
      from,
      to,
      branch: branch || "--Show All--",
      transactionMode: transactionMode || "Opening & Closing with Current Transaction"
    }
  });
}
