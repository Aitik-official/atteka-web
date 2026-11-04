"use client";

import React, { useState } from "react";
import { BarChart3, FileSpreadsheet, Calendar, Download, Printer } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";

export default function ReportsHubPage() {
  const [reportType, setReportType] = useState<"TRIAL_BALANCE" | "PROFIT_LOSS" | "OPERATIONS">("TRIAL_BALANCE");
  const [fromDate, setFromDate] = useState("2026-11-01");
  const [toDate, setToDate] = useState("2026-11-04");

  const trialBalanceData = [
    { code: "1001", account: "Cash in Hand - Mumbai Branch", debit: 45000, credit: 0 },
    { code: "1002", account: "IndusInd Corporate Bank Account", debit: 1582500, credit: 0 },
    { code: "2001", account: "Sundry Debtors - Freight Customers", debit: 680000, credit: 0 },
    { code: "3001", account: "Sundry Creditors - Vehicle Vendors", debit: 0, credit: 320000 },
    { code: "4001", account: "Freight Income - FTL Operations", debit: 0, credit: 2150000 },
    { code: "5001", account: "Vehicle Hire & Trip Expenses", debit: 1250000, credit: 0 },
    { code: "5002", account: "Loading & Handling Expenses", debit: 85000, credit: 0 },
    { code: "6001", account: "GST Payable - Output RCM (5%)", debit: 0, credit: 107500 },
    { code: "6002", account: "GST Input Tax Credit (ITC)", debit: 107500, credit: 0 },
    { code: "9001", account: "Capital Account / Reserves", debit: 0, credit: 1172500 }
  ];

  const totalDebit = trialBalanceData.reduce((acc, row) => acc + row.debit, 0);
  const totalCredit = trialBalanceData.reduce((acc, row) => acc + row.credit, 0);

  return (
    <div className="space-y-4 pb-10">
      <PageHeader
        moduleCode="C291"
        title="Financial Reports & Trial Balance"
        subtitle="Reports • TrailBalance.aspx & ProfitLoss.aspx (C292) • General Ledger balances, revenue, and trip costs"
        breadcrumbs={[
          { label: "Reports", href: "/dashboard" },
          { label: "Trial Balance" }
        ]}
        actions={
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
        }
      />

      {/* Selector and Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-xs">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <button
            onClick={() => setReportType("TRIAL_BALANCE")}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors shrink-0 ${
              reportType === "TRIAL_BALANCE"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Trial Balance
          </button>
          <button
            onClick={() => setReportType("PROFIT_LOSS")}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors shrink-0 ${
              reportType === "PROFIT_LOSS"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Profit & Loss Summary
          </button>
          <button
            onClick={() => setReportType("OPERATIONS")}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors shrink-0 ${
              reportType === "OPERATIONS"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Operational Register
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 px-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 px-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Trial Balance Table */}
      <ResponsiveTableWrapper
        title={`General Ledger Trial Balance (${fromDate} to ${toDate})`}
        showSwipeHint={true}
        actions={
          <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Difference: ₹0 (Balanced)
          </span>
        }
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[620px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Account Code</th>
              <th className="py-3 px-3.5">Account Ledger Head</th>
              <th className="py-3 px-3.5 text-right">Debit Balance (₹)</th>
              <th className="py-3 px-3.5 text-right">Credit Balance (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {trialBalanceData.map((row) => (
              <tr key={row.code} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3.5 font-mono text-blue-700 font-bold">{row.code}</td>
                <td className="py-2.5 px-3.5 text-slate-900 font-medium">{row.account}</td>
                <td className="py-2.5 px-3.5 text-right font-semibold text-slate-700 font-mono">
                  {row.debit > 0 ? `₹${row.debit.toLocaleString()}` : "-"}
                </td>
                <td className="py-2.5 px-3.5 text-right font-semibold text-slate-700 font-mono">
                  {row.credit > 0 ? `₹${row.credit.toLocaleString()}` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold text-xs border-t-2 border-slate-300">
            <tr>
              <td colSpan={2} className="py-3 px-3.5 uppercase text-slate-800">
                Grand Total / Closing Ledger Balance
              </td>
              <td className="py-3 px-3.5 text-right text-blue-800 font-mono text-sm">
                ₹{totalDebit.toLocaleString()}
              </td>
              <td className="py-3 px-3.5 text-right text-blue-800 font-mono text-sm">
                ₹{totalCredit.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </ResponsiveTableWrapper>
    </div>
  );
}
