"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, CheckSquare } from "lucide-react";
import { toast } from "@/lib/toastBus";
import { DocumentDateFilter,
  SelectionDocumentDateForm
} from "@/components/fleet/SelectionDocumentDateForm";

const SAMPLE_TRIPS = [
  { documentNo: "TS-2026-0042",
    tripsheetNo: "TS-2026-0042",
    vehicleNo: "MH04JK3515",
    driverName: "Vijay More",
    branch: "ALC1",
    documentDate: "06/11/2026",
    route: "BHIWANDI → PUNE",
    grossFreight: 45000,
    advancePaid: 25000,
    dieselExpense: 12000,
    tollExpense: 3200,
    unloadingLabor: 1500,
    status: "PENDING SETTLEMENT"
  },
  { documentNo: "TS-2026-0048",
    tripsheetNo: "TS-2026-0048",
    vehicleNo: "MH04AB1234",
    driverName: "Ramesh Patil",
    branch: "ALC1",
    documentDate: "06/11/2026",
    route: "BHIWANDI → NAGPUR",
    grossFreight: 68000,
    advancePaid: 30000,
    dieselExpense: 18500,
    tollExpense: 5400,
    unloadingLabor: 2000,
    status: "PENDING SETTLEMENT"
  },
  { documentNo: "TS-2026-0039",
    tripsheetNo: "TS-2026-0039",
    vehicleNo: "MH12CD5678",
    driverName: "Suresh Yadav",
    branch: "ALC1",
    documentDate: "05/11/2026",
    route: "MUMBAI → AHMEDABAD",
    grossFreight: 52000,
    advancePaid: 20000,
    dieselExpense: 14000,
    tollExpense: 4100,
    unloadingLabor: 1800,
    status: "PENDING SETTLEMENT"
  }
];

type TripRow = (typeof SAMPLE_TRIPS)[0];

function netPayable(row: TripRow) { return (
    Number(row.grossFreight) -
    Number(row.advancePaid) -
    Number(row.dieselExpense) -
    Number(row.tollExpense) -
    Number(row.unloadingLabor)
  );
}

