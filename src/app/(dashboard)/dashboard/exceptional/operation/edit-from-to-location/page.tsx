"use client";

import React, { useMemo, useState } from "react";
import { toast } from "@/lib/toastBus";
import { useMasterOptions } from "@/hooks/useMasterOptions";
import { DOC_TYPE_OPTIONS, withCurrentOption } from "@/lib/masterOptions";
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

type DocType = "THC" | "PDC";

type DocRow = {
  id: string;
  documentNo: string;
  docType: DocType;
  dateLabel: string;
  fromLocation: string;
  toLocation: string;
  vendorName: string;
};

const DOC_OPTIONS = DOC_TYPE_OPTIONS.filter((d) => d.value === "PDC" || d.value === "THC");

export default function EditFromToLocationPage() {
  const { options } = useMasterOptions();
  const [step, setStep] = useState<"filter" | "detail">("filter");
  const [docType, setDocType] = useState<DocType>("PDC");
  const [docNo, setDocNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<DocRow | null>(null);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");

  const fromOptions = useMemo(
    () => withCurrentOption(options.locations, fromLocation),
    [options.locations, fromLocation]
  );
  const toOptions = useMemo(
    () => withCurrentOption(options.locations, toLocation),
    [options.locations, toLocation]
  );

  const load = async () => {
    if (!docNo.trim()) {
      toast.error("Enter THC / PDC No");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        slug: "edit-from-to-location",
        documentNo: docNo.trim().toUpperCase(),
        docType
      });
      const res = await fetch(`/api/exceptional/operation?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Document not found");
        return;
      }
      const d = data.data as DocRow;
      setRow(d);
      setFromLocation(d.fromLocation || "");
      setToLocation(d.toLocation || "");
      setStep("detail");
    } catch {
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!row) return;
    if (!fromLocation.trim() || !toLocation.trim()) {
      toast.error("Enter From and To Location");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exceptional/operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "edit-from-to-location",
          documentNo: row.documentNo,
          values: {
            fromLocation: fromLocation.trim().toUpperCase(),
            toLocation: toLocation.trim().toUpperCase()
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submit failed");
        return;
      }
      setRow(data.data as DocRow);
      setFromLocation(data.data.fromLocation);
      setToLocation(data.data.toLocation);
      toast.success(`Locations updated for ${row.documentNo} (demo)`);
    } catch {
      toast.error("Submit failed");
    } finally {
      setSaving(false);
    }
  };

  const demoValues =
    docType === "PDC"
      ? ["DSALC12600573", "DSALC12600532", "PSALC12600410"]
      : ["THCALC12600110", "THCALC12600111"];

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10 font-sans">
      <WcvBackLink />

      {step === "filter" && (
        <WcvFormCard title="THC To Assign Vendor">
          <WcvFieldRow label="Document Type">
            <WcvSelect
              value={docType}
              onChange={(v) => setDocType(v as DocType)}
              options={DOC_OPTIONS}
            />
          </WcvFieldRow>
          <WcvFieldRow label="Enter THC / PDC No :">
            <WcvTextInput
              value={docNo}
              onChange={setDocNo}
              onEnter={() => void load()}
              className="min-w-[220px] flex-1"
            />
          </WcvFieldRow>
          <div className="flex justify-center pt-2">
            <button type="button" disabled={loading} onClick={() => void load()} className={wcvPillBtn}>
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
          <WcvDemoHint label={`Demo ${docType} Nos`} values={demoValues} />
        </WcvFormCard>
      )}

      {step === "detail" && row && (
        <WcvFormCard
          title="THC / PDC Details"
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
              Change document
            </button>
          }
        >
          <WcvResultTable
            headers={[
              "Document No.",
              "Document Date",
              "From Location",
              "To Location",
              "Vendor Name"
            ]}
            cells={[
              <span key="n" className="font-mono font-semibold text-[#0171d3]">
                {row.documentNo}
              </span>,
              row.dateLabel,
              row.fromLocation,
              row.toLocation,
              row.vendorName
            ]}
          />

          <div className="space-y-3 max-w-xl">
            <WcvFieldRow label="From Location" labelWidth="w-[120px]">
              <WcvSelect
                value={fromLocation}
                onChange={setFromLocation}
                options={fromOptions}
                className="min-w-[200px] flex-1"
              />
            </WcvFieldRow>
            <WcvFieldRow label="To Location" labelWidth="w-[120px]">
              <WcvSelect
                value={toLocation}
                onChange={setToLocation}
                options={toOptions}
                className="min-w-[200px] flex-1"
              />
            </WcvFieldRow>
          </div>

          <div className="flex justify-center">
            <button type="button" disabled={saving} onClick={() => void save()} className={wcvPillBtn}>
              {saving ? "Saving..." : "Submit"}
            </button>
          </div>
        </WcvFormCard>
      )}
    </div>
  );
}
