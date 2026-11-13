import { MODULE_SEARCH_CATALOG } from "@/lib/moduleCatalog";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

/** Exact path label overrides (leaf or intermediate). */
const PATH_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/finance": "Finance",
  "/dashboard/finance/mr-entry": "MR",
  "/dashboard/finance/mr-entry/generate-bill-mr": "Generate Bill MR.",
  "/dashboard/finance/mr-entry/generate-bill-mr-rebate": "Generate Bill MR With Rebate",
  "/dashboard/finance/mr-entry/paid-topay-mr": "PaidToPayMR",
  "/dashboard/finance/mr-entry/view-print-mr": "View / Print MR",
  "/dashboard/finance/mr-entry/credit-note": "Generate Credit Note.",
  "/dashboard/finance/mr-entry/view-print-credit-note": "View Print Credit Note",
  "/dashboard/finance/mr-entry/credit-note-new": "Credit Note New",
  "/dashboard/finance/customer-billing": "Customer Billing",
  "/dashboard/finance/customer-billing/completion-financial": "Completion Financial",
  "/dashboard/finance/customer-billing/other-bill": "Other Bill Generation",
  "/dashboard/finance/customer-billing/customer-invoice": "Customer Invoice",
  "/dashboard/finance/customer-billing/download-multiple-pods": "Download Multiple PODs",
  "/dashboard/operations/cn-operations/edit-cns": "Edit Complete Pending CNs",
  "/dashboard/operations/cn-operations/view-print-cn": "View / Print CN",
  "/dashboard/operations/tripsheets/prepare-pickup-pdc": "Prepare Pickup PDC",
  "/dashboard/operations/tripsheets/prepare-delivery-pdc": "Prepare Delivery PDC",
  "/dashboard/operations/tripsheets/update-delivery-pdc": "Update Delivery PDC",
  "/dashboard/operations/view-print/delivery-pdc": "View/Print Delivery PDC",
  "/dashboard/operations/view-print/pickup-pdc": "View & Print Pickup PDC",
  "/dashboard/operations/tripsheets/prepare": "View Print Loading Sheet",
  "/dashboard/operations/tripsheets/prepare/new": "Prepare Trip Sheet",
  "/dashboard/finance/cash-bank-statement": "CBS Statement",
  "/dashboard/finance/cash-bank-statement/view-print-cbs": "View / Print CBS",
  "/dashboard/finance/cash-bank-statement/online-payment-report": "Online Payment Report",
  "/dashboard/finance/cash-bank-statement/online-payment-reprocess": "Online Payment Re-Process",
  "/dashboard/finance/cash-bank-statement/api-bank-statement": "API Bank Statement",
  "/dashboard/finance/billing": "Customer Billing",
  "/dashboard/finance/bank-statement": "View Bank Statement",
  "/dashboard/finance/bank-payment": "IndusInd Bank Online Payment Process",
  "/dashboard/finance/vendor-billing": "Vendor Billing",
  "/dashboard/finance/vendor-billing/pdc-freight-advance-single": "PDC Freight/Advance Payment [Single]",
  "/dashboard/finance/vendor-billing/pdc-freight-advance-multiple": "PDC Freight/Advance Payment [Multiple]",
  "/dashboard/finance/vendor-billing/pdc-balance-payment-single": "PDC Balance Payment [Single]",
  "/dashboard/finance/vendor-billing/pdc-balance-payment-multiple": "PDC Balance Payment [Multiple]",
  "/dashboard/finance/vendor-billing/tripsheet-advance-payment": "Dedicated Payment Entry",
  "/dashboard/finance/vendor-billing/tripsheet-balance-payment": "Dedicated Payment Entry",
  "/dashboard/finance/vendor-billing/vendor-bill-finalization": "Vendor Bill Finalization Process",
  "/dashboard/finance/print-dot-matrix": "Print Document [Dot-Matrix]",
  "/dashboard/finance/print-dot-matrix/pdc-freight-memo": "PDC Freight Memo",
  "/dashboard/finance/print-dot-matrix/print-vouchers": "Print Vouchers",
  "/dashboard/finance/print-dot-matrix/print-debit-advice": "View Print Debit Advice",
  "/dashboard/finance/print-dot-matrix/docket-print": "Print CN Number [Dot-Matrx]",
  "/dashboard/operations": "Operations",
  "/dashboard/operations/tracking": "Document Tracking",
  "/dashboard/fleet": "Fleet",
  "/dashboard/fleet/trip-management": "Trip Management",
  "/dashboard/fleet/fuel-toll": "Fuel and Toll Management",
  "/dashboard/tracking": "Tracking",
  "/dashboard/tracking/documents": "Tracking Documents",
  "/dashboard/tracking/party": "Track Customer/Vendor",
  "/dashboard/masters": "Masters",
  "/dashboard/crm": "CRM",
  "/dashboard/admin": "Admin",
  "/dashboard/exceptional": "Exceptional",
  "/dashboard/exceptional/operation": "Operation",
  "/dashboard/exceptional/operation/reassign-next-location": "Reassign Location to Dockets",
  "/dashboard/exceptional/operation/cancel-delivery-pdc": "PDC Cancellation",
  "/dashboard/exceptional/operation/edit-thc-vendor-date-vehicle": "THC To Assign Vendor",
  "/dashboard/exceptional/operation/change-route": "THC To Assign New Route",
  "/dashboard/exceptional/operation/edit-billing-party": "Edit Billing Party",
  "/dashboard/exceptional/operation/edit-manual-document-number": "Edit Manual Document Number",
  "/dashboard/exceptional/operation/edit-pdc-vendor-date-vehicle": "PDC To Assign Vendor",
  "/dashboard/exceptional/operation/edit-billing-party-branch-po": "Assign Billing Branch / Party / PO",
  "/dashboard/exceptional/operation/edit-from-to-location": "Edit From & To Location",
  "/dashboard/reports": "Reports",
  "/dashboard/reports/accounts": "Accounts",
  "/dashboard/reports/finance": "Finance",
  "/dashboard/reports/operations": "Operation Report",
  "/dashboard/reports/final-accounts": "Final Accounts",
  "/dashboard/reports/purchase": "Purchase Report",
  "/dashboard/reports/erp-tracking": "ERP Tracking",
  "/dashboard/reports/company-vehicles": "Company Vehicle Reports",
  "/dashboard/driver": "Driver",
  "/dashboard/profile": "Profile"
};

