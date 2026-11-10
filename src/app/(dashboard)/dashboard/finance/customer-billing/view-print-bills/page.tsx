"use client";

import React, { useEffect, useMemo, useState } from "react";
import { printScoped } from "@/lib/printEngine";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Columns3,
  Copy,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  Printer,
  Search,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BILL_FORMATS, printCustomerBill } from "@/lib/billPrintFormats";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoInput(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatBillDate(value?: string | Date) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ViewPrintBillsPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [customers, setCustomers] = useState<any[]>([]);
  const [allBills, setAllBills] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const [dateFrom, setDateFrom] = useState(daysAgoInput(29));
  const [dateTo, setDateTo] = useState(todayInput());
  const [billingParty, setBillingParty] = useState("");
  const [billType, setBillType] = useState("Freight");
  const [billFormat, setBillFormat] = useState<string>(BILL_FORMATS[0]);
  const [billNo, setBillNo] = useState("");
  const [manualBillNo, setManualBillNo] = useState("");
  const [docketNo, setDocketNo] = useState("");

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [tableSearch, setTableSearch] = useState("");
  const [cardView, setCardView] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    sr: true,
    billNumber: true,
    billDate: true,
    billingBranch: true,
    partyName: true,
    billType: true,
    amount: true,
    gstAmount: true,
    total: true,
    topsheetNo: true,
    mrsNo: true,
    mrsDate: true,
    printPdf: true,
    eInvoice: true
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCustomers(d.data || []);
      })
      .catch(() => {});

    fetch("/api/billing")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAllBills(d.data || []);
      })
      .catch(() => {});
  }, []);

  const dateRangeLabel = `${new Date(dateFrom).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })} - ${new Date(dateTo).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })}`;

  const handleSearch = () => {
    setLoading(true);
    setFeedback(null);
    const fromTs = new Date(dateFrom).setHours(0, 0, 0, 0);
    const toTs = new Date(dateTo).setHours(23, 59, 59, 999);

    let list = [...allBills];

    list = list.filter((b) => {
      const t = new Date(b.billDate).getTime();
      return !Number.isNaN(t) && t >= fromTs && t <= toTs;
    });

    if (billingParty.trim()) {
      list = list.filter((b) =>
        String(b.customerName || b.partyName || "")
          .toLowerCase()
          .includes(billingParty.toLowerCase())
      );
    }

    if (billType) {
      const typeNeedle = billType.toLowerCase();
      list = list.filter((b) =>
        String(b.billType || "Freight Bill")
          .toLowerCase()
          .includes(typeNeedle.replace("freight", "freight"))
      );
    }

    if (billNo.trim()) {
      list = list.filter((b) =>
        String(b.billNumber || "")
          .toUpperCase()
          .includes(billNo.trim().toUpperCase())
      );
    }

    if (manualBillNo.trim()) {
      list = list.filter((b) =>
        String(b.manualBillNo || b.billNumber || "")
          .toUpperCase()
          .includes(manualBillNo.trim().toUpperCase())
      );
    }

    if (docketNo.trim()) {
      const tokens = docketNo
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      list = list.filter((b) => {
        const cns = (b.consignments || []).map((c: string) => String(c).toUpperCase());
        return tokens.some((t) => cns.includes(t) || cns.some((c: string) => c.includes(t)));
      });
    }

    setResults(list);
    setPage(1);
    setTableSearch("");
    setStep(2);
    setLoading(false);

    if (list.length === 0) {
      setFeedback("No bills found for the selected filters.");
    }
  };

  const searched = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return results;
    return results.filter(
      (b) =>
        String(b.billNumber || "").toLowerCase().includes(q) ||
        String(b.customerName || "").toLowerCase().includes(q) ||
        String(b.billingBranch || "").toLowerCase().includes(q) ||
        String(b.irnDetails?.irn || b.irn || "").toLowerCase().includes(q)
    );
  }, [results, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(searched.length / pageSize));
  const paged = searched.slice((page - 1) * pageSize, page * pageSize);

  const exportExcel = () => {
    const headers = [
      "Sr No",
      "Bill Number",
      "Bill Date",
      "Billing Branch",
      "Party Name",
      "Bill Type",
      "Amount",
      "GST Amount",
      "Total",
      "Topsheet No",
      "MRS No",
      "MRS Date",
      "E-Invoice"
    ];
    const rows = searched.map((b, idx) => [
      idx + 1,
      b.billNumber || "",
      formatBillDate(b.billDate),
      b.billingBranch || b.collectionBranch || "ALC1",
      b.customerName || "",
      b.billType || "Freight Bill",
      Number(b.totalFreight || 0).toFixed(2),
      Number(b.taxAmount || 0).toFixed(2),
      Number(b.grandTotal || 0).toFixed(2),
      b.topsheetNo || "",
      b.mrsNo || "",
      b.mrsDate ? formatBillDate(b.mrsDate) : "",
      b.irnDetails?.irn || b.irn || ""
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ViewPrintBills_${todayInput()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyTable = async () => {
    const text = searched
      .map(
        (b, idx) =>
          `${idx + 1}\t${b.billNumber}\t${formatBillDate(b.billDate)}\t${b.customerName}\t${Number(b.grandTotal || 0).toFixed(2)}`
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Copied bill rows to clipboard.");
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback("Unable to copy to clipboard.");
    }
  };

  const col = (key: string) => visibleCols[key] !== false;

  return (
    <div className="space-y-4 pb-16 max-w-7xl mx-auto">
      <PageHeader
        moduleCode="C194"
        title="View / Print Bills"
        subtitle="Finance • Customer Billing • ViewPrintBills.aspx"
actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm"
              title="Search filters"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <Link
              href="/dashboard/finance/customer-billing"
              className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        }
      />

      {feedback && (
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          {feedback}
        </div>
      )}

      {/* STEP 1 — Filters (matches screenshot) */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 max-w-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bill Date</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-blue-200 rounded-lg text-xs"
                />
              </div>
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 h-10 px-3 border border-blue-200 rounded-lg text-xs"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{dateRangeLabel}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">Billing Party</label>
            <div className="flex gap-2">
              <select
                value={billingParty}
                onChange={(e) => setBillingParty(e.target.value)}
                className="w-full h-10 px-3 border border-blue-200 rounded-lg text-xs bg-white"
              >
                <option value="">-- All Parties --</option>
                {customers.map((c) => (
                  <option key={c._id || c.customerCode} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs shrink-0"
                title="Lookup billing party"
                onClick={() => setFeedback("Select billing party from the dropdown (Customer Master).")}
              >
                ...
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">Bill Type</label>
            <select
              value={billType}
              onChange={(e) => setBillType(e.target.value)}
              className="w-full h-10 px-3 border border-blue-200 rounded-lg text-xs bg-white"
            >
              <option value="Freight">Freight</option>
              <option value="Other">Other</option>
              <option value="Supplementary">Supplementary</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">Bill Formate</label>
            <select
              value={billFormat}
              onChange={(e) => setBillFormat(e.target.value)}
              className="w-full h-10 px-3 border border-blue-200 rounded-lg text-xs bg-white"
            >
              {BILL_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              value={billNo}
              onChange={(e) => setBillNo(e.target.value.toUpperCase())}
              placeholder="Bill No"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400"
            />
          </div>

          <div>
            <input
              value={manualBillNo}
              onChange={(e) => setManualBillNo(e.target.value.toUpperCase())}
              placeholder="Manual Bill No"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400"
            />
          </div>

          <div>
            <input
              value={docketNo}
              onChange={(e) => setDocketNo(e.target.value.toUpperCase())}
              placeholder="Docket No"
              className="w-full h-10 px-3 border border-blue-300 rounded-lg text-xs text-blue-700 placeholder:text-blue-400"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSearch}
              className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Results table (matches screenshot) */}
      {step === 2 && (
        <div data-print-root className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColumnsMenu((v) => !v)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  <Columns3 className="w-3.5 h-3.5" /> Column visibility
                </button>
                {showColumnsMenu && (
                  <div className="absolute z-20 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-xs max-h-64 overflow-y-auto">
                    {Object.keys(visibleCols).map((key) => (
                      <label key={key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleCols[key]}
                          onChange={() => setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }))}
                        />
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={copyTable}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50 inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button
                type="button"
                onClick={exportExcel}
                className="px-3 py-1.5 text-xs font-semibold border border-emerald-200 text-emerald-800 rounded-lg bg-emerald-50 hover:bg-emerald-100 inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                type="button"
                onClick={() => printScoped()}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50 inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                type="button"
                onClick={() => setCardView((v) => !v)}
                className={`px-3 py-1.5 text-xs font-semibold border rounded-lg inline-flex items-center gap-1.5 ${
                  cardView
                    ? "border-blue-300 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> CARD VIEW
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="text-slate-600">
                Show{" "}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="mx-1 h-8 px-2 border border-slate-200 rounded-md"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>{" "}
                entries
              </label>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search:"
                  className="w-full h-8 pl-8 pr-3 border border-slate-200 rounded-md text-xs"
                />
              </div>
            </div>
          </div>

          {!cardView ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1200px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    {col("sr") && <th className="py-2.5 px-3">Sr No</th>}
                    {col("billNumber") && <th className="py-2.5 px-3">Bill Number</th>}
                    {col("billDate") && <th className="py-2.5 px-3">Bill Date</th>}
                    {col("billingBranch") && <th className="py-2.5 px-3">Billing Branch</th>}
                    {col("partyName") && <th className="py-2.5 px-3">Party Name</th>}
                    {col("billType") && <th className="py-2.5 px-3">Bill Type</th>}
                    {col("amount") && <th className="py-2.5 px-3">Amount</th>}
                    {col("gstAmount") && <th className="py-2.5 px-3">GST Amount</th>}
                    {col("total") && <th className="py-2.5 px-3">Total</th>}
                    {col("topsheetNo") && <th className="py-2.5 px-3">Topsheet No</th>}
                    {col("mrsNo") && <th className="py-2.5 px-3">MRS No</th>}
                    {col("mrsDate") && <th className="py-2.5 px-3">MRS Date</th>}
                    {col("printPdf") && <th className="py-2.5 px-3">Print PDF</th>}
                    {col("eInvoice") && <th className="py-2.5 px-3">E-Invoice</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-10 text-center text-slate-400">
                        No bills found. Adjust filters and search again.
                      </td>
                    </tr>
                  ) : (
                    paged.map((b, idx) => {
                      const amount = Number(b.totalFreight || 0);
                      const gst = Number(b.taxAmount || 0);
                      const total = Number(b.grandTotal || amount + gst);
                      const irn = b.irnDetails?.irn || b.irn || "";
                      return (
                        <tr key={b._id || b.billNumber || idx} className="hover:bg-slate-50/80">
                          {col("sr") && (
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {(page - 1) * pageSize + idx + 1}
                            </td>
                          )}
                          {col("billNumber") && (
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{b.billNumber}</td>
                          )}
                          {col("billDate") && (
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{formatBillDate(b.billDate)}</td>
                          )}
                          {col("billingBranch") && (
                            <td className="py-2.5 px-3 font-mono">{b.billingBranch || b.collectionBranch || "ALC1"}</td>
                          )}
                          {col("partyName") && (
                            <td className="py-2.5 px-3 text-slate-800 max-w-[220px] truncate" title={b.customerName}>
                              {b.customerName}
                            </td>
                          )}
                          {col("billType") && (
                            <td className="py-2.5 px-3">{b.billType || "Freight Bill"}</td>
                          )}
                          {col("amount") && (
                            <td className="py-2.5 px-3 font-mono">{amount.toFixed(2)}</td>
                          )}
                          {col("gstAmount") && (
                            <td className="py-2.5 px-3 font-mono">{gst.toFixed(2)}</td>
                          )}
                          {col("total") && (
                            <td className="py-2.5 px-3 font-mono font-bold">{total.toFixed(2)}</td>
                          )}
                          {col("topsheetNo") && <td className="py-2.5 px-3 text-slate-400">{b.topsheetNo || ""}</td>}
                          {col("mrsNo") && <td className="py-2.5 px-3 text-slate-400">{b.mrsNo || ""}</td>}
                          {col("mrsDate") && (
                            <td className="py-2.5 px-3 text-slate-400">
                              {b.mrsDate ? formatBillDate(b.mrsDate) : ""}
                            </td>
                          )}
                          {col("printPdf") && (
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={() => printCustomerBill(b, billFormat)}
                                className="text-blue-700 font-mono font-semibold hover:underline inline-flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                {b.billNumber}
                              </button>
                            </td>
                          )}
                          {col("eInvoice") && (
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-600 max-w-[160px] truncate" title={irn}>
                              {irn || "-"}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paged.map((b, idx) => (
                <div key={b._id || idx} className="border border-slate-200 rounded-xl p-4 text-xs space-y-1.5 bg-slate-50/50">
                  <div className="font-mono font-bold text-blue-700">{b.billNumber}</div>
                  <div className="text-slate-600">{formatBillDate(b.billDate)}</div>
                  <div className="font-semibold text-slate-800 truncate">{b.customerName}</div>
                  <div className="font-mono">₹{Number(b.grandTotal || 0).toLocaleString()}</div>
                  <button
                    type="button"
                    onClick={() => printCustomerBill(b, billFormat)}
                    className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold"
                  >
                    Print PDF
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing {(page - 1) * pageSize + (searched.length ? 1 : 0)} to{" "}
              {Math.min(page * pageSize, searched.length)} of {searched.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 font-semibold"
              >
                Back to Filters
              </button>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold">{page}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
