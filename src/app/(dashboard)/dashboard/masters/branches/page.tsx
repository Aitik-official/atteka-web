"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Branch Master lives under Company Structure (Location Master). */
export default function BranchMasterRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/admin/company-structure");
  }, [router]);
  return (
    <div className="p-6 text-xs text-slate-500">
      Opening Branch Master in Company Structure…
    </div>
  );
}
