"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  Info,
  KeyRound,
  X
} from "lucide-react";
import {
  dismissToast,
  pushToast,
  subscribeDismiss,
  subscribeToast,
  type ToastInput,
  type ToastKind,
  type ToastRecord,
  type ToastTone
} from "@/lib/toastBus";

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 4200,
  info: 3800,
  warning: 5200,
  error: 7000
};

function ToneIcon({ type, kind }: { type: ToastTone; kind: ToastKind }) {
  const cls = "w-4 h-4 shrink-0";
  if (kind === "document") return <FileText className={cls} />;
  if (kind === "auth") return <KeyRound className={cls} />;
  if (type === "success") return <CheckCircle2 className={cls} />;
  if (type === "error") return <AlertCircle className={cls} />;
  if (type === "warning") return <AlertTriangle className={cls} />;
  return <Info className={cls} />;
}

function kindBadge(kind: ToastKind, type: ToastTone) {
  switch (kind) {
    case "document":
      return "Document No";
    case "auth":
      return "Session Auth";
    case "alert":
      return type === "warning" ? "Warning" : "Error";
    default:
      return actionBadge(type);
  }
}

function kindShell(kind: ToastKind, type: ToastTone) {
  if (kind === "document") {
    return {
      wrap: "bg-slate-900 border-slate-700 text-white shadow-2xl shadow-slate-900/40",
      bar: "bg-amber-400",
      iconWrap: "bg-slate-800 text-amber-300 border border-slate-600",
      badge: "bg-amber-400/15 text-amber-200 border-amber-400/30",
      code: "bg-black/40 border-slate-600 text-amber-100",
      btn: "bg-amber-400 hover:bg-amber-300 text-slate-900",
      muted: "text-slate-400",
      title: "text-amber-200/90",
      body: "text-slate-100",
      sub: "text-slate-400"
    };
  }
  if (kind === "auth") {
    const cleared = type === "info" || type === "warning";
    return {
      wrap: cleared
        ? "bg-gradient-to-br from-slate-50 to-indigo-50 border-slate-300 text-slate-800 shadow-lg shadow-slate-100/80"
        : "bg-gradient-to-br from-indigo-50 to-sky-50 border-indigo-200 text-slate-800 shadow-lg shadow-indigo-100/80",
      bar: cleared ? "bg-slate-500" : "bg-indigo-500",
      iconWrap: cleared ? "bg-slate-100 text-slate-700" : "bg-indigo-100 text-indigo-700",
      badge: cleared
        ? "bg-slate-100 text-slate-700 border-slate-200"
        : "bg-indigo-100 text-indigo-700 border-indigo-200",
      code: "bg-white border-indigo-200 text-indigo-900",
      btn: "bg-indigo-600 hover:bg-indigo-700 text-white",
      muted: "text-indigo-400",
      title: cleared ? "text-slate-700" : "text-indigo-700",
      body: "text-slate-800",
      sub: "text-slate-600"
    };
  }
  if (kind === "alert" || type === "error") {
    const isWarn = type === "warning";
    return {
      wrap: isWarn
        ? "bg-white border-amber-300 text-slate-800 shadow-lg shadow-amber-100/70"
        : "bg-white border-red-300 text-slate-800 shadow-lg shadow-red-100/70",
      bar: isWarn ? "bg-amber-500" : "bg-red-500",
      iconWrap: isWarn ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600",
      badge: isWarn
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200",
      code: isWarn
        ? "bg-amber-50 border-amber-200 text-slate-900"
        : "bg-red-50 border-red-200 text-slate-900",
      btn: isWarn
        ? "bg-amber-600 hover:bg-amber-700 text-white"
        : "bg-red-600 hover:bg-red-700 text-white",
      muted: "text-slate-400",
      title: isWarn ? "text-amber-700" : "text-red-700",
      body: "text-slate-800",
      sub: "text-slate-600"
    };
  }
  // action — success vs info chrome
  if (type === "info") {
    return {
      wrap: "bg-white border-sky-200 text-slate-800 shadow-lg shadow-sky-100/70",
      bar: "bg-sky-500",
      iconWrap: "bg-sky-50 text-sky-600",
      badge: "bg-sky-50 text-sky-700 border-sky-200",
      code: "bg-sky-50 border-sky-200 text-slate-900",
      btn: "bg-sky-600 hover:bg-sky-700 text-white",
      muted: "text-slate-400",
      title: "text-sky-700",
      body: "text-slate-800",
      sub: "text-slate-600"
    };
  }
  return {
    wrap: "bg-white border-emerald-200 text-slate-800 shadow-lg shadow-emerald-100/70",
    bar: "bg-emerald-500",
    iconWrap: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    code: "bg-emerald-50 border-emerald-200 text-slate-900",
    btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
    muted: "text-slate-400",
    title: "text-emerald-700",
    body: "text-slate-800",
    sub: "text-slate-600"
  };
}

function actionBadge(type: ToastTone) {
  if (type === "info") return "Info";
  if (type === "success") return "Saved";
  return "Notice";
}

