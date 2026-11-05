"use client";

import React, { useState } from "react";
import { WcvActionCard, WcvRibbonHeader } from "@/components/common/WcvActionCard";
import { Layers, DollarSign, Truck, CheckCircle2, X, Plus, Save } from "lucide-react";

export default function OperationsAdminHubPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [ftlTypes, setFtlTypes] = useState([
    { id: "FTL-32S", name: "32 FT Single Axle Container", capacityTons: 7.5, dimensions: "32 x 8 x 8.5 ft" },
    { id: "FTL-32M", name: "32 FT Multi-Axle Container", capacityTons: 15.0, dimensions: "32 x 8 x 8.5 ft" },
    { id: "FTL-20C", name: "20 FT Standard Container", capacityTons: 9.0, dimensions: "20 x 8 x 8 ft" },
    { id: "FTL-16T", name: "Taurus 10-Tyre Open Body", capacityTons: 16.0, dimensions: "22 x 7.5 x 6 ft" },
    { id: "FTL-24T", name: "Multi-Axle 12-Tyre Heavy", capacityTons: 24.0, dimensions: "28 x 8 x 6.5 ft" }
  ]);

  const [routeCosts, setRouteCosts] = useState([
    { corridor: "Mumbai ➔ Delhi", ftlRate: 68000, minDieselLiters: 480, tollAllowance: 7200 },
    { corridor: "Mumbai ➔ Bangalore", ftlRate: 46000, minDieselLiters: 320, tollAllowance: 4800 },
    { corridor: "Mumbai ➔ Ahmedabad", ftlRate: 26000, minDieselLiters: 190, tollAllowance: 2800 },
    { corridor: "Delhi ➔ Kolkata", ftlRate: 72000, minDieselLiters: 510, tollAllowance: 8100 }
  ]);

  const handleSave = (name: string) => {
    setSuccessMsg(`${name} updated successfully.`);
    setTimeout(() => {
      setSuccessMsg(null);
      setActiveModal(null);
    }, 1500);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <WcvRibbonHeader title="Operations" />

      {/* 3 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <WcvActionCard
          title="FTL Type"
          description="Full Truck Load vehicle body classifications"
          onClick={() => setActiveModal("FTL Type Master")}
          icon={Layers}
        />
        <WcvActionCard
          title="Route Cost Master"
          description="Standard corridor tariffs & diesel allowances"
          onClick={() => setActiveModal("Route Cost Master")}
          icon={DollarSign}
        />
        <WcvActionCard
          title="Vehicle Master"
          description="Fleet registration and compliance documents"
          href="/dashboard/masters/vehicles"
          icon={Truck}
        />
      </div>

      {/* Interactive Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">{activeModal}</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                ✓ {successMsg}
              </div>
            )}

            {activeModal === "FTL Type Master" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Manage standard full truck load vehicle categories and payload tonnage capacities.
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Classification Name</th>
                        <th className="p-2.5">Capacity (Tons)</th>
                        <th className="p-2.5">Dimensions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ftlTypes.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-mono font-bold text-blue-600">{t.id}</td>
                          <td className="p-2.5 font-medium text-slate-800">{t.name}</td>
                          <td className="p-2.5 font-mono text-slate-700">{t.capacityTons} MT</td>
                          <td className="p-2.5 text-slate-500 font-mono">{t.dimensions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => {
                      const newId = `FTL-${ftlTypes.length + 1}`;
                      setFtlTypes([...ftlTypes, { id: newId, name: "Special Heavy Haul", capacityTons: 30.0, dimensions: "Custom" }]);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Category
                  </button>
                  <button
                    onClick={() => handleSave("FTL Classifications")}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Categories
                  </button>
                </div>
              </div>
            )}

            {activeModal === "Route Cost Master" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Standard line-haul trip rate contract benchmarks and driver diesel / FASTag advance limits.
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2.5">Corridor</th>
                        <th className="p-2.5">Standard FTL Rate</th>
                        <th className="p-2.5">Diesel Allowance</th>
                        <th className="p-2.5">Toll / FASTag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {routeCosts.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-semibold text-slate-800">{r.corridor}</td>
                          <td className="p-2.5 font-mono text-emerald-700 font-bold">₹{r.ftlRate.toLocaleString()}</td>
                          <td className="p-2.5 font-mono text-slate-600">{r.minDieselLiters} Liters</td>
                          <td className="p-2.5 font-mono text-slate-600">₹{r.tollAllowance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleSave("Route Cost Matrix")}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Cost Matrix
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
