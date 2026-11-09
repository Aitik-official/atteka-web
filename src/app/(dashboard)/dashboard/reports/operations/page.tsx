"use client";

import React from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import {
  FileText,
  AlertCircle,
  Truck,
  BarChart2,
  Layers,
  FileSpreadsheet,
  Camera,
  FileCheck2
} from "lucide-react";

export default function OperationReportsHubPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Authentic WebCoreVision Ribbon Header matching image */}
      <WcvRibbonHeader title="Operation Reports" />

      {/* 8 Action Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <WcvActionCard
          title="CN Register"
          description="Consignment Register / Booking Register"
          href="/dashboard/reports/operations/consignment-register"
          icon={FileText}
        />
        <WcvActionCard
          title="Undeliverd CN Register"
          description="Consignment Register - Undelivered"
          href="/dashboard/reports/operations/consignment-register?undelivered=1"
          icon={AlertCircle}
        />
        <WcvActionCard
          title="Delivery Register"
          description="Booking Register - Delivered"
          href="/dashboard/reports/operations/delivery-register"
          icon={Truck}
        />
        <WcvActionCard
          title="Booking Summary"
          description="Booking Summary"
          href="/dashboard/reports/operations/booking-summary"
          icon={BarChart2}
        />

        {/* Row 2 */}
        <WcvActionCard
          title="PDC Register"
          description="PDC Register"
          href="/dashboard/reports/operations/pdc-register"
          icon={Layers}
        />
        <WcvActionCard
          title="PDC Register [Docket wise]"
          description="PDC Register [Docket wise]"
          href="/dashboard/reports/operations/pdc-register-docket-wise"
          icon={FileSpreadsheet}
        />
        <WcvActionCard
          title="Scan POD/PODs Report"
          description="Scan POD/PODs Report"
          href="/dashboard/reports/operations/scan-pod"
          icon={Camera}
        />
        <WcvActionCard
          title="DSR New Report"
          description="Proposed DSR Report"
          href="/dashboard/reports/operations/dsr"
          icon={FileCheck2}
        />
      </div>
    </div>
  );
}

