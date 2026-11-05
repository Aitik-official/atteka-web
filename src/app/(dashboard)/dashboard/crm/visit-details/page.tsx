"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { CalendarCheck, FileSpreadsheet } from "lucide-react";
import { UpdateVisitDetailsPanel } from "@/components/crm/UpdateVisitDetailsPanel";
import { QuotationMasterPanel } from "@/components/crm/QuotationMasterPanel";

export default function VisitDetailsHubPage() {
  const [activeModule, setActiveModule] = useState<"hub" | "visit" | "quotation">("hub");

  if (activeModule === "visit") {
    return <UpdateVisitDetailsPanel onBack={() => setActiveModule("hub")} />;
  }

  if (activeModule === "quotation") {
    return <QuotationMasterPanel onBack={() => setActiveModule("hub")} />;
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Vist Details" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Update Visit Details"
          description="Log client meetings & commercial discussions"
          onClick={() => setActiveModule("visit")}
          icon={CalendarCheck}
        />
        <WcvActionCard
          title="Quotation"
          description="Generate client tariff quotation sheets"
          onClick={() => setActiveModule("quotation")}
          icon={FileSpreadsheet}
        />
      </div>
    </div>
  );
}
