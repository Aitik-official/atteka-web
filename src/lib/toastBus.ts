export type ToastTone = "success" | "error" | "info" | "warning";

/**
 * Visual / task family — keeps document-number toasts distinct from
 * everyday save feedback and session-auth notices.
 */
export type ToastKind = "action" | "document" | "auth" | "alert";

export type ToastInput = {
  type?: ToastTone;
  /** Defaults: document when sticky/code looks like a doc no; else action */
  kind?: ToastKind;
  message: string;
  /** Document / IRN / voucher number — only sticky when kind is `document` */
  code?: string;
  title?: string;
  sticky?: boolean;
  durationMs?: number;
};

export type ToastRecord = ToastInput & {
  id: string;
  type: ToastTone;
  kind: ToastKind;
  sticky: boolean;
  createdAt: number;
};

type Listener = (toast: ToastRecord) => void;
type DismissListener = (id: string) => void;

const listeners = new Set<Listener>();
const dismissListeners = new Set<DismissListener>();

function looksLikeGeneratedNumberToast(message: string, code?: string) {
  if (code && String(code).trim()) {
    const c = String(code);
    // Auth ack codes must not be treated as document numbers
    if (/^ACK[-_]?\d+$/i.test(c)) return false;
    return true;
  }
  const hasLabel =
    /\b(bill\s*(no\.?|number)?|trip\s*sheet(\s*no\.?)?|loading\s*slip|docket\s*no\.?|irn|mr\s*no\.?|cn\s*no\.?|voucher)\b/i.test(
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

function resolveKind(input: ToastInput): ToastKind {
  if (input.kind) return input.kind;
  if (input.sticky === true || looksLikeGeneratedNumberToast(input.message, input.code)) {
    return "document";
  }
  if (input.type === "error" || input.type === "warning") return "alert";
  return "action";
}

export function createToastRecord(input: ToastInput): ToastRecord {
  const type = input.type || "info";
  const kind = resolveKind(input);
  const sticky =
    kind === "document"
      ? input.sticky !== false
      : input.sticky === true;
  return {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    kind,
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

type Opts = Omit<ToastInput, "type" | "message" | "kind">;
type DocOpts = Omit<ToastInput, "message" | "kind">;
type AuthOpts = Omit<ToastInput, "type" | "message" | "kind">;

/** Convenience API usable outside React components */
export const toast = {
  /** Everyday save / update feedback (auto-dismiss, compact) */
  success: (message: string, opts?: Opts) =>
    pushToast({ type: "success", kind: "action", message, sticky: false, ...opts }),
  error: (message: string, opts?: Opts) =>
    pushToast({ type: "error", kind: "alert", message, ...opts }),
  info: (message: string, opts?: Opts) =>
    pushToast({ type: "info", kind: "action", message, sticky: false, ...opts }),
  warning: (message: string, opts?: Opts) =>
    pushToast({ type: "warning", kind: "alert", message, ...opts }),

  /**
   * Bill / CN / Trip / IRN / voucher numbers — sticky document card,
   * bottom-right, with copy. Use this instead of success+code.
   */
  document: (message: string, opts: DocOpts & { code: string }) =>
    pushToast({
      type: opts.type || "success",
      kind: "document",
      message,
      sticky: true,
      ...opts
    }),

  /** Session authentication token notices — distinct auth chrome */
  auth: (message: string, opts?: AuthOpts & { type?: ToastTone }) =>
    pushToast({
      type: opts?.type || "success",
      kind: "auth",
      message,
      sticky: false,
      durationMs: opts?.durationMs ?? 5500,
      ...opts
    }),

  /** @deprecated Prefer toast.document for generated numbers */
  sticky: (message: string, opts?: Omit<ToastInput, "message" | "sticky" | "kind">) =>
    pushToast({
      type: opts?.type || "success",
      kind: "document",
      message,
      sticky: true,
      ...opts
    }),

  confirm: (message: string) =>
    typeof window !== "undefined" ? window.confirm(message) : false,
  dismiss: dismissToast
};
