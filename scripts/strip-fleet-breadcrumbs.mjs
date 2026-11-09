import fs from "fs";

const files = [
  "src/app/(dashboard)/dashboard/fleet/trip-management/trip-settlement/page.tsx",
  "src/app/(dashboard)/dashboard/fleet/trip-management/voucher-payment/page.tsx",
  "src/app/(dashboard)/dashboard/fleet/trip-management/view-print-trip-settlement/page.tsx",
  "src/app/(dashboard)/dashboard/fleet/trip-management/view-print-vehicle-advance/page.tsx"
];

for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  s = s.replace(/\s*CompanyVehicleBreadcrumb,?\s*/g, "\n  ");
  s = s.replace(/\s*<CompanyVehicleBreadcrumb[\s\S]*?\/>\s*/g, "\n");
  s = s.replace(/import\s*\{\s*,/g, "import { ");
  s = s.replace(/,\s*,/g, ",");
  s = s.replace(/\{\s+/g, "{ ");
  fs.writeFileSync(f, s);
  console.log("cleaned", f);
}
