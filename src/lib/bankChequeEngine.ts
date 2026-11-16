import { connectToDatabase } from "@/lib/mongodb";
import { FinanceCheque } from "@/models/FinanceCheque";
import { ChequeBook } from "@/models/ChequeBook";
import { BankStatementLine } from "@/models/BankStatementLine";
import { OnlinePayment } from "@/models/OnlinePayment";
import { PrintJob, PrintJobKind } from "@/models/PrintJob";
import { BankOperation } from "@/models/BankOperation";
import { bankService } from "@/services/bankService";

function toIso(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function toLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const BANK_CHEQUE_MASTERS = {
  locations: ["ALC1", "ALC2", "PUNE", "NASHIK"],
  banks: ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "INDUSIND BANK"],
  bankAccounts: [
    { code: "INDB-201002938471", label: "INDUSIND BANK - 201002938471", bank: "INDUSIND BANK", accountNo: "201002938471" },
    { code: "HDFC-502000112233", label: "HDFC BANK - 502000112233", bank: "HDFC BANK", accountNo: "502000112233" },
    { code: "ICIC-628901234567", label: "ICICI BANK - 628901234567", bank: "ICICI BANK", accountNo: "628901234567" },
    { code: "SBIN-30123456789", label: "SBI - 30123456789", bank: "SBI", accountNo: "30123456789" }
  ],
  chequeBookAccounts: [
    "HDFC Bank - Ops · ****4521",
    "ICICI Bank - Current · ****8830",
    "SBI - Collection · ****1102",
    "Axis Bank - Payments · ****7744"
  ],
  customers: [
    { code: "CUS0001", name: "NORTHBOUND FREIGHT PVT LTD" },
    { code: "CUS0002", name: "COASTAL CARGO SOLUTIONS" },
    { code: "CUS0003", name: "METRO LOGISTICS PARTNERS" },
    { code: "CUS0004", name: "GATEWAY DISTRIBUTION CO" }
  ]
};

async function ensureChequeSeeds() {
  await connectToDatabase();
  const count = await FinanceCheque.countDocuments();
  if (count >= 8) return;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < 10; i++) {
    const iso = addDays(today, -((i % 8) + 1));
    const cust = BANK_CHEQUE_MASTERS.customers[i % BANK_CHEQUE_MASTERS.customers.length];
    try {
      await FinanceCheque.create({
        chequeNo: `CHQ${String(26120000 + i)}`,
        chequeDate: new Date(iso),
        amount: Number((8500 + (i % 6) * 1250 + (i % 4) * 175.5).toFixed(2)),
        bankName: BANK_CHEQUE_MASTERS.banks[i % BANK_CHEQUE_MASTERS.banks.length],
        customerCode: cust.code,
        customerName: cust.name,
        receivedFrom: `${cust.code} - ${cust.name}`,
        entryLocation: BANK_CHEQUE_MASTERS.locations[i % BANK_CHEQUE_MASTERS.locations.length],
        narration: "Seed on-account cheque",
        status: "Pending"
      });
    } catch {
      /* duplicate ok */
    }
  }
}

