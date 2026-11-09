"use client";

import { SectionHub } from "@/components/common/SectionHub";
import { Building2, Hash, Network, Settings, Shield, Wallet } from "lucide-react";

export default function AdminHubPage() {
  return (
    <SectionHub
      title="Admin"
      cards={[
        {
          title: "Company Structure",
          description: "Company structure",
          href: "/dashboard/admin/company-structure",
          icon: Building2
        },
        {
          title: "Business Partners",
          description: "Business partners",
          href: "/dashboard/admin/business-partners",
          icon: Network
        },
        {
          title: "Operations",
          description: "Admin operations",
          href: "/dashboard/admin/operations",
          icon: Settings
        },
        {
          title: "Docket Number Master",
          description: "Docket numbers",
          href: "/dashboard/masters/docket-numbers",
          icon: Hash
        },
        {
          title: "Finance & Accounts",
          description: "Finance admin",
          href: "/dashboard/admin/finance-accounts",
          icon: Wallet
        },
        {
          title: "APIs",
          description: "API configuration",
          href: "/dashboard/admin/apis",
          icon: Shield
        }
      ]}
    />
  );
}
