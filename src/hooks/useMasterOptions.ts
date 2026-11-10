"use client";

import { useEffect, useState } from "react";
import {
  MasterOptionsBundle,
  SERVICE_TYPE_OPTIONS,
  FALLBACK_BRANCH_OPTIONS,
  FALLBACK_CUSTOMER_OPTIONS,
  FALLBACK_FTL_OPTIONS,
  FALLBACK_ROUTE_OPTIONS,
  FALLBACK_VEHICLE_OPTIONS,
  FALLBACK_VENDOR_OPTIONS,
  mapBranchOptions,
  mapCustomerOptions,
  mapFtlTypeOptions,
  mapLocationOptions,
  mapRouteOptions,
  mapVehicleOptions,
  mapVendorOptions
} from "@/lib/masterOptions";

function orFallback<T>(list: T[], fallback: T[]) {
  return list.length ? list : fallback;
}

const EMPTY: MasterOptionsBundle = {
  vendors: FALLBACK_VENDOR_OPTIONS,
  customers: FALLBACK_CUSTOMER_OPTIONS,
  branches: FALLBACK_BRANCH_OPTIONS,
  vehicles: FALLBACK_VEHICLE_OPTIONS,
  ftlTypes: FALLBACK_FTL_OPTIONS,
  routes: FALLBACK_ROUTE_OPTIONS,
  locations: mapLocationOptions(
    FALLBACK_BRANCH_OPTIONS.map((b) => ({ city: b.meta?.city, branchName: b.name, branchCode: b.code })),
    FALLBACK_ROUTE_OPTIONS.map((r) => {
      const [origin, destination] = r.value.split("-");
      return { origin, destination, code: r.code };
    })
  ),
  serviceTypes: SERVICE_TYPE_OPTIONS,
  source: "fallback"
};

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

/** Loads dropdown options from Masters APIs (Mongo + fallbacks). */
export function useMasterOptions() {
  const [options, setOptions] = useState<MasterOptionsBundle>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [vendorsRes, customersRes, branchesRes, vehiclesRes, ftlTypesRes, routesRes] =
          await Promise.all([
            fetchJson("/api/vendors"),
            fetchJson("/api/customers"),
            fetchJson("/api/branches"),
            fetchJson("/api/vehicles"),
            fetchJson("/api/ftl-types"),
            fetchJson("/api/routes")
          ]);

        if (cancelled) return;

        const vendorRows = vendorsRes?.data || [];
        const customerRows = customersRes?.data || [];
        const branchRows = branchesRes?.data || [];
        const vehicleRows = vehiclesRes?.data || [];
        const ftlRows = ftlTypesRes?.data || [];
        const routeRows = routesRes?.data || [];

        const anyMongo =
          Boolean(vendorsRes?.success || customersRes?.success || branchesRes?.success) &&
          !vendorsRes?.isMemoryStore &&
          !branchesRes?.isMemoryStore;

        const vendors = orFallback(mapVendorOptions(vendorRows), FALLBACK_VENDOR_OPTIONS);
        const customers = orFallback(mapCustomerOptions(customerRows), FALLBACK_CUSTOMER_OPTIONS);
        const branches = orFallback(mapBranchOptions(branchRows), FALLBACK_BRANCH_OPTIONS);
        const vehicles = orFallback(mapVehicleOptions(vehicleRows), FALLBACK_VEHICLE_OPTIONS);
        const ftlTypes = orFallback(mapFtlTypeOptions(ftlRows), FALLBACK_FTL_OPTIONS);
        const routes = orFallback(mapRouteOptions(routeRows), FALLBACK_ROUTE_OPTIONS);
        const locations = orFallback(
          mapLocationOptions(branchRows, routeRows),
          EMPTY.locations
        );

        setOptions({
          vendors,
          customers,
          branches,
          vehicles,
          ftlTypes,
          routes,
          locations,
          serviceTypes: SERVICE_TYPE_OPTIONS,
          source: anyMongo ? "mongo" : "fallback"
        });
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load masters");
          setOptions(EMPTY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading, error };
}
