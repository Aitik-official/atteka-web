export type ExceptionalOpField = {
  key: string;
  label: string;
  type?: "text" | "date" | "select" | "textarea";
  options?: string[];
  readonly?: boolean;
};

export type ExceptionalOpModule = {
  slug: string;
  title: string;
  description: string;
  docLabel: string;
  docPlaceholder: string;
  fields: ExceptionalOpField[];
};

/** Exception → Operation submodule catalog (fabricated demo workflows). */
export const EXCEPTIONAL_OPERATION_MODULES: ExceptionalOpModule[] = [
  {
    slug: "reassign-next-location",
    title: "Reassign & Next Location",
    description: "Reassign & Next Location",
    docLabel: "CN / Docket No.",
    docPlaceholder: "Enter CN No.",
    fields: [
      { key: "documentNo", label: "Document No.", readonly: true },
      { key: "currentLocation", label: "Current Location", readonly: true },
      { key: "nextLocation", label: "Next Location", type: "select", options: ["BHIWANDI", "PUNE", "HYDERABAD", "CHENNAI", "NAGPUR", "BENGALURU"] },
      { key: "reassignBranch", label: "Reassign Branch", type: "select", options: ["ALC1: Ateka Logistics", "ALC2: Bhiwandi Hub", "ALC3: Pune Hub"] },
      { key: "remark", label: "Remark", type: "textarea" }
    ]
  },
  {
    slug: "cancel-delivery-pdc",
    title: "Cancel Delivery PDC",
    description: "Cancel Delivery PDC",
    docLabel: "Delivery PDC No.",
    docPlaceholder: "Enter System PDC No.",
    fields: [
      { key: "documentNo", label: "PDC No.", readonly: true },
      { key: "manualPdcNo", label: "Manual PDC No.", readonly: true },
      { key: "vehicleNo", label: "Vehicle No.", readonly: true },
      { key: "pdcDate", label: "PDC Date", readonly: true },
      { key: "cancelReason", label: "Cancel Reason", type: "select", options: ["Wrong vehicle allotment", "Duplicate PDC", "Customer deferred delivery", "Ops correction", "Other"] },
      { key: "remark", label: "Remark", type: "textarea" }
    ]
  },
  {
    slug: "edit-thc-vendor-date-vehicle",
    title: "Edit THC Vendor/Date/Vehicle",
    description: "Edit THC Vendor/Date/Vehicle",
    docLabel: "THC / TripSheet No.",
    docPlaceholder: "Enter THC No.",
    fields: [
      { key: "documentNo", label: "THC No.", readonly: true },
      { key: "vendor", label: "Vendor", type: "select", options: ["V00001: COMPANY VEHICLE", "V00002: METRO HAULAGE PARTNERS", "V00006: S.P LOGISTICS", "V00009: GATEWAY FLEET CO"] },
      { key: "thcDate", label: "THC Date", type: "date" },
      { key: "vehicleNo", label: "Vehicle No." },
      { key: "remark", label: "Remark", type: "textarea" }
    ]
  },
  {
    slug: "change-route",
    title: "Change Route",
    description: "Change Route",
    docLabel: "CN / TripSheet No.",
    docPlaceholder: "Enter Document No.",
    fields: [
      { key: "documentNo", label: "Document No.", readonly: true },
      { key: "currentRoute", label: "Current Route", readonly: true },
      { key: "newRoute", label: "New Route", type: "select", options: ["BHIWANDI-HYDERABAD", "BHIWANDI-CHENNAI", "PUNE-NAGPUR", "BHIWANDI-BENGALURU", "SURAT-BHIWANDI"] },
      { key: "remark", label: "Remark", type: "textarea" }
    ]
  },
  {
    slug: "edit-billing-party",
    title: "Edit Billing Party",
    description: "Edit Billing Party",
    docLabel: "CN No.",
    docPlaceholder: "Enter CN No.",
    fields: [
      { key: "documentNo", label: "CN No.", readonly: true },
      { key: "currentParty", label: "Current Billing Party", readonly: true },
      { key: "newParty", label: "New Billing Party", type: "select", options: ["NORTHBOUND FREIGHT PVT LTD", "METRO LOGISTICS PARTNERS", "COASTAL CARGO SOLUTIONS", "GATEWAY DISTRIBUTION CO"] },
      { key: "remark", label: "Remark", type: "textarea" }
    ]
  },
  {
    slug: "edit-manual-document-number",
    title: "Edit Manual document Number",
    description: "Edit Manual document Number",
    docLabel: "System Document No.",
    docPlaceholder: "Enter System Doc No.",
    fields: [
      { key: "documentNo", label: "System Document No.", readonly: true },
      { key: "docType", label: "Document Type", readonly: true },
      { key: "manualDocumentNo", label: "Manual Document No." },
      { key: "remark", label: "Remark", type: "textarea" }
    ]
  },
  {
    slug: "edit-pdc-vendor-date-vehicle",
    title: "Edit PDC Vendor/Date/Vehicle",
    description: "Edit PDC Vendor/Date/Vehicle",
    docLabel: "PDC No.",
    docPlaceholder: "Enter System PDC No.",
    fields: [
      { key: "documentNo", label: "PDC No.", readonly: true },
      { key: "vendor", label: "Vendor", type: "select", options: ["V00001: COMPANY VEHICLE", "V00002: METRO HAULAGE PARTNERS", "V00006: S.P LOGISTICS", "V00009: GATEWAY FLEET CO"] },
      { key: "pdcDate", label: "PDC Date", type: "date" },
      { key: "vehicleNo", label: "Vehicle No." },
      { key: "remark", label: "Remark", type: "textarea" }
    ]
  },
  {
    slug: "edit-billing-party-branch-po",
    title: "Edit Billing Party/Branch/Po NO",
    description: "Edit Billing Party/Branch/Po NO",
    docLabel: "CN No.",
    docPlaceholder: "Enter CN No.",
    fields: [
      { key: "documentNo", label: "CN No.", readonly: true },
      { key: "billingParty", label: "Billing Party", type: "select", options: ["NORTHBOUND FREIGHT PVT LTD", "METRO LOGISTICS PARTNERS", "COASTAL CARGO SOLUTIONS", "GATEWAY DISTRIBUTION CO"] },
      { key: "billingBranch", label: "Billing Branch", type: "select", options: ["ALC1: Ateka Logistics", "ALC2: Bhiwandi Hub", "ALC3: Pune Hub"] },
      { key: "poNo", label: "PO No." },
      { key: "remark", label: "Remark", type: "textarea" }
    ]
  },
  {
    slug: "edit-from-to-location",
    title: "Edit From & To location",
    description: "Edit From & To location",
    docLabel: "CN No.",
    docPlaceholder: "Enter CN No.",
    fields: [
      { key: "documentNo", label: "CN No.", readonly: true },
      { key: "fromLocation", label: "From Location", type: "select", options: ["BHIWANDI", "PUNE", "SURAT", "NASHIK", "MUMBAI"] },
      { key: "toLocation", label: "To Location", type: "select", options: ["HYDERABAD", "CHENNAI", "NAGPUR", "BENGALURU", "NHAVASHEVA", "BHIWANDI"] },
      { key: "remark", label: "Remark", type: "textarea" }
    ]
  }
];

export function getExceptionalOpModule(slug: string) {
  return EXCEPTIONAL_OPERATION_MODULES.find((m) => m.slug === slug) || null;
}
