"use client";

import React from "react";
import Link from "next/link";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";

export type HubCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type HubPrimaryAction = {
  label: string;
  href: string;
};

export function SectionHub({
  title,
  subtitle,
  description,
  primaryAction,
  cards
}: {
  title: string;
  subtitle?: string;
  description?: string;
  primaryAction?: HubPrimaryAction;
  cards: HubCard[];
}) {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <WcvRibbonHeader
        title={title}
        subtitle={subtitle}
        action={
          primaryAction ? (
            <Link
              href={primaryAction.href}
              className="h-9 px-4 rounded-full bg-[#0171d3] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#015fae] shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {primaryAction.label}
            </Link>
          ) : undefined
        }
      />
      {description ? (
        <p className="text-xs text-slate-500 -mt-2 px-0.5 max-w-2xl leading-relaxed">{description}</p>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <WcvActionCard
            key={c.href + c.title}
            title={c.title}
            description={c.description}
            href={c.href}
            icon={c.icon}
          />
        ))}
      </div>
    </div>
  );
}