async function ensureStatementSeeds() {
  await connectToDatabase();
  const count = await BankStatementLine.countDocuments();
  if (count >= 8) return;
  const today = new Date().toISOString().slice(0, 10);
  const seeds = [
    { n: "NEFT IN - FREIGHT COLLECTION NORTH ZONE", ref: "INDB2611040001", debit: 0, credit: 185000, bal: 1420500 },
    { n: "NEFT OUT - SHREE TRANSPORT CO FREIGHT", ref: "INDB2611050012", debit: 48500, credit: 0, bal: 1372000 },
    { n: "RTGS OUT - MEHTA FUELS PVT LTD", ref: "RTGS261106008", debit: 156750.5, credit: 0, bal: 1215249.5 },
    { n: "IMPS OUT - DRIVER ADVANCE RAJESH KUMAR", ref: "IMPS2611070012", debit: 12000, credit: 0, bal: 1203249.5 },
    { n: "CMS CHQ CLG - PATEL ROADLINES", ref: "CMS2611080044", debit: 0, credit: 63200, bal: 1266449.5 },
    { n: "CHQ DEPOSIT - ON ACCOUNT CUS0001", ref: "CHQ26120000", debit: 0, credit: 9750, bal: 1276199.5 },
    { n: "BANK CHARGES", ref: "CHG26111001", debit: 295, credit: 0, bal: 1275904.5 },
    { n: "NEFT IN - CUSTOMER COLLECTION", ref: "INDB2611110009", debit: 0, credit: 42000, bal: 1317904.5 }
  ];
  for (let i = 0; i < seeds.length; i++) {
    const iso = addDays(today, -(seeds.length - i));
    const s = seeds[i];
    try {
      await BankStatementLine.create({
        lineId: `BS-SEED-${i + 1}`,
        channel: "MANUAL",
        bank: "INDUSIND BANK",
        accountNo: "201002938471",
        txnDate: new Date(iso),
        valueDate: new Date(iso),
        narration: s.n,
        chqRefNo: s.ref,
        debit: s.debit,
        credit: s.credit,
        balance: s.bal,
        voucherNo: s.debit > 0 ? `BPV/ALC1/26${String(100 + i).slice(-3)}` : `BRV/ALC1/26${String(100 + i).slice(-3)}`,
        docNo: `DOC${26000 + i}`,
        status: "Posted"
      });
    } catch {
      /* duplicate ok */
    }
  }
}

async function ensureOnlinePaymentSeeds() {
  await connectToDatabase();
  const count = await OnlinePayment.countDocuments();
  if (count >= 8) return;
  const today = new Date().toISOString().slice(0, 10);
  const seeds = [
    { voucherNo: "BPV/ALC1/26001", type: "F-Pay", paidTo: "SHREE TRANSPORT CO", vendorCode: "VND1002", amount: 48500, mode: "NEFT", doc: "THC88421", status: "Pending" as const },
    { voucherNo: "BPV/ALC1/26002", type: "A-Pay", paidTo: "RAJESH KUMAR", vendorCode: "VND1003", amount: 12000, mode: "IMPS", doc: "ADV3108", status: "Pending" as const },
    { voucherNo: "BPV/ALC1/26003", type: "B-Pay", paidTo: "MEHTA FUELS PVT LTD", vendorCode: "VND1004", amount: 156750.5, mode: "RTGS", doc: "BILL99210", status: "Pending" as const },
    { voucherNo: "BPV/ALC1/26004", type: "O-Pay", paidTo: "OFFICE MART SUPPLIES", vendorCode: "VND1005", amount: 8450, mode: "NEFT", doc: "OPS7711", status: "Pending" as const },
    { voucherNo: "BPV/ALC1/26005", type: "Fleet", paidTo: "AUTOCARE GARAGE", vendorCode: "VND1006", amount: 22400, mode: "NEFT", doc: "FLT2201", status: "Pending" as const },
    { voucherNo: "BPV/ALC1/26006", type: "Salary", paidTo: "STAFF PAYROLL", vendorCode: "PAY001", amount: 285000, mode: "NEFT", doc: "SAL1101", status: "Approved" as const },
    { voucherNo: "BPV/ALC1/26007", type: "F-Pay", paidTo: "PATEL ROADLINES", vendorCode: "VND1001", amount: 63200, mode: "NEFT", doc: "MR24112", status: "Success" as const },
    { voucherNo: "BPV/ALC1/26008", type: "F-Pay", paidTo: "GATEWAY HAULERS", vendorCode: "VND1007", amount: 31800, mode: "NEFT", doc: "THC88501", status: "Failed" as const },
    { voucherNo: "BPV/ALC1/26009", type: "B-Pay", paidTo: "COASTAL FUEL AGENCY", vendorCode: "VND0003", amount: 74200, mode: "RTGS", doc: "BILL99301", status: "Success" as const },
    { voucherNo: "BPV/ALC1/26010", type: "F-Pay", paidTo: "METRO TYRE SUPPLIES", vendorCode: "VND0002", amount: 15600, mode: "NEFT", doc: "INV9911", status: "Reversed" as const }
  ];
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i];
    const iso = addDays(today, -(i + 1));
    try {
      await OnlinePayment.create({
        paymentId: `H2H-${1001 + i}`,
        voucherNo: s.voucherNo,
        voucherDate: new Date(iso),
        documentNo: s.doc,
        paymentType: s.type,
        projectName: `${s.type} settlement`,
        paidTo: s.paidTo,
        vendorCode: s.vendorCode,
        vendorName: s.paidTo,
        amount: s.amount,
        expense: s.amount,
        bankName: "INDUSIND BANK",
        acNoIfsc: "201002938471 - INDB0000001",
        paymentMode: s.mode,
        utrRef: s.status === "Success" || s.status === "Approved" ? `INDB${iso.replace(/-/g, "").slice(2)}${String(i).padStart(3, "0")}` : "",
        status: s.status,
        entryBy: i % 2 === 0 ? "AL002" : "AL015",
        narration: `Being ${s.type} against ${s.doc}`,
        batchFileName: i % 3 === 0 ? `ateka_6_${iso.replace(/-/g, "").slice(2)}_001` : "",
        ageingDays: i + 1
      });
    } catch {
      /* duplicate ok */
    }
  }
}

