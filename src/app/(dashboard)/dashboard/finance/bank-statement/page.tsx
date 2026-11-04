"use client";

import React, { useState, useEffect } from "react";
import { Landmark, ArrowDownLeft, ArrowUpRight, Calendar, RefreshCw } from "lucide-react";
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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C850</span>
            <h1 className="text-lg font-bold text-slate-800">Bank Statement & BRS Viewer</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/ACCOUNTS.PAGES/Vouchers/BankStatement.aspx • IndusInd Corporate Account Statement
          </p>
        </div>
        <SimulatedBadge text="STATEMENT SIMULATION ADAPTER" />
      </div>

      {/* Account Header Card */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">IndusInd Bank Limited - Nariman Point Branch</h3>
            <p className="text-slate-500 font-mono">A/c: 201002938471 • IFSC: INDB0000001 • Currency: INR</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-slate-500 block">Clear Ledger Balance</span>
            <span className="text-base font-bold text-emerald-700">&#8377;1,582,500.00</span>
          </div>
          <button
            onClick={fetchStatement}
            className="p-2 border rounded hover:bg-slate-100 text-slate-600"
            title="Refresh Statement"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statement Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
            <tr>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Cheque / Ref No</th>
              <th className="py-2.5 px-3">Transaction Description</th>
              <th className="py-2.5 px-3 text-right">Debit (Withdrawal)</th>
              <th className="py-2.5 px-3 text-right">Credit (Deposit)</th>
              <th className="py-2.5 px-3 text-right">Running Balance (&#8377;)</th>
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
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500 font-mono">{row.date}</td>
                  <td className="py-2.5 px-3 font-mono text-blue-700">{row.chequeOrRefNo}</td>
                  <td className="py-2.5 px-3 text-slate-700">{row.description}</td>
                  <td className="py-2.5 px-3 text-right text-red-600 font-semibold">
                    {row.debit > 0 ? `₹${row.debit.toLocaleString()}` : "-"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                    {row.credit > 0 ? `₹${row.credit.toLocaleString()}` : "-"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                    &#8377;{row.balance.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

