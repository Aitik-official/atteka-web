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
  return { ok: res.ok, cookie: cookies.map((c) => c.split(";")[0]).join("; ") };
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
  const src = res.data.source;
  return (
    res.status === 200 &&
    (src === "db" || src === "empty" || src === "ledger") &&
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
  const from = new Date();
  from.setDate(from.getDate() - 365);
  const fromIso = from.toISOString().slice(0, 10);

  const journal = await api(auth.cookie, "POST", "/api/finance/journal-entry", {
    voucherDate: today,
    location: "ALC1",
    paidTo: "VERIFY JOURNAL PARTY",
    narration: "VERIFY VIEW JOURNAL",
    totalDebit: 1500,
    totalCredit: 1500,
    lines: [
      { particular: "Freight Expense", debit: 1500, credit: 0 },
      { particular: "Suspense", debit: 0, credit: 1500 }
    ]
  });
  const jvNo = journal.data?.data?.voucherNumber;
  checks.push({
    name: "seed-journal",
    status: journal.status,
    source: journal.data.source,
    voucherNumber: jvNo,
    ok: journal.status === 200 && !!jvNo
  });

  const viewJv = await api(
    auth.cookie,
    "GET",
    `/api/finance/view-journal-vouchers?voucherNo=${encodeURIComponent(jvNo || "")}`
  );
  checks.push({
    name: "view-journal-vouchers",
    status: viewJv.status,
    source: viewJv.data.source,
    voucherNo: viewJv.data?.data?.voucherNo,
    lines: (viewJv.data?.data?.lines || []).length,
    ok: okDb(viewJv, viewJv.data?.data?.voucherNo === jvNo && (viewJv.data?.data?.lines || []).length >= 2)
  });

  const debitAdvice = await api(
    auth.cookie,
    "GET",
    `/api/finance/print-debit-advice?mode=criteria&dateMode=range&from=${fromIso}&to=${today}`
  );
  checks.push({
    name: "print-debit-advice",
    status: debitAdvice.status,
    source: debitAdvice.data.source,
    count: debitAdvice.data.count,
    ok: okDb(debitAdvice)
  });

  const pdcMemo = await api(
    auth.cookie,
    "GET",
    `/api/finance/pdc-freight-memo?mode=criteria&dateMode=range&from=${fromIso}&to=${today}`
  );
  checks.push({
    name: "pdc-freight-memo",
    status: pdcMemo.status,
    source: pdcMemo.data.source,
    count: pdcMemo.data.count,
    ok: okDb(pdcMemo)
  });

  const pickup = await api(
    auth.cookie,
    "GET",
    `/api/operations/view-print-pickup-pdc?from=${fromIso}&to=${today}`
  );
  checks.push({
    name: "view-print-pickup-pdc",
    status: pickup.status,
    source: pickup.data.source,
    total: pickup.data.total,
    ok: okDb(pickup)
  });

  const delivery = await api(
    auth.cookie,
    "GET",
    `/api/operations/view-print-delivery-pdc?from=${fromIso}&to=${today}`
  );
  checks.push({
    name: "view-print-delivery-pdc",
    status: delivery.status,
    source: delivery.data.source,
    total: delivery.data.total,
    ok: okDb(delivery)
  });

  if ((pickup.data.data || [])[0]?.id) {
    const detail = await api(
      auth.cookie,
      "GET",
      `/api/operations/view-print-pickup-pdc?id=${pickup.data.data[0].id}`
    );
    checks.push({
      name: "view-print-pickup-detail",
      status: detail.status,
      source: detail.data.source,
      hasLines: Array.isArray(detail.data?.data?.lines),
      ok: okDb(detail, !!detail.data?.data?.pdcNo)
    });
  }

  for (const name of [
    "trial-balance",
    "general-ledger",
    "subsidiary-ledger",
    "customer-ledger",
    "cash-bank-statement",
    "branch-profit-loss"
  ]) {
    const qs =
      name === "general-ledger"
        ? `from=${fromIso}&to=${today}&account=DEBTORS`
        : name === "customer-ledger"
          ? `from=${fromIso}&to=${today}&customer=CUS0001`
          : name === "cash-bank-statement"
            ? `from=${fromIso}&to=${today}&cashBank=CASH`
            : `from=${fromIso}&to=${today}`;
    const res = await api(auth.cookie, "GET", `/api/reports/${name}?${qs}`);
    checks.push({
      name: `report-${name}`,
      status: res.status,
      source: res.data.source,
      count: res.data.count,
      ok: okDb(res, Array.isArray(res.data.data))
    });
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(
    JSON.stringify(
      {
        base: BASE,
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
