"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Plus, Truck, Download, Eye, Upload, CheckCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ResponsiveTableWrapper } from "@/components/common/ResponsiveTableWrapper";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function DocketsListPage() {
  const [consignments, setConsignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [uploadDocket, setUploadDocket] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
        alert("POD uploaded successfully! Docket status updated to DELIVERED.");
        setUploadDocket(null);
        setUploadFile(null);
        fetchDockets();
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Error uploading file");
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
                      onClick={() => setSelectedDoc(c)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold transition-colors"
                      title="View Full Docket"
                    >
                      View
                    </button>
                    <Link
                      href={`/dashboard/operations/dockets/${c.docketNo}/print`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold inline-block transition-colors"
                      title="Print E-Docket"
                    >
                      Print
                    </Link>
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

            <div className="text-right pt-2 border-t border-slate-100">
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
    </div>
  );
}
