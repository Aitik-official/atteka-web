"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { resolveBreadcrumbs } from "@/lib/breadcrumbs";
import { WcvBreadcrumb } from "@/components/common/WcvBreadcrumb";

export function DashboardBreadcrumbs() {
  const pathname = usePathname() || "";
  const isHome =
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname === "/dashboard/" ||
    pathname === "";

  const items = useMemo(
    () => (isHome ? [] : resolveBreadcrumbs(pathname)),
    [pathname, isHome]
  );

  if (isHome || !items.length) return null;

  return (
    <div className="mb-3" data-dashboard-breadcrumb>
      <WcvBreadcrumb items={items} />
    </div>
  );
}
