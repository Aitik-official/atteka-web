export type MasterOption = {
  value: string;
  label: string;
  code?: string;
  name?: string;
  meta?: Record<string, string>;
};

export type MasterOptionsBundle = {
  vendors: MasterOption[];
  customers: MasterOption[];
  branches: MasterOption[];
  vehicles: MasterOption[];
  ftlTypes: MasterOption[];
  routes: MasterOption[];
  locations: MasterOption[];
  serviceTypes: MasterOption[];
  source: "mongo" | "fallback" | "mixed";
};

export const SERVICE_TYPE_OPTIONS: MasterOption[] = [
  { value: "FTL", label: "FTL", code: "FTL", name: "FTL" },
  { value: "LTL", label: "LTL", code: "LTL", name: "LTL" },
  { value: "PART LOAD", label: "PART LOAD", code: "PART LOAD", name: "PART LOAD" }
];

export const DOC_TYPE_OPTIONS: MasterOption[] = [
  { value: "THC", label: "THC" },
  { value: "PDC", label: "PDC" },
  { value: "Manifest", label: "Manifest" },
  { value: "Bill", label: "Bill" }
];

/** Demo masters used when APIs return empty / offline. */
export const FALLBACK_VENDOR_OPTIONS: MasterOption[] = [
  { value: "V00001: COMPANY VEHICLE", label: "V00001: COMPANY VEHICLE", code: "V00001", name: "COMPANY VEHICLE" },
  { value: "V00002: METRO HAULAGE PARTNERS", label: "V00002: METRO HAULAGE PARTNERS", code: "V00002", name: "METRO HAULAGE PARTNERS" },
  { value: "V00006: S.P LOGISTICS", label: "V00006: S.P LOGISTICS", code: "V00006", name: "S.P LOGISTICS" },
  { value: "V00009: GATEWAY FLEET CO", label: "V00009: GATEWAY FLEET CO", code: "V00009", name: "GATEWAY FLEET CO" }
];

export const FALLBACK_CUSTOMER_OPTIONS: MasterOption[] = [
  {
    value: "P000001",
    label: "P000001 : NORTHBOUND FREIGHT PVT LTD",
    code: "P000001",
    name: "NORTHBOUND FREIGHT PVT LTD",
    meta: { gstin: "27AABCN1234A1Z5" }
  },
  {
    value: "P000002",
    label: "P000002 : METRO LOGISTICS PARTNERS",
    code: "P000002",
    name: "METRO LOGISTICS PARTNERS",
    meta: { gstin: "27AABCM5678B1Z2" }
  },
  {
    value: "P000003",
    label: "P000003 : COASTAL CARGO SOLUTIONS",
    code: "P000003",
    name: "COASTAL CARGO SOLUTIONS",
    meta: { gstin: "27AABCC9012C1Z9" }
  },
  {
    value: "P000004",
    label: "P000004 : GATEWAY DISTRIBUTION CO",
    code: "P000004",
    name: "GATEWAY DISTRIBUTION CO",
    meta: { gstin: "27AABCD3456D1Z1" }
  }
];

export const FALLBACK_BRANCH_OPTIONS: MasterOption[] = [
  { value: "ALC1", label: "ALC1 : Ateka Logistics", code: "ALC1", name: "Ateka Logistics", meta: { city: "BHIWANDI" } },
  { value: "ALC2", label: "ALC2 : Bhiwandi Hub", code: "ALC2", name: "Bhiwandi Hub", meta: { city: "BHIWANDI" } },
  { value: "ALC3", label: "ALC3 : Pune Hub", code: "ALC3", name: "Pune Hub", meta: { city: "PUNE" } }
];

export const FALLBACK_VEHICLE_OPTIONS: MasterOption[] = [
  { value: "MH04AB1234", label: "MH04AB1234 (32 FT)", code: "MH04AB1234", name: "MH04AB1234", meta: { type: "32 FT" } },
  { value: "MH12CD5678", label: "MH12CD5678 (20 FT)", code: "MH12CD5678", name: "MH12CD5678", meta: { type: "20 FT" } },
  { value: "TN09EF9012", label: "TN09EF9012 (TRAILER)", code: "TN09EF9012", name: "TN09EF9012", meta: { type: "TRAILER" } }
];

export const FALLBACK_FTL_OPTIONS: MasterOption[] = [
  { value: "32 FT SXL", label: "32 FT SXL", code: "32 FT SXL", name: "32 FT SXL" },
  { value: "20 FT CONTAINER", label: "20 FT CONTAINER", code: "20 FT CONTAINER", name: "20 FT CONTAINER" },
  { value: "TRAILER", label: "TRAILER", code: "TRAILER", name: "TRAILER" },
  { value: "14 FT", label: "14 FT", code: "14 FT", name: "14 FT" }
];