function mapCheque(v: any) {
  const iso = toIso(v.chequeDate);
  return {
    id: String(v._id),
    chequeNo: v.chequeNo,
    chequeDate: toLabel(iso),
    chequeDateIso: iso,
    entryLocation: v.entryLocation || "ALC1",
    customerCode: v.customerCode || "",
    customerName: v.customerName || v.receivedFrom || "",
    bankName: v.bankName || "",
    bankBranch: v.bankBranch || "",
    amount: Number(v.amount || 0),
    status: v.status || "Pending",
    narration: v.narration || "",
    receivedFrom: v.receivedFrom || "",
    depositSlipNo: v.depositSlipNo || "",
    depositedAt: v.depositedAt ? toIso(v.depositedAt) : ""
  };
}

export async function saveOnAccountChequeReceipt(input: {
  chequeUtrNo: string;
  chequeUtrDate?: string;
  amount: number;
  bankName?: string;
  bankBranch?: string;
  receivedFrom?: string;
  customerName?: string;
  narration?: string;
  chequeReceivedAt?: string;
  entryLocation?: string;
  entryBy?: string;
}) {
  await ensureChequeSeeds();
  const chequeNo = String(input.chequeUtrNo || "").trim().toUpperCase();
  if (!chequeNo) throw Object.assign(new Error("Enter Cheque / UTR number"), { status: 400 });
  if (!Number(input.amount) || Number(input.amount) <= 0) {
    throw Object.assign(new Error("Enter Amount"), { status: 400 });
  }
  const party = String(input.receivedFrom || input.customerName || "").trim();
  if (!party) throw Object.assign(new Error("Select Received From or enter Customer Name"), { status: 400 });

  const codeMatch = party.match(/^([A-Z0-9]+)\s*-/i);
  const doc = await FinanceCheque.create({
    chequeNo,
    chequeDate: input.chequeUtrDate ? new Date(input.chequeUtrDate) : new Date(),
    amount: Number(input.amount),
    bankName: input.bankName || "",
    bankBranch: input.bankBranch || "",
    receivedFrom: party,
    customerCode: codeMatch?.[1]?.toUpperCase() || "",
    customerName: input.customerName || party,
    entryLocation: input.entryLocation || input.chequeReceivedAt || "ALC1",
    narration: input.narration || "",
    chequeReceivedAt: input.chequeReceivedAt || "",
    status: "Pending",
    entryBy: input.entryBy || "AL002",
    payload: input
  });
  return mapCheque(doc);
}

