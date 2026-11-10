"use client";

import React, { useState } from "react";
import { toast } from "@/lib/toastBus";
import { useMasterOptions } from "@/hooks/useMasterOptions";
import {
  WcvBackLink,
  WcvDemoHint,
  WcvFieldRow,
  WcvFormCard,
  WcvLookupInput,
  WcvResultTable,
  WcvSelect,
  WcvTextInput,
  wcvPillBtn
} from "@/components/common/WcvFormPrimitives";

type DocketDetail = {
  id: string;
  documentNo: string;
  docketDateLabel: string;
  fromLocation: string;
  toLocation: string;
  typeOfFtl: string;
  billingParty: string;
  billToPartyCode: string;
  gstin: string;
  serviceType: string;
};

export default function EditBillingPartyPage() {
  const { options, loading: mastersLoading } = useMasterOptions();
  const [step, setStep] = useState<"filter" | "detail">("filter");
  const [docketNo, setDocketNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<DocketDetail | null>(null);
  const [fromLoc, setFromLoc] = useState("");
  const [toLoc, setToLoc] = useState("");
  const [serviceType, setServiceType] = useState("FTL");
  const [typeOfFtl, setTypeOfFtl] = useState("");
  const [billToCode, setBillToCode] = useState("");
  const [gstin, setGstin] = useState("");

  const selectedParty = options.customers.find(
    (c) => c.code === billToCode.trim().toUpperCase() || c.value === billToCode.trim().toUpperCase()
  );

  const load = async () => {
    if (!docketNo.trim()) {
      toast.error("Enter Docket No");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        slug: "edit-billing-party",
        documentNo: docketNo.trim().toUpperCase()
      });
      const res = await fetch(`/api/exceptional/operation?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Docket not found");
        return;
      }
      const d = data.data as DocketDetail;
      setDetail(d);
      setBillToCode(d.billToPartyCode || "");
      setGstin(d.gstin || "");
      setFromLoc("");
      setToLoc("");
      setServiceType(d.serviceType || "FTL");
      setTypeOfFtl("");
      setStep("detail");
    } catch {
      toast.error("Failed to load docket");
    } finally {
      setLoading(false);
    }
  };

  const pickParty = () => {
    if (!selectedParty) {
      toast.error("Party code not found in Customer Master");
      return;
    }
    setBillToCode(selectedParty.code || selectedParty.value);
    setGstin(selectedParty.meta?.gstin || gstin);
    toast.success(`Selected ${selectedParty.name || selectedParty.label}`);
  };

  const save = async () => {
    if (!detail) return;
    if (!billToCode.trim()) {
      toast.error("Enter Bill to Party");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exceptional/operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "edit-billing-party",
          documentNo: detail.documentNo,
          values: {
            billToPartyCode: billToCode.trim().toUpperCase(),
            billingParty: selectedParty?.name || detail.billingParty,
            gstin: gstin || selectedParty?.meta?.gstin || "",
            fromLocation: fromLoc || detail.fromLocation,
            toLocation: toLoc || detail.toLocation,
            serviceType,
            typeOfFtl: typeOfFtl || detail.typeOfFtl
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submit failed");
        return;
      }
      setDetail(data.data as DocketDetail);
      toast.success(`Billing party updated for ${detail.documentNo}`);
    } catch {
      toast.error("Submit failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      <WcvBackLink />

      {step === "filter" && (
        <WcvFormCard title="Edit Billing Party">
          <WcvFieldRow label="Enter Docket No." labelClassName="text-[#0171d3]">
            <WcvTextInput
              value={docketNo}
              onChange={setDocketNo}
              onEnter={() => void load()}
              className="min-w-[220px] flex-1"
            />
          </WcvFieldRow>
          <div className="flex justify-center pt-2">
            <button type="button" disabled={loading} onClick={() => void load()} className={wcvPillBtn}>
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
          <WcvDemoHint label="Demo Docket Nos" values={["ALC12660616", "ALC12660615", "ALC12660617"]} />
          <p className="text-[11px] text-slate-400 text-center">
            Party / location / FTL lists load from Customer, Branch & FTL Type masters
            {mastersLoading ? " (loading…)" : ` · ${options.source}`}
          </p>
        </WcvFormCard>
      )}

      {step === "detail" && detail && (
        <WcvFormCard
          title="Docket Details & Assign New Party"
          centeredTitle={false}
          className="max-w-6xl mx-auto"
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
          <WcvResultTable
            headers={[
              "Docket No.",
              "Docket Date",
              "From Location",
              "To Location",
              "Type of FTL",
              "Billing Party"
            ]}
            cells={[
              <span key="n" className="font-mono font-semibold text-[#0171d3]">
                {detail.documentNo}
              </span>,
              detail.docketDateLabel,
              detail.fromLocation,
              detail.toLocation,
              detail.typeOfFtl,
              detail.billingParty
            ]}
          />

          <div className="space-y-3 pt-2 max-w-3xl">
            <WcvFieldRow label="Bill to Party" labelWidth="w-[110px]">
              <WcvLookupInput
                value={billToCode}
                onChange={setBillToCode}
                onLookup={pickParty}
                hint={selectedParty?.name || selectedParty?.label || ""}
              />
            </WcvFieldRow>
            <WcvFieldRow label="GSTIN No" labelWidth="w-[110px]">
              <span className="font-mono text-slate-700">{gstin || selectedParty?.meta?.gstin || "—"}</span>
            </WcvFieldRow>
            <WcvFieldRow label="From" labelWidth="w-[110px]">
              <WcvSelect
                value={fromLoc}
                onChange={setFromLoc}
                options={options.locations}
                includeEmpty
              />
            </WcvFieldRow>
            <WcvFieldRow label="To" labelWidth="w-[110px]">
              <WcvSelect value={toLoc} onChange={setToLoc} options={options.locations} includeEmpty />
            </WcvFieldRow>
            <WcvFieldRow label="Serivce Type" labelWidth="w-[110px]">
              <WcvSelect
                value={serviceType}
                onChange={setServiceType}
                options={options.serviceTypes}
              />
            </WcvFieldRow>
            <WcvFieldRow label="Type of FTL" labelWidth="w-[110px]">
              <WcvSelect
                value={typeOfFtl}
                onChange={setTypeOfFtl}
                options={options.ftlTypes}
                includeEmpty
              />
            </WcvFieldRow>
          </div>

          <div className="flex justify-center items-center gap-3 pt-2">
            <button type="button" disabled={saving} onClick={() => void save()} className={wcvPillBtn}>
              {saving ? "Saving..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("filter");
                setDetail(null);
              }}
              className={wcvPillBtn}
            >
              Back
            </button>
          </div>
        </WcvFormCard>
      )}
    </div>
  );
}
