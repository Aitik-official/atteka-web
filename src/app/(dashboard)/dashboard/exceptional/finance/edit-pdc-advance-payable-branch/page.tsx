"use client";

import React, { useMemo, useState } from "react";
import { toast } from "@/lib/toastBus";
import { useMasterOptions } from "@/hooks/useMasterOptions";
import {
  WcvBackLink,
  WcvDemoHint,
  WcvFieldRow,
  WcvFormCard,
  WcvLookupInput,
  WcvTextInput,
  wcvInputCls,
  wcvPillBtn
} from "@/components/common/WcvFormPrimitives";

type DateMode = "range" | "today" | "last7" | "pdcNo";

type AdvancePdcRow = {
  id: string;
  documentNo: string;
  manualPdcNo: string;
  vehicleNo: string;
  vendorCode: string;
  vendorName: string;
  pdcAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  pdcDate: string;
  advancePayableBranch: string;
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtInr(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function EditPdcAdvancePayableBranchPage() {
  const { options } = useMasterOptions();
  const [step, setStep] = useState<"filter" | "result">("filter");
  const [dateMode, setDateMode] = useState<DateMode>("range");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return toInputDate(d);
  });
  const [toDate, setToDate] = useState(toInputDate(new Date()));
  const [pdcNo, setPdcNo] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const [branchCode, setBranchCode] = useState("ALC1");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<AdvancePdcRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const vendorHint = useMemo(() => {
    const code = vendorCode.trim().toUpperCase();
    if (!code) return "";
    const v = options.vendors.find((x) => x.code === code || x.value.startsWith(code));
    return v?.name || v?.label || "";
  }, [vendorCode, options.vendors]);

  const branchHint = useMemo(() => {
    const code = branchCode.trim().toUpperCase();
    if (!code) return "";
    const b = options.branches.find((x) => x.code === code || x.value === code);
    return b?.name || b?.label || "";
  }, [branchCode, options.branches]);

  const lookupVendor = () => {
    const code = vendorCode.trim().toUpperCase();
    if (!code) {
      toast.error("Enter vendor code");
      return;
    }
    const v = options.vendors.find((x) => x.code === code || x.value.startsWith(code));
    if (!v) {
      toast.error("Vendor not found in Vendor Master");
      return;
    }
    setVendorCode(v.code || code);
    toast.success(`Selected ${v.name || v.label}`);
  };

  const lookupBranch = () => {
    const code = branchCode.trim().toUpperCase();
    if (!code) {
      toast.error("Enter branch code");
      return;
    }
    const b = options.branches.find((x) => x.code === code || x.value === code);
    if (!b) {
      toast.error("Branch not found in Branch Master");
      return;
    }
    setBranchCode(b.code || code);
    toast.success(`Selected ${b.name || b.label}`);
  };

  const show = async () => {
    if (dateMode === "pdcNo" && !pdcNo.trim()) {
      toast.error("Enter PDC No");
      return;
    }
    if (!branchCode.trim()) {
      toast.error("Enter Advance Payable Branch");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        slug: "edit-pdc-advance-payable-branch",
        dateMode,
        from: fromDate,
        to: toDate,
        pdcNo: pdcNo.trim().toUpperCase(),
        vendorCode: vendorCode.trim().toUpperCase(),
        branch: branchCode.trim().toUpperCase()
      });
      const res = await fetch(`/api/exceptional/finance?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load PDCs");
        return;
      }
      setRows((data.data || []) as AdvancePdcRow[]);
      setSelected(new Set());
      setStep("result");
      if (!(data.data || []).length) {
        toast.info("No PDC rows for this criteria (demo)");
      }
    } catch {
      toast.error("Failed to load PDCs");
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((r) => r.documentNo)));
  };

  const toggleOne = (doc: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(doc);
      else next.delete(doc);
      return next;
    });
  };

  const update = async () => {
    if (!selected.size) {
      toast.error("Select at least one PDC");
      return;
    }
    if (!branchCode.trim()) {
      toast.error("Advance Payable Branch is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exceptional/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "edit-pdc-advance-payable-branch",
          documentNos: Array.from(selected),
          advancePayableBranch: branchCode.trim().toUpperCase()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Update failed");
        return;
      }
      const updatedMap = new Map(
        ((data.data || []) as AdvancePdcRow[]).map((r) => [r.documentNo, r])
      );
      setRows((prev) =>
        prev.map((r) => (updatedMap.has(r.documentNo) ? { ...r, ...updatedMap.get(r.documentNo)! } : r))
      );
      toast.success(data.message || "Updated (demo)");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const radioCls = "accent-[#0171d3] w-3.5 h-3.5";

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 font-sans">
      <WcvBackLink href="/dashboard/exceptional/finance" />

      {step === "filter" && (
        <WcvFormCard title="Selection Document Date" className="max-w-3xl mx-auto">
          <div className="space-y-4 text-[13px]">
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">Select Document Date</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="dateMode"
                    className={radioCls}
                    checked={dateMode === "range"}
                    onChange={() => setDateMode("range")}
                  />
                  <span className="text-slate-700">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    disabled={dateMode !== "range"}
                    onChange={(e) => setFromDate(e.target.value)}
                    className={`${wcvInputCls} w-[140px]`}
                  />
                  <span className="text-slate-700">To</span>
                  <input
                    type="date"
                    value={toDate}
                    disabled={dateMode !== "range"}
                    onChange={(e) => setToDate(e.target.value)}
                    className={`${wcvInputCls} w-[140px]`}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="dateMode"
                    className={radioCls}
                    checked={dateMode === "today"}
                    onChange={() => setDateMode("today")}
                  />
                  <span>Todays - Label</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="dateMode"
                    className={radioCls}
                    checked={dateMode === "last7"}
                    onChange={() => setDateMode("last7")}
                  />
                  <span>Last 7 Days</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="dateMode"
                    className={radioCls}
                    checked={dateMode === "pdcNo"}
                    onChange={() => setDateMode("pdcNo")}
                  />
                  <span>PDC No</span>
                  <WcvTextInput
                    value={pdcNo}
                    onChange={setPdcNo}
                    className="w-[160px]"
                    onEnter={() => {
                      if (dateMode === "pdcNo") void show();
                    }}
                  />
                </label>
              </div>
            </div>

            <WcvFieldRow label="PDC Vendor" labelClassName="text-[#0171d3]" labelWidth="w-[170px]">
              <WcvLookupInput
                value={vendorCode}
                onChange={setVendorCode}
                onLookup={lookupVendor}
                hint={vendorHint}
                className="w-[120px]"
              />
            </WcvFieldRow>

            <WcvFieldRow
              label="Advance Payable Branch"
              labelClassName="text-[#0171d3]"
              labelWidth="w-[170px]"
            >
              <WcvLookupInput
                value={branchCode}
                onChange={setBranchCode}
                onLookup={lookupBranch}
                hint={branchHint}
                className="w-[120px]"
              />
            </WcvFieldRow>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => void show()}
                className={`${wcvPillBtn} bg-[#0171d3] text-white border-[#0171d3] hover:bg-[#015bb0]`}
              >
                {loading ? "Loading..." : "show"}
              </button>
            </div>

            <WcvDemoHint
              label="Demo PDC Nos"
              values={["DSALC12600573", "DSALC12600532", "PSALC12600410", "DSALC12600601"]}
            />
            <p className="text-[11px] text-slate-400 text-center">
              Try vendor <span className="font-mono text-[#0171d3]">V00009</span> · branch{" "}
              <span className="font-mono text-[#0171d3]">ALC1</span>
            </p>
          </div>
        </WcvFormCard>
      )}

      {step === "result" && (
        <WcvFormCard
          title="Assign Advance Payment Branch"
          centeredTitle={false}
          className="max-w-6xl mx-auto"
          actions={
            <button
              type="button"
              onClick={() => {
                setStep("filter");
                setRows([]);
                setSelected(new Set());
              }}
              className="text-[11px] font-semibold text-white/90 hover:text-white underline"
            >
              Change criteria
            </button>
          }
        >
          <WcvFieldRow
            label="Advance Payable Branch"
            labelClassName="text-[#0171d3]"
            labelWidth="w-[170px]"
          >
            <WcvLookupInput
              value={branchCode}
              onChange={setBranchCode}
              onLookup={lookupBranch}
              hint={branchHint}
              className="w-[120px]"
            />
          </WcvFieldRow>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[900px]">
              <thead>
                <tr className="bg-[#0171d3] text-white">
                  {[
                    "Select",
                    "PDC Number",
                    "Manual PDC No",
                    "Vehicle Number",
                    "Vendor Name",
                    "PDC Amount",
                    "Advance Amount",
                    "Balance Amount"
                  ].map((h) => (
                    <th
                      key={h}
                      className="border border-slate-300 px-3 py-2 text-left font-semibold whitespace-nowrap"
                    >
                      {h === "Select" ? (
                        <input
                          type="checkbox"
                          className="accent-white"
                          checked={rows.length > 0 && selected.size === rows.length}
                          onChange={(e) => toggleAll(e.target.checked)}
                        />
                      ) : (
                        h
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border border-slate-300 px-3 py-8 text-center text-slate-500"
                    >
                      No records found for selected criteria
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          className="accent-[#0171d3]"
                          checked={selected.has(r.documentNo)}
                          onChange={(e) => toggleOne(r.documentNo, e.target.checked)}
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-mono font-semibold text-[#0171d3]">
                        {r.documentNo}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-mono">
                        {r.manualPdcNo || ""}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-mono">{r.vehicleNo}</td>
                      <td className="border border-slate-300 px-3 py-2">
                        {r.vendorCode}: {r.vendorName}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                        {fmtInr(r.pdcAmount)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                        {fmtInr(r.advanceAmount)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                        {fmtInr(r.balanceAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-start pt-2">
            <button
              type="button"
              disabled={saving || !rows.length}
              onClick={() => void update()}
              className={`${wcvPillBtn} bg-[#0171d3] text-white border-[#0171d3] hover:bg-[#015bb0]`}
            >
              {saving ? "Updating..." : "Update"}
            </button>
          </div>
        </WcvFormCard>
      )}
    </div>
  );
}
