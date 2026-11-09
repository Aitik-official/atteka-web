"use client";

import { SectionHub } from "@/components/common/SectionHub";
import { Building2, Car, Hash, Users, UserSquare2 } from "lucide-react";

export default function MastersHubPage() {
  return (
    <SectionHub
      title="Masters"
      cards={[
        {
          title: "Customer Master",
          description: "Customers",
          href: "/dashboard/masters/customers",
          icon: Users
        },
        {
          title: "Vendor Master",
          description: "Vendors",
          href: "/dashboard/masters/vendors",
          icon: UserSquare2
        },
        {
          title: "Vehicle Master",
          description: "Vehicles",
          href: "/dashboard/masters/vehicles",
          icon: Car
        },
        {
          title: "Branch Master",
          description: "Branches",
          href: "/dashboard/masters/branches",
          icon: Building2
        },
        {
          title: "Customer GST Registration",
          description: "Customer GST",
          href: "/dashboard/masters/customer-gst",
          icon: Users
        },
        {
          title: "Docket Number Master",
          description: "Docket numbers",
          href: "/dashboard/masters/docket-numbers",
          icon: Hash
        }
      ]}
    />
  );
}