export default function TripSettlementPage() { const [vehicles, setVehicles] = useState<string[]>([]);
  const [step, setStep] = useState<"filter" | "list" | "settle">("filter");
  const [results, setResults] = useState<TripRow[]>([]);
  const [selected, setSelected] = useState<TripRow | null>(null);
  const [form, setForm] = useState({ dieselExpense: 0,
    tollExpense: 0,
    unloadingLabor: 0,
    otherExpense: 0,
    remark: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => { if (!d.success) return;
        const nos = (d.data || [])
          .map((v: any) => String(v.vehicleNumber || "").trim().toUpperCase())
          .filter(Boolean);
        setVehicles([...new Set(nos)] as string[]);
      })
      .catch(() => {});
  }, []);

  const mapApiRow = (d: any): TripRow => ({ documentNo: d.documentNo || d.tripsheetNo,
    tripsheetNo: d.tripsheetNo || d.documentNo,
    vehicleNo: d.vehicleNo,
    driverName: d.driverName || "",
    branch: d.branch || "ALC1",
    documentDate: d.documentDate ? new Date(d.documentDate).toLocaleDateString("en-GB") : "",
    route: d.route || "",
    grossFreight: Number(d.grossFreight) || 0,
    advancePaid: Number(d.advancePaid) || 0,
    dieselExpense: Number(d.dieselExpense) || 0,
    tollExpense: Number(d.tollExpense) || 0,
    unloadingLabor: Number(d.unloadingLabor) || 0,
    status: d.status === "SETTLED" ? "SETTLED" : "PENDING SETTLEMENT"
  });

  const handleFilter = async (filter: DocumentDateFilter) => { if (filter.searchMode === "document" && !filter.documentNo.trim()) { toast.error("Enter Document No.");
      return;
    }
    try { const params = new URLSearchParams();
      if (filter.searchMode === "document") params.set("documentNo", filter.documentNo.trim());
      else { params.set("from", filter.fromDate);
        params.set("to", filter.toDate);
        if (filter.vehicleNo !== "Show all") params.set("vehicleNo", filter.vehicleNo);
      }
      const res = await fetch(`/api/fleet/trip-settlements?${params.toString()}`);
      const data = await res.json();
      let rows: TripRow[] = (data.data || []).map(mapApiRow);
      if (rows.length === 0) { // Seed editable draft from sample template when DB has no match
        const base = SAMPLE_TRIPS[0];
        rows = [
          { ...base,
            vehicleNo: filter.vehicleNo !== "Show all" ? filter.vehicleNo : base.vehicleNo,
            documentNo:
              filter.documentNo.trim() ||
              `TS-${(filter.vehicleNo !== "Show all" ? filter.vehicleNo : "NEW").replace(/\s/g, "")}-${Date.now()
                .toString()
                .slice(-4)}`,
            tripsheetNo:
              filter.documentNo.trim() ||
              `TS-${(filter.vehicleNo !== "Show all" ? filter.vehicleNo : "NEW").replace(/\s/g, "")}-${Date.now()
                .toString()
                .slice(-4)}`,
            status: "PENDING SETTLEMENT"
          }
        ];
      }
      setResults(rows);
      setStep("list");
      if (data.isMemoryStore) toast.warning("MongoDB unavailable — showing memory fallback");
    } catch { toast.error("Failed to load trip settlements");
    }
  };

  const openSettle = (row: TripRow) => { setSelected(row);
    setForm({ dieselExpense: row.dieselExpense,
      tollExpense: row.tollExpense,
      unloadingLabor: row.unloadingLabor,
      otherExpense: 0,
      remark: "Trip settlement approved"
    });
    setStep("settle");
  };

  const computedNet = selected
    ? Number(selected.grossFreight) -
      Number(selected.advancePaid) -
      Number(form.dieselExpense) -
      Number(form.tollExpense) -
      Number(form.unloadingLabor) -
      Number(form.otherExpense)
    : 0;

  const saveSettlement = async () => { if (!selected) return;
    setSaving(true);
    try { const res = await fetch("/api/fleet/trip-settlements", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentNo: selected.documentNo,
          tripsheetNo: selected.tripsheetNo,
          vehicleNo: selected.vehicleNo,
          driverName: selected.driverName,
          branch: selected.branch,
          route: selected.route,
          grossFreight: selected.grossFreight,
          advancePaid: selected.advancePaid,
          dieselExpense: form.dieselExpense,
          tollExpense: form.tollExpense,
          unloadingLabor: form.unloadingLabor,
          otherExpense: form.otherExpense,
          netPayable: computedNet,
          remark: form.remark,
          status: "SETTLED"
        })
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to save trip settlement");
        return;
      }
      toast.document(`Trip settlement approved for ${selected.tripsheetNo}`, {
        title: data.isMemoryStore ? "Settlement (Memory)" : "Trip Settlement",
        code: data.data?.documentNo || selected.tripsheetNo
      });
      setSelected(null);
      setStep("filter");
    } catch { toast.error("Failed to save trip settlement");
    } finally { setSaving(false);
    }
  };

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-10">
      {step === "filter" && (
        <SelectionDocumentDateForm
          vehicleLabel="Entry Vehicle No."
          vehicles={vehicles}
          onSubmit={handleFilter}
        />
      )}

      {step === "list" && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 flex items-center justify-between">
            <span>Trip Settlement Documents</span>
            <button
              type="button"
              onClick={() => setStep("filter")}
              className="text-[11px] font-medium bg-white/15 hover:bg-white/25 px-2 py-1 rounded"
            >
              Change Filter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#e8f1fb] text-slate-700">
                  <th className="border border-slate-200 px-2 py-2 text-left">Document / Tripsheet</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Vehicle No</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Driver</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Route</th>
                  <th className="border border-slate-200 px-2 py-2 text-left">Date</th>
                  <th className="border border-slate-200 px-2 py-2 text-right">Gross Freight</th>
                  <th className="border border-slate-200 px-2 py-2 text-right">Net Payable</th>
                  <th className="border border-slate-200 px-2 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.documentNo} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-2 font-mono font-semibold text-[#0171d3]">
                      {row.documentNo}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 font-mono font-bold">{row.vehicleNo}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.driverName}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.route}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.documentDate}</td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono">
                      {row.grossFreight.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono font-semibold text-emerald-700">
                      {netPayable(row).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => openSettle(row)}
                        className="px-2.5 py-1 rounded border border-[#7eb6e8] text-[#0171d3] font-semibold hover:bg-[#e8f1fb]"
                      >
                        Settle
                      </button>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={8} className="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      No tripsheets found for selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === "settle" && selected && (
        <div className="bg-white border border-slate-300 shadow-sm">
          <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2 flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Trip Settlement — {selected.tripsheetNo}
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
            <div>
              <div className="text-slate-500">Vehicle No</div>
              <div className="font-mono font-bold">{selected.vehicleNo}</div>
            </div>
            <div>
              <div className="text-slate-500">Driver</div>
              <div className="font-semibold">{selected.driverName}</div>
            </div>
            <div>
              <div className="text-slate-500">Route</div>
              <div className="font-semibold">{selected.route}</div>
            </div>
            <div>
              <div className="text-slate-500">Branch</div>
              <div className="font-semibold">{selected.branch}</div>
            </div>

            <div className="md:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
              <div className="flex justify-between">
                <span>Gross Freight</span>
                <span className="font-mono font-bold">
                  ₹{selected.grossFreight.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Less: Advance Paid</span>
                <span className="font-mono font-bold">
                  - ₹{selected.advancePaid.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diesel Expense</label>
              <input
                type="number"
                value={form.dieselExpense}
                onChange={(e) => setForm({ ...form, dieselExpense: Number(e.target.value) })}
                className="w-full h-9 px-3 border border-slate-300 rounded-sm font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Toll Expense</label>
              <input
                type="number"
                value={form.tollExpense}
                onChange={(e) => setForm({ ...form, tollExpense: Number(e.target.value) })}
                className="w-full h-9 px-3 border border-slate-300 rounded-sm font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unloading Labor</label>
              <input
                type="number"
                value={form.unloadingLabor}
                onChange={(e) => setForm({ ...form, unloadingLabor: Number(e.target.value) })}
                className="w-full h-9 px-3 border border-slate-300 rounded-sm font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Other Expense</label>
              <input
                type="number"
                value={form.otherExpense}
                onChange={(e) => setForm({ ...form, otherExpense: Number(e.target.value) })}
                className="w-full h-9 px-3 border border-slate-300 rounded-sm font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Remark</label>
              <input
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                className="w-full h-9 px-3 border border-slate-300 rounded-sm"
              />
            </div>
            <div className="md:col-span-2 flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-sm">
              <span>Net Balance Payable</span>
              <span className={`font-mono ${computedNet >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                ₹{computedNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setStep("list")}
              className="inline-flex items-center gap-1.5 text-[#0171d3] font-semibold text-xs hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to list
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={saveSettlement}
              className="inline-flex items-center gap-1.5 min-w-[150px] justify-center h-9 px-4 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] font-semibold text-sm hover:bg-[#e8f1fb] disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? "Saving..." : "Approve Settlement"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
