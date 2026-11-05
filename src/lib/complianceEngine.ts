export interface VehicleComplianceItem {
  name: "Fitness" | "Insurance" | "National Permit" | "PUC" | "Road Tax";
  expiryDate: string; // ISO date string YYYY-MM-DD
  daysRemaining: number;
  status: "VALID" | "EXPIRING_SOON" | "EXPIRED";
}

export interface VehicleComplianceSummary {
  vehicleRegNo: string;
  vehicleType: string;
  driverName?: string;
  driverPhone?: string;
  items: VehicleComplianceItem[];
  hasExpired: boolean;
  hasWarning: boolean;
}

export function computeVehicleCompliance(vehicle: {
  registrationNumber: string;
  vehicleType?: string;
  fitnessExpiryDate?: string;
  insuranceExpiryDate?: string;
  nationalPermitExpiryDate?: string;
  driverPhone?: string;
  driverName?: string;
}): VehicleComplianceSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDoc = (name: VehicleComplianceItem["name"], dateStr?: string): VehicleComplianceItem => {
    if (!dateStr) {
      return { name, expiryDate: "Not Recorded", daysRemaining: 0, status: "EXPIRING_SOON" };
    }
    const exp = new Date(dateStr);
    const diffTime = exp.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status: VehicleComplianceItem["status"] = "VALID";
    if (days < 0) {
      status = "EXPIRED";
    } else if (days <= 30) {
      status = "EXPIRING_SOON";
    }

    return {
      name,
      expiryDate: exp.toISOString().slice(0, 10),
      daysRemaining: days,
      status
    };
  };

  const items: VehicleComplianceItem[] = [
    checkDoc("Fitness", vehicle.fitnessExpiryDate),
    checkDoc("Insurance", vehicle.insuranceExpiryDate),
    checkDoc("National Permit", vehicle.nationalPermitExpiryDate)
  ];

  const hasExpired = items.some((i) => i.status === "EXPIRED");
  const hasWarning = items.some((i) => i.status === "EXPIRING_SOON");

  return {
    vehicleRegNo: vehicle.registrationNumber,
    vehicleType: vehicle.vehicleType || "32 FT Container",
    driverName: vehicle.driverName || "Fleet In-charge",
    driverPhone: vehicle.driverPhone || "9820199482",
    items,
    hasExpired,
    hasWarning
  };
}

export function generateWhatsAppExpiryMessage(summary: VehicleComplianceSummary): string {
  const expiredDocs = summary.items
    .filter((i) => i.status === "EXPIRED" || i.status === "EXPIRING_SOON")
    .map(
      (i) =>
        `• ${i.name}: ${i.status === "EXPIRED" ? "❌ EXPIRED" : `⚠️ EXPIRING in ${i.daysRemaining} days`} (${i.expiryDate})`
    )
    .join("\n");

  return encodeURIComponent(
    `*🚨 ATTEKA LOGISTICS - FLEET COMPLIANCE ALERT*\n\n` +
      `Vehicle: *${summary.vehicleRegNo}* (${summary.vehicleType})\n` +
      `Driver / In-charge: ${summary.driverName}\n\n` +
      `*Statutory Expiration Notice:*\n${expiredDocs}\n\n` +
      `Please renew immediate to avoid transit RTO penalty or vehicle seizure.\n` +
      `Contact Ulwe Fleet Desk: +91 98201 99482`
  );
}

