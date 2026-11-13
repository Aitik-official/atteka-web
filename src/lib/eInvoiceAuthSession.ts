/** Session-scoped author tokens — E-Invoice and E-WayBill are independent and can both be active. */

export type EInvoiceTokenType = "e-invoice" | "e-waybill";

export type AuthTokenEntry = {
  tokenType: EInvoiceTokenType;
  label: string;
  ackCode: string;
  savedAt: string;
};

export type EInvoiceAuthBag = {
  "e-invoice"?: AuthTokenEntry;
  "e-waybill"?: AuthTokenEntry;
};

/** @deprecated Old single-token shape — migrated on read */
export type EInvoiceAuthSession = AuthTokenEntry;

const STORAGE_KEY = "atteka_einvoice_auth_session";
const EVENT = "atteka:einvoice-auth";

export function tokenTypeLabel(type: EInvoiceTokenType) {
  return type === "e-waybill" ? "E-WayBill Author Token" : "E-Invoice Author Token";
}

function emit(bag: EInvoiceAuthBag) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: bag }));
}

function isEntry(v: unknown): v is AuthTokenEntry {
  if (!v || typeof v !== "object") return false;
  const o = v as AuthTokenEntry;
  return !!o.tokenType && !!o.savedAt && !!o.ackCode;
}

/** Read both tokens; migrates legacy single-token JSON if present. */
export function getEInvoiceAuthBag(): EInvoiceAuthBag {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EInvoiceAuthBag | AuthTokenEntry;

    // Legacy: single { tokenType, label, ackCode, savedAt }
    if (isEntry(parsed) && !("e-invoice" in parsed) && !("e-waybill" in parsed)) {
      const bag: EInvoiceAuthBag = { [parsed.tokenType]: parsed };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
      return bag;
    }

    const bag = parsed as EInvoiceAuthBag;
    const next: EInvoiceAuthBag = {};
    if (isEntry(bag["e-invoice"])) next["e-invoice"] = bag["e-invoice"];
    if (isEntry(bag["e-waybill"])) next["e-waybill"] = bag["e-waybill"];
    return next;
  } catch {
    return {};
  }
}

/** Prefer E-Invoice token for IRN gates; fall back to any for display. */
export function getEInvoiceAuthSession(): AuthTokenEntry | null {
  const bag = getEInvoiceAuthBag();
  return bag["e-invoice"] || bag["e-waybill"] || null;
}

export function getAuthToken(type: EInvoiceTokenType): AuthTokenEntry | null {
  return getEInvoiceAuthBag()[type] || null;
}

export function hasEInvoiceAuthSession() {
  return !!getEInvoiceAuthBag()["e-invoice"];
}

export function hasEWayBillAuthSession() {
  return !!getEInvoiceAuthBag()["e-waybill"];
}

export function hasAnyAuthorToken() {
  const bag = getEInvoiceAuthBag();
  return !!(bag["e-invoice"] || bag["e-waybill"]);
}

export function saveEInvoiceAuthSession(tokenType: EInvoiceTokenType): AuthTokenEntry {
  const entry: AuthTokenEntry = {
    tokenType,
    label: tokenTypeLabel(tokenType),
    ackCode: `ACK-${Date.now().toString().slice(-6)}`,
    savedAt: new Date().toISOString()
  };
  const bag = getEInvoiceAuthBag();
  bag[tokenType] = entry;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
    emit(bag);
  }
  return entry;
}

export function clearAuthToken(tokenType: EInvoiceTokenType) {
  if (typeof window === "undefined") return;
  const bag = getEInvoiceAuthBag();
  delete bag[tokenType];
  if (!bag["e-invoice"] && !bag["e-waybill"]) {
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
  }
  emit(bag);
}

export function clearEInvoiceAuthSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  emit({});
}
