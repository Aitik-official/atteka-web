"use client";

import { SectionHub } from "@/components/common/SectionHub";
import { Fuel, Truck, Car } from "lucide-react";

export default function FleetHubPage() {
  return (
    <SectionHub
      title="Fleet"
      cards={[
        {
          title: "Trip Management",
          description: "Company vehicle payment & settlements",
          href: "/dashboard/fleet/trip-management",
          icon: Truck
        },
        {
          title: "Fuel and Toll Management",
          description: "BPCL / fuel & toll",
          href: "/dashboard/fleet/fuel-toll",
          icon: Fuel
        },
        {
          title: "Vehicle Master",
          description: "Fleet vehicles",
          href: "/dashboard/masters/vehicles",
          icon: Car
        }
      ]}
    />
  );
}
