"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { FileBadge, CreditCard } from "lucide-react";
import { DrivingLicenceApiPanel } from "@/components/admin/DrivingLicenceApiPanel";
import { PanCardApiPanel } from "@/components/admin/PanCardApiPanel";

export default function APIsAdminHubPage() {
  const [activeModule, setActiveModule] = useState<"hub" | "dl" | "pan">("hub");

  if (activeModule === "dl") {
    return <DrivingLicenceApiPanel onBack={() => setActiveModule("hub")} />;
  }

  if (activeModule === "pan") {
    return <PanCardApiPanel onBack={() => setActiveModule("hub")} />;
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="APIs" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Driving Licence API"
          description="Verify Driver Licence via MoRTH Sarathi"
          onClick={() => setActiveModule("dl")}
          icon={FileBadge}
        />
        <WcvActionCard
          title="Pan Card API"
          description="Verify Vendor PAN with NSDL / Income Tax"
          onClick={() => setActiveModule("pan")}
          icon={CreditCard}
        />
      </div>
    </div>
  );
}
