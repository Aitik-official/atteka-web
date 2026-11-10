"use client";

import React, { useMemo, useState } from "react";
import { toast } from "@/lib/toastBus";
import { DOC_TYPE_OPTIONS } from "@/lib/masterOptions";
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

type DocType = "THC" | "PDC" | "Manifest" | "Bill";

type DocRow = {
  id: string;
  documentNo: string;
  docType: DocType;
  manualNo: string;
  dateLabel: string;
  branch: string;
  vehicleNo: string;
  deliveryLocation: string;
  contractAmt: string;
  route?: string;
  partyName?: string;
  manualPrefix: string;
  manualSuffix: string;
};

export default function EditManualDocumentNumberPage() {
  const [step, setStep] = useState<"filter" | "detail">("filter");
  const [docType, setDocType] = useState<DocType>("THC");
  const [systemNo, setSystemNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<DocRow | null>(null);
  const [manualSuffix, setManualSuffix] = useState("");

  const detailTitle = useMemo(() => {
    switch (docType) {
      case "PDC":
        return "PDC Details & Assign New Manual No";
      case "THC":
        return "THC Details & Assign New Manual No";
      case "Manifest":
        return "Manifest Details & Assign New Manual No";
      case "Bill":
        return "Bill Details & Assign New Manual No";
      default:
        return "Details & Assign New Manual No";
    }
  }, [docType]);

  const load = async () => {
    if (!systemNo.trim()) {
      toast.error("Enter Document No. [System]");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        slug: "edit-manual-document-number",
        documentNo: systemNo.trim().toUpperCase(),
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
      setManualSuffix(d.manualSuffix || "");
      setStep("detail");
    } catch {
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!row) return;
    const manualNo = `${row.manualPrefix}${manualSuffix}`.trim();
    if (!manualSuffix.trim()) {
      toast.error("Enter Manual No");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exceptional/operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "edit-manual-document-number",
          documentNo: row.documentNo,
          values: {
            manualNo,
            manualSuffix: manualSuffix.trim().toUpperCase()
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Update failed");
        return;
      }
      setRow(data.data as DocRow);
      toast.success(`Manual No saved for ${row.documentNo} (demo)`);
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const demoValues =
    docType === "PDC"
      ? ["DSALC12600573", "DSALC12600532"]
      : docType === "THC"
        ? ["THCALC12600110", "THCALC12600111"]
        : docType === "Manifest"
          ? ["MFALC12600021", "MFALC12600022"]
          : ["BLALC12600031", "BLALC12600032"];

  const headers =
    row?.docType === "PDC"
      ? [
          "System No.",
          "Manual No.",
          "PDC Date",
          "PDC Branch",
          "Vehicle",
          "Delivery Location",
          "Contract Amt."
        ]
      : row?.docType === "THC"
        ? [
            "System No.",
            "Manual No.",
            "THC Date",
            "THC Branch",
            "Vehicle",
            "Route",
            "Contract Amt."
          ]
        : row?.docType === "Bill"
          ? [
              "System No.",
              "Manual No.",
              "Bill Date",
              "Bill Branch",
              "Party",
              "Location",
              "Bill Amt."
            ]
          : [
              "System No.",
              "Manual No.",
              "Manifest Date",
              "Branch",
              "Vehicle",
              "To Location",
              "Contract Amt."
            ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      <WcvBackLink />

      {step === "filter" && (
        <WcvFormCard title="Select CN Criteria">
          <WcvFieldRow label="Document Type :" labelWidth="w-[160px]">
            <WcvSelect
              value={docType}
              onChange={(v) => setDocType(v as DocType)}
              options={DOC_TYPE_OPTIONS}
            />
          </WcvFieldRow>
          <WcvFieldRow label="Document No. [System]" labelWidth="w-[160px]">
            <WcvTextInput
              value={systemNo}
              onChange={setSystemNo}
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
          title={detailTitle}
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
              Change criteria
            </button>
          }
        >
          <WcvResultTable
            headers={headers}
            cells={[
              <span key="n" className="font-mono font-semibold text-[#0171d3]">
                {row.documentNo}
              </span>,
              <span key="m" className="font-mono">
                {row.manualNo || ""}
              </span>,
              row.dateLabel,
              row.branch,
              <span key="v" className="font-mono">
                {row.docType === "Bill" ? row.partyName : row.vehicleNo}
              </span>,
              row.docType === "THC" ? row.route : row.deliveryLocation,
              row.contractAmt
            ]}
          />

          <WcvFieldRow
            label={`Manual ${row.docType === "Bill" ? "Bill" : row.docType} No :`}
            labelWidth="w-auto"
          >
            <span className="font-mono text-slate-700">{row.manualPrefix}</span>
            <WcvTextInput
              value={manualSuffix}
              onChange={setManualSuffix}
              className="w-[140px]"
            />
          </WcvFieldRow>

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