export async function assignChequeBook(input: {
  entryLocation: string;
  bankAc: string;
  fromSrNo: number;
  toSrNo: number;
  dateOfIssue?: string;
  issuedBy?: string;
}) {
  await connectToDatabase();
  const from = Number(input.fromSrNo);
  const to = Number(input.toSrNo);
  if (!input.entryLocation) throw Object.assign(new Error("Select Entry Location"), { status: 400 });
  if (!input.bankAc) throw Object.assign(new Error("Select Bank A/C"), { status: 400 });
  if (!from || !to || to < from) throw Object.assign(new Error("Enter valid From / To Sr.No"), { status: 400 });
  const leafCount = to - from + 1;
  const bookNo = `CB${input.entryLocation}${Date.now().toString().slice(-8)}`.toUpperCase();
  const doc = await ChequeBook.create({
    bookNo,
    entryLocation: input.entryLocation,
    bankAc: input.bankAc,
    fromSrNo: from,
    toSrNo: to,
    leafCount,
    dateOfIssue: input.dateOfIssue ? new Date(input.dateOfIssue) : new Date(),
    status: "Issued",
    issuedBy: input.issuedBy || "AL002",
    payload: input
  });
  return {
    bookNo: doc.bookNo,
    entryLocation: doc.entryLocation,
    bankAc: doc.bankAc,
    fromSrNo: doc.fromSrNo,
    toSrNo: doc.toSrNo,
    leafCount: doc.leafCount,
    dateOfIssue: toIso(doc.dateOfIssue),
    status: doc.status,
    message: `Cheque book issued ${from}–${to} (${leafCount} leaves) at ${doc.entryLocation}`
  };
}

export async function listChequesForDeposit(filters: {
  from?: string;
  to?: string;
  location?: string;
  customerCode?: string;
  chequeNumber?: string;
  includeDeposited?: boolean;
}) {
  await ensureChequeSeeds();
  const clauses: any[] = [];
  if (!filters.includeDeposited) clauses.push({ status: "Pending" });
  if (filters.from || filters.to) {
    const range: any = {};
    if (filters.from) range.$gte = new Date(filters.from);
    if (filters.to) range.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    clauses.push({ chequeDate: range });
  }
  if (filters.location && filters.location !== "--Show All--") {
    clauses.push({ entryLocation: filters.location });
  }
  if (filters.customerCode) {
    clauses.push({ customerCode: { $regex: filters.customerCode, $options: "i" } });
  }
  if (filters.chequeNumber) {
    clauses.push({ chequeNo: { $regex: filters.chequeNumber, $options: "i" } });
  }
  const rows = await FinanceCheque.find(clauses.length ? { $and: clauses } : {})
    .sort({ chequeDate: -1 })
    .limit(200);
  return rows.map(mapCheque);
}

export async function depositCheques(chequeNos: string[], entryBy?: string) {
  await ensureChequeSeeds();
  const nos = (chequeNos || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean);
  if (!nos.length) throw Object.assign(new Error("Select at least one cheque"), { status: 400 });
  const slipNo = `DEP${Date.now().toString().slice(-8)}`;
  const result = await FinanceCheque.updateMany(
    { chequeNo: { $in: nos }, status: "Pending" },
    {
      $set: {
        status: "Deposited",
        depositedAt: new Date(),
        depositSlipNo: slipNo,
        entryBy: entryBy || "AL002"
      }
    }
  );
  return {
    slipNo,
    matched: result.matchedCount,
    modified: result.modifiedCount,
    message: `${result.modifiedCount} cheque(s) deposited · slip ${slipNo}`
  };
}

function mapStatement(v: any) {
  const iso = toIso(v.txnDate);
  const valueIso = toIso(v.valueDate) || iso;
  return {
    id: v.lineId || String(v._id),
    date: iso,
    narration: v.narration || "",
    chqRefNo: v.chqRefNo || "",
    valueDt: valueIso,
    withdrawalAmt: Number(v.debit || 0),
    depositAmt: Number(v.credit || 0),
    closingBalance: Number(v.balance || 0),
    voucherNo: v.voucherNo || "",
    docNo: v.docNo || "",
    debit: Number(v.debit || 0),
    credit: Number(v.credit || 0),
    bank: v.bank || "",
    accountNo: v.accountNo || "",
    txnDate: iso,
    valueDate: valueIso,
    refNo: v.chqRefNo || "",
    description: v.narration || "",
    balance: Number(v.balance || 0),
    channel: v.channel === "API" ? inferChannel(v.narration) : v.channel || "MANUAL",
    status: v.status || "Posted"
  };
}

