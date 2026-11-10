"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getExceptionalOpModule } from "@/lib/exceptionalOperationModules";
import { ExceptionalOperationEditor } from "@/components/exceptional/ExceptionalOperationEditor";

export default function ExceptionalOperationModulePage() {
  const params = useParams();
  const slug = params?.slug ? String(params.slug) : "";
  const module = getExceptionalOpModule(slug);

  if (!module) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-xl border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full inline-flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-base font-bold text-slate-900">Module not found</h1>
        <p className="text-xs text-slate-500">No exceptional operation for “{slug}”.</p>
        <Link
          href="/dashboard/exceptional/operation"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0171d3]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Operation
        </Link>
      </div>
    );
  }

  return <ExceptionalOperationEditor module={module} />;
}