/** Build path→label map from module catalog (exact routes). */
function catalogPathLabels(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of MODULE_SEARCH_CATALOG) {
    if (m.route?.startsWith("/dashboard")) {
      map[m.route] = m.label;
    }
  }
  return map;
}

const CATALOG_PATH_LABELS = catalogPathLabels();

/** Shorter parent labels when a hub is used as an intermediate crumb. */
const PARENT_SHORT_LABELS: Record<string, string> = {
  "mr-entry": "MR",
  "customer-billing": "Customer Billing",
  "cash-bank-statement": "CBS Statement",
  "trip-management": "Trip Management",
  "fuel-toll": "Fuel & Toll",
  "final-accounts": "Final Accounts",
  accounts: "Accounts",
  operations: "Operations",
  documents: "Documents",
  finance: "Finance",
  reports: "Reports",
  fleet: "Fleet",
  tracking: "Tracking",
  masters: "Masters",
  crm: "CRM",
  admin: "Admin",
  exceptional: "Exceptional",
  tripsheets: "TripSheet",
  "cn-operations": "CN Operations"
};

/** Section index destinations (created hubs or first useful child). */
const SECTION_HOME: Record<string, string> = {
  finance: "/dashboard/finance",
  operations: "/dashboard/operations",
  fleet: "/dashboard/fleet",
  tracking: "/dashboard/tracking",
  masters: "/dashboard/masters",
  crm: "/dashboard/crm",
  admin: "/dashboard/admin",
  exceptional: "/dashboard/exceptional",
  reports: "/dashboard/reports",
  driver: "/dashboard/driver",
  profile: "/dashboard/profile"
};

