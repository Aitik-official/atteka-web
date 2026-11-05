/** Flat searchable catalog for global header autocomplete */

export type ModuleSearchItem = {
  id: string;
  label: string;
  code?: string;
  route: string;
  group: string;
  /** Extra keywords that should match besides label/code/group */
  keywords?: string[];
};

export const MODULE_SEARCH_CATALOG: ModuleSearchItem[] = [
  // Operations
  { id: "C009", label: "Freight Booking", code: "C009", route: "/dashboard/operations/freight-booking", group: "Operations" },
  { id: "C019", label: "CN Operations [System]", code: "C019", route: "/dashboard/operations/cn-operations", group: "Operations" },
  { id: "C010", label: "New CN Booking", code: "C010", route: "/dashboard/operations/new-cn", group: "Operations", keywords: ["cn", "docket"] },
  { id: "C035", label: "TripSheet Operations", code: "C035", route: "/dashboard/operations/tripsheets", group: "Operations" },
  { id: "C035P", label: "Prepare Loading Slip", code: "C035", route: "/dashboard/operations/tripsheets/prepare", group: "Operations", keywords: ["trip", "loading"] },
  { id: "C039", label: "View Print Document", code: "C039", route: "/dashboard/operations/view-print", group: "Operations" },
  { id: "C011", label: "Consignments & Dockets", code: "C011", route: "/dashboard/operations/dockets", group: "Operations", keywords: ["docket"] },
  { id: "C111T", label: "Live Tracking", code: "C111", route: "/dashboard/operations/tracking", group: "Operations", keywords: ["track"] },

  // Finance
  { id: "C002", label: "Finance", code: "C002", route: "/dashboard/finance/customer-billing", group: "Finance", keywords: ["fin"] },
  { id: "C181", label: "Vendor Billing", code: "C181", route: "/dashboard/finance/vendor-billing", group: "Finance" },
  { id: "C194", label: "Customer Billing", code: "C194", route: "/dashboard/finance/customer-billing", group: "Finance", keywords: ["transport bill", "bill"] },
  { id: "C194T", label: "Transport Bill Generation", code: "C194", route: "/dashboard/finance/customer-billing/transport-bill", group: "Finance", keywords: ["bill", "fin"] },
  { id: "C194V", label: "View / Print Bills", code: "C194", route: "/dashboard/finance/customer-billing/view-print-bills", group: "Finance" },
  { id: "C655", label: "Genrate E-Invoice (IRN)", code: "C655", route: "/dashboard/finance/e-invoice", group: "Finance" },
  { id: "C202", label: "MR Entry", code: "C202", route: "/dashboard/finance/mr-entry", group: "Finance" },
  { id: "C208", label: "Vouchers", code: "C208", route: "/dashboard/finance/vouchers", group: "Finance" },
  { id: "C215", label: "Cheque Management", code: "C215", route: "/dashboard/finance/cheque-management", group: "Finance" },
  { id: "C223", label: "Cash & Bank Statement", code: "C223", route: "/dashboard/finance/cash-bank-statement", group: "Finance", keywords: ["bank"] },
  { id: "C225", label: "Print Document [Dot-Matrix ]", code: "C225", route: "/dashboard/finance/print-dot-matrix", group: "Finance" },
  { id: "C782", label: "Bank Payment", code: "C782", route: "/dashboard/finance/bank-payment", group: "Finance", keywords: ["bank", "indus"] },

  // CRM
  { id: "C061", label: "Customer Master", code: "C061", route: "/dashboard/masters/customers", group: "CRM" },
  { id: "C062", label: "Customer GST Registration", code: "C062", route: "/dashboard/masters/customer-gst", group: "CRM" },
  { id: "C504", label: "Lead Details", code: "C504", route: "/dashboard/crm/lead-details", group: "CRM" },
  { id: "C505", label: "Vist Details", code: "C505", route: "/dashboard/crm/visit-details", group: "CRM", keywords: ["visit", "quotation"] },
  { id: "C916", label: "Activity", code: "C916", route: "/dashboard/crm/activity", group: "CRM" },

  // Fleet
  { id: "C749", label: "Trip Management", code: "C749", route: "/dashboard/fleet/trip-management", group: "Fleet" },
  { id: "C750", label: "Fuel and Toll Management", code: "C750", route: "/dashboard/fleet/fuel-toll", group: "Fleet" },
  { id: "C158V", label: "Vehicle Master", code: "C158", route: "/dashboard/masters/vehicles", group: "Fleet", keywords: ["veh", "fleet"] },

  // Tracking
  { id: "C111", label: "Tracking Douments", code: "C111", route: "/dashboard/tracking/documents", group: "Tracking" },
  { id: "C485", label: "Track Customer/Vendor", code: "C485", route: "/dashboard/tracking/party", group: "Tracking" },

  // Exceptional
  { id: "C117", label: "Operation", code: "C117", route: "/dashboard/operations/dockets", group: "Exceptional" },
  { id: "C132", label: "Finance", code: "C132", route: "/dashboard/exceptional/finance", group: "Exceptional", keywords: ["fin"] },
  { id: "C520", label: "Bank Reconciliation Statment", code: "C520", route: "/dashboard/exceptional/brs", group: "Exceptional" },
  { id: "C588", label: "Company Vechicle Exceptional", code: "C588", route: "/dashboard/exceptional/vehicle", group: "Exceptional" },
  {
    id: "C132F",
    label: "Docket Financial Completion",
    code: "C132",
    route: "/dashboard/exceptional/finance",
    group: "Exceptional",
    keywords: ["fin", "financial", "docket"]
  },
  {
    id: "C132P",
    label: "Edit PDC Non-Financial to Financial",
    code: "C132",
    route: "/dashboard/exceptional/finance",
    group: "Exceptional",
    keywords: ["fin", "financial", "pdc"]
  },

  // Reports
  { id: "C084", label: "Operation Report", code: "C084", route: "/dashboard/reports/operations", group: "Reports" },
  { id: "C085", label: "Finance", code: "C085", route: "/dashboard/reports/finance", group: "Reports", keywords: ["fin"] },
  { id: "C086", label: "Accounts", code: "C086", route: "/dashboard/reports/accounts", group: "Reports", keywords: ["trial"] },
  { id: "C840", label: "Purchase Report", code: "C840", route: "/dashboard/reports/purchase", group: "Reports" },
  { id: "C088", label: "ERP Tracking", code: "C088", route: "/dashboard/reports/erp-tracking", group: "Reports" },
  { id: "C486", label: "Final Accounts", code: "C486", route: "/dashboard/reports/final-accounts", group: "Reports", keywords: ["fin", "final"] },
  { id: "C576", label: "Company Vechicle Reports", code: "C576", route: "/dashboard/reports/company-vehicles", group: "Reports" },

  // Profile
  { id: "PROF", label: "Employee Profile Information", code: "PROF", route: "/dashboard/profile", group: "Profile", keywords: ["my profile", "profile"] },

  // Admin
  { id: "C052", label: "Company Structure", code: "C052", route: "/dashboard/admin/company-structure", group: "Admin" },
  { id: "C060", label: "Business Partners", code: "C060", route: "/dashboard/admin/business-partners", group: "Admin", keywords: ["vendor"] },
  { id: "C065", label: "Operations", code: "C065", route: "/dashboard/admin/operations", group: "Admin" },
  { id: "C066", label: "Docket Number Master", code: "C066", route: "/dashboard/masters/docket-numbers", group: "Admin" },
  { id: "C077", label: "Finance & Accounts", code: "C077", route: "/dashboard/admin/finance-accounts", group: "Admin", keywords: ["fin"] },
  { id: "C686", label: "APIs", code: "C686", route: "/dashboard/admin/apis", group: "Admin" }
];

export function searchModules(query: string, limit = 12): ModuleSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = MODULE_SEARCH_CATALOG.map((item) => {
    const label = item.label.toLowerCase();
    const code = (item.code || "").toLowerCase();
    const group = item.group.toLowerCase();
    const hay = [label, code, group, ...(item.keywords || [])].join(" ");

    let score = 0;
    if (label.startsWith(q)) score += 100;
    else if (label.includes(q)) score += 60;
    if (code === q || code.includes(q)) score += 80;
    if (group.startsWith(q) || group.includes(q)) score += 40;
    if ((item.keywords || []).some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()))) {
      score += 50;
    }
    if (!hay.includes(q) && score === 0) return null;
    // Prefer shorter label matches slightly
    score += Math.max(0, 20 - label.length / 4);
    return { item, score };
  }).filter(Boolean) as { item: ModuleSearchItem; score: number }[];

  scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
  return scored.slice(0, limit).map((s) => s.item);
}
