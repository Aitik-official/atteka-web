"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Edit3, Printer, PlusCircle } from "lucide-react";

export default function CnOperationsHubPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader
        title="CN Operations & Consignment Management"
        subtitle="Operations • Module C019 • Consignment Note editing, search, and document printing"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <WcvActionCard
          title="Edit Consignment (CN)"
          description="Browse pending CNs by date or CN No, then open for edit."
          href="/dashboard/operations/cn-operations/edit-cns"
          icon={Edit3}
        />
        <WcvActionCard
          title="View & Print CN"
          description="Search by docket date or CN No, then view / print consignments."
          href="/dashboard/operations/cn-operations/view-print-cn"
          icon={Printer}
        />
        <WcvActionCard
          title="Book New Consignment"
          description="Create a fresh CN with GST auto-calculation, rate matrix lookup, and multi-piece package weight tags."
          href="/dashboard/operations/new-cn"
          icon={PlusCircle}
        />
      </div>
    </div>
  );
}
