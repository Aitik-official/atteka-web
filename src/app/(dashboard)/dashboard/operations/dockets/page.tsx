"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Plus, Truck, Download, Eye, Upload, CheckCircle } from "lucide-react";

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
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">C011</span>
            <h1 className="text-lg font-bold text-slate-800">Consignments & Dockets Register</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PAGES/OPERATIONS.PAGES/EditCnNew.aspx • Master registry with live search & POD verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/operations/new-cn"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Consignment
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Docket No, Customer, City..."
            className="w-full h-9 pl-9 pr-3 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2 text-xs border border-slate-300 rounded bg-white"
          >
            <option value="">All Statuses</option>
            <option value="BOOKED">BOOKED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="ARRIVED">ARRIVED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="BILLED">BILLED</option>
          </select>

          <button
            onClick={fetchDockets}
            className="px-3 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Docket No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3">Billing Party</th>
                <th className="py-2.5 px-3">Origin &rarr; Dest</th>
                <th className="py-2.5 px-3">Goods / Weight</th>
                <th className="py-2.5 px-3">Grand Total (&#8377;)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-3"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                      <td className="py-3 px-3"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                      <td className="py-3 px-3"><div className="h-4 bg-slate-100 rounded w-12"></div></td>
                      <td className="py-3 px-3"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                      <td className="py-3 px-3"><div className="h-4 bg-slate-100 rounded w-28"></div></td>
                      <td className="py-3 px-3"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                      <td className="py-3 px-3"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                      <td className="py-3 px-3"><div className="h-4 bg-slate-100 rounded w-14"></div></td>
                      <td className="py-3 px-3"><div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div></td>
                    </tr>
                  ))}
                </>
              ) : consignments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching consignments found.
                  </td>
                </tr>
              ) : (
                consignments.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-blue-700">{c.docketNo}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(c.bookingDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{c.bookingBranch}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium truncate max-w-[160px]">
                      {c.billingParty}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {c.fromLocation} &rarr; {c.toLocation}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {c.packageDetails?.packagesCount} pkgs ({c.packageDetails?.chargedWeight} kg)
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      &#8377;{c.financials?.grandTotal?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === "DELIVERED"
                            ? "bg-green-100 text-green-700"
                            : c.status === "BILLED"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      <button
                        onClick={() => setSelectedDoc(c)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                        title="View Full Docket"
                      >
                        View
                      </button>
                      <Link
                        href={`/dashboard/operations/dockets/${c.docketNo}/print`}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold inline-block"
                        title="Print E-Docket"
                      >
                        Print
                      </Link>
                      <button
                        onClick={() => setUploadDocket(c.docketNo)}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold"
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
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">Docket: {selectedDoc.docketNo}</h2>
                <p className="text-xs text-slate-500">Booked on {new Date(selectedDoc.bookingDate).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border">
                <span className="font-bold text-slate-700 block mb-1">Consignor (Shipper)</span>
                <p className="font-semibold">{selectedDoc.consignor?.name}</p>
                <p>{selectedDoc.consignor?.address}</p>
                <p>{selectedDoc.consignor?.city} - {selectedDoc.consignor?.pincode}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border">
                <span className="font-bold text-slate-700 block mb-1">Consignee (Receiver)</span>
                <p className="font-semibold">{selectedDoc.consignee?.name}</p>
                <p>{selectedDoc.consignee?.address}</p>
                <p>{selectedDoc.consignee?.city} - {selectedDoc.consignee?.pincode}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Goods Description:</span>
                <span className="font-semibold">{selectedDoc.packageDetails?.productDescription} ({selectedDoc.packageDetails?.packageType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Quantity / Weights:</span>
                <span className="font-semibold">{selectedDoc.packageDetails?.packagesCount} pkgs | Actual: {selectedDoc.packageDetails?.actualWeight} kg | Charged: {selectedDoc.packageDetails?.chargedWeight} kg</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold text-blue-700">
                <span>Grand Total Freight:</span>
                <span>&#8377;{selectedDoc.financials?.grandTotal?.toLocaleString()}</span>
              </div>
            </div>

            {selectedDoc.podUrl && (
              <div className="p-3 bg-green-50 rounded border border-green-200 text-xs">
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

            <div className="text-right pt-2 border-t">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload POD Modal */}
      {uploadDocket && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">
              Upload Proof of Delivery (POD) for {uploadDocket}
            </h2>
            <form onSubmit={handleUploadPod} className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded p-4 text-center">
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
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded disabled:opacity-50"
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