const SEGMENT_LABELS: Record<string, string> = {
  finance: "Finance",
  operations: "Operations",
  fleet: "Fleet",
  tracking: "Tracking",
  masters: "Masters",
  crm: "CRM",
  admin: "Admin",
  exceptional: "Exceptional",
  operation: "Operation",
  "reassign-next-location": "Reassign Location to Dockets",
  "cancel-delivery-pdc": "PDC Cancellation",
  "edit-thc-vendor-date-vehicle": "THC To Assign Vendor",
  "change-route": "THC To Assign New Route",
  "edit-billing-party": "Edit Billing Party",
  "edit-manual-document-number": "Edit Manual Document Number",
  "edit-pdc-vendor-date-vehicle": "PDC To Assign Vendor",
  "edit-billing-party-branch-po": "Assign Billing Branch / Party / PO",
  "edit-from-to-location": "Edit From & To Location",
  reports: "Reports",
  accounts: "Accounts",
  "final-accounts": "Final Accounts",
  "mr-entry": "MR Entry",
  "generate-bill-mr": "Generate Bill MR.",
  "generate-bill-mr-rebate": "Generate Bill MR With Rebate",
  "paid-topay-mr": "PaidToPayMR",
  "view-print-mr": "View / Print MR",
  "credit-note": "Generate Credit Note.",
  "view-print-credit-note": "View Print Credit Note",
  "credit-note-new": "Credit Note New",
  "cash-bank-statement": "CBS Statement",
  "view-print-cbs": "View / Print CBS",
  "online-payment-report": "Online Payment Report",
  "online-payment-reprocess": "Online Payment Re-Process",
  "api-bank-statement": "API Bank Statement",
  "customer-billing": "Customer Billing",
  "completion-financial": "Completion Financial",
  "other-bill": "Other Bill Generation",
  "customer-invoice": "Customer Invoice",
  "download-multiple-pods": "Download Multiple PODs",
  "vendor-billing": "Vendor Billing",
  "pdc-freight-advance-single": "PDC Freight/Advance Payment [Single]",
  "pdc-freight-advance-multiple": "PDC Freight/Advance Payment [Multiple]",
  "pdc-balance-payment-single": "PDC Balance Payment [Single]",
  "pdc-balance-payment-multiple": "PDC Balance Payment [Multiple]",
  "tripsheet-advance-payment": "Dedicated Payment Entry",
  "tripsheet-balance-payment": "Dedicated Payment Entry",
  "vendor-bill-finalization": "Vendor Bill Finalization Process",
  vouchers: "Vouchers",
  "enter-vendor-invoice": "Vendor Invoice Entry",
  "enter-vendor-payment": "Vendor Invoice Payment",
  "debit-voucher": "Debit Voucher",
  "credit-voucher": "Credit Voucher",
  "contra-entry": "Contra Entry",
  "journal-entry": "Journal Entry",
  "view-print-vouchers": "View / Print Bills",
  "view-journal-vouchers": "View Journal Vouchers",
  "cancel-vendor-invoice": "Cancel Vendor Invoice",
  "cancel-vendor-payment": "Cancel Vendor Invoice Payment",
  "view-vendor-invoice": "View Vendor Invoice",
  "view-vendor-invoice-payment": "View Vendor Invoice Payment",
  "debit-note": "Generate Debit Note.",
  "view-print-vouchers-new": "View / Print Voucher",
  "view-cancel-vouchers": "View Cancel Voucher",
  "gstr2b-invoice-booking": "GSTR2B Invoice Booking",
  "cheque-management": "Cheque Management",
  "on-account-cheque-receipt": "On Account Receipts",
  "on-account-cheque-deposit": "On A/C Cheque Deposit",
  "assign-cheque-book": "Cheque Book Issue",
  "print-dot-matrix": "Print Document [Dot-Matrix]",
  "pdc-freight-memo": "PDC Freight Memo",
  "print-vouchers": "Print Vouchers",
  "print-debit-advice": "View Print Debit Advice",
  "docket-print": "Print CN Number [Dot-Matrx]",
  "e-invoice": "Genrate E-Invoice (IRN)",
  "authentication-token": "Authentication Token",
  "generate-irn": "Generate Invoice Reference Number (IRN)",
  "cancel-irn": "Cancel Invoice Reference Number (IRN)",
  "generate-credit-note-irn": "Genrate Credit Note (IRN)",
  billing: "Customer Billing",
  "bank-statement": "View Bank Statement",
  "bank-payment": "IndusInd Bank Online Payment Process",
  "general-ledger": "General Ledger",
  "subsidiary-ledger": "Subsidiary Ledger",
  "customer-ledger": "Customer Ledger",
  "branch-profit-loss": "Branch Profit and Loss Report",
  "trial-balance": "Trial Balance",
  "new-trial-balance": "New Trial Balance",
  "profit-loss": "Profit & Loss Statement",
  "balance-sheet": "Balance Sheet",
  "new-balance-sheet": "New Balance Sheet",
  "company-advance-payment": "Company Advance Payment Entry",
  "trip-settlement": "Trip Settlement",
  "view-print-trip-settlement": "View Print Trip Settlement",
  "view-print-vehicle-advance": "View Print Vehicle Advance Payment",
  "voucher-payment": "Voucher Payment",
  "bpcl-sale-transaction": "BPCL Sale Transaction",
  "transport-bill": "Transport Bill Generation",
  "view-print-bills": "View / Print Bills",
  "cn-freight-register": "CN Register With Freight Details",
  "unbilled-cn-register": "Un-Billed CN Register",
  "unbilled-branch-ageing": "Un-Billed O/S Branch wise ageing",
  "bills-generated": "Bills Generated Report",
  "bills-generated-docket-wise": "Bills Generated Report [Docket wise]",
  "voucher-wise-invoice": "Voucher Wise Invoice Report",
  "bill-register-collection": "Bill Register With Collection Details",
  "submitted-os-detail": "Submitted O/S Detail",
  "submitted-os-without-on-account": "Submitted O/S Detail [Without On Account]",
  "submitted-os-docket-wise": "Submitted O/S [Docket wise]",
  "submitted-os-branch-ageing": "Submitted O/S Branch wise ageing",
  "submitted-os-party-ageing": "Submitted O/S Party wise ageing",
  "docket-wise-octroi": "Docket Wise Octroi Details",
  "mr-wise-collection": "MR wise Collection Report",
  "party-wise-bill-register": "Party Wise Bill Register",
  "consignment-register": "Consignment Register",
  "delivery-register": "Delivery Register",
  "booking-summary": "Booking Summary",
  "pdc-register": "PDC Register",
  "pdc-register-docket-wise": "PDC Register [Docket wise]",
  "scan-pod": "Scan POD/PODs Report",
  dsr: "Proposed DSR Report",
  "cn-tracking": "CN Tracking",
  "new-cn-tracking": "New CN Tracking",
  "track-documents": "Track Documents [CN/TC/THC/PDC]",
  "company-vehicles": "Company Vehicle Reports",
  "erp-tracking": "ERP Tracking",
  purchase: "Purchase Report",
  "new-cn": "New CN Booking",
  "freight-booking": "Freight Booking",
  "cn-operations": "CN Operations [System]",
  "edit-cns": "Edit Complete Pending CNs",
  "view-print-cn": "View / Print CN",
  "view-print": "View Print Document",
  "delivery-pdc": "View/Print Delivery PDC",
  "pickup-pdc": "View & Print Pickup PDC",
  tripsheets: "TripSheet Operations",
  "prepare-pickup-pdc": "Prepare Pickup PDC",
  "prepare-delivery-pdc": "Prepare Delivery PDC",
  "update-delivery-pdc": "Update Delivery PDC",
  prepare: "View Print Loading Sheet",
  new: "Prepare Trip Sheet",
  dockets: "Consignments & Dockets",
  print: "Print",
  customers: "Customer Master",
  vendors: "Vendor Master",
  vehicles: "Vehicle Master",
  branches: "Branch Master",
  "customer-gst": "Customer GST Registration",
  "docket-numbers": "Docket Number Master",
  "lead-details": "Lead Details",
  "visit-details": "Vist Details",
  activity: "Activity",
  "company-structure": "Company Structure",
  "business-partners": "Business Partners",
  "finance-accounts": "Finance & Accounts",
  apis: "APIs",
  brs: "Bank Reconciliation Statment",
  vehicle: "Company Vechicle Exceptional",
  party: "Track Customer/Vendor",
  documents: "Tracking Documents",
  "trip-management": "Trip Management",
  "fuel-toll": "Fuel and Toll Management",
  driver: "Driver",
  profile: "Profile"
};

