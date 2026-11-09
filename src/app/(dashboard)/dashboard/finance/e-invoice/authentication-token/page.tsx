"use client";

import React, { useState } from "react";
import { FileCog } from "lucide-react";
import { toast } from "@/lib/toastBus";

const OPTIONS = [
  { value: "", label: "---select---" },
  { value: "e-invoice", label: "E-Invoice Author Tocken" },
  { value: "e-waybill", label: "E-WayBill Author Tocken" }
] as const;

export default function AuthenticationTokenPage() {
  const [tokenType, setTokenType] = useState("e-invoice");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!tokenType) {
      toast.error("Please select E-WayBill & E-Invoice option");
      return;
    }

    setSaving(true);
    try {
      // WCV shows a numeric ack popup first, then success (keep client wording)
      const ackCode = tokenType === "e-invoice" ? "1" : "1";
      window.alert(ackCode);
      // brief simulated save
      await new Promise((r) => setTimeout(r, 200));
      window.alert("Auth token Save Sucessfully!!!");
      toast.success("Auth token saved (demo)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
        <FileCog className="w-4 h-4 text-slate-600" />
        <span>E-WayBill &amp; E-Invoice Author Tocken...</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <fieldset className="border border-[#0171d3] rounded-md px-2 pb-1.5 pt-1">
              <legend className="px-1 text-[11px] font-semibold text-slate-600">
                E-WayBill &amp; E-Invoice
              </legend>
              <select
                value={tokenType}
                onChange={(e) => setTokenType(e.target.value)}
                className="w-full h-9 px-1 text-sm bg-transparent outline-none text-slate-800"
              >
                {OPTIONS.map((o) => (
                  <option key={o.value || "select"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </fieldset>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="h-10 min-w-[88px] px-6 rounded-md text-white text-sm font-semibold shadow-sm disabled:opacity-60 bg-gradient-to-b from-[#4da3e8] to-[#0171d3] hover:from-[#3d93d8] hover:to-[#015fae]"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
