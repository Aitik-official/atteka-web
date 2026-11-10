"use client";

import React from "react";
import {
  ArrowLeftRight,
  Ban,
  FileEdit,
  MapPin,
  Route,
  Truck,
  Users,
  Building2,
  Hash
} from "lucide-react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { EXCEPTIONAL_OPERATION_MODULES } from "@/lib/exceptionalOperationModules";

const ICONS = [
  ArrowLeftRight,
  Ban,
  Truck,
  Route,
  Users,
  Hash,
  FileEdit,
  Building2,
  MapPin
] as const;

export default function ExceptionalOperationHubPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <WcvRibbonHeader title="Operation" subtitle="Exceptional • Operations correction tools" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXCEPTIONAL_OPERATION_MODULES.map((m, i) => {
          const Icon = ICONS[i] || FileEdit;
          return (
            <WcvActionCard
              key={m.slug}
              title={m.title}
              description={m.description}
              href={`/dashboard/exceptional/operation/${m.slug}`}
              icon={Icon}
            />
          );
        })}
      </div>
    </div>
  );
}
