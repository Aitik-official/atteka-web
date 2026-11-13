"use client";

import React from "react";
import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/breadcrumbs";

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * WebCoreVision-style crumbs: Admin > Company Structure
 * Parents: blue underlined links. Current: blue (no underline).
 */
export function WcvBreadcrumb({ items, className = "" }: Props) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] leading-5 ${className}`}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && <span className="text-slate-400 select-none px-0.5">&gt;</span>}
            {isLast || !item.href ? (
              <span
                className="text-[#0171d3] font-medium truncate max-w-[280px] sm:max-w-none"
                aria-current={isLast ? "page" : undefined}
                title={item.label}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-[#0171d3] underline underline-offset-2 hover:text-blue-800 truncate max-w-[200px]"
                title={item.label}
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