function inferChannel(narration: string) {
  const n = (narration || "").toUpperCase();
  if (n.includes("RTGS")) return "RTGS";
  if (n.includes("IMPS")) return "IMPS";
  if (n.includes("CHQ") || n.includes("CHEQUE") || n.includes("CMS")) return "CHEQUE";
  if (n.includes("NEFT")) return "NEFT";
  return "API";
}

export async function listBankStatement(filters: {
  from?: string;
  to?: string;
  bank?: string;
  accountNo?: string;
  channel?: "MANUAL" | "IMPORT" | "API" | string;
}) {
  await ensureStatementSeeds();
  const clauses: any[] = [];
  if (filters.from || filters.to) {
    const range: any = {};
    if (filters.from) range.$gte = new Date(filters.from);
    if (filters.to) range.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    clauses.push({ txnDate: range });
  }
  if (filters.bank) clauses.push({ bank: { $regex: filters.bank, $options: "i" } });
  if (filters.accountNo) clauses.push({ accountNo: filters.accountNo });
  if (filters.channel === "API") clauses.push({ channel: "API" });
  else if (filters.channel === "IMPORT") clauses.push({ channel: "IMPORT" });
  else if (filters.channel === "MANUAL") clauses.push({ channel: { $in: ["MANUAL", "IMPORT"] } });

  const rows = await BankStatementLine.find(clauses.length ? { $and: clauses } : {})
    .sort({ txnDate: -1 })
    .limit(400);
  return rows.map(mapStatement);
}

export async function importBankStatement(opts?: { bank?: string; accountNo?: string; note?: string }) {
  await ensureStatementSeeds();
  const batchId = `IMP${Date.now().toString().slice(-8)}`;
  const today = new Date().toISOString().slice(0, 10);
  const bank = opts?.bank || "INDUSIND BANK";
  const accountNo = opts?.accountNo || "201002938471";
  const lines = [
    { n: "IMPORT NEFT CR - COLLECTION", ref: `IMP${batchId}01`, debit: 0, credit: 25000, bal: 1342904.5 },
    { n: "IMPORT NEFT DR - VENDOR PAY", ref: `IMP${batchId}02`, debit: 8500, credit: 0, bal: 1334404.5 },
    { n: "IMPORT CHQ CLG", ref: `IMP${batchId}03`, debit: 0, credit: 11200, bal: 1345604.5 }
  ];
  const created = [];
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i];
    const doc = await BankStatementLine.create({
      lineId: `${batchId}-${i + 1}`,
      channel: "IMPORT",
      bank,
      accountNo,
      txnDate: new Date(today),
      valueDate: new Date(today),
      narration: s.n,
      chqRefNo: s.ref,
      debit: s.debit,
      credit: s.credit,
      balance: s.bal,
      voucherNo: "",
      docNo: batchId,
      status: "Posted",
      importBatchId: batchId,
      payload: { note: opts?.note || "Replica file import" }
    });
    created.push(mapStatement(doc));
  }
  await BankOperation.create({
    transactionId: `STMT-${batchId}`,
    bankName: bank,
    accountNumber: accountNo,
    operationType: "STATEMENT_IMPORT",
    beneficiaryName: "STATEMENT IMPORT",
    amount: created.reduce((s, r) => s + r.credit - r.debit, 0),
    utrNumber: batchId,
    status: "SUCCESS",
    isSimulated: true,
    notes: opts?.note || "Bank statement import (replica)"
  });
  return {
    batchId,
    count: created.length,
    data: created,
    message: `Import saved · ${created.length} line(s) · batch ${batchId}`
  };
}

