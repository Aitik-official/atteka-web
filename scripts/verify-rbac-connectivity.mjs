import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function checkMongo() {
  const uri = process.env.MONGODB_URI;
  const out = {
    connected: false,
    pingMs: 0,
    dbName: null,
    host: null,
    collections: [],
    users: [],
    userCount: 0,
    error: null
  };
  if (!uri) {
    out.error = "MONGODB_URI missing in .env.local";
    return out;
  }
  try {
    out.host = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@").split("@")[1]?.split("/")[0] || "";
  } catch {
    out.host = "(unknown)";
  }
  const t0 = Date.now();
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
    out.pingMs = Date.now() - t0;
    out.connected = true;
    out.dbName = mongoose.connection.name;
    const cols = await mongoose.connection.db.listCollections().toArray();
    out.collections = cols.map((c) => c.name).sort();
    const users = await mongoose.connection.db
      .collection("users")
      .find({})
      .project({ userId: 1, name: 1, role: 1, branchCode: 1, isActive: 1, passwordHash: 1 })
      .limit(50)
      .toArray();
    out.userCount = users.length;
    out.users = users.map((u) => ({
      userId: u.userId,
      name: u.name,
      role: u.role,
      branchCode: u.branchCode,
      isActive: u.isActive,
      hasPasswordHash: Boolean(u.passwordHash)
    }));
  } catch (e) {
    out.pingMs = Date.now() - t0;
    out.error = e.message;
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
  }
  return out;
}

async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json().catch(() => ({}));
  const setCookie = res.headers.getSetCookie?.() || [];
  const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");
  return {
    status: res.status,
    ok: res.ok,
    role: data?.user?.role || null,
    userId: data?.user?.userId || null,
    name: data?.user?.name || null,
    error: data?.error || null,
    cookie: cookieHeader
  };
}

async function apiCall(cookie, method, path) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json"
    },
    body: method === "GET" || method === "HEAD" ? undefined : JSON.stringify({})
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, error: body?.error || null };
}

async function main() {
  const report = {
    baseUrl: BASE,
    mongo: null,
    logins: [],
    rbacApiGates: [],
    sessionMe: [],
    linkage: {}
  };

  report.mongo = await checkMongo();

  const demos = [
    ["AL002", "OPERATOR"],
    ["ADMIN01", "ADMIN"],
    ["MGR01", "MANAGER"],
    ["ACC01", "ACCOUNTS"],
    ["GUEST01", "GUEST"]
  ];

  for (const [userId, expectedRole] of demos) {
    const t0 = Date.now();
    let row;
    try {
      const loginRes = await login(userId, "demo123");
      row = {
        userId,
        expectedRole,
        actualRole: loginRes.role,
        roleOk: loginRes.role === expectedRole,
        status: loginRes.status,
        ms: Date.now() - t0,
        hasCookie: Boolean(loginRes.cookie && loginRes.cookie.includes("wcv_auth_session")),
        error: loginRes.error
      };

      if (loginRes.cookie) {
        const me = await fetch(`${BASE}/api/auth/me`, {
          headers: { Cookie: loginRes.cookie }
        });
        const meData = await me.json().catch(() => ({}));
        report.sessionMe.push({
          userId,
          meStatus: me.status,
          meRole: meData?.user?.role || null,
          meMatchesLogin: meData?.user?.role === loginRes.role
        });

        // Gate samples
        const gates = [
          ["GET", "/api/billing"],
          ["POST", "/api/billing"],
          ["POST", "/api/consignments"],
          ["POST", "/api/customers"],
          ["GET", "/api/employees"]
        ];
        for (const [method, p] of gates) {
          const r = await apiCall(loginRes.cookie, method, p);
          report.rbacApiGates.push({
            userId,
            role: loginRes.role,
            method,
            path: p,
            status: r.status,
            error: r.error
          });
        }

        await fetch(`${BASE}/api/auth/logout`, {
          method: "POST",
          headers: { Cookie: loginRes.cookie }
        });
      }
    } catch (e) {
      row = {
        userId,
        expectedRole,
        actualRole: null,
        roleOk: false,
        status: 0,
        ms: Date.now() - t0,
        hasCookie: false,
        error: e.message
      };
    }
    report.logins.push(row);
  }

  report.linkage = {
    mongoConnected: report.mongo.connected,
    allDemoLoginsOk: report.logins.every((l) => l.roleOk && l.hasCookie),
    allMeSessionsOk: report.sessionMe.every((s) => s.meMatchesLogin),
    guestPostBillingForbidden: report.rbacApiGates.some(
      (g) => g.userId === "GUEST01" && g.method === "POST" && g.path === "/api/billing" && g.status === 403
    ),
    operatorPostCustomersForbidden: report.rbacApiGates.some(
      (g) => g.userId === "AL002" && g.method === "POST" && g.path === "/api/customers" && g.status === 403
    ),
    adminGetEmployeesAllowed: report.rbacApiGates.some(
      (g) => g.userId === "ADMIN01" && g.method === "GET" && g.path === "/api/employees" && g.status === 200
    ),
    guestGetEmployeesForbidden: report.rbacApiGates.some(
      (g) => g.userId === "GUEST01" && g.method === "GET" && g.path === "/api/employees" && g.status === 403
    )
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