function titleCaseSegment(seg: string) {
  if (!seg || seg.startsWith("[")) return seg.replace(/^\[|\]$/g, "");
  return seg
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/** Runtime ids (docket nos, mongo ids, slugs) — not named route folders. */
function looksLikeDynamicId(seg: string) {
  if (!seg) return false;
  if (SEGMENT_LABELS[seg] || PARENT_SHORT_LABELS[seg]) return false;
  if (seg.startsWith("[") && seg.endsWith("]")) return true;
  // codes with digits (ALC126…, TS…, SAMPLE123) or long opaque tokens
  if (/\d/.test(seg) && !seg.includes("-")) return true;
  if (/^[a-f0-9]{16,}$/i.test(seg)) return true;
  return false;
}

function catalogLabel(path: string): string | null {
  if (CATALOG_PATH_LABELS[path]) return CATALOG_PATH_LABELS[path];
  let best: { route: string; label: string } | null = null;
  for (const m of MODULE_SEARCH_CATALOG) {
    if (path === m.route || path.startsWith(m.route + "/")) {
      if (!best || m.route.length > best.route.length) {
        best = { route: m.route, label: m.label };
      }
    }
  }
  return best && best.route === path ? best.label : null;
}

function resolveHref(path: string, segment: string, isLast: boolean): string | undefined {
  if (isLast) return undefined;
  if (SECTION_HOME[segment] && path === `/dashboard/${segment}`) {
    return SECTION_HOME[segment];
  }
  return path;
}

/**
 * Build WCV-style breadcrumbs for a dashboard pathname.
 * Homepage (`/dashboard`) returns [] — no crumbs.
 */
export function resolveBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (!pathname || pathname === "/dashboard" || pathname === "/dashboard/") {
    return [];
  }

  const clean = pathname.split("?")[0].replace(/\/+$/, "") || "/dashboard";
  if (!clean.startsWith("/dashboard")) return [];

  const parts = clean.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  if (!parts.length) return [];

  const crumbs: BreadcrumbItem[] = [];
  let acc = "/dashboard";
  let parentPath = "/dashboard";

  parts.forEach((seg, idx) => {
    acc += `/${seg}`;
    const isLast = idx === parts.length - 1;
    const isDynamic = looksLikeDynamicId(seg);

    // Skip intermediate dynamic ids so crumbs stay Admin > Company Structure style
    // e.g. /operations/dockets/ALC123/print → Operations > Consignments & Dockets > Print
    if (isDynamic && !isLast) {
      parentPath = parentPath; // keep previous real hub as parent for next crumb
      return;
    }

    const pathLabel = PATH_LABELS[acc] || CATALOG_PATH_LABELS[acc];
    const shortParent = !isLast ? PARENT_SHORT_LABELS[seg] : undefined;
    const catalog = catalogLabel(acc);
    const segmentLabel = SEGMENT_LABELS[seg];

    const label =
      pathLabel ||
      shortParent ||
      (isLast
        ? catalog || segmentLabel || (isDynamic ? "Details" : titleCaseSegment(seg))
        : segmentLabel || catalog || titleCaseSegment(seg));

    crumbs.push({
      label,
      href: isLast ? undefined : resolveHref(acc, seg, false) || parentPath
    });

    parentPath = acc;
  });

  return crumbs;
}