export async function fetchApiBankStatement(opts: {
  accountCode?: string;
  from?: string;
  to?: string;
  saveQuery?: boolean;
  queryName?: string;
}) {
  await ensureStatementSeeds();
  const accounts = BANK_CHEQUE_MASTERS.bankAccounts;
  const acc =
    accounts.find((a) => a.code === opts.accountCode) ||
    accounts.find((a) => a.accountNo === opts.accountCode) ||
    accounts[0];

  const feed = await bankService.fetchStatement(
    acc.accountNo,
    opts.from || toIso(new Date()),
    opts.to || toIso(new Date())
  );

  const upserted = [];
  for (let i = 0; i < feed.length; i++) {
    const row = feed[i];
    const lineId = `API-${acc.accountNo}-${row.chequeOrRefNo || i}-${row.date}`;
    const doc = await BankStatementLine.findOneAndUpdate(
      { lineId },
      {
        $set: {
          lineId,
          channel: "API",
          bank: acc.bank,
          accountNo: acc.accountNo,
          txnDate: new Date(row.date),
          valueDate: new Date(row.valueDate || row.date),
          narration: row.description,
          chqRefNo: row.chequeOrRefNo,
          debit: row.debit,
          credit: row.credit,
          balance: row.balance,
          status: "Posted",
          payload: { source: "MockIndusIndBankService" }
        }
      },
      { upsert: true, new: true }
    );
    upserted.push(mapStatement(doc));
  }

  // Also return any previously stored API lines in range
  const stored = await listBankStatement({
    from: opts.from,
    to: opts.to,
    accountNo: acc.accountNo,
    channel: "API"
  });
  const byId = new Map<string, any>();
  [...upserted, ...stored].forEach((r) => byId.set(r.id, r));
  const data = Array.from(byId.values());

  return {
    account: acc,
    count: data.length,
    data,
    meta: {
      gstPortal: undefined,
      bankPortal: "not_connected",
      adapter: "MockIndusIndBankService",
      note: "Replica API fetch — live bank portal not connected"
    },
    message: `Fetched ${data.length} transaction(s) via API`
  };
}

function mapOnlinePayment(v: any) {
  const iso = toIso(v.voucherDate);
  return {
    id: v.paymentId || String(v._id),
    paymentId: v.paymentId,
    voucherNo: v.voucherNo,
    voucherDate: iso,
    paymentDate: iso,
    ageingDays: Number(v.ageingDays || 0),
    documentNo: v.documentNo || "",
    paymentType: v.paymentType || "F-Pay",
    projectName: v.projectName || "",
    paidTo: v.paidTo,
    vendorCode: v.vendorCode || "",
    vendorName: v.vendorName || v.paidTo || "",
    amount: Number(v.amount || 0),
    income: Number(v.income || 0),
    expense: Number(v.expense || v.amount || 0),
    bankName: v.bankName || "",
    acNoIfsc: v.acNoIfsc || "",
    paymentMode: v.paymentMode || "NEFT",
    utrRef: v.utrRef || "",
    status: v.status || "Pending",
    entryBy: v.entryBy || "AL002",
    attachedFile: v.attachedFile || "",
    narration: v.narration || "",
    hdfcRemark: v.hdfcRemark || "",
    batchFileName: v.batchFileName || ""
  };
}

export async function listH2hQueue(filters?: {
  from?: string;
  to?: string;
  status?: string;
  paymentType?: string;
  search?: string;
}) {
  await ensureOnlinePaymentSeeds();
  const clauses: any[] = [{ status: { $in: ["Pending", "Approved", "Rejected"] } }];
  if (filters?.status && filters.status !== "All") clauses.push({ status: filters.status });
  if (filters?.paymentType && filters.paymentType !== "All") clauses.push({ paymentType: filters.paymentType });
  if (filters?.from || filters?.to) {
    const range: any = {};
    if (filters.from) range.$gte = new Date(filters.from);
    if (filters.to) range.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    clauses.push({ voucherDate: range });
  }
  if (filters?.search) {
    const q = filters.search.trim();
    clauses.push({
      $or: [
        { voucherNo: { $regex: q, $options: "i" } },
        { paidTo: { $regex: q, $options: "i" } },
        { documentNo: { $regex: q, $options: "i" } }
      ]
    });
  }
  const rows = await OnlinePayment.find({ $and: clauses }).sort({ voucherDate: -1 }).limit(200);
  return rows.map(mapOnlinePayment);
}

