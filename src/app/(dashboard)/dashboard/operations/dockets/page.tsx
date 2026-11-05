"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Filter, Plus, Truck, Download, Eye, Upload, CheckCircle, RefreshCw, AlertCircle, Edit3, Save, X, Printer } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { StatusBadge } from "@/components/common/StatusBadge";
import { printLaserA4Cn, printThermalCounterSlip, printDotMatrixSheet } from "@/lib/printEngine";

export default function DocketsListPage() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("action") === "edit";
  const targetDocketParam = searchParams.get("docket");

  const [consignments, setConsignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadDocket, setUploadDocket] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [printFormatModal, setPrintFormatModal] = useState<any | null>(null);

  const fetchDockets = () => {
    setLoading(true);
    let url = `/api/consignments?search=${encodeURIComponent(search)}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConsignments(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDockets();
  }, [search, statusFilter]);

  useEffect(() => {
    if (targetDocketParam) {
      // Case-insensitive match in currently loaded list
      const match = consignments.find(
        (c) => c.docketNo?.toLowerCase() === targetDocketParam.toLowerCase()
      );
      if (match) {
        setEditingDoc({ ...match });
      } else {
        // Fetch specific CN directly by docket number
        fetch(`/api/consignments/${encodeURIComponent(targetDocketParam)}`)
          .then((res) => res.json())
          .then((resData) => {
            if (resData.success && resData.data) {
              setEditingDoc({ ...resData.data });
            }
          })
          .catch(() => {});
      }
    }
  }, [targetDocketParam, consignments]);

  const handleFinancialChange = (field: string, val: number) => {
    if (!editingDoc) return;
    const currentFin = editingDoc.financials || {};
    const freightAmount = field === "freightAmount" ? val : Number(currentFin.freightAmount || 0);
    const loadingCharge = field === "loadingCharge" ? val : Number(currentFin.loadingCharge || 0);
    const gstRate = field === "gstRate" ? val : Number(currentFin.gstRate || 0);

    const subTotal = freightAmount + loadingCharge;
    const gstAmount = Math.round((subTotal * gstRate) / 100);
    const grandTotal = subTotal + gstAmount;

    setEditingDoc({
      ...editingDoc,
      financials: {
        ...currentFin,
        freightAmount,
        loadingCharge,
        subTotal,
        gstRate,
        gstAmount,
        grandTotal
      }
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/consignments/${editingDoc.docketNo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingDoc)
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({
          type: "success",
          text: `Consignment docket ${editingDoc.docketNo} updated successfully!`
        });
        setEditingDoc(null);
        fetchDockets();
        setTimeout(() => setToastMsg(null), 5000);
      } else {
        setToastMsg({
          type: "error",
          text: data.error || "Failed to update consignment"
        });
      }
    } catch {
      setToastMsg({ type: "error", text: "Error saving consignment changes." });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUploadPod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadDocket) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("docketNo", uploadDocket);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({
          type: "success",
          text: `POD for docket ${uploadDocket} uploaded successfully! Status updated to DELIVERED.`
        });
        setUploadDocket(null);
        setUploadFile(null);
        fetchDockets();
        setTimeout(() => setToastMsg(null), 5000);
      } else {
        setToastMsg({
          type: "error",
          text: data.error || "Upload failed. Please try again."
        });
      }
    } catch {
      setToastMsg({ type: "error", text: "Error uploading POD file." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Reusable Modular Header */}
      <PageHeader
        moduleCode="C011"
        title="Consignments & Dockets Register"
        subtitle="Operations • EditCnNew.aspx • Master registry with live search & POD verification"
        breadcrumbs={[
          { label: "Operations", href: "/dashboard" },
          { label: "Consignments Register" }
        ]}
        actions={
          <Link
            href="/dashboard/operations/new-cn"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Consignment
          </Link>
        }
      />

      {/* Edit Mode Notification Banner */}
      {isEditMode && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">Edit CN Mode Active</p>
              <p className="text-[11px] text-amber-800">
                Click the <strong>Edit</strong> button on any consignment docket below to modify billing party, consignor/consignee, goods package details, corridor routing, or freight charges.
              </p>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            toastMsg.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Docket No, Customer, City..."
            className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium hidden xs:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-slate-700 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">BOOKED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="ARRIVED">ARRIVED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="BILLED">BILLED</option>
            </select>
          </div>

          <button
            onClick={fetchDockets}
            className="px-3 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Reusable Responsive Table Wrapper */}
      <ResponsiveTableWrapper
        title="Active Docket Register"
        totalCount={consignments.length}
        showSwipeHint={true}
      >
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[720px]">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Docket No</th>
              <th className="py-3 px-3.5">Date</th>
              <th className="py-3 px-3.5">Branch</th>
              <th className="py-3 px-3.5">Billing Party</th>
              <th className="py-3 px-3.5">Corridor Route</th>
              <th className="py-3 px-3.5">Packages & Weight</th>
              <th className="py-3 px-3.5">Grand Total</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-3.5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-3 px-3.5"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                    <td className="py-3 px-3.5"><div className="h-4 bg-slate-100 rounded w-12"></div></td>
                    <td className="py-3 px-3.5"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-3 px-3.5"><div className="h-4 bg-slate-100 rounded w-28"></div></td>
                    <td className="py-3 px-3.5"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    <td className="py-3 px-3.5"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3 px-3.5"><div className="h-4 bg-slate-100 rounded w-14"></div></td>
                    <td className="py-3 px-3.5"><div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div></td>
                  </tr>
                ))}
              </>
            ) : consignments.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400">
                  No matching consignments found. Create one from &quot;New Consignment&quot;.
                </td>
              </tr>
            ) : (
              consignments.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-blue-700 font-mono">{c.docketNo}</td>
                  <td className="py-2.5 px-3.5 text-slate-500">
                    {new Date(c.bookingDate).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">{c.bookingBranch}</td>
                  <td className="py-2.5 px-3.5 text-slate-800 font-medium truncate max-w-[160px]">
                    {c.billingParty}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">
                    <span className="font-semibold">{c.fromLocation}</span> &rarr;{" "}
                    <span className="font-semibold">{c.toLocation}</span>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">
                    {c.packageDetails?.packagesCount} pkgs ({c.packageDetails?.chargedWeight} kg)
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-slate-900 font-mono">
                    ₹{c.financials?.grandTotal?.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3.5 text-right space-x-1.5">
                    <button
                      onClick={() => setEditingDoc({ ...c })}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                      title="Edit Consignment Details"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => setSelectedDoc(c)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold transition-colors"
                      title="View Full Docket"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setPrintFormatModal(c)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                      title="Multi-Format Printing"
                    >
                      <Printer className="w-3 h-3" /> Print
                    </button>
                    <button
                      onClick={() => setUploadDocket(c.docketNo)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[11px] font-semibold transition-colors"
                      title="Upload Proof of Delivery"
                    >
                      POD
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ResponsiveTableWrapper>

      {/* Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-mono">
                  Docket: {selectedDoc.docketNo}
                </h2>
                <p className="text-xs text-slate-500">
                  Booked on {new Date(selectedDoc.bookingDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Consignor (Shipper)</span>
                <p className="font-semibold">{selectedDoc.consignor?.name}</p>
                <p className="text-slate-600">{selectedDoc.consignor?.address}</p>
                <p className="text-slate-500">{selectedDoc.consignor?.city} - {selectedDoc.consignor?.pincode}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Consignee (Receiver)</span>
                <p className="font-semibold">{selectedDoc.consignee?.name}</p>
                <p className="text-slate-600">{selectedDoc.consignee?.address}</p>
                <p className="text-slate-500">{selectedDoc.consignee?.city} - {selectedDoc.consignee?.pincode}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Goods Description:</span>
                <span className="font-semibold text-slate-800">
                  {selectedDoc.packageDetails?.productDescription} ({selectedDoc.packageDetails?.packageType})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Quantity & Weights:</span>
                <span className="font-semibold text-slate-800">
                  {selectedDoc.packageDetails?.packagesCount} pkgs | Actual: {selectedDoc.packageDetails?.actualWeight} kg | Charged: {selectedDoc.packageDetails?.chargedWeight} kg
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-blue-700 text-sm">
                <span>Grand Total Freight:</span>
                <span className="font-mono">₹{selectedDoc.financials?.grandTotal?.toLocaleString()}</span>
              </div>
            </div>

            {selectedDoc.podUrl && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-xs">
                <span className="font-bold text-green-800 block mb-1">Proof of Delivery (POD) Attached</span>
                <a
                  href={selectedDoc.podUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <Eye className="w-3.5 h-3.5" /> View Scanned POD Document
                </a>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setEditingDoc({ ...selectedDoc });
                  setSelectedDoc(null);
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Consignment
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Edit Consignment Modal */}
      {editingDoc && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-4 sm:p-6 border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-mono">
                    Edit Consignment: {editingDoc.docketNo}
                  </h2>
                  <p className="text-xs text-slate-500">Modify consignment docket data and financial charges</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Section 1: Core Routing & Party */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                  1. Core Booking & Routing
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Billing Party</label>
                    <input
                      type="text"
                      value={editingDoc.billingParty || ""}
                      onChange={(e) => setEditingDoc({ ...editingDoc, billingParty: e.target.value })}
                      className="w-full h-8.5 px-2.5 border border-slate-200 bg-white rounded-lg font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Booking Branch</label>
                    <input
                      type="text"
                      value={editingDoc.bookingBranch || ""}
                      onChange={(e) => setEditingDoc({ ...editingDoc, bookingBranch: e.target.value.toUpperCase() })}
                      className="w-full h-8.5 px-2.5 border border-slate-200 bg-white rounded-lg font-semibold uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Payment Basis</label>
                    <select
                      value={editingDoc.paymentBasis || "TBB"}
                      onChange={(e) => setEditingDoc({ ...editingDoc, paymentBasis: e.target.value })}
                      className="w-full h-8.5 px-2 border border-slate-200 bg-white rounded-lg font-medium"
                    >
                      <option value="TBB">TBB (To Be Billed)</option>
                      <option value="PAID">PAID (Prepaid)</option>
                      <option value="TO-PAY">TO-PAY (Collect at Delivery)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">From Location</label>
                    <input
                      type="text"
                      value={editingDoc.fromLocation || ""}
                      onChange={(e) => setEditingDoc({ ...editingDoc, fromLocation: e.target.value.toUpperCase() })}
                      className="w-full h-8.5 px-2.5 border border-slate-200 bg-white rounded-lg font-semibold uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">To Location (Destination)</label>
                    <input
                      type="text"
                      value={editingDoc.toLocation || ""}
                      onChange={(e) => setEditingDoc({ ...editingDoc, toLocation: e.target.value.toUpperCase() })}
                      className="w-full h-8.5 px-2.5 border border-slate-200 bg-white rounded-lg font-semibold uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Service Type</label>
                    <select
                      value={editingDoc.serviceType || "FTL"}
                      onChange={(e) => setEditingDoc({ ...editingDoc, serviceType: e.target.value })}
                      className="w-full h-8.5 px-2 border border-slate-200 bg-white rounded-lg font-medium"
                    >
                      <option value="FTL">Full Truck Load (FTL)</option>
                      <option value="LTL">Part Load (LTL)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Consignor & Consignee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                    2. Consignor (Sender)
                  </span>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">Company / Name</label>
                    <input
                      type="text"
                      value={editingDoc.consignor?.name || ""}
                      onChange={(e) =>
                        setEditingDoc({
                          ...editingDoc,
                          consignor: { ...(editingDoc.consignor || {}), name: e.target.value }
                        })
                      }
                      className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">Address</label>
                    <input
                      type="text"
                      value={editingDoc.consignor?.address || ""}
                      onChange={(e) =>
                        setEditingDoc({
                          ...editingDoc,
                          consignor: { ...(editingDoc.consignor || {}), address: e.target.value }
                        })
                      }
                      className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">City</label>
                      <input
                        type="text"
                        value={editingDoc.consignor?.city || ""}
                        onChange={(e) =>
                          setEditingDoc({
                            ...editingDoc,
                            consignor: { ...(editingDoc.consignor || {}), city: e.target.value.toUpperCase() }
                          })
                        }
                        className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Phone</label>
                      <input
                        type="text"
                        value={editingDoc.consignor?.phone || ""}
                        onChange={(e) =>
                          setEditingDoc({
                            ...editingDoc,
                            consignor: { ...(editingDoc.consignor || {}), phone: e.target.value }
                          })
                        }
                        className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                    3. Consignee (Receiver)
                  </span>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">Company / Name</label>
                    <input
                      type="text"
                      value={editingDoc.consignee?.name || ""}
                      onChange={(e) =>
                        setEditingDoc({
                          ...editingDoc,
                          consignee: { ...(editingDoc.consignee || {}), name: e.target.value }
                        })
                      }
                      className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">Address</label>
                    <input
                      type="text"
                      value={editingDoc.consignee?.address || ""}
                      onChange={(e) =>
                        setEditingDoc({
                          ...editingDoc,
                          consignee: { ...(editingDoc.consignee || {}), address: e.target.value }
                        })
                      }
                      className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">City</label>
                      <input
                        type="text"
                        value={editingDoc.consignee?.city || ""}
                        onChange={(e) =>
                          setEditingDoc({
                            ...editingDoc,
                            consignee: { ...(editingDoc.consignee || {}), city: e.target.value.toUpperCase() }
                          })
                        }
                        className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Phone</label>
                      <input
                        type="text"
                        value={editingDoc.consignee?.phone || ""}
                        onChange={(e) =>
                          setEditingDoc({
                            ...editingDoc,
                            consignee: { ...(editingDoc.consignee || {}), phone: e.target.value }
                          })
                        }
                        className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Package & Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                    4. Goods & Packages
                  </span>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">Product Description</label>
                    <input
                      type="text"
                      value={editingDoc.packageDetails?.productDescription || ""}
                      onChange={(e) =>
                        setEditingDoc({
                          ...editingDoc,
                          packageDetails: {
                            ...(editingDoc.packageDetails || {}),
                            productDescription: e.target.value
                          }
                        })
                      }
                      className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Package Type</label>
                      <select
                        value={editingDoc.packageDetails?.packageType || "BOX"}
                        onChange={(e) =>
                          setEditingDoc({
                            ...editingDoc,
                            packageDetails: {
                              ...(editingDoc.packageDetails || {}),
                              packageType: e.target.value
                            }
                          })
                        }
                        className="w-full h-8 px-1.5 border border-slate-200 bg-white rounded-md"
                      >
                        <option value="BOX">BOX</option>
                        <option value="CRATE">CRATE</option>
                        <option value="DRUM">DRUM</option>
                        <option value="PALLET">PALLET</option>
                        <option value="BAG">BAG</option>
                        <option value="CARTON">CARTON</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Pkgs Count</label>
                      <input
                        type="number"
                        value={editingDoc.packageDetails?.packagesCount ?? 0}
                        onChange={(e) =>
                          setEditingDoc({
                            ...editingDoc,
                            packageDetails: {
                              ...(editingDoc.packageDetails || {}),
                              packagesCount: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Chg Wt (kg)</label>
                      <input
                        type="number"
                        value={editingDoc.packageDetails?.chargedWeight ?? 0}
                        onChange={(e) =>
                          setEditingDoc({
                            ...editingDoc,
                            packageDetails: {
                              ...(editingDoc.packageDetails || {}),
                              chargedWeight: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                    5. Financial Charges (₹)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Freight (₹)</label>
                      <input
                        type="number"
                        value={editingDoc.financials?.freightAmount ?? 0}
                        onChange={(e) => handleFinancialChange("freightAmount", Number(e.target.value))}
                        className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Loading (₹)</label>
                      <input
                        type="number"
                        value={editingDoc.financials?.loadingCharge ?? 0}
                        onChange={(e) => handleFinancialChange("loadingCharge", Number(e.target.value))}
                        className="w-full h-8 px-2 border border-slate-200 bg-white rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">GST Rate (%)</label>
                      <select
                        value={editingDoc.financials?.gstRate ?? 5}
                        onChange={(e) => handleFinancialChange("gstRate", Number(e.target.value))}
                        className="w-full h-8 px-1.5 border border-slate-200 bg-white rounded-md"
                      >
                        <option value={0}>0% Exempt</option>
                        <option value={5}>5% Standard RCM</option>
                        <option value={12}>12% Forward</option>
                        <option value={18}>18% High</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center text-xs">
                    <span className="text-blue-700 font-medium">
                      Subtotal: ₹{editingDoc.financials?.subTotal?.toLocaleString() ?? 0} + GST: ₹{editingDoc.financials?.gstAmount?.toLocaleString() ?? 0}
                    </span>
                    <span className="font-bold text-blue-900 font-mono text-sm">
                      Total: ₹{editingDoc.financials?.grandTotal?.toLocaleString() ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Compliance & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">E-Way Bill No</label>
                  <input
                    type="text"
                    value={editingDoc.ewayBillNo || ""}
                    onChange={(e) => setEditingDoc({ ...editingDoc, ewayBillNo: e.target.value })}
                    className="w-full h-8.5 px-2.5 border border-slate-200 bg-white rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Status</label>
                  <select
                    value={editingDoc.status || "BOOKED"}
                    onChange={(e) => setEditingDoc({ ...editingDoc, status: e.target.value })}
                    className="w-full h-8.5 px-2.5 border border-slate-200 bg-white rounded-lg font-bold text-blue-700"
                  >
                    <option value="BOOKED">BOOKED</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="ARRIVED">ARRIVED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="BILLED">BILLED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={editingDoc.remark || ""}
                    onChange={(e) => setEditingDoc({ ...editingDoc, remark: e.target.value })}
                    className="w-full h-8.5 px-2.5 border border-slate-200 bg-white rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingEdit ? "Saving..." : "Save Consignment Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload POD Modal */}
      {uploadDocket && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-5 border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <h2 className="text-sm font-bold text-slate-800">
              Upload Proof of Delivery (POD) for <span className="text-blue-600 font-mono">{uploadDocket}</span>
            </h2>
            <form onSubmit={handleUploadPod} className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadDocket(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? "Uploading..." : "Save POD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Multi-Format Hardware Print Modal */}
      {printFormatModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Select Hardware Print Format</h3>
              </div>
              <button
                onClick={() => setPrintFormatModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Consignment: <strong>{printFormatModal.docketNo}</strong> &bull; {printFormatModal.fromLocation} ➔ {printFormatModal.toLocation}
            </p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  printLaserA4Cn({
                    cnNumber: printFormatModal.docketNo,
                    bookingDate: printFormatModal.bookingDate,
                    originBranch: printFormatModal.fromLocation,
                    destinationBranch: printFormatModal.toLocation,
                    consignor: { name: printFormatModal.billingParty, address: "Mumbai Yard" },
                    consignee: { name: "Direct Consignee", address: printFormatModal.toLocation },
                    packageCount: printFormatModal.packageDetails?.packagesCount || 1,
                    packageType: printFormatModal.packageDetails?.packageType || "Cartons",
                    actualWeight: printFormatModal.packageDetails?.actualWeight || 0,
                    chargedWeight: printFormatModal.packageDetails?.chargedWeight || 0,
                    freightCharges: {
                      subtotal: printFormatModal.financials?.freightAmount || 0,
                      gst: printFormatModal.financials?.gstAmount || 0,
                      grandTotal: printFormatModal.financials?.grandTotal || 0
                    }
                  });
                  setPrintFormatModal(null);
                }}
                className="w-full p-3 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl text-left flex items-center justify-between transition-all"
              >
                <div>
                  <span className="font-bold block text-slate-800">📄 Laser A4 Consignment Note</span>
                  <span className="text-[10px] text-slate-500">Standard office copy with Code128 barcode</span>
                </div>
                <span className="text-blue-600 font-bold text-xs">Print ➔</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  printThermalCounterSlip({
                    cnNumber: printFormatModal.docketNo,
                    bookingDate: printFormatModal.bookingDate,
                    originBranch: printFormatModal.fromLocation,
                    destinationBranch: printFormatModal.toLocation,
                    consignor: { name: printFormatModal.billingParty },
                    consignee: { name: "Direct Consignee" },
                    packageCount: printFormatModal.packageDetails?.packagesCount || 1,
                    packageType: printFormatModal.packageDetails?.packageType || "BOX",
                    actualWeight: printFormatModal.packageDetails?.actualWeight || 0,
                    chargedWeight: printFormatModal.packageDetails?.chargedWeight || 0,
                    totalFreight: printFormatModal.financials?.grandTotal || 0,
                    deliveryType: "TO PAY"
                  });
                  setPrintFormatModal(null);
                }}
                className="w-full p-3 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl text-left flex items-center justify-between transition-all"
              >
                <div>
                  <span className="font-bold block text-slate-800">🧾 3-Inch Thermal POS Receipt (80mm)</span>
                  <span className="text-[10px] text-slate-500">High-speed counter roll with barcode</span>
                </div>
                <span className="text-emerald-600 font-bold text-xs">Print ➔</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  printDotMatrixSheet({
                    cnNumber: printFormatModal.docketNo,
                    bookingDate: printFormatModal.bookingDate,
                    originBranch: printFormatModal.fromLocation,
                    destinationBranch: printFormatModal.toLocation,
                    consignor: { name: printFormatModal.billingParty },
                    consignee: { name: "Direct Consignee" },
                    packageCount: printFormatModal.packageDetails?.packagesCount || 1,
                    actualWeight: printFormatModal.packageDetails?.actualWeight || 0,
                    chargedWeight: printFormatModal.packageDetails?.chargedWeight || 0,
                    totalFreight: printFormatModal.financials?.grandTotal || 0
                  });
                  setPrintFormatModal(null);
                }}
                className="w-full p-3 bg-white border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 rounded-xl text-left flex items-center justify-between transition-all"
              >
                <div>
                  <span className="font-bold block text-slate-800">🖨️ Continuous Dot-Matrix Tractor Feed</span>
                  <span className="text-[10px] text-slate-500">80-Column multi-part carbon copy stationery</span>
                </div>
                <span className="text-purple-600 font-bold text-xs">Print ➔</span>
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setPrintFormatModal(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
