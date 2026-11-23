/**
 * Ateka dual business lines — keep codes/prefixes distinct.
 * Road Carrier = ARC* ; Logistics = ALC*
 */

export type BusinessLine = "LOGISTICS" | "ROAD_CARRIER";

export const BUSINESS_LINES = {
  LOGISTICS: {
    key: "LOGISTICS" as const,
    label: "Ateka Logistics",
    short: "ALC",
    branchCode: "ALC1",
    docketPrefix: "ALC126",
    billPrefix: "BLALC",
    mrPrefix: "MRALC",
    tripsheetPrefix: "DSALC",
    description: "Logistics CN / Docket stationery series"
  },
  ROAD_CARRIER: {
    key: "ROAD_CARRIER" as const,
    label: "Ateka Road Carrier",
    short: "ARC",
    branchCode: "ARC1",
    docketPrefix: "ARC126",
    billPrefix: "BLARC",
    mrPrefix: "MRARC",
    tripsheetPrefix: "DSARC",
    description: "Road Carrier CN / Docket stationery series"
  }
} as const;

export function resolveBusinessLine(input?: string | null): BusinessLine {
  const raw = String(input || "")
    .trim()
    .toUpperCase();
  if (!raw) return "LOGISTICS";
  if (
    raw === "ROAD_CARRIER" ||
    raw === "ROAD CARRIER" ||
    raw === "ARC" ||
    raw.startsWith("ARC") ||
    raw.includes("ROAD CARRIER") ||
    raw.includes("ATEKA ROAD")
  ) {
    return "ROAD_CARRIER";
  }
  if (
    raw === "LOGISTICS" ||
    raw === "ALC" ||
    raw === "DEFAULT" ||
    raw.startsWith("ALC") ||
    raw.includes("LOGISTICS")
  ) {
    return "LOGISTICS";
  }
  // Docket / doc number heuristics
  if (/^ARC|^BLARC|^MRARC|^DSARC/i.test(raw)) return "ROAD_CARRIER";
  if (/^ALC|^BLALC|^MRALC|^DSALC/i.test(raw)) return "LOGISTICS";
  return "LOGISTICS";
}

export function businessLineConfig(line?: string | null) {
  return BUSINESS_LINES[resolveBusinessLine(line)];
}

export function docketPrefixFor(line?: string | null) {
  return businessLineConfig(line).docketPrefix;
}

export function branchCodeFor(line?: string | null) {
  return businessLineConfig(line).branchCode;
}