export async function approveRejectH2h(ids: string[], action: "approve" | "reject", remark?: string) {
  await ensureOnlinePaymentSeeds();
  const list = (ids || []).map(String).filter(Boolean);
  if (!list.length) throw Object.assign(new Error("Select at least one payment"), { status: 400 });
  const results = [];
  for (const id of list) {
    const row = await OnlinePayment.findOne({
      $or: [{ paymentId: id }, { voucherNo: id }]
    });
    if (!row) continue;
    if (action === "approve") {
      const pay = await bankService.processOnlinePayment({
        beneficiaryName: row.paidTo,
        accountNumber: (row.acNoIfsc || "").split(" - ")[0] || "201002938471",
        ifscCode: (row.acNoIfsc || "").split(" - ")[1] || "INDB0000001",
        amount: row.amount,
        remarks: row.narration
      });
      row.status = pay.status === "SUCCESS" ? "Approved" : "Failed";
      row.utrRef = pay.utrNumber;
      row.hdfcRemark = remark || pay.message;
      await row.save();
      await BankOperation.create({
        transactionId: pay.transactionId,
        bankName: "IndusInd Bank",
        accountNumber: "201002938471",
        operationType: "ONLINE_PAYMENT",
        beneficiaryName: row.paidTo,
        amount: row.amount,
        utrNumber: pay.utrNumber,
        status: pay.status === "SUCCESS" ? "SUCCESS" : "FAILED",
        isSimulated: true,
        notes: `H2H ${action} ${row.voucherNo}`
      });
    } else {
      row.status = "Rejected";
      row.hdfcRemark = remark || "Rejected";
      await row.save();
    }
    results.push(mapOnlinePayment(row));
  }
  return {
    count: results.length,
    data: results,
    message: `${results.length} payment(s) ${action === "approve" ? "approved" : "rejected"}`
  };
}

export async function listOnlinePaymentReport(filters: {
  from?: string;
  to?: string;
  vendor?: string;
  status?: string;
}) {
  await ensureOnlinePaymentSeeds();
  const clauses: any[] = [{ status: { $in: ["Success", "Failed", "Reversed", "Approved", "Reprocessed", "Pending"] } }];
  if (filters.from || filters.to) {
    const range: any = {};
    if (filters.from) range.$gte = new Date(filters.from);
    if (filters.to) range.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    clauses.push({ voucherDate: range });
  }
  if (filters.vendor) {
    clauses.push({
      $or: [
        { vendorCode: { $regex: filters.vendor, $options: "i" } },
        { vendorName: { $regex: filters.vendor, $options: "i" } },
        { paidTo: { $regex: filters.vendor, $options: "i" } }
      ]
    });
  }
  if (filters.status && filters.status !== "All") clauses.push({ status: filters.status });
  const rows = await OnlinePayment.find({ $and: clauses }).sort({ voucherDate: -1 }).limit(400);
  return rows.map(mapOnlinePayment);
}

export async function listReprocessFiles() {
  await ensureOnlinePaymentSeeds();
  const rows = await OnlinePayment.aggregate([
    { $match: { batchFileName: { $ne: "" } } },
    {
      $group: {
        _id: "$batchFileName",
        voucherCount: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        bank: { $first: "$bankName" },
        generatedOn: { $min: "$voucherDate" }
      }
    },
    { $sort: { generatedOn: -1 } }
  ]);
  if (!rows.length) {
    // seed a few batch names onto failed/pending for UI
    const pending = await OnlinePayment.find({ status: { $in: ["Failed", "Pending"] } }).limit(6);
    for (let i = 0; i < pending.length; i++) {
      const iso = toIso(pending[i].voucherDate).replace(/-/g, "").slice(2);
      pending[i].batchFileName = `ateka_6_${iso}_${String(i + 1).padStart(3, "0")}`;
      await pending[i].save();
    }
    return listReprocessFiles();
  }
  return rows.map((r, idx) => ({
    id: `rp-${idx + 1}`,
    fileName: r._id,
    displayLabel: `Re-Process file ${String(r._id).replace("ateka_6_", "")}`,
    generatedOn: toIso(r.generatedOn),
    voucherCount: r.voucherCount,
    totalAmount: Number(r.totalAmount || 0),
    bank: r.bank || "INDUSIND BANK"
  }));
}

