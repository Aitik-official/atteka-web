"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { useRbac } from "@/components/rbac/RbacProvider";
import { Suspense } from "react";

function AccessDeniedInner() {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const { role } = useRbac();

  return (
    <div className="max-w-lg mx-auto mt-16 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <ShieldOff className="h-7 w-7" />
      </div>
      <h1 className="text-lg font-bold text-slate-900">Access denied</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your role <span className="font-mono font-semibold text-slate-800">{role}</span> cannot open
        this module.
      </p>
      {from ? (
        <p className="mt-1 truncate text-xs font-mono text-slate-400" title={from}>
          {from}
        </p>
      ) : null}
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto mt-16 p-8 text-center text-sm text-slate-500">
          Checking access…
        </div>
      }
    >
      <AccessDeniedInner />
    </Suspense>
  );
}