export function useToast() {
  return {
    toast: pushToast,
    success: (message: string, opts?: Omit<ToastInput, "type" | "message" | "kind">) =>
      pushToast({ type: "success", kind: "action", message, sticky: false, ...opts }),
    error: (message: string, opts?: Omit<ToastInput, "type" | "message" | "kind">) =>
      pushToast({ type: "error", kind: "alert", message, ...opts }),
    info: (message: string, opts?: Omit<ToastInput, "type" | "message" | "kind">) =>
      pushToast({ type: "info", kind: "action", message, sticky: false, ...opts }),
    warning: (message: string, opts?: Omit<ToastInput, "type" | "message" | "kind">) =>
      pushToast({ type: "warning", kind: "alert", message, ...opts }),
    document: (message: string, opts: Omit<ToastInput, "message" | "kind"> & { code: string }) =>
      pushToast({ type: opts.type || "success", kind: "document", message, sticky: true, ...opts }),
    auth: (message: string, opts?: Omit<ToastInput, "type" | "message" | "kind">) =>
      pushToast({
        type: "success",
        kind: "auth",
        message,
        sticky: false,
        durationMs: opts?.durationMs ?? 5500,
        ...opts
      }),
    sticky: (message: string, opts?: Omit<ToastInput, "message" | "sticky" | "kind">) =>
      pushToast({ type: opts?.type || "success", kind: "document", message, sticky: true, ...opts }),
    dismiss: dismissToast
  };
}

function ToastCard({
  t,
  onRemove,
  onCopy
}: {
  t: ToastRecord;
  onRemove: (id: string) => void;
  onCopy: (code: string) => void;
}) {
  const shell = kindShell(t.kind, t.type);
  const lines = String(t.message || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const isDocument = t.kind === "document";

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden border shadow-lg ${
        isDocument ? "rounded-2xl" : "rounded-xl"
      } ${shell.wrap}`}
      role="status"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${shell.bar}`} />
      <div className={`flex items-start gap-2.5 ${isDocument ? "p-4 pl-4" : "p-3.5 pl-4"}`}>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${shell.iconWrap}`}
        >
          <ToneIcon type={t.type} kind={t.kind} />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${shell.badge}`}
            >
              {kindBadge(t.kind, t.type)}
            </span>
            {t.title && (
              <span className={`font-bold text-[11px] uppercase tracking-wide ${shell.title}`}>
                {t.title}
              </span>
            )}
          </div>

          {isDocument && t.code ? (
            <>
              <div className={`text-[12px] leading-snug ${shell.sub}`}>{lines[0]}</div>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <code
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[15px] font-bold tracking-wide ${shell.code}`}
                >
                  {t.code}
                </code>
                <button
                  type="button"
                  onClick={() => onCopy(t.code!)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold ${shell.btn}`}
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              {lines.slice(1).map((line, i) => (
                <div key={`${t.id}-sub-${i}`} className={`text-[11px] ${shell.muted}`}>
                  {line}
                </div>
              ))}
              <p className={`text-[10px] font-medium pt-0.5 ${shell.muted}`}>
                Keep this number · stays open until closed
              </p>
            </>
          ) : (
            <>
              <div className="space-y-0.5">
                {lines.map((line, i) => (
                  <div
                    key={`${t.id}-${i}`}
                    className={`leading-snug break-words ${
                      i === 0 ? `font-semibold text-[13px] ${shell.body}` : `text-[12px] ${shell.sub}`
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </div>
              {t.code && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <code
                    className={`px-2 py-0.5 rounded border font-mono text-[11px] font-semibold ${shell.code}`}
                  >
                    {t.code}
                  </code>
                </div>
              )}
              {t.sticky && (
                <p className={`text-[10px] font-medium pt-0.5 ${shell.muted}`}>
                  Stays open until closed
                </p>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(t.id)}
          className={`p-1 rounded-md shrink-0 ${
            isDocument
              ? "hover:bg-white/10 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          }`}
          title="Close"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubAdd = subscribeToast((t) => {
      setToasts((prev) => [t, ...prev].slice(0, 6));
      if (!t.sticky) {
        const ms = t.durationMs ?? DEFAULT_DURATION[t.type];
        window.setTimeout(() => remove(t.id), ms);
      }
    });
    const unsubDismiss = subscribeDismiss((id) => remove(id));
    return () => {
      unsubAdd();
      unsubDismiss();
    };
  }, [remove]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      pushToast({
        type: "success",
        kind: "action",
        message: `Copied ${code}`,
        sticky: false,
        durationMs: 2000
      });
    } catch {
      pushToast({
        type: "error",
        kind: "alert",
        message: "Could not copy. Select the number manually."
      });
    }
  };

  const actionToasts = toasts.filter((t) => t.kind !== "document");
  const documentToasts = toasts.filter((t) => t.kind === "document");

  return (
    <>
      {children}

      {/* Action / auth / alert — top right */}
      <div
        className="fixed top-14 right-3 sm:top-16 sm:right-5 z-[200] flex flex-col gap-2.5 w-[min(100%-1.5rem,22rem)] pointer-events-none"
        aria-live="polite"
      >
        {actionToasts.map((t) => (
          <ToastCard key={t.id} t={t} onRemove={remove} onCopy={(c) => void copyCode(c)} />
        ))}
      </div>

      {/* Document numbers — bottom right, distinct from action toasts */}
      <div
        className="fixed bottom-4 right-3 sm:bottom-6 sm:right-5 z-[200] flex flex-col-reverse gap-2.5 w-[min(100%-1.5rem,24rem)] pointer-events-none"
        aria-live="polite"
      >
        {documentToasts.map((t) => (
          <ToastCard key={t.id} t={t} onRemove={remove} onCopy={(c) => void copyCode(c)} />
        ))}
      </div>
    </>
  );
}
