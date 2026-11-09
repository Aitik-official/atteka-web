"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import type { LucideIcon } from "lucide-react";

export type HubCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export function SectionHub({ title, cards }: { title: string; cards: HubCard[] }) {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <WcvRibbonHeader title={title} />
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
