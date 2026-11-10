"use client";

import React, { useMemo, useState } from "react";
import { toast } from "@/lib/toastBus";
import { useMasterOptions } from "@/hooks/useMasterOptions";
import { withCurrentOption } from "@/lib/masterOptions";
import {
  WcvBackLink,
  WcvFieldRow,
  WcvFormCard,
  WcvSelect,
  WcvTextInput,
  wcvPillBtn
} from "@/components/common/WcvFormPrimitives";

type CnDetail = {
  id: string;
  documentNo: string;
  bookingDateLabel: string;
  deliveryDateLabel: string;
  destination: string;
  nextLocation: string;
  mode: string;
  pkgs: number | string;
  actWt: number | string;
  consignor: string;
  consignee: string;
  reassignDeliveryTo: string;
  reassignNextTo: string;
};

export default function ReassignNextLocationPage() {
  const { options } = useMasterOptions();
  const [step, setStep] = useState<"filter" | "detail">("filter");
  const [docketMain, setDocketMain] = useState("");
  const [docketSuffix, setDocketSuffix] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<CnDetail | null>(null);

  const deliveryOptions = useMemo(
    () => withCurrentOption(options.locations, detail?.reassignDeliveryTo || ""),
    [options.locations, detail?.reassignDeliveryTo]
  );
  const nextOptions = useMemo(
    () => withCurrentOption(options.locations, detail?.reassignNextTo || ""),
    [options.locations, detail?.reassignNextTo]
  );

  const load = async () => {
    const doc = `${docketMain.trim()}${docketSuffix.trim()}`.toUpperCase();
    if (!docketMain.trim()) {
      toast.error("Enter Docket No");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        slug: "reassign-next-location",
        documentNo: doc || docketMain.trim().toUpperCase()
      });
      const res = await fetch(`/api/exceptional/operation?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Docket not found");
        return;
      }
      setDetail(data.data as CnDetail);
      setStep("detail");
    } catch {
      toast.error("Failed to load docket");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch("/api/exceptional/operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "reassign-next-location",
          documentNo: detail.documentNo,
          values: {
            reassignDeliveryTo: detail.reassignDeliveryTo,
            reassignNextTo: detail.reassignNextTo,
            destination: detail.destination,
            nextLocation: detail.nextLocation
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submit failed");
        return;
      }
      setDetail(data.data as CnDetail);
      toast.success(data.message || "Location reassigned (demo)");
    } catch {
      toast.error("Submit failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10 font-sans">
      <WcvBackLink />

      {step === "filter" && (
        <WcvFormCard title="Select CN Criteria">
          <WcvFieldRow label="Docket No :" labelWidth="w-[90px]">
            <WcvTextInput
              value={docketMain}
              onChange={setDocketMain}
              onEnter={() => void load()}
              className="w-[200px]"
            />
            <WcvTextInput
              value={docketSuffix}
              onChange={setDocketSuffix}
              onEnter={() => void load()}
              className="w-[72px]"
            />
          </WcvFieldRow>
          <div className="flex justify-center pt-2">
            <button type="button" disabled={loading} onClick={() => void load()} className={wcvPillBtn}>
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </WcvFormCard>
      )}

      {step === "detail" && detail && (
        <WcvFormCard
          title="Suffix CN Details"
          centeredTitle={false}
          className="max-w-5xl mx-auto"
          actions={
            <button
              type="button"
              onClick={() => {
                setStep("filter");
                setDetail(null);
              }}
              className="text-[11px] font-semibold text-white/90 hover:text-white underline"
            >
              Change criteria
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 text-[12px]">
            <InfoRow label="CN No :" value={detail.documentNo} link />
            <InfoRow label="Booking Date :" value={detail.bookingDateLabel} />
            <InfoRow label="Delivery Date :" value={detail.deliveryDateLabel || ""} />
            <InfoRow label="Destination :" value={detail.destination} link />
            <InfoRow label="Next Location :" value={detail.nextLocation} link />
            <InfoRow label="Mode :" value={detail.mode} link />
            <InfoRow label="Pkgs. :" value={String(detail.pkgs)} />
            <InfoRow label="Act. Wt. :" value={String(detail.actWt)} />
            <div />
            <InfoRow label="Consignor :" value={detail.consignor} link className="md:col-span-3" />
            <InfoRow label="Consignee :" value={detail.consignee} link className="md:col-span-3" />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <WcvFieldRow label="Re-assign Delivery Location to :" labelWidth="min-w-[200px]">
              <WcvSelect
                value={detail.reassignDeliveryTo}
                options={deliveryOptions}
                includeEmpty
                placeholder="---Select---"
                onChange={(v) => setDetail({ ...detail, reassignDeliveryTo: v })}
              />
            </WcvFieldRow>
            <WcvFieldRow label="Re-assign Next Location to :" labelWidth="min-w-[200px]">
              <WcvSelect
                value={detail.reassignNextTo}
                options={nextOptions}
                includeEmpty
                placeholder="---Select---"
                onChange={(v) => setDetail({ ...detail, reassignNextTo: v })}
              />
            </WcvFieldRow>
          </div>

          <div className="flex justify-center pt-3">
            <button type="button" disabled={saving} onClick={() => void save()} className={wcvPillBtn}>
              {saving ? "Saving..." : "Submit"}
            </button>
          </div>
        </WcvFormCard>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  link,
  className = ""
}: {
  label: string;
  value: string;
  link?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-x-2 gap-y-0.5 ${className}`}>
      <span className="font-semibold text-slate-800 shrink-0">{label}</span>
      <span className={link ? "text-[#0171d3] font-medium" : "text-slate-800"}>{value}</span>
    </div>
  );
}
