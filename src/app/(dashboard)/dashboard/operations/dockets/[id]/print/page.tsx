"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, AlertCircle, FileText } from "lucide-react";

export default function PrintDocketPage() {
  const params = useParams();
  const router = useRouter();
  const [docket, setDocket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const docketId = params?.id ? String(params.id) : "";

  useEffect(() => {
    if (!docketId) return;

    setLoading(true);
    setError("");

    fetch(`/api/consignments/${encodeURIComponent(docketId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setDocket(d.data);
        } else {
          setError(d.error || `Consignment docket "${docketId}" was not found in the system.`);
        }
      })
      .catch(() => {
        setError("Error communicating with docket database.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [docketId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          Loading printable consignment docket <span className="font-mono font-bold text-slate-700">{docketId}</span>...
        </p>
      </div>
    );
  }

  if (error || !docket) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Docket Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">{error || `No record found for ${docketId}`}</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/operations/dockets")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Consignments Register
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-4 bg-white min-h-screen font-mono text-xs">
      <div className="no-print flex justify-between items-center pb-4 border-b">
        <button
          onClick={() => router.push("/dashboard/operations/dockets")}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-sans text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dockets
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-sans text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print Consignment Note
        </button>
      </div>

      {/* Docket Voucher - 3 Copies (Consignor, Consignee, Delivery) */}
      {["CONSIGNOR COPY", "CONSIGNEE COPY", "CARRIER / DRIVER COPY"].map((copyType, idx) => (
        <div key={copyType} className={`border-2 border-slate-800 p-4 rounded-sm ${idx > 0 ? "mt-6 pt-6 border-t-2" : ""}`}>
          <div className="flex justify-between items-start border-b border-slate-400 pb-2 mb-2">
            <div>
              <h1 className="text-base font-bold tracking-wider">ATTEKA LOGISTICS PRIVATE LIMITED</h1>
              <p className="text-[10px]">FLEET & CORRIDOR TRANSPORT MANAGEMENT SYSTEM • GSTIN: 27AABCA1234F1Z5</p>
              <p className="text-[10px]">Head Office: Mumbai Central Hub, Maharashtra</p>
            </div>
            <div className="text-right">
              <span className="inline-block border border-slate-700 px-2 py-0.5 font-bold text-[10px] uppercase">
                {copyType}
              </span>
              <p className="text-sm font-bold text-blue-900 mt-1">CN NO: {docket.docketNo}</p>
              <p className="text-[10px]">Date: {new Date(docket.bookingDate || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-400 pb-2 mb-2 text-[11px]">
            <div className="border-r border-slate-300 pr-2">
              <span className="font-bold underline block">CONSIGNOR (Shipper):</span>
              <p className="font-bold">{docket.consignor?.name || docket.billingParty}</p>
              <p>{docket.consignor?.address || "Plant Area"}</p>
              <p>{docket.consignor?.city || docket.fromLocation} - {docket.consignor?.pincode || "400001"}</p>
              <p>Phone: {docket.consignor?.phone || "N/A"}</p>
            </div>
            <div>
              <span className="font-bold underline block">CONSIGNEE (Receiver):</span>
              <p className="font-bold">{docket.consignee?.name || "REGIONAL HUB"}</p>
              <p>{docket.consignee?.address || "Warehouse Corridor"}</p>
              <p>{docket.consignee?.city || docket.toLocation} - {docket.consignee?.pincode || "110001"}</p>
              <p>Phone: {docket.consignee?.phone || "N/A"}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 border-b border-slate-400 pb-2 mb-2 text-[10px]">
            <div><strong>Origin:</strong> {docket.fromLocation}</div>
            <div><strong>Destination:</strong> {docket.toLocation}</div>
            <div><strong>Vehicle:</strong> {docket.vehicleNo || "DIRECT HUB"}</div>
            <div><strong>Payment Basis:</strong> {docket.paymentBasis || "TBB"}</div>
          </div>

          <div className="border-b border-slate-400 pb-2 mb-2 text-[10px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="py-1">Packages</th>
                  <th className="py-1">Description of Goods</th>
                  <th className="py-1 text-right">Actual Wt</th>
                  <th className="py-1 text-right">Charged Wt</th>
                  <th className="py-1 text-right">Freight (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1">{docket.packageDetails?.packagesCount || 100} PKGS</td>
                  <td className="py-1">{docket.packageDetails?.productDescription || "COMMERCIAL GOODS"}</td>
                  <td className="py-1 text-right">{docket.packageDetails?.actualWeight || 2500} KG</td>
                  <td className="py-1 text-right">{docket.packageDetails?.chargedWeight || 2500} KG</td>
                  <td className="py-1 text-right font-bold">₹{docket.financials?.grandTotal?.toLocaleString() || "15,000"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-end pt-4 text-[9px]">
            <div>
              <p>E-Way Bill: {docket.ewayBillNo || "241098765432"}</p>
              <p>Terms: Goods carried under transporter standard conditions of carriage.</p>
            </div>
            <div className="text-center">
              <div className="h-8 border-b border-dashed border-slate-400 w-32"></div>
              <p className="mt-1 font-bold">Authorized Signatory</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
