/**
 * Edge-safe RBAC policy (no Node-only imports).
 * Used by middleware, API guards, and UI menu filtering.
 */

export type AppRole = "ADMIN" | "OPERATOR" | "ACCOUNTS" | "MANAGER" | "GUEST";

export type Permission =
  | "operations.read"
  | "operations.write"
  | "finance.read"
  | "finance.write"
  | "crm.read"
  | "crm.write"
  | "fleet.read"
  | "fleet.write"
  | "tracking.read"
  | "exceptional.read"
  | "exceptional.write"
  | "reports.read"
  | "admin.read"
  | "admin.write"
  | "masters.read"
  | "masters.write";

export const ALL_ROLES: AppRole[] = [
  "ADMIN",
  "OPERATOR",
  "ACCOUNTS",
  "MANAGER",
  "GUEST"
];

/** Allow-lists aligned with ROLE_PERMISSIONS (for requireApiSession call sites). */
export const WRITE_FINANCE: AppRole[] = ["ADMIN", "ACCOUNTS", "MANAGER", "OPERATOR"];
export const WRITE_OPS: AppRole[] = ["ADMIN", "OPERATOR", "MANAGER"];
export const WRITE_MASTERS: AppRole[] = ["ADMIN", "MANAGER"];
export const WRITE_ADMIN: AppRole[] = ["ADMIN"];
export const WRITE_EXCEPTIONAL: AppRole[] = ["ADMIN", "MANAGER", "ACCOUNTS"];
export const READ_ANY: AppRole[] = ["ADMIN", "OPERATOR", "ACCOUNTS", "MANAGER", "GUEST"];

const ROLE_PERMISSIONS: Record<AppRole, Permission[] | "*"> = {
  ADMIN: "*",
  MANAGER: [
    "operations.read",
    "operations.write",
    "finance.read",
    "finance.write",
    "crm.read",
    "crm.write",
    "fleet.read",
    "fleet.write",
    "tracking.read",
    "exceptional.read",
    "exceptional.write",
    "reports.read",
    "admin.read",
    "masters.read",
    "masters.write"
  ],
  OPERATOR: [
    "operations.read",
    "operations.write",
    "finance.read",
    "finance.write",
    "crm.read",
    "crm.write",
    "fleet.read",
    "fleet.write",
    "tracking.read",
    "reports.read",
    "masters.read"
  ],
  ACCOUNTS: [
    "operations.read",
    "finance.read",
    "finance.write",
    "crm.read",
    "fleet.read",
    "tracking.read",
    "exceptional.read",
    "exceptional.write",
    "reports.read",
    "masters.read"
  ],
  GUEST: [
    "operations.read",
    "finance.read",
    "crm.read",
    "fleet.read",
    "tracking.read",
    "reports.read",
    "masters.read"
  ]
};

type PathRule = {
  /** Path prefix (longest match wins). */
  prefix: string;
  read: Permission;
  write?: Permission;
};

/** Dashboard page access by path prefix. */
const DASHBOARD_RULES: PathRule[] = [
  { prefix: "/dashboard/admin", read: "admin.read", write: "admin.write" },
  { prefix: "/dashboard/masters", read: "masters.read", write: "masters.write" },
  { prefix: "/dashboard/operations", read: "operations.read", write: "operations.write" },
  { prefix: "/dashboard/finance", read: "finance.read", write: "finance.write" },
  { prefix: "/dashboard/crm", read: "crm.read", write: "crm.write" },
  { prefix: "/dashboard/fleet", read: "fleet.read", write: "fleet.write" },
  { prefix: "/dashboard/tracking", read: "tracking.read" },
  { prefix: "/dashboard/exceptional", read: "exceptional.read", write: "exceptional.write" },
  { prefix: "/dashboard/reports", read: "reports.read" }
];

/** API access by path prefix. */
const API_RULES: PathRule[] = [
  { prefix: "/api/employees", read: "admin.read", write: "admin.write" },
  { prefix: "/api/email-config", read: "admin.read", write: "admin.write" },
  { prefix: "/api/exceptional", read: "exceptional.read", write: "exceptional.write" },
  { prefix: "/api/consignments", read: "operations.read", write: "operations.write" },
  { prefix: "/api/tripsheets", read: "operations.read", write: "operations.write" },
  { prefix: "/api/operations", read: "operations.read", write: "operations.write" },
  { prefix: "/api/billing", read: "finance.read", write: "finance.write" },
  { prefix: "/api/mr", read: "finance.read", write: "finance.write" },
  { prefix: "/api/finance", read: "finance.read", write: "finance.write" },
  { prefix: "/api/gst", read: "finance.read", write: "finance.write" },
  { prefix: "/api/bank", read: "finance.read", write: "finance.write" },
  { prefix: "/api/reports", read: "reports.read" },
  { prefix: "/api/crm", read: "crm.read", write: "crm.write" },
  { prefix: "/api/fleet", read: "fleet.read", write: "fleet.write" },
  { prefix: "/api/tracking", read: "tracking.read" },
  { prefix: "/api/customers", read: "masters.read", write: "masters.write" },
  { prefix: "/api/customer-gst", read: "masters.read", write: "masters.write" },
  { prefix: "/api/vendors", read: "masters.read", write: "masters.write" },
  { prefix: "/api/vendor-gst", read: "masters.read", write: "masters.write" },
  { prefix: "/api/vehicles", read: "masters.read", write: "masters.write" },
  { prefix: "/api/branches", read: "masters.read", write: "masters.write" },
  { prefix: "/api/routes", read: "masters.read", write: "masters.write" },
  { prefix: "/api/ftl-types", read: "masters.read", write: "masters.write" },
  { prefix: "/api/sac-codes", read: "masters.read", write: "masters.write" },
  { prefix: "/api/docket-numbers", read: "masters.read", write: "masters.write" },
  { prefix: "/api/driving-licence", read: "masters.read", write: "masters.write" },
  { prefix: "/api/upload", read: "operations.read", write: "operations.write" }
];

