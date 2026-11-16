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

  const debit = await api(auth.cookie, "POST", "/api/finance/debit-voucher", {
    voucherDate: today,
    location: "ALC1",
    payTo: `VERIFY VENDOR ${stamp}`,
    amount: 2500,
    taxableAmount: 2500,
    netPayable: 2500,
    narration: "VERIFY DEBIT",
    accountCode: "4001",
    acDescription: "Freight Expense"
  });
  const debitNo = debit.data?.data?.voucherNumber;
  checks.push({
    name: "32-debit-voucher",
    status: debit.status,
    source: debit.data.source,
    message: debit.data.message,
    voucherNumber: debitNo,
    ok: okDb(debit, !!debitNo)
  });

  const debitCancel = await api(auth.cookie, "POST", "/api/finance/debit-voucher", {
    action: "cancel",
    voucherNumber: debitNo,
    reason: "verify cancel"
  });
  checks.push({
    name: "32-debit-cancel",
    status: debitCancel.status,
    source: debitCancel.data.source,
    message: debitCancel.data.message,
    ok: okDb(debitCancel, String(debitCancel.data.message || "").includes("cancelled"))
  });

  const credit = await api(auth.cookie, "POST", "/api/finance/credit-voucher", {
    voucherDate: today,
    location: "ALC1",
    receivedFrom: `VERIFY PARTY ${stamp}`,
    amount: 1800,
    taxableAmount: 1800,
    netPayable: 1800,
    narration: "VERIFY CREDIT",
    accountCode: "2001",
    mode: "NEFT"
  });
  checks.push({
    name: "33-credit-voucher",
    status: credit.status,
    source: credit.data.source,
    message: credit.data.message,
    voucherNumber: credit.data?.data?.voucherNumber,
    ok: okDb(credit, !!credit.data?.data?.voucherNumber)
  });

  const creditAccounts = await api(auth.cookie, "GET", "/api/finance/credit-voucher?accounts=1");
  checks.push({
    name: "33-credit-accounts",
    status: creditAccounts.status,
    source: creditAccounts.data.source,
    count: (creditAccounts.data?.data?.accounts || []).length,
    ok: okDb(creditAccounts, (creditAccounts.data?.data?.accounts || []).length > 0)
  });

  const contra = await api(auth.cookie, "POST", "/api/finance/contra-entry", {
    voucherDate: today,
    narration: "VERIFY CONTRA",
    lines: [
      { particular: "Cash in Hand - ALC1", debit: 500, credit: 0 },
      { particular: "HDFC Bank - Ops", debit: 0, credit: 500 }
    ]
  });
  checks.push({
    name: "34-contra-entry",
    status: contra.status,
    source: contra.data.source,
    message: contra.data.message,
    voucherNumber: contra.data?.data?.voucherNumber,
    ok: okDb(contra, !!contra.data?.data?.voucherNumber)
  });

  const journal = await api(auth.cookie, "POST", "/api/finance/journal-entry", {
    voucherDate: today,
    location: "ALC1",
    paidTo: "JOURNAL VERIFY",
    narration: "VERIFY JOURNAL",
    totalDebit: 1200,
    totalCredit: 1200,
    lines: [
      { particular: "Freight Expense", debit: 1200, credit: 0 },
      { particular: "Suspense", debit: 0, credit: 1200 }
    ]
  });
  checks.push({
    name: "35-journal-entry",
    status: journal.status,
    source: journal.data.source,
    message: journal.data.message,
    voucherNumber: journal.data?.data?.voucherNumber,
    ok: okDb(journal, !!journal.data?.data?.voucherNumber && !String(journal.data.message || "").includes("demo"))
  });

  const vendorInv = await api(auth.cookie, "POST", "/api/finance/enter-vendor-invoice", {
    invoiceType: "Direct Invoice",
    vendor: "VND0001 - ATLAS SPARES TRADING",
    invoiceNo: `INV/VERIFY/${stamp}`,
    invoiceDate: today,
    amount: 4500,
    taxableAmount: 4500,
    tds: 100,
    netPayable: 4400,
    narration: "VERIFY VENDOR INVOICE"
  });
  const invNo = vendorInv.data?.data?.invoiceNo || `INV/VERIFY/${stamp}`;
  const invVoucher = vendorInv.data?.data?.voucherNumber;
  checks.push({
    name: "36-enter-vendor-invoice",
    status: vendorInv.status,
    source: vendorInv.data.source,
    message: vendorInv.data.message,
    voucherNumber: invVoucher,
    nextStep: vendorInv.data?.data?.nextStep,
    ok: okDb(vendorInv, vendorInv.data?.data?.nextStep === "entry-complete" && !!invVoucher)
  });

  const vendorPay = await api(auth.cookie, "POST", "/api/finance/enter-vendor-payment", {
    vendor: "VND0001 - ATLAS SPARES TRADING",
    paymentDate: today,
    amount: 2000,
    paymentMode: "NEFT",
    againstInvoice: invNo,
    narration: "VERIFY VENDOR PAYMENT"
  });
  const payNo = vendorPay.data?.data?.voucherNumber;
  checks.push({
    name: "37-enter-vendor-payment",
    status: vendorPay.status,
    source: vendorPay.data.source,
    message: vendorPay.data.message,
    voucherNumber: payNo,
    nextStep: vendorPay.data?.data?.nextStep,
    ok: okDb(vendorPay, vendorPay.data?.data?.nextStep === "payment-complete" && !!payNo)
  });

  const cancelInv = await api(auth.cookie, "POST", "/api/finance/cancel-vendor-invoice", {
    voucherNumber: invVoucher,
    invoiceNo: invNo,
    reason: "verify cancel invoice"
  });
  checks.push({
    name: "38-cancel-vendor-invoice",
    status: cancelInv.status,
    source: cancelInv.data.source,
    message: cancelInv.data.message,
    ok: okDb(cancelInv, String(cancelInv.data.message || "").toLowerCase().includes("cancel"))
  });

  const cancelPay = await api(auth.cookie, "POST", "/api/finance/cancel-vendor-payment", {
    voucherNumber: payNo,
    reason: "verify cancel payment"
  });
  checks.push({
    name: "39-cancel-vendor-payment",
    status: cancelPay.status,
    source: cancelPay.data.source,
    message: cancelPay.data.message,
    ok: okDb(cancelPay, String(cancelPay.data.message || "").toLowerCase().includes("cancel"))
  });

  const debitNote = await api(auth.cookie, "POST", "/api/finance/debit-note", {
    invoiceNo: invNo,
    vendor: "VND0001 - ATLAS SPARES TRADING",
    amount: 500,
    debitNoteDate: today,
    reason: "VERIFY DEBIT NOTE"
  });
  checks.push({
    name: "40-debit-note",
    status: debitNote.status,
    source: debitNote.data.source,
    message: debitNote.data.message,
    voucherNumber: debitNote.data?.data?.voucherNumber,
    ok: okDb(debitNote, !!debitNote.data?.data?.voucherNumber)
  });

  const gstr2bList = await api(auth.cookie, "GET", "/api/finance/gstr2b-invoice-booking");
  const gstrIds = (gstr2bList.data.data || []).slice(0, 2).map((r) => r.id);
  checks.push({
    name: "41-gstr2b-list",
    status: gstr2bList.status,
    source: gstr2bList.data.source,
    count: gstr2bList.data.count,
    portal: gstr2bList.data?.meta?.gstPortal,
    ok: okDb(gstr2bList, gstr2bList.data?.meta?.gstPortal === "not_connected" && gstrIds.length > 0)
  });

  const gstr2bBook = await api(auth.cookie, "POST", "/api/finance/gstr2b-invoice-booking", {
    ids: gstrIds
  });
  checks.push({
    name: "41-gstr2b-book",
    status: gstr2bBook.status,
    source: gstr2bBook.data.source,
    message: gstr2bBook.data.message,
    ok: okDb(gstr2bBook, !String(gstr2bBook.data.message || "").includes("(demo)"))
  });

  const viewPrint = await api(
    auth.cookie,
    "GET",
    `/api/finance/view-print-vouchers?from=${today}&to=${today}`
  );
  checks.push({
    name: "42-view-print-list",
    status: viewPrint.status,
    source: viewPrint.data.source,
    count: viewPrint.data.count,
    ok: okDb(viewPrint)
  });

  const detailNo = credit.data?.data?.voucherNumber || journal.data?.data?.voucherNumber;
  const viewDetail = await api(
    auth.cookie,
    "GET",
    `/api/finance/view-print-vouchers?detail=1&voucherNumber=${encodeURIComponent(detailNo || "")}`
  );
  checks.push({
    name: "42-view-print-detail",
    status: viewDetail.status,
    source: viewDetail.data.source,
    voucherNumber: viewDetail.data?.data?.voucherNumber,
    ok: okDb(viewDetail, !!viewDetail.data?.data?.voucherNumber)
  });

  const viewVendorInv = await api(
    auth.cookie,
    "GET",
    `/api/finance/view-vendor-invoice?detail=1&voucherNumber=${encodeURIComponent(invVoucher || "")}`
  );
  checks.push({
    name: "42-view-vendor-invoice",
    status: viewVendorInv.status,
    source: viewVendorInv.data.source,
    ok: okDb(viewVendorInv, !!viewVendorInv.data?.data)
  });

  const viewVendorPay = await api(
    auth.cookie,
    "GET",
    `/api/finance/view-vendor-invoice-payment?detail=1&voucherNumber=${encodeURIComponent(payNo || "")}`
  );
  checks.push({
    name: "42-view-vendor-payment",
    status: viewVendorPay.status,
    source: viewVendorPay.data.source,
    ok: okDb(viewVendorPay, !!viewVendorPay.data?.data)
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
