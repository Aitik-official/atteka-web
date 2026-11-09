"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Copy, Info, X } from "lucide-react";
import {
  dismissToast,
  pushToast,
  subscribeDismiss,
  subscribeToast,
  type ToastInput,
  type ToastRecord,
  type ToastTone
} from "@/lib/toastBus";

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 4000,
  info: 4000,
  warning: 5500,
  error: 7000
};

function toneClasses(type: ToastTone) {
  switch (type) {
    case "success":
      return {
        wrap: "bg-emerald-50 border-emerald-200 text-emerald-900",
        icon: "text-emerald-600",
        code: "bg-white border-emerald-200 text-slate-900",
        btn: "bg-emerald-600 hover:bg-emerald-700 text-white"
      };
    case "error":
      return {
        wrap: "bg-red-50 border-red-200 text-red-900",
        icon: "text-red-600",
        code: "bg-white border-red-200 text-slate-900",
        btn: "bg-red-600 hover:bg-red-700 text-white"
      };
    case "warning":
      return {
        wrap: "bg-amber-50 border-amber-200 text-amber-950",
        icon: "text-amber-600",
        code: "bg-white border-amber-200 text-slate-900",
        btn: "bg-amber-600 hover:bg-amber-700 text-white"
      };
    default:
      return {
        wrap: "bg-blue-50 border-blue-200 text-blue-950",
        icon: "text-blue-600",
        code: "bg-white border-blue-200 text-slate-900",
        btn: "bg-blue-600 hover:bg-blue-700 text-white"
      };
  }
}

function ToneIcon({ type }: { type: ToastTone }) {
  const cls = "w-4 h-4 shrink-0 mt-0.5";
  if (type === "success") return <CheckCircle2 className={`${cls} text-emerald-600`} />;
  if (type === "error") return <AlertCircle className={`${cls} text-red-600`} />;
  if (type === "warning") return <AlertTriangle className={`${cls} text-amber-600`} />;
  return <Info className={`${cls} text-blue-600`} />;
}

export function useToast() {
  return {
    toast: pushToast,
    success: (message: string, opts?: Omit<ToastInput, "type" | "message">) =>
      pushToast({ type: "success", message, ...opts }),
    error: (message: string, opts?: Omit<ToastInput, "type" | "message">) =>
      pushToast({ type: "error", message, ...opts }),
    info: (message: string, opts?: Omit<ToastInput, "type" | "message">) =>
      pushToast({ type: "info", message, ...opts }),
    warning: (message: string, opts?: Omit<ToastInput, "type" | "message">) =>
      pushToast({ type: "warning", message, ...opts }),
    sticky: (message: string, opts?: Omit<ToastInput, "message" | "sticky">) =>
      pushToast({ type: opts?.type || "success", message, sticky: true, ...opts }),
    dismiss: dismissToast
  };
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

  const copyCode = async (code: string, toastId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      pushToast({
        type: "success",
        message: `Copied ${code} to clipboard.`,
        sticky: false,
        durationMs: 2500
      });
    } catch {
      pushToast({ type: "error", message: "Could not copy. Select the number manually." });
    }
    // keep original sticky toast open
    void toastId;
  };

  return (
    <>
      {children}
      <div
        className="fixed top-16 right-3 sm:right-5 z-[100] flex flex-col gap-2 w-[min(100%-1.5rem,24rem)] pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const tone = toneClasses(t.type);
          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-xl border shadow-lg p-3.5 text-xs animate-in fade-in slide-in-from-top-2 ${tone.wrap}`}
              role="status"
            >
              <div className="flex items-start gap-2.5">
                <ToneIcon type={t.type} />
                <div className="flex-1 min-w-0 space-y-2">
                  {t.title && <div className="font-bold text-[11px] uppercase tracking-wide opacity-80">{t.title}</div>}
                  <div className="font-semibold leading-snug break-words">{t.message}</div>
                  {t.code && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <code className={`px-2.5 py-1 rounded-md border font-mono text-sm font-bold ${tone.code}`}>
                        {t.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyCode(t.code!, t.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold ${tone.btn}`}
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                  )}
                  {t.sticky && (
                    <p className="text-[10px] opacity-70 font-medium">Stays open until you close it</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="p-1 rounded-md hover:bg-black/5 text-current opacity-70 hover:opacity-100 shrink-0"
                  title="Close"
                  aria-label="Close notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
