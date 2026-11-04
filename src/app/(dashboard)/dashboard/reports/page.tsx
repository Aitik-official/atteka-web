"use client";

import React, { useState } from "react";
import { BarChart3, FileSpreadsheet, Calendar, Download, Printer } from "lucide-react";

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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C291</span>
            <h1 className="text-lg font-bold text-slate-800">Financial Reports & Trial Balance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/ACCOUNTS.PAGES/AccountMIS/TrailBalance.aspx & ProfitLoss.aspx (C292)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print Statement
          </button>
        </div>
      </div>

      {/* Selector and Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center text-xs">
        <div className="flex gap-2">
          <button
            onClick={() => setReportType("TRIAL_BALANCE")}
            className={`px-3 py-1.5 font-semibold rounded ${
              reportType === "TRIAL_BALANCE" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Trial Balance
          </button>
          <button
            onClick={() => setReportType("PROFIT_LOSS")}
            className={`px-3 py-1.5 font-semibold rounded ${
              reportType === "PROFIT_LOSS" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Profit & Loss Summary
          </button>
          <button
            onClick={() => setReportType("OPERATIONS")}
            className={`px-3 py-1.5 font-semibold rounded ${
              reportType === "OPERATIONS" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Operational Docket Register
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 px-2 border rounded"
          />
          <span className="text-slate-400">&rarr;</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 px-2 border rounded"
          />
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Atteka Logistics ERP &bull; General Ledger Trial Balance ({fromDate} to {toDate})
          </h2>
          <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Ledger Difference: &#8377;0 (Balanced)
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
            <tr>
              <th className="py-2.5 px-3">Account Code</th>
              <th className="py-2.5 px-3">Account Ledger Head</th>
              <th className="py-2.5 px-3 text-right">Debit Balance (&#8377;)</th>
              <th className="py-2.5 px-3 text-right">Credit Balance (&#8377;)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {trialBalanceData.map((row) => (
              <tr key={row.code} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">{row.code}</td>
                <td className="py-2.5 px-3 text-slate-800 font-medium">{row.account}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                  {row.debit > 0 ? `₹${row.debit.toLocaleString()}` : "-"}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                  {row.credit > 0 ? `₹${row.credit.toLocaleString()}` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300">
            <tr>
              <td colSpan={2} className="py-3 px-3 uppercase text-slate-800">
                Grand Total / Closing Ledger Balance
              </td>
              <td className="py-3 px-3 text-right text-blue-800 text-sm">
                &#8377;{totalDebit.toLocaleString()}
              </td>
              <td className="py-3 px-3 text-right text-blue-800 text-sm">
                &#8377;{totalCredit.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

