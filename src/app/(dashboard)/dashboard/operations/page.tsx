"use client";

import { SectionHub } from "@/components/common/SectionHub";
import { FileText, Package, Printer, Route, Truck } from "lucide-react";

export default function OperationsHubPage() {
  return (
    <SectionHub
      title="Operations"
      cards={[
        {
          title: "Freight Booking",
          description: "Freight booking",
          href: "/dashboard/operations/freight-booking",
          icon: Package
        },
        {
          title: "CN Operations [System]",
          description: "CN operations",
          href: "/dashboard/operations/cn-operations",
          icon: FileText
        },
        {
          title: "New CN Booking",
          description: "Create new CN",
          href: "/dashboard/operations/new-cn",
          icon: FileText
        },
        {
          title: "TripSheet Operations",
          description: "Tripsheets & loading",
          href: "/dashboard/operations/tripsheets",
          icon: Truck
        },
        {
          title: "View Print Document",
          description: "Print documents",
          href: "/dashboard/operations/view-print",
          icon: Printer
        },
        {
          title: "Consignments & Dockets",
          description: "Docket register",
          href: "/dashboard/operations/dockets",
          icon: Route
        }
      ]}
    />
  );
}
