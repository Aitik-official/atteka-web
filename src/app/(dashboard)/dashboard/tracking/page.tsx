"use client";

import { SectionHub } from "@/components/common/SectionHub";
import { MapPin, Users } from "lucide-react";

export default function TrackingHubPage() {
  return (
    <SectionHub
      title="Tracking"
      cards={[
        {
          title: "Tracking Documents",
          description: "CN / THC / PDC tracking",
          href: "/dashboard/tracking/documents",
          icon: MapPin
        },
        {
          title: "Track Customer/Vendor",
          description: "Party tracking",
          href: "/dashboard/tracking/party",
          icon: Users
        }
      ]}
    />
  );
}
