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
  wcvInputCls,
  wcvPillBtn
} from "@/components/common/WcvFormPrimitives";

type PdcRow = {
  id: string;
  documentNo: string;
  manualPdcNo: string;
  pdcDate: string;
  pdcLocation: string;
  vendor: string;
  vendorCode: string;
  vehicleNo: string;
  deliveryLocation: string;
  noOfCns: string;
  weight: string;
};

export default function EditPdcVendorDateVehiclePage() {
  const { options } = useMasterOptions();
  const [step, setStep] = useState<"filter" | "result">("filter");
  const [pdcNo, setPdcNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<PdcRow | null>(null);

  const vendorOptions = useMemo(
    () => withCurrentOption(options.vendors, row?.vendor || ""),
    [options.vendors, row?.vendor]
  );
  const vehicleOptions = useMemo(
    () => withCurrentOption(options.vehicles, row?.vehicleNo || ""),
    [options.vehicles, row?.vehicleNo]
  );

  const load = async () => {
    if (!pdcNo.trim()) {
      toast.error("Enter PDC No");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        slug: "edit-pdc-vendor-date-vehicle",
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

  const save = async () => {
    if (!row) return;
    setSaving(true);
    try {
      const res = await fetch("/api/exceptional/operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "edit-pdc-vendor-date-vehicle",
          documentNo: row.documentNo,
          values: {
            vendor: row.vendor,
            vendorCode: row.vendorCode,
            pdcDate: row.pdcDate,
            vehicleNo: row.vehicleNo
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Update failed");
        return;
      }
      setRow(data.data as PdcRow);
      toast.success(`PDC ${row.documentNo} updated (demo)`);
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      <WcvBackLink />

      {step === "filter" && (
        <WcvFormCard title="PDC To Assign Vendor">
          <WcvFieldRow label="Enter PDC No." labelClassName="text-[#0171d3]">
            <WcvTextInput
              value={pdcNo}
              onChange={setPdcNo}
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
            label="Demo PDC Nos"
            values={["DSALC12600573", "DSALC12600532", "PSALC12600410"]}
          />
        </WcvFormCard>
      )}

      {step === "result" && row && (
        <WcvFormCard
          title="Edit PDC Vendor / Date / Vehicle"
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
              "Vendor",
              "Vehicle No.",
              "Delivery Location",
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
              row.vendor,
              <span key="v" className="font-mono">
                {row.vehicleNo}
              </span>,
              row.deliveryLocation,
              row.noOfCns,
              row.weight
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            <label className="block text-[12px]">
              <span className="font-semibold text-slate-700 mb-1 block">Vendor</span>
              <WcvSelect
                value={row.vendor}
                options={vendorOptions}
                className="w-full"
                onChange={(value) => {
                  const v = vendorOptions.find((x) => x.value === value || x.label === value);
                  setRow({
                    ...row,
                    vendor: value,
                    vendorCode: v?.code || row.vendorCode
                  });
                }}
              />
            </label>
            <label className="block text-[12px]">
              <span className="font-semibold text-slate-700 mb-1 block">PDC Date</span>
              <input
                type="date"
                value={toIsoDate(row.pdcDate)}
                onChange={(e) => setRow({ ...row, pdcDate: fromIsoDate(e.target.value) })}
                className={`${wcvInputCls} w-full`}
              />
            </label>
            <label className="block text-[12px]">
              <span className="font-semibold text-slate-700 mb-1 block">Vehicle No.</span>
              <WcvSelect
                value={row.vehicleNo}
                options={vehicleOptions}
                className="w-full font-mono"
                onChange={(value) => setRow({ ...row, vehicleNo: value })}
              />
            </label>
          </div>

          <div className="flex justify-center">
            <button type="button" disabled={saving} onClick={() => void save()} className={wcvPillBtn}>
              {saving ? "Saving..." : "Update PDC"}
            </button>
          </div>
        </WcvFormCard>
      )}
    </div>
  );
}

function toIsoDate(v: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return v;
}

function fromIsoDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
