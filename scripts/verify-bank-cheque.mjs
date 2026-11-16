import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  let k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "AL002", password: "demo123" })
  });
  const data = await res.json();
  const cookies = res.headers.getSetCookie?.() || [];
  return { ok: res.ok, cookie: cookies.map((c) => c.split(";")[0]).join("; "), role: data?.user?.role };
}

async function api(cookie, method, url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function okDb(res, extra = true) {
  return (
    res.status === 200 &&
    res.data.source === "db" &&
    !String(res.data.message || "").includes("(demo)") &&
    extra
  );
}

async function main() {
  const auth = await login();
  if (!auth.ok) {
    console.log(JSON.stringify({ error: "login failed" }, null, 2));
    process.exit(1);
  }

  const checks = [];
  const today = new Date().toISOString().slice(0, 10);
  const stamp = Date.now().toString().slice(-6);

  const receipt = await api(auth.cookie, "POST", "/api/finance/on-account-cheque-receipt", {
    chequeUtrNo: `CHQVERIFY${stamp}`,
    chequeUtrDate: today,
    amount: 12500.5,
    bankName: "HDFC Bank",
    receivedFrom: "CUS0001 - NORTHBOUND FREIGHT PVT LTD",
    narration: "VERIFY RECEIPT"
  });
  checks.push({
    name: "43-cheque-receipt",
    status: receipt.status,
    source: receipt.data.source,
    message: receipt.data.message,
    chequeNo: receipt.data?.data?.chequeNo,
    ok: okDb(receipt, !!receipt.data?.data?.chequeNo)
  });

  const book = await api(auth.cookie, "POST", "/api/finance/assign-cheque-book", {
    entryLocation: "ALC1",
    bankAc: "HDFC Bank - Ops · ****4521",
    fromSrNo: 1001,
    toSrNo: 1050,
    dateOfIssue: today
  });
  checks.push({
    name: "44-assign-cheque-book",
    status: book.status,
    source: book.data.source,
    message: book.data.message,
    bookNo: book.data?.data?.bookNo,
    ok: okDb(book, !!book.data?.data?.bookNo && String(book.data.message || "").includes("issued"))
  });

  const depositList = await api(
    auth.cookie,
    "GET",
    `/api/finance/on-account-cheque-deposit?from=${today}&to=${today}&chequeNumber=CHQVERIFY${stamp}`
  );
  checks.push({
    name: "45-deposit-list",
    status: depositList.status,
    source: depositList.data.source,
    count: depositList.data.count,
    ok: okDb(depositList, (depositList.data.data || []).length >= 1)
  });

  const deposit = await api(auth.cookie, "POST", "/api/finance/on-account-cheque-deposit", {
    chequeNos: [`CHQVERIFY${stamp}`]
  });
  checks.push({
    name: "45-deposit",
    status: deposit.status,
    source: deposit.data.source,
    message: deposit.data.message,
    ok: okDb(deposit, String(deposit.data.message || "").toLowerCase().includes("deposit"))
  });

  const stmt = await api(auth.cookie, "GET", `/api/bank/statement?from=${today}&to=${today}`);
  checks.push({
    name: "46-statement-list",
    status: stmt.status,
    source: stmt.data.source,
    count: stmt.data.count,
    ok: okDb(stmt)
  });

  const stmtImport = await api(auth.cookie, "POST", "/api/bank/statement", {
    fileName: `verify-${stamp}.xlsx`
  });
  checks.push({
    name: "46-statement-import",
    status: stmtImport.status,
    source: stmtImport.data.source,
    message: stmtImport.data.message,
    ok: okDb(stmtImport, String(stmtImport.data.message || "").includes("Import saved"))
  });

  const apiStmt = await api(
    auth.cookie,
    "GET",
    `/api/bank/api-statement?bankAccount=INDB-201002938471&from=${today}&to=${today}`
  );
  checks.push({
    name: "47-api-statement",
    status: apiStmt.status,
    source: apiStmt.data.source,
    count: apiStmt.data.count,
    portal: apiStmt.data?.meta?.bankPortal,
    ok: okDb(apiStmt, apiStmt.data?.meta?.bankPortal === "not_connected" && (apiStmt.data.count || 0) > 0)
  });

  const apiSave = await api(auth.cookie, "POST", "/api/bank/api-statement", {
    action: "save",
    accountCode: "INDB-201002938471",
    from: today,
    to: today,
    name: `VERIFY ${stamp}`
  });
  checks.push({
    name: "47-api-save-query",
    status: apiSave.status,
    source: apiSave.data.source,
    message: apiSave.data.message,
    ok: okDb(apiSave, String(apiSave.data.message || "").includes("saved"))
  });

  const reprocessFiles = await api(auth.cookie, "GET", "/api/bank/online-payment-reprocess");
  const fileName = reprocessFiles.data?.data?.[0]?.fileName;
  checks.push({
    name: "48-reprocess-files",
    status: reprocessFiles.status,
    source: reprocessFiles.data.source,
    count: reprocessFiles.data.count,
    ok: okDb(reprocessFiles, (reprocessFiles.data.data || []).length > 0)
  });

  const reprocess = await api(auth.cookie, "POST", "/api/bank/online-payment-reprocess", {
    fileName
  });
  checks.push({
    name: "48-reprocess",
    status: reprocess.status,
    source: reprocess.data.source,
    message: reprocess.data.message,
    lines: (reprocess.data.data || []).length,
    ok: okDb(reprocess, String(reprocess.data.message || "").toLowerCase().includes("re-process"))
  });

  const report = await api(
    auth.cookie,
    "GET",
    `/api/bank/online-payment-report?from=${today}&to=${today}`
  );
  checks.push({
    name: "49-online-payment-report",
    status: report.status,
    source: report.data.source,
    count: report.data.count,
    ok: okDb(report)
  });

  const h2h = await api(auth.cookie, "GET", "/api/bank/h2h-online-payment?status=Pending");
  const ids = (h2h.data.data || []).slice(0, 2).map((r) => r.id);
  checks.push({
    name: "50-h2h-queue",
    status: h2h.status,
    source: h2h.data.source,
    count: h2h.data.count,
    ok: okDb(h2h, ids.length > 0)
  });

  const approve = await api(auth.cookie, "POST", "/api/bank/h2h-online-payment", {
    action: "approve",
    ids
  });
  checks.push({
    name: "50-h2h-approve",
    status: approve.status,
    source: approve.data.source,
    message: approve.data.message,
    ok: okDb(approve, String(approve.data.message || "").includes("approved"))
  });

  const balance = await api(auth.cookie, "POST", "/api/bank/h2h-online-payment", {
    action: "balance"
  });
  checks.push({
    name: "50-h2h-balance",
    status: balance.status,
    source: balance.data.source,
    ok: okDb(balance, !!balance.data?.data?.availableBalance)
  });

  const printDocket = await api(auth.cookie, "POST", "/api/finance/dot-matrix-print", {
    kind: "DOCKET",
    documentNos: [`ALC1${stamp}01`, `ALC1${stamp}02`]
  });
  checks.push({
    name: "51-print-docket",
    status: printDocket.status,
    source: printDocket.data.source,
    message: printDocket.data.message,
    ok: okDb(printDocket, !!printDocket.data?.data?.jobId)
  });

  const printVoucher = await api(auth.cookie, "POST", "/api/finance/dot-matrix-print", {
    kind: "VOUCHER",
    documentNos: ["BPV/ALC1/26001"]
  });
  checks.push({
    name: "51-print-voucher",
    status: printVoucher.status,
    source: printVoucher.data.source,
    ok: okDb(printVoucher, !!printVoucher.data?.data?.jobId)
  });

  const printAdvice = await api(auth.cookie, "POST", "/api/finance/dot-matrix-print", {
    kind: "DEBIT_ADVICE",
    documentNos: ["DA/ALC1/26001"]
  });
  checks.push({
    name: "51-print-debit-advice",
    status: printAdvice.status,
    source: printAdvice.data.source,
    ok: okDb(printAdvice, !!printAdvice.data?.data?.jobId)
  });

  const printPdc = await api(auth.cookie, "POST", "/api/finance/dot-matrix-print", {
    kind: "PDC_FREIGHT_MEMO",
    documentNos: ["PDC/ALC1/26001"]
  });
  checks.push({
    name: "51-print-pdc",
    status: printPdc.status,
    source: printPdc.data.source,
    ok: okDb(printPdc, !!printPdc.data?.data?.jobId)
  });

  const failed = checks.filter((c) => !c.ok);
  console.log(
    JSON.stringify(
      {
        base: BASE,
        role: auth.role,
        passed: checks.filter((c) => c.ok).length,
        failed: failed.length,
        checks
      },
      null,
      2
    )
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
