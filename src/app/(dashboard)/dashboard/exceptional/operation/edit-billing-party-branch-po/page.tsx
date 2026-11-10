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
  WcvTextInput,
  wcvPillBtn
} from "@/components/common/WcvFormPrimitives";

type DocketDetail = {
  id: string;
  documentNo: string;
  docketDateLabel: string;
  consignor: string;
  pkgs: string;
  actWt: string;
  chgWt: string;
  billPartyCode: string;
  billPartyName: string;
  deliveryLocation: string;
  poNumber: string;
  shipmentNo: string;
  dnNumber: string;
  financialBranchCode: string;
  financialBranchName: string;
};

const TITLE = "Docket Details & Assign New Billing Branch Party and Po number/Shipment no";

export default function EditBillingPartyBranchPoPage() {
  const { options } = useMasterOptions();
  const [step, setStep] = useState<"filter" | "detail">("filter");
  const [docketNo, setDocketNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<DocketDetail | null>(null);

  const load = async () => {
    if (!docketNo.trim()) {
      toast.error("Enter Docket No");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        slug: "edit-billing-party-branch-po",
        documentNo: docketNo.trim().toUpperCase()
      });
      const res = await fetch(`/api/exceptional/operation?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Docket not found");
        return;
      }
      setDetail(data.data as DocketDetail);
      setStep("detail");
    } catch {
      toast.error("Failed to load docket");
    } finally {
      setLoading(false);
    }
  };

  const lookupParty = () => {
    if (!detail) return;
    const code = detail.billPartyCode.trim().toUpperCase();
    const found = options.customers.find(
      (p) => p.code === code || p.value === code
    );
    if (!found) {
      toast.error("Party not found in Customer Master");
      return;
    }
    setDetail({
      ...detail,
      billPartyCode: found.code || found.value,
      billPartyName: found.label
    });
    toast.success(`Selected ${found.name || found.label}`);
  };

  const lookupBranch = () => {
    if (!detail) return;
    const code = detail.financialBranchCode.trim().toUpperCase();
    const found = options.branches.find((b) => b.code === code || b.value === code);
    if (!found) {
      toast.error("Branch not found in Branch Master");
      return;
    }
    setDetail({
      ...detail,
      financialBranchCode: found.code || found.value,
      financialBranchName: found.label
    });
    toast.success(`Selected ${found.name || found.label}`);
  };

  const save = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch("/api/exceptional/operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "edit-billing-party-branch-po",
          documentNo: detail.documentNo,
          values: {
            poNumber: detail.poNumber,
            shipmentNo: detail.shipmentNo,
            dnNumber: detail.dnNumber,
            billPartyCode: detail.billPartyCode,
            billPartyName: detail.billPartyName,
            financialBranchCode: detail.financialBranchCode,
            financialBranchName: detail.financialBranchName
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submit failed");
        return;
      }
      setDetail(data.data as DocketDetail);
      toast.success(`Updated ${detail.documentNo} (demo)`);
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
        <WcvFormCard title={TITLE} className="max-w-2xl mx-auto">
          <WcvFieldRow label="Enter Docket No." labelClassName="text-[#0171d3]">
            <WcvTextInput
              value={docketNo}
              onChange={setDocketNo}
              onEnter={() => void load()}
              className="min-w-[220px] flex-1"
            />
          </WcvFieldRow>
          <div className="flex justify-center">
            <button type="button" disabled={loading} onClick={() => void load()} className={wcvPillBtn}>
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
          <WcvDemoHint label="Demo Docket Nos" values={["ALC12660616", "ALC12660615", "ALC12660617"]} />
        </WcvFormCard>
      )}

      {step === "detail" && detail && (
        <WcvFormCard
          title={TITLE}
          centeredTitle={false}
          className="max-w-6xl mx-auto"
          actions={
            <button
              type="button"
              onClick={() => {
                setStep("filter");
                setDetail(null);
              }}
              className="text-[11px] font-semibold text-white/90 hover:text-white underline shrink-0"
            >
              Change Docket
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[980px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  {[
                    "Dkt No.",
                    "Dkt Date",
                    "Consignor",
                    "Pkgs",
                    "Act. Wt",
                    "Chg. Wt",
                    "Bill Party",
                    "Dely Loc"
                  ].map((h) => (
                    <th
                      key={h}
                      className="border border-slate-300 px-3 py-2 text-left font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-2 font-mono font-semibold text-[#0171d3]">
                    {detail.documentNo}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 whitespace-nowrap">
                    {detail.docketDateLabel}
                  </td>
                  <td className="border border-slate-300 px-3 py-2">{detail.consignor}</td>
                  <td className="border border-slate-300 px-3 py-2 text-center">{detail.pkgs}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right">{detail.actWt}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right">{detail.chgWt}</td>
                  <td className="border border-slate-300 px-3 py-2">{detail.billPartyName}</td>
                  <td className="border border-slate-300 px-3 py-2">{detail.deliveryLocation}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-3 max-w-3xl">
            <WcvFieldRow label="Po Number" labelWidth="w-[200px]">
              <WcvTextInput
                value={detail.poNumber}
                onChange={(v) => setDetail({ ...detail, poNumber: v })}
                className="w-[220px]"
              />
            </WcvFieldRow>
            <WcvFieldRow label="Shipment No" labelWidth="w-[200px]">
              <WcvTextInput
                value={detail.shipmentNo}
                onChange={(v) => setDetail({ ...detail, shipmentNo: v })}
                className="w-[220px]"
              />
            </WcvFieldRow>
            <WcvFieldRow label="DN Number" labelWidth="w-[200px]">
              <WcvTextInput
                value={detail.dnNumber}
                onChange={(v) => setDetail({ ...detail, dnNumber: v })}
                className="w-[220px]"
              />
            </WcvFieldRow>
            <WcvFieldRow label="Billing Party" labelWidth="w-[200px]">
              <WcvLookupInput
                value={detail.billPartyCode}
                onChange={(v) => setDetail({ ...detail, billPartyCode: v })}
                onLookup={lookupParty}
                hint={detail.billPartyName}
              />
            </WcvFieldRow>
            <WcvFieldRow label="Financial Completion Branch" labelWidth="w-[200px]">
              <WcvLookupInput
                value={detail.financialBranchCode}
                onChange={(v) => setDetail({ ...detail, financialBranchCode: v })}
                onLookup={lookupBranch}
                hint={detail.financialBranchName}
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
