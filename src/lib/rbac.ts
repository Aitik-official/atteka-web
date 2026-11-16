import { NextRequest, NextResponse } from "next/server";
import { getSession, type UserSession } from "@/lib/auth";
import {
  type AppRole,
  type Permission,
  WRITE_FINANCE,
  WRITE_OPS,
  WRITE_MASTERS,
  WRITE_ADMIN,
  WRITE_EXCEPTIONAL,
  READ_ANY,
  normalizeRole,
  canAccess,
  hasPermission,
  canAccessDashboardPath,
  canAccessApiPath,
  canMutate,
  permissionsForRole
} from "@/lib/rbacPolicy";

export type { AppRole, Permission };
export {
  normalizeRole,
  canAccess,
  hasPermission,
  canAccessDashboardPath,
  canAccessApiPath,
  canMutate,
  permissionsForRole,
  WRITE_FINANCE,
  WRITE_OPS,
  WRITE_MASTERS,
  WRITE_ADMIN,
  WRITE_EXCEPTIONAL,
  READ_ANY
};

/** Named allow-lists for existing / new requireApiSession call sites. */
export const RBAC = {
  financeWrite: WRITE_FINANCE,
  opsWrite: WRITE_OPS,
  mastersWrite: WRITE_MASTERS,
  adminWrite: WRITE_ADMIN,
  exceptionalWrite: WRITE_EXCEPTIONAL,
  anyAuth: READ_ANY
};

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

/** API guard by permission key (preferred for new routes). */
export async function requirePermission(
  permission: Permission
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
  if (!hasPermission(session.role, permission)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: `Forbidden — role ${session.role} lacks ${permission}`
        },
        { status: 403 }
      )
    };
  }
  return { session };
}
