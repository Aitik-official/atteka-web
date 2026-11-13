import { NextRequest, NextResponse } from "next/server";
import { getSession, type UserSession } from "@/lib/auth";

export type AppRole = "ADMIN" | "OPERATOR" | "ACCOUNTS" | "MANAGER" | "GUEST";

/** Replica: OPERATOR may bill/collect; GUEST is read-only. */
const WRITE_FINANCE: AppRole[] = ["ADMIN", "ACCOUNTS", "MANAGER", "OPERATOR"];
const WRITE_OPS: AppRole[] = ["ADMIN", "OPERATOR", "MANAGER", "ACCOUNTS"];
const WRITE_MASTERS: AppRole[] = ["ADMIN", "MANAGER"];

export const RBAC = {
  financeWrite: WRITE_FINANCE,
  opsWrite: WRITE_OPS,
  mastersWrite: WRITE_MASTERS,
  anyAuth: ["ADMIN", "OPERATOR", "ACCOUNTS", "MANAGER", "GUEST"] as AppRole[]
};

function normalizeRole(role: string): AppRole {
  const r = String(role || "OPERATOR").toUpperCase() as AppRole;
  if (["ADMIN", "OPERATOR", "ACCOUNTS", "MANAGER", "GUEST"].includes(r)) return r;
  return "OPERATOR";
}

export function canAccess(role: string, allowed: AppRole[]): boolean {
  const r = normalizeRole(role);
  if (r === "ADMIN") return true;
  return allowed.includes(r);
}

/** API guard: valid JWT session + optional role allow-list. */
export async function requireApiSession(
  _req?: NextRequest,
  allowedRoles?: AppRole[]
): Promise<{ session: UserSession } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    };
  }
  if (allowedRoles && !canAccess(session.role, allowedRoles)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: `Forbidden — role ${session.role} cannot perform this action`
        },
        { status: 403 }
      )
    };
  }
  return { session };
}
