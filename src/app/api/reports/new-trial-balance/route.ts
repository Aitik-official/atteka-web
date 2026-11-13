import { NextRequest, NextResponse } from "next/server";
import { buildTrialBalanceFromLedger, type TrialBalanceAccount } from "@/lib/booksEngine";

type Acc = TrialBalanceAccount;

function closing(od: number, oc: number, cd: number, cc: number) {
  const net = od - oc + cd - cc;
  return {
    closingDebit: net > 0 ? Number(net.toFixed(2)) : 0,
    closingCredit: net < 0 ? Number(Math.abs(net).toFixed(2)) : 0
  };
}

function extractBranch(raw: string) {
  const t = raw.replace(/^-+|-+$/g, "").trim();
  if (!t || /show all/i.test(t) || /^select$/i.test(t)) return "";
  return (t.includes(" - ") ? t.split(" - ").pop()! : t).trim().toUpperCase();
}

function buildRows(accounts: Acc[]) {
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

  if (diffCd || diffCc || diffCld || diffClc) {
    rows.push({
      group: "",
      subGroup: "",
      accountName: "Diff in Balances",
      accountCode: "",
      openingDebit: 0,
      openingCredit: 0,
      currentDebit: diffCd,
      currentCredit: diffCc,
      closingDebit: diffCld,
      closingCredit: diffClc,
      isDiff: true
    });
    grand.cd += diffCd;
    grand.cc += diffCc;
    grand.cld += diffCld;
    grand.clc += diffClc;
  }

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

  return rows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fy = (searchParams.get("fy") || "").trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const branch = extractBranch(searchParams.get("branch") || "");
  const transactionMode = (searchParams.get("transactionMode") || "").trim();
  const forceDemo = searchParams.get("demo") === "1";

  const ledger = forceDemo
    ? { accounts: [] as Acc[], source: "empty" as const, count: 0 }
    : await buildTrialBalanceFromLedger({ from, to, branch });

  let accounts = ledger.accounts;
  let source: "ledger" | "empty" | "demo-empty" = ledger.source === "ledger" ? "ledger" : "empty";

  if (!accounts.length) {
    // Honest empty TB — do not inject fabricated COA when no posts exist
    source = "demo-empty";
    accounts = [];
  }

  if (/opening only/i.test(transactionMode)) {
    accounts = accounts.map((a) => ({ ...a, cd: 0, cc: 0 }));
  } else if (/current only/i.test(transactionMode)) {
    accounts = accounts.map((a) => ({ ...a, od: 0, oc: 0 }));
  }

  const rows = accounts.length
    ? buildRows(accounts)
    : [
        {
          group: "",
          subGroup: "",
          accountName: "No ledger posts yet — generate a Bill and MR to populate Trial Balance",
          accountCode: "",
          openingDebit: 0,
          openingCredit: 0,
          currentDebit: 0,
          currentCredit: 0,
          closingDebit: 0,
          closingCredit: 0,
          isDiff: true
        },
        {
          group: "",
          subGroup: "",
          accountName: "Total",
          accountCode: "",
          openingDebit: 0,
          openingCredit: 0,
          currentDebit: 0,
          currentCredit: 0,
          closingDebit: 0,
          closingCredit: 0,
          isGrandTotal: true
        }
      ];

  return NextResponse.json({
    success: true,
    count: rows.filter((r: any) => !r.isSubTotal && !r.isDiff && !r.isGrandTotal).length,
    data: rows,
    source,
    ledgerEntryCount: ledger.count,
    filters: {
      fy: fy || null,
      from,
      to,
      branch: branch || "--Show All--",
      transactionMode: transactionMode || "Opening & Closing with Current Transaction"
    },
    message:
      source === "ledger"
        ? "Trial Balance from LedgerEntry posts (Bill + MR)"
        : "No real ledger posts yet — empty TB (not fabricated demo figures)"
  });
}
