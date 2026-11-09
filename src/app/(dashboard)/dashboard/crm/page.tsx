"use client";

import { SectionHub } from "@/components/common/SectionHub";
import { Activity, MapPinned, UserPlus } from "lucide-react";

export default function CrmHubPage() {
  return (
    <SectionHub
      title="CRM"
      cards={[
        {
          title: "Lead Details",
          description: "Leads",
          href: "/dashboard/crm/lead-details",
          icon: UserPlus
        },
        {
          title: "Visit Details",
          description: "Visits & quotations",
          href: "/dashboard/crm/visit-details",
          icon: MapPinned
        },
        {
          title: "Activity",
          description: "CRM activity",
          href: "/dashboard/crm/activity",
          icon: Activity
        }
      ]}
    />
  );
}