const ALWAYS_ALLOWED_DASHBOARD = new Set([
  "/dashboard",
  "/dashboard/",
  "/dashboard/profile",
  "/dashboard/access-denied"
]);

const PUBLIC_API = new Set(["/api/auth/login", "/api/auth/logout"]);

/** Sidebar / home module gate (prevents cross-module link leaks e.g. masters under Admin). */
export const MODULE_READ_PERMISSION: Record<string, Permission> = {
  operations: "operations.read",
  finance: "finance.read",
  crm: "crm.read",
  fleet: "fleet.read",
  tracking: "tracking.read",
  exceptional: "exceptional.read",
  reports: "reports.read",
  admin: "admin.read",
  masters: "masters.read"
};

export function canAccessModule(role: string, moduleKey: string): boolean {
  const perm = MODULE_READ_PERMISSION[moduleKey];
  if (!perm) return true;
  return hasPermission(role, perm);
}

/** Built-in demo accounts used for RBAC testing (override DB when these IDs login). */
export const DEMO_RBAC_USERS: Record<
  string,
  { name: string; role: AppRole; branchCode: string; operatingLocation: string; financialYear: string }
> = {
  AL002: {
    name: "ANISHA OZARKAR",
    role: "OPERATOR",
    branchCode: "MUM",
    operatingLocation: "MUMBAI CENTRAL",
    financialYear: "2026-2027"
  },
  DEMO01: {
    name: "DEMO OPERATOR",
    role: "OPERATOR",
    branchCode: "MUM",
    operatingLocation: "MUMBAI CENTRAL",
    financialYear: "2026-2027"
  },
  ADMIN01: {
    name: "ADMINISTRATOR",
    role: "ADMIN",
    branchCode: "MUM",
    operatingLocation: "MUMBAI CENTRAL",
    financialYear: "2026-2027"
  },
  MGR01: {
    name: "BRANCH MANAGER",
    role: "MANAGER",
    branchCode: "MUM",
    operatingLocation: "MUMBAI CENTRAL",
    financialYear: "2026-2027"
  },
  ACC01: {
    name: "ACCOUNTS USER",
    role: "ACCOUNTS",
    branchCode: "MUM",
    operatingLocation: "MUMBAI CENTRAL",
    financialYear: "2026-2027"
  },
  GUEST01: {
    name: "GUEST VIEWER",
    role: "GUEST",
    branchCode: "MUM",
    operatingLocation: "MUMBAI CENTRAL",
    financialYear: "2026-2027"
  }
};

export function normalizeRole(role: string | undefined | null): AppRole {
  const r = String(role || "OPERATOR").toUpperCase() as AppRole;
  if (ALL_ROLES.includes(r)) return r;
  return "OPERATOR";
}

export function hasPermission(role: string, permission: Permission): boolean {
  const r = normalizeRole(role);
  const perms = ROLE_PERMISSIONS[r];
  if (perms === "*") return true;
  return perms.includes(permission);
}

export function canAccess(role: string, allowed: AppRole[]): boolean {
  const r = normalizeRole(role);
  if (r === "ADMIN") return true;
  return allowed.includes(r);
}

function matchRule(pathname: string, rules: PathRule[]): PathRule | null {
  let best: PathRule | null = null;
  for (const rule of rules) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      if (!best || rule.prefix.length > best.prefix.length) best = rule;
    }
  }
  return best;
}

export function canAccessDashboardPath(role: string, pathname: string): boolean {
  const path = pathname.split("?")[0] || pathname;
  if (ALWAYS_ALLOWED_DASHBOARD.has(path) || path === "/dashboard") return true;
  if (path.startsWith("/dashboard/access-denied")) return true;
  if (path.startsWith("/dashboard/profile")) return true;

  const rule = matchRule(path, DASHBOARD_RULES);
  if (!rule) {
    // Unknown dashboard page: allow any authenticated role
    return true;
  }
  return hasPermission(role, rule.read);
}

function isMutatingMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE";
}

export function canAccessApiPath(role: string, pathname: string, method: string): boolean {
  const path = pathname.split("?")[0] || pathname;
  if (PUBLIC_API.has(path)) return true;
  if (path.startsWith("/api/auth/")) return true;

  const rule = matchRule(path, API_RULES);
  if (!rule) {
    // Unmapped API: authenticated users may read; only non-GUEST may mutate
    if (isMutatingMethod(method)) {
      return normalizeRole(role) !== "GUEST";
    }
    return true;
  }

  if (isMutatingMethod(method)) {
    const writePerm = rule.write;
    if (!writePerm) return false; // read-only API surface
    return hasPermission(role, writePerm);
  }

  return hasPermission(role, rule.read);
}

/** True if role may perform any write action in the app. */
export function canMutate(role: string): boolean {
  const r = normalizeRole(role);
  return r !== "GUEST";
}

export function permissionsForRole(role: string): Permission[] | "*" {
  return ROLE_PERMISSIONS[normalizeRole(role)];
}