export const FALLBACK_ROUTE_OPTIONS: MasterOption[] = [
  { value: "BHIWANDI-HYDERABAD", label: "BHIWANDI-HYDERABAD", code: "R001", name: "BHIWANDI-HYDERABAD" },
  { value: "BHIWANDI-CHENNAI", label: "BHIWANDI-CHENNAI", code: "R002", name: "BHIWANDI-CHENNAI" },
  { value: "BHIWANDI-BENGALURU", label: "BHIWANDI-BENGALURU", code: "R003", name: "BHIWANDI-BENGALURU" },
  { value: "PUNE-NAGPUR", label: "PUNE-NAGPUR", code: "R004", name: "PUNE-NAGPUR" },
  { value: "SURAT-BHIWANDI", label: "SURAT-BHIWANDI", code: "R005", name: "SURAT-BHIWANDI" },
  { value: "NASHIK-HYDERABAD", label: "NASHIK-HYDERABAD", code: "R006", name: "NASHIK-HYDERABAD" }
];

function uniqByValue(list: MasterOption[]) {
  const seen = new Set<string>();
  return list.filter((o) => {
    const key = o.value.toUpperCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mapVendorOptions(rows: any[]): MasterOption[] {
  return uniqByValue(
    (rows || []).map((v) => {
      const code = String(v.vendorCode || v.code || "").trim().toUpperCase();
      const name = String(v.name || v.vendorName || "").trim();
      const label = code && name ? `${code}: ${name}` : code || name;
      return {
        value: label,
        label,
        code,
        name,
        meta: { gstin: String(v.gstNo || v.gstin || "") }
      };
    })
  );
}

export function mapCustomerOptions(rows: any[]): MasterOption[] {
  return uniqByValue(
    (rows || []).map((c) => {
      const code = String(c.customerCode || c.code || c.partyCode || "").trim().toUpperCase();
      const name = String(c.name || c.customerName || c.partyName || "").trim();
      const label = code && name ? `${code} : ${name}` : code || name;
      return {
        value: code || label,
        label,
        code,
        name,
        meta: { gstin: String(c.gstin || c.gstNo || "") }
      };
    })
  );
}

export function mapBranchOptions(rows: any[]): MasterOption[] {
  return uniqByValue(
    (rows || []).map((b) => {
      const code = String(b.branchCode || b.code || "").trim().toUpperCase();
      const name = String(b.branchName || b.name || "").trim();
      const label = code && name ? `${code} : ${name}` : code || name;
      return {
        value: code || label,
        label,
        code,
        name,
        meta: { city: String(b.city || "").toUpperCase() }
      };
    })
  );
}

export function mapVehicleOptions(rows: any[]): MasterOption[] {
  return uniqByValue(
    (rows || []).map((v) => {
      const no = String(v.vehicleNumber || v.vehicleNo || "").trim().toUpperCase();
      const type = String(v.vehicleType || "").trim();
      const label = type ? `${no} (${type})` : no;
      return { value: no, label, code: no, name: no, meta: { type } };
    })
  );
}

export function mapFtlTypeOptions(rows: any[]): MasterOption[] {
  return uniqByValue(
    (rows || []).map((f) => {
      const name = String(f.ftlType || f.vehicleType || f.name || "").trim().toUpperCase();
      return { value: name, label: name, code: name, name };
    })
  );
}

export function mapRouteOptions(rows: any[]): MasterOption[] {
  return uniqByValue(
    (rows || []).map((r) => {
      const origin = String(r.origin || "").trim().toUpperCase();
      const destination = String(r.destination || "").trim().toUpperCase();
      const code = String(r.code || "").trim().toUpperCase();
      const corridor =
        origin && destination
          ? `${origin}-${destination.split("+")[0]}`
          : destination || origin || code;
      const label = code ? `${code}: ${corridor}` : corridor;
      return {
        value: corridor,
        label,
        code,
        name: corridor,
        meta: { origin, destination }
      };
    })
  );
}

/** Keep current persisted value selectable even if masters list changed. */
export function withCurrentOption(options: MasterOption[], current: string): MasterOption[] {
  if (!current) return options;
  if (options.some((o) => o.value === current || o.label === current || o.code === current)) {
    return options;
  }
  return [{ value: current, label: current, code: current, name: current }, ...options];
}

export function mapLocationOptions(branches: any[], routes: any[]): MasterOption[] {
  const fromBranches = (branches || [])
    .map((b) => String(b.city || b.branchName || "").trim().toUpperCase())
    .filter(Boolean);
  const fromRoutes = (routes || []).flatMap((r) => {
    const origin = String(r.origin || "").trim().toUpperCase();
    const destParts = String(r.destination || "")
      .split("+")
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean);
    return [origin, ...destParts];
  });
  const extras = [
    "BHIWANDI",
    "HYDERABAD",
    "CHENNAI",
    "PUNE",
    "NAGPUR",
    "BENGALURU",
    "SURAT",
    "NASHIK",
    "MUMBAI",
    "NHAVASHEVA"
  ];
  return uniqByValue(
    [...fromBranches, ...fromRoutes, ...extras].map((loc) => ({
      value: loc,
      label: loc,
      code: loc,
      name: loc
    }))
  );
}
