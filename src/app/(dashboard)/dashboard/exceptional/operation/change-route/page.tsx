"use client";

import React, { useMemo, useState } from "react";
import { toast } from "@/lib/toastBus";
import { useMasterOptions } from "@/hooks/useMasterOptions";
import { withCurrentOption } from "@/lib/masterOptions";
import {
  WcvBackLink,
  WcvDemoHint,
  WcvFieldRow,
  WcvFormCard,
  WcvResultTable,
  WcvSelect,
  WcvTextInput,
  wcvPillBtn
} from "@/components/common/WcvFormPrimitives";

type ThcRow = {
  id: string;
  documentNo: string;
  manualThcNo: string;
  thcDate: string;
  thcLocation: string;
  vendor: string;
  vehicleNo: string;
  currentRoute: string;
  newRoute: string;
  noOfCns: string;
  weight: string;
};

export default function ChangeRoutePage() {
  const { options } = useMasterOptions();
  const [step, setStep] = useState<"filter" | "result">("filter");
  const [thcNo, setThcNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<ThcRow | null>(null);

  const routeOptions = useMemo(
    () => withCurrentOption(options.routes, row?.newRoute || row?.currentRoute || ""),
    [options.routes, row?.newRoute, row?.currentRoute]
  );

  const load = async () => {
    if (!thcNo.trim()) {
      toast.error("Enter THC No");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        slug: "change-route",
        documentNo: thcNo.trim().toUpperCase()
      });
      const res = await fetch(`/api/exceptional/operation?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "THC not found");
        return;
      }
      setRow(data.data as ThcRow);
      setStep("result");
    } catch {
      toast.error("Failed to load THC");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!row) return;
    setSaving(true);
    try {
      const res = await fetch("/api/exceptional/operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "change-route",
          documentNo: row.documentNo,
          values: {
            newRoute: row.newRoute,
            currentRoute: row.newRoute
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Route update failed");
        return;
      }
      setRow(data.data as ThcRow);
      toast.success(`Route updated for ${row.documentNo} (demo)`);
    } catch {
      toast.error("Route update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      <WcvBackLink />

      {step === "filter" && (
        <WcvFormCard title="THC To Assign New Route">
          <WcvFieldRow label="THC No :" labelClassName="text-[#0171d3]">
            <WcvTextInput
              value={thcNo}
              onChange={setThcNo}
              onEnter={() => void load()}
              className="min-w-[220px] flex-1"
            />
          </WcvFieldRow>
          <div className="flex justify-center">
            <button type="button" disabled={loading} onClick={() => void load()} className={wcvPillBtn}>
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
          <WcvDemoHint
            label="Demo THC Nos"
            values={["THCALC12600110", "THCALC12600111", "THCALC12600112"]}
          />
        </WcvFormCard>
      )}

      {step === "result" && row && (
        <WcvFormCard
          title="Change Route"
          centeredTitle={false}
          className="max-w-6xl mx-auto"
          actions={
            <button
              type="button"
              onClick={() => {
                setStep("filter");
                setRow(null);
              }}
              className="text-[11px] font-semibold text-white/90 hover:text-white underline"
            >
              Change THC No
            </button>
          }
        >
          <WcvResultTable
            headers={[
              "THC No.",
              "Manual THC No.",
              "THC Date",
              "THC Location",
              "Vendor",
              "Vehicle No.",
              "Current Route",
              "No of CNs",
              "Weight"
            ]}
            cells={[
              <span key="n" className="font-mono font-semibold text-[#0171d3]">
                {row.documentNo}
              </span>,
              row.manualThcNo || "",
              row.thcDate,
              row.thcLocation,
              row.vendor,
              <span key="v" className="font-mono">
                {row.vehicleNo}
              </span>,
              <span key="r" className="font-semibold">
                {row.currentRoute}
              </span>,
              row.noOfCns,
              row.weight
            ]}
          />

          <div className="max-w-md">
            <label className="block text-[12px]">
              <span className="font-semibold text-slate-700 mb-1 block">Assign New Route</span>
              <WcvSelect
                value={row.newRoute}
                options={routeOptions}
                className="w-full"
                onChange={(value) => setRow({ ...row, newRoute: value })}
              />
            </label>
          </div>

          <div className="flex justify-center">
            <button type="button" disabled={saving} onClick={() => void save()} className={wcvPillBtn}>
              {saving ? "Saving..." : "Update Route"}
            </button>
          </div>
        </WcvFormCard>
      )}
    </div>
  );
}
