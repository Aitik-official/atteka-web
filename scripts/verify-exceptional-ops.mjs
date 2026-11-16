import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const raw = fs.readFileSync(path.join(root, ".env.local"), "utf8");
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
    body: JSON.stringify({ username: "MGR01", password: "demo123" })
  });
  const data = await res.json();
  const cookies = res.headers.getSetCookie?.() || [];
  return {
    ok: res.ok,
    role: data?.user?.role,
    cookie: cookies.map((c) => c.split(";")[0]).join("; ")
  };
}

async function api(cookie, method, url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  const auth = await login();
  if (!auth.ok) {
    console.log(JSON.stringify({ error: "login failed", auth }, null, 2));
    process.exit(1);
  }

  const checks = [];

  // 1 from/to location
  {
    const load = await api(
      auth.cookie,
      "GET",
      "/api/exceptional/operation?slug=edit-from-to-location&documentNo=DSALC12600573&docType=PDC"
    );
    const save = await api(auth.cookie, "POST", "/api/exceptional/operation", {
      slug: "edit-from-to-location",
      documentNo: "DSALC12600573",
      values: { fromLocation: "BHIWANDI", toLocation: "NAGPUR" }
    });
    const reload = await api(
      auth.cookie,
      "GET",
      "/api/exceptional/operation?slug=edit-from-to-location&documentNo=DSALC12600573&docType=PDC"
    );
    checks.push({
      name: "edit-from-to-location",
      load: load.status,
      save: save.status,
      source: save.data.source,
      message: save.data.message,
      persistedTo: reload.data?.data?.toLocation,
      ok:
        load.status === 200 &&
        save.status === 200 &&
        save.data.source === "db" &&
        reload.data?.data?.toLocation === "NAGPUR"
    });
  }

  // 2 reassign
  {
    const save = await api(auth.cookie, "POST", "/api/exceptional/operation", {
      slug: "reassign-next-location",
      documentNo: "ALC12660615",
      values: { reassignDeliveryTo: "ALC2", reassignNextTo: "ALC3" }
    });
    const reload = await api(
      auth.cookie,
      "GET",
      "/api/exceptional/operation?slug=reassign-next-location&documentNo=ALC12660615"
    );
    checks.push({
      name: "reassign-next-location",
      save: save.status,
      nextLocation: reload.data?.data?.nextLocation,
      ok: save.status === 200 && String(reload.data?.data?.nextLocation || "").includes("ALC3")
    });
  }

  // 10 advance payable branch
  {
    const list = await api(
      auth.cookie,
      "GET",
      "/api/exceptional/finance?slug=edit-pdc-advance-payable-branch&dateMode=pdcNo&pdcNo=DSALC12600573"
    );
    const save = await api(auth.cookie, "POST", "/api/exceptional/finance", {
      slug: "edit-pdc-advance-payable-branch",
      documentNos: ["DSALC12600573"],
      advancePayableBranch: "ALC3"
    });
    const reload = await api(
      auth.cookie,
      "GET",
      "/api/exceptional/finance?slug=edit-pdc-advance-payable-branch&dateMode=pdcNo&pdcNo=DSALC12600573"
    );
    checks.push({
      name: "edit-pdc-advance-payable-branch",
      list: list.status,
      save: save.status,
      branch: reload.data?.data?.[0]?.advancePayableBranch,
      ok:
        list.status === 200 &&
        save.status === 200 &&
        save.data.source === "db" &&
        reload.data?.data?.[0]?.advancePayableBranch === "ALC3"
    });
  }

  // cancel delivery pdc
  {
    const save = await api(auth.cookie, "POST", "/api/exceptional/operation", {
      slug: "cancel-delivery-pdc",
      documentNo: "DSALC12600533",
      values: { cancelReason: "Ops correction" }
    });
    const reload = await api(
      auth.cookie,
      "GET",
      "/api/exceptional/operation?slug=cancel-delivery-pdc&documentNo=DSALC12600533"
    );
    checks.push({
      name: "cancel-delivery-pdc",
      save: save.status,
      cancelled: reload.data?.data?.cancelled,
      ok: save.status === 200 && reload.data?.data?.cancelled === "Y"
    });
  }

  console.log(
    JSON.stringify(
      {
        role: auth.role,
        allOk: checks.every((c) => c.ok),
        checks
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
