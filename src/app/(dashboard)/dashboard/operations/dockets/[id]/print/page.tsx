"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";

export default function PrintDocketPage() {
  const params = useParams();
  const router = useRouter();
  const [docket, setDocket] = useState<any | null>(null);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/consignments/${params.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.data) setDocket(d.data);
        });
    }
  }, [params.id]);

  if (!docket) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading printable consignment docket...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-4 bg-white min-h-screen font-mono text-xs">
      <div className="no-print flex justify-between items-center pb-4 border-b">
        <button
          onClick={() => router.back()}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-sans text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dockets
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-sans text-xs font-semibold flex items-center gap-1.5"
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
              <p className="text-[10px]">Date: {new Date(docket.bookingDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-400 pb-2 mb-2 text-[11px]">
            <div className="border-r border-slate-300 pr-2">
              <span className="font-bold underline block">CONSIGNOR (Shipper):</span>
              <p className="font-bold">{docket.consignor?.name}</p>
              <p>{docket.consignor?.address}</p>
              <p>{docket.consignor?.city} - {docket.consignor?.pincode}</p>
              <p>Phone: {docket.consignor?.phone || "N/A"}</p>
            </div>
            <div>
              <span className="font-bold underline block">CONSIGNEE (Receiver):</span>
              <p className="font-bold">{docket.consignee?.name}</p>
              <p>{docket.consignee?.address}</p>
              <p>{docket.consignee?.city} - {docket.consignee?.pincode}</p>
              <p>Phone: {docket.consignee?.phone || "N/A"}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 border-b border-slate-400 pb-2 mb-2 text-[10px]">
            <div><strong>Origin:</strong> {docket.fromLocation}</div>
            <div><strong>Destination:</strong> {docket.toLocation}</div>
            <div><strong>Vehicle:</strong> {docket.vehicleNo || "DIRECT HUB"}</div>
            <div><strong>Payment Basis:</strong> {docket.paymentBasis}</div>
          </div>

          <div className="border-b border-slate-400 pb-2 mb-2 text-[10px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="py-1">Packages</th>
                  <th className="py-1">Description of Goods</th>
                  <th className="py-1 text-right">Actual Wt</th>
                  <th className="py-1 text-right">Charged Wt</th>
                  <th className="py-1 text-right">Freight (&#8377;)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1">{docket.packageDetails?.packagesCount} {docket.packageDetails?.packageType}</td>
                  <td className="py-1 font-bold">{docket.packageDetails?.productDescription}</td>
                  <td className="py-1 text-right">{docket.packageDetails?.actualWeight} kg</td>
                  <td className="py-1 text-right">{docket.packageDetails?.chargedWeight} kg</td>
                  <td className="py-1 text-right font-bold">&#8377;{docket.financials?.freightAmount?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="text-[10px] text-slate-600">E-Way Bill: {docket.ewayBillNo || "EXEMPTED"}</span>
            <span className="font-bold text-sm">
              Grand Total Freight (incl 5% GST): &#8377;{docket.financials?.grandTotal?.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-end pt-8 text-[10px] border-t border-dashed mt-4">
            <div>Shipper Signature</div>
            <div>Driver Signature</div>
            <div>Authorized Signatory (Atteka Logistics)</div>
          </div>
        </div>
      ))}
    </div>
  );
}

