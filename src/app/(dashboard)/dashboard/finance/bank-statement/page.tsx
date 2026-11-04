"use client";

import React, { useState, useEffect } from "react";
import { Landmark, ArrowDownLeft, ArrowUpRight, Calendar, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { SimulatedBadge } from "@/components/common/SimulatedBadge";

export default function BankStatementPage() {
  const [statement, setStatement] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatement = () => {
    setLoading(true);
    fetch("/api/bank/statement")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStatement(d.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  return (
    <div className="space-y-4 pb-10">
      <PageHeader
        moduleCode="C850"
        title="Bank Statement & BRS Viewer"
        subtitle="Finance • BankStatement.aspx • IndusInd Corporate Account Statement & Bank Reconciliation"
        breadcrumbs={[
          { label: "Finance", href: "/dashboard" },
          { label: "Bank Statement" }
        ]}
        actions={<SimulatedBadge text="STATEMENT ADAPTER" />}
      />

      {/* Account Header Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">IndusInd Bank Limited - Nariman Point Branch</h3>
            <p className="text-slate-500 font-mono text-[11px]">A/c: 201002938471 • IFSC: INDB0000001 • Currency: INR</p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-slate-500 text-[11px] block">Clear Ledger Balance</span>
            <span className="text-base font-bold text-emerald-700 font-mono">₹1,582,500.00</span>
          </div>
          <button
            onClick={fetchStatement}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Statement"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statement Table with ResponsiveTableWrapper */}
      <ResponsiveTableWrapper
        title="Account Transaction Statement"
        totalCount={statement.length}
        showSwipeHint={true}
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Date</th>
              <th className="py-3 px-3.5">Cheque / Ref No</th>
              <th className="py-3 px-3.5">Transaction Description</th>
              <th className="py-3 px-3.5 text-right">Debit (Withdrawal)</th>
              <th className="py-3 px-3.5 text-right">Credit (Deposit)</th>
              <th className="py-3 px-3.5 text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Loading statement records...
                </td>
              </tr>
            ) : (
              statement.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3.5 text-slate-500 font-mono">{row.date}</td>
                  <td className="py-2.5 px-3.5 font-mono text-blue-700 font-semibold">{row.chequeOrRefNo}</td>
                  <td className="py-2.5 px-3.5 text-slate-700">{row.description}</td>
                  <td className="py-2.5 px-3.5 text-right text-red-600 font-semibold font-mono">
                    {row.debit > 0 ? `₹${row.debit.toLocaleString()}` : "-"}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-emerald-600 font-semibold font-mono">
                    {row.credit > 0 ? `₹${row.credit.toLocaleString()}` : "-"}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 font-mono">
                    ₹{row.balance?.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ResponsiveTableWrapper>
    </div>
  );
}
