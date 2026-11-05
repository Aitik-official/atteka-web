import { LedgerEntry } from "@/models/LedgerEntry";
import { connectToDatabase } from "@/lib/mongodb";

export const COA = {
  CASH: { code: "CASH", name: "Cash on Hand", group: "Current Assets" },
  HDFC: { code: "HDFC", name: "HDFC Bank Operating A/c", group: "Bank Accounts" },
  DEBTORS: { code: "DEBTORS", name: "Sundry Debtors (Receivables)", group: "Current Assets" },
  CREDITORS: { code: "CREDITORS", name: "Sundry Creditors (Payables)", group: "Current Liabilities" },
  FREIGHT_INC: { code: "FREIGHTINC", name: "Freight Income (Direct)", group: "Direct Revenue" },
  GST_OUTPUT: { code: "GSTOUT", name: "GST Output Tax Payable (18%)", group: "Current Liabilities" },
  GST_INPUT: { code: "GSTIN", name: "GST Input Tax Credit", group: "Current Assets" },
  TDS_REC: { code: "TDSREC", name: "TDS Receivable (Tax Deducted by Customer)", group: "Current Assets" },
  TRIP_EXP: { code: "TRIPEXP", name: "Vehicle & Driver Trip Expense", group: "Direct Expenses" }
};

export async function postConsignmentLedger(cn: {
  cnNumber: string;
  consignorName: string;
  totalFreight: number;
  gstAmount: number;
  grandTotal: number;
  branchCode?: string;
}) {
  try {
    await connectToDatabase();
    const entryNum = `JRN-CN-${cn.cnNumber}`;
    const branch = cn.branchCode || "ALC1";
    const date = new Date();

    // 1. Debit Sundry Debtors with Grand Total
    await LedgerEntry.create({
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "CN",
      referenceId: cn.cnNumber,
      accountCode: COA.DEBTORS.code,
      accountName: `${COA.DEBTORS.name} - ${cn.consignorName}`,
      accountGroup: COA.DEBTORS.group,
      debit: cn.grandTotal,
      credit: 0,
      narration: `Freight booking receivable against CN ${cn.cnNumber}`,
      branchCode: branch
    });

    // 2. Credit Freight Income with taxable freight
    await LedgerEntry.create({
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "CN",
      referenceId: cn.cnNumber,
      accountCode: COA.FREIGHT_INC.code,
      accountName: COA.FREIGHT_INC.name,
      accountGroup: COA.FREIGHT_INC.group,
      debit: 0,
      credit: cn.totalFreight,
      narration: `Direct transport revenue from CN ${cn.cnNumber}`,
      branchCode: branch
    });

    // 3. Credit GST Output Tax with GST amount (if applicable)
    if (cn.gstAmount > 0) {
      await LedgerEntry.create({
        entryNumber: entryNum,
        entryDate: date,
        referenceType: "CN",
        referenceId: cn.cnNumber,
        accountCode: COA.GST_OUTPUT.code,
        accountName: COA.GST_OUTPUT.name,
        accountGroup: COA.GST_OUTPUT.group,
        debit: 0,
        credit: cn.gstAmount,
        narration: `18% GTA Output tax payable on CN ${cn.cnNumber}`,
        branchCode: branch
      });
    }

    return true;
  } catch (err) {
    console.error("Ledger posting error for CN", err);
    return false;
  }
}

export async function postMoneyReceiptLedger(mr: {
  mrNumber: string;
  customerName: string;
  amountReceived: number;
  tdsDeduction?: number;
  mode: string;
  branchCode?: string;
}) {
  try {
    await connectToDatabase();
    const entryNum = `JRN-MR-${mr.mrNumber}`;
    const branch = mr.branchCode || "ALC1";
    const date = new Date();
    const tds = mr.tdsDeduction || 0;
    const totalCredit = mr.amountReceived + tds;

    // 1. Debit Bank or Cash with Amount Received
    const bankOrCash = mr.mode === "CASH" ? COA.CASH : COA.HDFC;
    await LedgerEntry.create({
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "MR",
      referenceId: mr.mrNumber,
      accountCode: bankOrCash.code,
      accountName: bankOrCash.name,
      accountGroup: bankOrCash.group,
      debit: mr.amountReceived,
      credit: 0,
      narration: `Collection received via ${mr.mode} on MR ${mr.mrNumber}`,
      branchCode: branch
    });

    // 2. Debit TDS Receivable if TDS was withheld by customer
    if (tds > 0) {
      await LedgerEntry.create({
        entryNumber: entryNum,
        entryDate: date,
        referenceType: "MR",
        referenceId: mr.mrNumber,
        accountCode: COA.TDS_REC.code,
        accountName: COA.TDS_REC.name,
        accountGroup: COA.TDS_REC.group,
        debit: tds,
        credit: 0,
        narration: `TDS 2% (u/s 194C) deduction claimed on MR ${mr.mrNumber}`,
        branchCode: branch
      });
    }

    // 3. Credit Sundry Debtors
    await LedgerEntry.create({
      entryNumber: entryNum,
      entryDate: date,
      referenceType: "MR",
      referenceId: mr.mrNumber,
      accountCode: COA.DEBTORS.code,
      accountName: `${COA.DEBTORS.name} - ${mr.customerName}`,
      accountGroup: COA.DEBTORS.group,
      debit: 0,
      credit: totalCredit,
      narration: `Account settlement on MR ${mr.mrNumber}`,
      branchCode: branch
    });

    return true;
  } catch (err) {
    console.error("Ledger posting error for MR", err);
    return false;
  }
}
