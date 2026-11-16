"use client";

import { SectionHub } from "@/components/common/SectionHub";
import { AlertTriangle, Landmark, Truck, Wallet } from "lucide-react";

export default function ExceptionalHubPage() {
  return (
    <SectionHub
      title="Exceptional"
      subtitle="Controlled corrections & exceptions"
      description="Use Operation for document fixes. Finance exceptions stay locked until your role allows them."
      primaryAction={{
        label: "Operation",
        href: "/dashboard/exceptional/operation"
      }}
      cards={[
        {
          title: "Operation",
          description: "Exceptional operations",
          href: "/dashboard/exceptional/operation",
          icon: AlertTriangle
        },
        {
          title: "Finance",
          description: "Exceptional finance",
          href: "/dashboard/exceptional/finance",
          icon: Wallet
        },
        {
          title: "Bank Reconciliation Statement",
          description: "BRS",
          href: "/dashboard/exceptional/brs",
          icon: Landmark
        },
        {
          title: "Company Vehicle Exceptional",
          description: "Vehicle exceptions",
          href: "/dashboard/exceptional/vehicle",
          icon: Truck
        }
      ]}
    />
  );
}
