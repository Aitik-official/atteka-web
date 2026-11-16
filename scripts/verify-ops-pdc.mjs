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

async function main() {
  const auth = await login();
  if (!auth.ok) {
    console.log(JSON.stringify({ error: "login failed" }, null, 2));
    process.exit(1);
  }

  const checks = [];

  // seed/list CNs
  const listCn = await api(
    auth.cookie,
    "GET",
    "/api/operations/prepare-pickup-pdc?mode=docket&docketNos=ALC12660615"
  );
  checks.push({
    name: "pickup-list",
    status: listCn.status,
    source: listCn.data.source,
    ok: listCn.status === 200 && listCn.data.source === "db" && (listCn.data.data || []).length > 0
  });

  // prepare pickup
  const pickup = await api(auth.cookie, "POST", "/api/operations/prepare-pickup-pdc", {
    vendor: "V00002: METRO HAULAGE PARTNERS",
    vehicleNo: "MH12TEST01",
    selectedCnNos: ["ALC12660621"],
    pdcDate: new Date().toISOString().slice(0, 10),
    contractAmount: 5000
  });
  checks.push({
    name: "prepare-pickup",
    status: pickup.status,
    source: pickup.data.source,
    pdcNo: pickup.data?.data?.pdcNo,
    message: pickup.data.message,
    ok: pickup.status === 200 && pickup.data.source === "db" && !String(pickup.data.message || "").includes("(demo)")
  });

  // prepare delivery
  const delivery = await api(auth.cookie, "POST", "/api/operations/prepare-delivery-pdc", {
    vendor: "V00009: GATEWAY FLEET CO",
    vehicleNo: "MH46TEST02",
    selected: ["ALC12660617"],
    pdcDate: new Date().toISOString().slice(0, 10)
  });
  const deliveryNo = delivery.data?.data?.pdcNo;
  checks.push({
    name: "prepare-delivery",
    status: delivery.status,
    source: delivery.data.source,
    pdcNo: deliveryNo,
    ok: delivery.status === 200 && delivery.data.source === "db" && !String(delivery.data.message || "").includes("(demo)")
  });

  // update/close delivery
  const update = await api(auth.cookie, "POST", "/api/operations/update-delivery-pdc", {
    tripSheetNo: deliveryNo || "DSALC12600573",
    driverName: "RAM SINGH",
    endKm: 120,
    close: true
  });
  checks.push({
    name: "update-close-delivery",
    status: update.status,
    source: update.data.source,
    message: update.data.message,
    ok: update.status === 200 && update.data.source === "db" && !String(update.data.message || "").includes("(demo)")
  });

  // loading slip list
  const loading = await api(auth.cookie, "GET", "/api/operations/prepare-loading-slip");
  checks.push({
    name: "loading-slip-list",
    status: loading.status,
    source: loading.data.source,
    count: loading.data.total,
    ok: loading.status === 200 && loading.data.source === "db" && (loading.data.total || 0) > 0
  });

  // edit-cns
  const editCns = await api(auth.cookie, "GET", "/api/operations/edit-cns?mode=cnno&cnNo=ALC12660615");
  checks.push({
    name: "edit-cns",
    status: editCns.status,
    source: editCns.data.source,
    ok: editCns.status === 200 && editCns.data.source === "db"
  });

  console.log(JSON.stringify({ role: auth.role, allOk: checks.every((c) => c.ok), checks }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
