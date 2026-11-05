"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Receipt } from "lucide-react";
import { GstSacCodeMasterPanel } from "@/components/admin/GstSacCodeMasterPanel";

export default function FinanceAccountsAdminHubPage() {
  const [activeModule, setActiveModule] = useState<"hub" | "sac">("hub");

  if (activeModule === "sac") {
    return <GstSacCodeMasterPanel onBack={() => setActiveModule("hub")} />;
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Finance & Accounts" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="GST Sac Code Master"
          description="GST Sac Code Master"
          onClick={() => setActiveModule("sac")}
          icon={Receipt}
        />
      </div>
    </div>
  );
}
