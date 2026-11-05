"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Users, ShieldCheck, Truck, CheckCircle2, FileCheck } from "lucide-react";
import { VendorMasterPanel } from "@/components/admin/VendorMasterPanel";
import { VendorApprovalPanel } from "@/components/admin/VendorApprovalPanel";
import { VendorGstRegistrationPanel } from "@/components/admin/VendorGstRegistrationPanel";

export default function BusinessPartnersAdminHubPage() {
  const [activeModule, setActiveModule] = useState<"hub" | "vendor" | "approval" | "vendor-gst">("hub");

  if (activeModule === "vendor") {
    return <VendorMasterPanel onBack={() => setActiveModule("hub")} />;
  }

  if (activeModule === "approval") {
    return <VendorApprovalPanel onBack={() => setActiveModule("hub")} />;
  }

  if (activeModule === "vendor-gst") {
    return <VendorGstRegistrationPanel onBack={() => setActiveModule("hub")} />;
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Business Partners" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WcvActionCard
          title="Customer Master"
          description="Customer Master"
          href="/dashboard/masters/customers"
          icon={Users}
        />
        <WcvActionCard
          title="Customer GST Registration"
          description="BA Master"
          href="/dashboard/masters/customer-gst"
          icon={ShieldCheck}
        />
        <WcvActionCard
          title="Vendor Master"
          description="Vendor Master"
          onClick={() => setActiveModule("vendor")}
          icon={Truck}
        />
        <WcvActionCard
          title="Vendor Approval"
          description="Vendor Approval"
          onClick={() => setActiveModule("approval")}
          icon={CheckCircle2}
        />
        <WcvActionCard
          title="Vendor GST Registration"
          description="BA Master"
          onClick={() => setActiveModule("vendor-gst")}
          icon={FileCheck}
        />
      </div>
    </div>
  );
}
