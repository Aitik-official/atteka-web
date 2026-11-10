"use client";

import React, { useState } from "react";
import { toast } from "@/lib/toastBus";
import {
  WcvBackLink,
  WcvDemoHint,
  WcvFieldRow,
  WcvFormCard,
  WcvResultTable,
  WcvTextInput,
  wcvPillBtn
} from "@/components/common/WcvFormPrimitives";

type PdcRow = {
  id: string;
  documentNo: string;
  manualPdcNo: string;
  pdcDate: string;
  pdcLocation: string;
  vehicleNo: string;
  noOfCns: string;
  weight: string;
  cancelled?: string;
};

export default function CancelDeliveryPdcPage() {
  const [step, setStep] = useState<"filter" | "result">("filter");
  const [pdcNo, setPdcNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [row, setRow] = useState<PdcRow | null>(null);

  const load = async () => {
    if (!pdcNo.trim()) {
      toast.error("Enter PDC No");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        slug: "cancel-delivery-pdc",
        documentNo: pdcNo.trim().toUpperCase()
      });
      const res = await fetch(`/api/exceptional/operation?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "PDC not found");
        return;
      }
      setRow(data.data as PdcRow);
      setStep("result");
    } catch {
      toast.error("Failed to load PDC");
    } finally {
      setLoading(false);
    }
  };

  const cancelPdc = async () => {
    if (!row) return;
    if (row.cancelled === "Y") {
      toast.info("PDC already cancelled");
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch("/api/exceptional/operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "cancel-delivery-pdc",
          documentNo: row.documentNo,
          values: {
            cancelled: "Y",
            cancelReason: "Cancelled via Exceptional Operation"
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cancel failed");
        return;
      }
      setRow(data.data as PdcRow);
      toast.success(`Delivery PDC ${row.documentNo} cancelled (demo)`);
    } catch {
      toast.error("Cancel failed");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10 font-sans">
      <WcvBackLink />

      {step === "filter" && (
        <WcvFormCard title="PDC Cancellation">
          <WcvFieldRow label="PDC No" labelWidth="w-[70px]" labelClassName="text-[#0171d3]">
            <WcvTextInput
              value={pdcNo}
              onChange={setPdcNo}
              onEnter={() => void load()}
              className="min-w-[220px]"
            />
          </WcvFieldRow>
          <div className="flex justify-center">
            <button type="button" disabled={loading} onClick={() => void load()} className={wcvPillBtn}>
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
          <WcvDemoHint
            label="Demo PDC Nos"
            values={["DSALC12600573", "DSALC12600532", "PSALC12600410"]}
          />
        </WcvFormCard>
      )}

      {step === "result" && row && (
        <WcvFormCard
          title="PDC Cancellation"
          centeredTitle={false}
          className="max-w-5xl mx-auto"
          actions={
            <button
              type="button"
              onClick={() => {
                setStep("filter");
                setRow(null);
              }}
              className="text-[11px] font-semibold text-white/90 hover:text-white underline"
            >
              Change PDC No
            </button>
          }
        >
          <WcvResultTable
            headers={[
              "PDC No.",
              "Manual PDC No.",
              "PDC Date",
              "PDC Location",
              "Vehicle Numer",
              "No of CNs",
              "Weight"
            ]}
            cells={[
              <span key="n" className="font-mono font-semibold text-[#0171d3]">
                {row.documentNo}
              </span>,
              row.manualPdcNo || "",
              row.pdcDate,
              row.pdcLocation,
              <span key="v" className="font-mono">
                {row.vehicleNo}
              </span>,
              row.noOfCns,
              row.weight
            ]}
          />

          {row.cancelled === "Y" && (
            <p className="text-center text-[12px] font-semibold text-red-600">
              This PDC is already cancelled.
            </p>
          )}

          <div className="flex justify-center">
            <button
              type="button"
              disabled={cancelling || row.cancelled === "Y"}
              onClick={() => void cancelPdc()}
              className={wcvPillBtn}
            >
              {cancelling ? "Cancelling..." : "Cancel PDC"}
            </button>
          </div>
        </WcvFormCard>
      )}
    </div>
  );
}
