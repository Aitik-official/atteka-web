export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastInput = {
  type?: ToastTone;
  message: string;
  /** Shown prominently (bill no, trip sheet no, etc.) — forces sticky */
  code?: string;
  title?: string;
  /** Stay until user closes. Auto-true when `code` is set or message looks like a generated number. */
  sticky?: boolean;
  durationMs?: number;
};

export type ToastRecord = ToastInput & {
  id: string;
  type: ToastTone;
  sticky: boolean;
  createdAt: number;
};

type Listener = (toast: ToastRecord) => void;
type DismissListener = (id: string) => void;

const listeners = new Set<Listener>();
const dismissListeners = new Set<DismissListener>();

function looksLikeGeneratedNumberToast(message: string, code?: string) {
  if (code && String(code).trim()) return true;
  const hasLabel =
    /\b(bill\s*(no\.?|number)?|trip\s*sheet(\s*no\.?)?|loading\s*slip|docket\s*no\.?|irn|mr\s*no\.?)\b/i.test(
      message
    );
  const hasCodeToken =
    /\bTBILL[-\w]*\d+\b/i.test(message) ||
    /\bBLALC\w*\d+\b/i.test(message) ||
    /\bTS\d{4,}\b/i.test(message) ||
    /\bALC\d{5,}\b/i.test(message) ||
    /\b([A-Z]{2,8}\d{4,}[\w-]*)\b/.test(message);
  return hasLabel && hasCodeToken;
}

export function createToastRecord(input: ToastInput): ToastRecord {
  const type = input.type || "info";
  const sticky =
    input.sticky === true ||
    looksLikeGeneratedNumberToast(input.message, input.code) ||
    !!input.code;
  return {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    message: input.message,
    code: input.code,
    title: input.title,
    sticky,
    durationMs: input.durationMs,
    createdAt: Date.now()
  };
}

export function pushToast(input: ToastInput) {
  const record = createToastRecord(input);
  listeners.forEach((fn) => fn(record));
  return record.id;
}

export function dismissToast(id: string) {
  dismissListeners.forEach((fn) => fn(id));
}

export function subscribeToast(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function subscribeDismiss(fn: DismissListener) {
  dismissListeners.add(fn);
  return () => dismissListeners.delete(fn);
}

/** Convenience API usable outside React components */
export const toast = {
  success: (message: string, opts?: Omit<ToastInput, "type" | "message">) =>
    pushToast({ type: "success", message, ...opts }),
  error: (message: string, opts?: Omit<ToastInput, "type" | "message">) =>
    pushToast({ type: "error", message, ...opts }),
  info: (message: string, opts?: Omit<ToastInput, "type" | "message">) =>
    pushToast({ type: "info", message, ...opts }),
  warning: (message: string, opts?: Omit<ToastInput, "type" | "message">) =>
    pushToast({ type: "warning", message, ...opts }),
  /** Always sticky — for bill / generated numbers */
  sticky: (message: string, opts?: Omit<ToastInput, "message" | "sticky">) =>
    pushToast({ type: opts?.type || "success", message, sticky: true, ...opts }),
  dismiss: dismissToast
};
