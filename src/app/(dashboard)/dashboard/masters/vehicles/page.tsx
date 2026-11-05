"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Vehicle Master lives under Admin → Operations. */
export default function VehicleMasterRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/admin/operations");
  }, [router]);
  return (
    <div className="p-6 text-xs text-slate-500">
      Opening Vehicle Master in Operations…
    </div>
  );
}
