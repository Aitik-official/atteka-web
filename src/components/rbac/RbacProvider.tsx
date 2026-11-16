"use client";

import React, { createContext, useContext, useMemo } from "react";
import {
  type AppRole,
  type Permission,
  normalizeRole,
  hasPermission,
  canAccessDashboardPath,
  canAccessModule,
  canMutate
} from "@/lib/rbacPolicy";

type RbacContextValue = {
  role: AppRole;
  can: (permission: Permission) => boolean;
  canPath: (pathname: string) => boolean;
  canModule: (moduleKey: string) => boolean;
  canWrite: boolean;
};

const RbacContext = createContext<RbacContextValue>({
  role: "OPERATOR",
  can: () => false,
  canPath: () => false,
  canModule: () => false,
  canWrite: false
});

export function RbacProvider({
  role,
  children
}: {
  role: string;
  children: React.ReactNode;
}) {
  const value = useMemo<RbacContextValue>(() => {
    const normalized = normalizeRole(role);
    return {
      role: normalized,
      can: (permission) => hasPermission(normalized, permission),
      canPath: (pathname) => canAccessDashboardPath(normalized, pathname),
      canModule: (moduleKey) => canAccessModule(normalized, moduleKey),
      canWrite: canMutate(normalized)
    };
  }, [role]);

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export function useRbac(): RbacContextValue {
  return useContext(RbacContext);
}
