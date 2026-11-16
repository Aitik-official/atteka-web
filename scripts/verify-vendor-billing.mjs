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
  const from = new Date();
  from.setDate(from.getDate() - 365);
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = new Date().toISOString().slice(0, 10);
  const qs = `from=${fromIso}&to=${toIso}`;

  const advList = await api(auth.cookie, "GET", `/api/finance/pdc-freight-advance-single?${qs}`);
  const advRow = (advList.data.data || [])[0];
  checks.push({
    name: "17-pdc-advance-single-list",
    status: advList.status,
    source: advList.data.source,
    count: advList.data.count,
    ok: okDb(advList, (advList.data.data || []).length > 0)
  });

  const advPay = await api(auth.cookie, "POST", "/api/finance/pdc-freight-advance-single", {
    id: advRow?.id,
    pdcNumber: advRow?.pdcNumber
  });
  checks.push({
    name: "17-pdc-advance-single-pay",
    status: advPay.status,
    source: advPay.data.source,
    message: advPay.data.message,
    batchRef: advPay.data?.data?.batchRef,
    ok: okDb(advPay, (advPay.data?.data?.count || 0) >= 0)
  });

  const balList = await api(auth.cookie, "GET", `/api/finance/pdc-balance-payment-single?${qs}`);
  const balRow = (balList.data.data || [])[0];
  checks.push({
    name: "18-pdc-balance-single-list",
    status: balList.status,
    source: balList.data.source,
    count: balList.data.count,
    ok: okDb(balList)
  });

  const balPay = await api(auth.cookie, "POST", "/api/finance/pdc-balance-payment-single", {
    id: balRow?.id || advRow?.id,
    pdcNumber: balRow?.pdcNumber || advRow?.pdcNumber
  });
  checks.push({
    name: "18-pdc-balance-single-pay",
    status: balPay.status,
    source: balPay.data.source,
    message: balPay.data.message,
    ok: okDb(balPay)
  });

  const multiAdvList = await api(auth.cookie, "GET", `/api/finance/pdc-freight-advance-multiple?${qs}`);
  const multiAdvIds = (multiAdvList.data.data || []).slice(0, 2).map((r) => r.id);
  checks.push({
    name: "19-pdc-advance-multiple-list",
    status: multiAdvList.status,
    source: multiAdvList.data.source,
    count: multiAdvList.data.count,
    ok: okDb(multiAdvList)
  });
  const multiAdvPay = await api(auth.cookie, "POST", "/api/finance/pdc-freight-advance-multiple", {
    ids: multiAdvIds.length ? multiAdvIds : advRow?.id ? [advRow.id] : []
  });
  checks.push({
    name: "19-pdc-advance-multiple-pay",
    status: multiAdvPay.status,
    source: multiAdvPay.data.source,
    message: multiAdvPay.data.message,
    ok: okDb(multiAdvPay)
  });

  const multiBalList = await api(auth.cookie, "GET", `/api/finance/pdc-balance-payment-multiple?${qs}`);
  const multiBalIds = (multiBalList.data.data || []).slice(0, 2).map((r) => r.id);
  checks.push({
    name: "20-pdc-balance-multiple-list",
    status: multiBalList.status,
    source: multiBalList.data.source,
    count: multiBalList.data.count,
    ok: okDb(multiBalList)
  });
  const multiBalPay = await api(auth.cookie, "POST", "/api/finance/pdc-balance-payment-multiple", {
    ids: multiBalIds.length ? multiBalIds : balRow?.id ? [balRow.id] : []
  });
  checks.push({
    name: "20-pdc-balance-multiple-pay",
    status: multiBalPay.status,
    source: multiBalPay.data.source,
    message: multiBalPay.data.message,
    ok: okDb(multiBalPay)
  });

  const tsAdvList = await api(auth.cookie, "GET", `/api/finance/tripsheet-advance-payment?${qs}`);
  const tsAdvIds = (tsAdvList.data.data || []).slice(0, 2).map((r) => r.id);
  checks.push({
    name: "21-tripsheet-advance-list",
    status: tsAdvList.status,
    source: tsAdvList.data.source,
    count: tsAdvList.data.count,
    ok: okDb(tsAdvList)
  });
  const tsAdvPay = await api(auth.cookie, "POST", "/api/finance/tripsheet-advance-payment", {
    ids: tsAdvIds
  });
  checks.push({
    name: "21-tripsheet-advance-pay",
    status: tsAdvPay.status,
    source: tsAdvPay.data.source,
    message: tsAdvPay.data.message,
    ok: tsAdvIds.length ? okDb(tsAdvPay) : tsAdvPay.status === 400 || okDb(tsAdvPay)
  });

  const tsBalList = await api(auth.cookie, "GET", `/api/finance/tripsheet-balance-payment?${qs}`);
  const tsBalIds = (tsBalList.data.data || []).slice(0, 2).map((r) => r.id);
  checks.push({
    name: "22-tripsheet-balance-list",
    status: tsBalList.status,
    source: tsBalList.data.source,
    count: tsBalList.data.count,
    ok: okDb(tsBalList)
  });
  const tsBalPay = await api(auth.cookie, "POST", "/api/finance/tripsheet-balance-payment", {
    ids: tsBalIds
  });
  checks.push({
    name: "22-tripsheet-balance-pay",
    status: tsBalPay.status,
    source: tsBalPay.data.source,
    message: tsBalPay.data.message,
    ok: tsBalIds.length ? okDb(tsBalPay) : tsBalPay.status === 400 || okDb(tsBalPay)
  });

  const vbfList = await api(auth.cookie, "GET", `/api/finance/vendor-bill-finalization?${qs}`);
  const vbfIds = (vbfList.data.data || []).slice(0, 1).map((r) => r.id);
  checks.push({
    name: "23-vendor-bill-finalization-list",
    status: vbfList.status,
    source: vbfList.data.source,
    count: vbfList.data.count,
    ok: okDb(vbfList)
  });
  const vbfPay = await api(auth.cookie, "POST", "/api/finance/vendor-bill-finalization", {
    ids: vbfIds
  });
  checks.push({
    name: "23-vendor-bill-finalization-pay",
    status: vbfPay.status,
    source: vbfPay.data.source,
    message: vbfPay.data.message,
    ok: vbfIds.length ? okDb(vbfPay) : vbfPay.status === 400 || okDb(vbfPay)
  });

  const failed = checks.filter((c) => !c.ok);
  console.log(JSON.stringify({ ok: failed.length === 0, role: auth.role, checks, failed }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