export async function reprocessOnlinePayment(fileName: string) {
  await ensureOnlinePaymentSeeds();
  const q = String(fileName || "").trim();
  if (!q) throw Object.assign(new Error("Select re-process file"), { status: 400 });
  const files = await listReprocessFiles();
  const file =
    files.find(
      (f) =>
        f.fileName.toLowerCase() === q.toLowerCase() ||
        f.displayLabel.toLowerCase() === q.toLowerCase() ||
        f.id.toLowerCase() === q.toLowerCase()
    ) || files[0];
  if (!file) throw Object.assign(new Error("Re-process file not found"), { status: 404 });

  const rows = await OnlinePayment.find({ batchFileName: file.fileName });
  const lineStatuses = [];
  for (const row of rows) {
    const pay = await bankService.processOnlinePayment({
      beneficiaryName: row.paidTo,
      accountNumber: (row.acNoIfsc || "").split(" - ")[0] || "201002938471",
      ifscCode: (row.acNoIfsc || "").split(" - ")[1] || "INDB0000001",
      amount: row.amount,
      remarks: `Reprocess ${file.fileName}`
    });
    row.status = "Reprocessed";
    row.utrRef = pay.utrNumber;
    await row.save();
    lineStatuses.push({
      voucherNo: row.voucherNo,
      paidTo: row.paidTo,
      amount: row.amount,
      status: "Success",
      utrRef: pay.utrNumber
    });
  }
  await BankOperation.create({
    transactionId: `REP-${Date.now()}`,
    bankName: "IndusInd Bank",
    accountNumber: "201002938471",
    operationType: "RE_PROCESS",
    beneficiaryName: file.fileName,
    amount: file.totalAmount,
    utrNumber: `REP${Date.now().toString().slice(-8)}`,
    status: "SUCCESS",
    isSimulated: true,
    notes: `Re-process ${file.fileName}`
  });
  return {
    file,
    lines: lineStatuses,
    message: `Re-process submitted for ${file.fileName} · ${lineStatuses.length} line(s)`
  };
}

export async function recordPrintJob(input: {
  kind: PrintJobKind;
  documentNos: string[];
  entryBy?: string;
  payload?: any;
}) {
  await connectToDatabase();
  const nos = (input.documentNos || []).map(String).filter(Boolean);
  if (!nos.length) throw Object.assign(new Error("Select at least one document"), { status: 400 });
  const jobId = `PJ${input.kind.slice(0, 3)}${Date.now().toString().slice(-8)}`;
  const doc = await PrintJob.create({
    jobId,
    kind: input.kind,
    documentNos: nos,
    count: nos.length,
    printer: "Dot-Matrix (replica)",
    status: "Sent",
    message: `${nos.length} document(s) sent to Dot-Matrix printer`,
    entryBy: input.entryBy || "AL002",
    payload: input.payload || {}
  });
  return {
    jobId: doc.jobId,
    kind: doc.kind,
    count: doc.count,
    documentNos: doc.documentNos,
    status: doc.status,
    message: doc.message
  };
}

export async function getChequeDepositLists() {
  await ensureChequeSeeds();
  return {
    locations: ["--Show All--", ...BANK_CHEQUE_MASTERS.locations],
    customers: [
      { code: "", name: "--Show All--", label: "--Show All--" },
      ...BANK_CHEQUE_MASTERS.customers.map((c) => ({
        code: c.code,
        name: c.name,
        label: `${c.code} - ${c.name}`
      }))
    ],
    bankAccounts: BANK_CHEQUE_MASTERS.chequeBookAccounts
  };
}
