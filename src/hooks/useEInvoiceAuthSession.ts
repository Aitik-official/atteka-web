"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearAuthToken,
  clearEInvoiceAuthSession,
  getEInvoiceAuthBag,
  saveEInvoiceAuthSession,
  type AuthTokenEntry,
  type EInvoiceAuthBag,
  type EInvoiceTokenType
} from "@/lib/eInvoiceAuthSession";

const STORAGE_KEY = "atteka_einvoice_auth_session";

export function useEInvoiceAuthSession() {
  const [bag, setBag] = useState<EInvoiceAuthBag>({});
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setBag(getEInvoiceAuthBag());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("atteka:einvoice-auth", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("atteka:einvoice-auth", onCustom as EventListener);
    };
  }, [refresh]);

  const save = useCallback((tokenType: EInvoiceTokenType) => {
    const next = saveEInvoiceAuthSession(tokenType);
    setBag(getEInvoiceAuthBag());
    return next;
  }, []);

  const clearOne = useCallback((tokenType: EInvoiceTokenType) => {
    clearAuthToken(tokenType);
    setBag(getEInvoiceAuthBag());
  }, []);

  const clear = useCallback(() => {
    clearEInvoiceAuthSession();
    setBag({});
  }, []);

  const invoiceToken: AuthTokenEntry | null = bag["e-invoice"] || null;
  const waybillToken: AuthTokenEntry | null = bag["e-waybill"] || null;
  /** Back-compat: primary session shown elsewhere = invoice token if present */
  const session = invoiceToken || waybillToken;

  return {
    bag,
    ready,
    invoiceToken,
    waybillToken,
    session,
    /** IRN screens require E-Invoice author token specifically */
    isAuthenticated: !!invoiceToken,
    hasInvoiceToken: !!invoiceToken,
    hasWaybillToken: !!waybillToken,
    hasAnyToken: !!(invoiceToken || waybillToken),
    save,
    clearOne,
    clear,
    refresh
  };
}
