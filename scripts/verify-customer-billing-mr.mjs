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
  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("application/zip") || ct.includes("octet-stream")) {
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      status: res.status,
      data: {
        source: res.headers.get("X-Source") || "db",
        message: res.headers.get("X-POD-Message") || "",
        count: Number(res.headers.get("X-POD-Count") || 0),
        zipBytes: buf.length,
        isZip: buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b
      }
    };
  }
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
  const from = new Date();
  from.setDate(from.getDate() - 365);
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = new Date().toISOString().slice(0, 10);
  const qs = `from=${fromIso}&to=${toIso}`;

  const other = await api(auth.cookie, "POST", "/api/finance/other-bill", {
    billingParty: "CUS1001 - NORTHBOUND FREIGHT PVT LTD",
    billDate: toIso,
    charges: { freight: 1500, detention: 200 },
    total: 1700,
    remark: "VERIFY OTHER BILL"
  });
  checks.push({
    name: "24-other-bill",
    status: other.status,
    source: other.data.source,
    message: other.data.message,
    billNo: other.data?.data?.billNo,
    ok: okDb(other, !!other.data?.data?.billNo)
  });

  const inv = await api(auth.cookie, "POST", "/api/finance/customer-invoice", {
    billingParty: "CUS1002 - METRO LOGISTICS PARTNERS",
    billDate: toIso,
    billNo: `BLALC1${Date.now().toString().slice(-6)}`,
    lines: [{ head: "FREIGHT", qty: 1, rate: 5000, amount: 5000 }],
    totalAmount: 5000,
    totalCgst: 450,
    totalSgst: 450,
    totalIgst: 0,
    netPayable: 5900
  });
  checks.push({
    name: "25-customer-invoice",
    status: inv.status,
    source: inv.data.source,
    message: inv.data.message,
    ok: okDb(inv, !!inv.data?.data?.billNo)
  });

  const podList = await api(auth.cookie, "GET", `/api/finance/download-multiple-pods?${qs}`);
  const podIds = (podList.data.data || []).slice(0, 2).map((r) => r.id || r.docketNo);
  checks.push({
    name: "26-pod-list",
    status: podList.status,
    source: podList.data.source,
    count: podList.data.total,
    ok: okDb(podList, (podList.data.data || []).length > 0)
  });
  const podZip = await api(auth.cookie, "POST", "/api/finance/download-multiple-pods", {
    ids: podIds
  });
  checks.push({
    name: "26-pod-zip",
    status: podZip.status,
    source: podZip.data.source,
    zipBytes: podZip.data.zipBytes,
    isZip: podZip.data.isZip,
    ok: podZip.status === 200 && podZip.data.isZip && (podZip.data.zipBytes || 0) > 20
  });

  const cf = await api(auth.cookie, "GET", `/api/finance/completion-financial?${qs}`);
  checks.push({
    name: "27-completion-financial",
    status: cf.status,
    source: cf.data.source,
    count: cf.data.count,
    ok: okDb(cf, (cf.data.data || []).length > 0)
  });

  const bills = await api(auth.cookie, "GET", `/api/finance/generate-bill-mr?${qs}`);
  const billNos = (bills.data.data || []).slice(0, 2).map((r) => r.billNumber);
  checks.push({
    name: "28-bill-mr-list",
    status: bills.status,
    source: bills.data.source,
    count: bills.data.count,
    ok: okDb(bills, billNos.length > 0)
  });
  const mr = await api(auth.cookie, "POST", "/api/finance/generate-bill-mr", {
    billNumbers: billNos,
    withRebate: false
  });
  checks.push({
    name: "28-bill-mr-post",
    status: mr.status,
    source: mr.data.source,
    message: mr.data.message,
    mrNumber: mr.data?.data?.mrNumber,
    ok: okDb(mr, !!mr.data?.data?.mrNumber)
  });

  const bills2 = await api(auth.cookie, "GET", `/api/finance/generate-bill-mr?${qs}`);
  const billNos2 = (bills2.data.data || []).slice(0, 1).map((r) => r.billNumber);
  const mrRebate = await api(auth.cookie, "POST", "/api/finance/generate-bill-mr", {
    billNumbers: billNos2,
    withRebate: true,
    rebatePercent: 2
  });
  checks.push({
    name: "28-bill-mr-rebate",
    status: mrRebate.status,
    source: mrRebate.data.source,
    message: mrRebate.data.message,
    ok: billNos2.length ? okDb(mrRebate, !!mrRebate.data?.data?.mrNumber) : true
  });

  const ptList = await api(auth.cookie, "GET", `/api/finance/paid-topay-mr?mode=date&${qs}`);
  const dockets = (ptList.data.data || []).slice(0, 2).map((r) => r.docketNo);
  checks.push({
    name: "29-paid-topay-list",
    status: ptList.status,
    source: ptList.data.source,
    count: ptList.data.count,
    ok: okDb(ptList)
  });
  const ptMr = await api(auth.cookie, "POST", "/api/finance/paid-topay-mr", { docketNos: dockets });
  checks.push({
    name: "29-paid-topay-post",
    status: ptMr.status,
    source: ptMr.data.source,
    message: ptMr.data.message,
    ok: dockets.length ? okDb(ptMr, !!ptMr.data?.data?.mrNumber) : ptMr.status === 400
  });

  const cnBill = await api(auth.cookie, "GET", `/api/finance/credit-note?billNo=BLALC12605010`);
  checks.push({
    name: "30-credit-note-lookup",
    status: cnBill.status,
    source: cnBill.data.source,
    ok: okDb(cnBill, !!cnBill.data?.data?.systemBillNo)
  });
  const cnPost = await api(auth.cookie, "POST", "/api/finance/credit-note", {
    systemBillNo: cnBill.data?.data?.systemBillNo || "BLALC12605010",
    amount: 1000,
    cgst: 90,
    sgst: 90,
    totalAmt: 1180,
    reason: "VERIFY"
  });
  checks.push({
    name: "30-credit-note-post",
    status: cnPost.status,
    source: cnPost.data.source,
    message: cnPost.data.message,
    ok: okDb(cnPost, !!cnPost.data?.data?.creditNoteNo)
  });

  const cnNewList = await api(auth.cookie, "GET", `/api/finance/credit-note-new?${qs}`);
  const cnNewBill = (cnNewList.data.data || []).find((r) => r.cnStatus === "Pending");
  checks.push({
    name: "30-credit-note-new-list",
    status: cnNewList.status,
    source: cnNewList.data.source,
    count: cnNewList.data.count,
    ok: okDb(cnNewList)
  });
  const cnNewPost = await api(auth.cookie, "POST", "/api/finance/credit-note-new", {
    billInvoiceNo: cnNewBill?.billInvoiceNo || inv.data?.data?.billNo,
    amount: cnNewBill?.amount,
    cgst: cnNewBill?.cgst,
    sgst: cnNewBill?.sgst,
    grossAmount: cnNewBill?.grossAmount
  });
  checks.push({
    name: "30-credit-note-new-post",
    status: cnNewPost.status,
    source: cnNewPost.data.source,
    message: cnNewPost.data.message,
    ok: okDb(cnNewPost, !!cnNewPost.data?.data?.creditNoteNo)
  });

  const viewMr = await api(auth.cookie, "GET", `/api/finance/view-print-mr?${qs}`);
  checks.push({
    name: "31-view-print-mr",
    status: viewMr.status,
    source: viewMr.data.source,
    count: viewMr.data.count,
    ok: okDb(viewMr, (viewMr.data.data || []).length > 0)
  });

  const viewCn = await api(auth.cookie, "GET", `/api/finance/view-print-credit-note?${qs}`);
  checks.push({
    name: "31-view-print-credit-note",
    status: viewCn.status,
    source: viewCn.data.source,
    count: viewCn.data.count,
    ok: okDb(viewCn, (viewCn.data.data || []).length > 0)
  });

  const failed = checks.filter((c) => !c.ok);
  console.log(JSON.stringify({ ok: failed.length === 0, role: auth.role, checks, failed }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
