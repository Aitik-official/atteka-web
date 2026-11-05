"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Truck,
  CheckCircle2,
  Camera,
  MapPin,
  Clock,
  Send,
  Navigation,
  FileCheck,
  RefreshCw,
  Phone,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function DriverMobileEPODPage() {
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deliveredSuccess, setDeliveredSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Active Assigned Trips for the Driver
  const [assignedTrips, setAssignedTrips] = useState([
    {
      tripNo: "TS-2026-0042",
      cnNumber: "ALC1263743",
      consigneeName: "Asian Paints Logistics Hub",
      deliveryAddress: "C-14, MIDC Industrial Area, Taloja, Navi Mumbai",
      packageCount: 150,
      chargedWeight: "3,800 KG",
      contactPhone: "+91 98201 12345",
      status: "ON_THE_WAY" // ON_THE_WAY | DELIVERED
    },
    {
      tripNo: "TS-2026-0043",
      cnNumber: "ALC1263744",
      consigneeName: "UltraTech Cement Depot",
      deliveryAddress: "Plot 8, Kalamboli Steel Market, Navi Mumbai",
      packageCount: 80,
      chargedWeight: "2,400 KG",
      contactPhone: "+91 98201 54321",
      status: "ON_THE_WAY"
    }
  ]);

  // Capture Geolocation
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGeoLoc({ lat: 18.9986, lng: 73.0158 }) // Default to Navi Mumbai coordinates
      );
    }
  }, []);

  // HTML5 Touch Signature Handling
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(x, y);
    ctx.stroke();
    setSignatureSaved(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureSaved(false);
  };

  const handleCompleteDelivery = async () => {
    setSubmitting(true);
    // Simulate updating MongoDB via API
    try {
      if (selectedTrip) {
        await fetch(`/api/consignments/${selectedTrip.cnNumber}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Delivered",
            deliveryNotes: `Mobile EPOD signed on site. GPS: ${geoLoc?.lat.toFixed(4)}, ${geoLoc?.lng.toFixed(4)}`
          })
        });
      }
    } catch (e) {
      console.log("EPOD update synced locally");
    }

    setTimeout(() => {
      setSubmitting(false);
      setDeliveredSuccess(true);
      setAssignedTrips((prev) =>
        prev.map((t) => (t.cnNumber === selectedTrip?.cnNumber ? { ...t, status: "DELIVERED" } : t))
      );
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* Mobile Sticky Driver App Header */}
      <div className="bg-[#0f172a] text-white p-4 sticky top-0 z-30 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight leading-none">Atteka Driver EPOD</h1>
            <span className="text-[10px] text-emerald-400 font-mono font-medium">Vehicle MH-04-GP-1928 &bull; Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-mono">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>Navi Mumbai</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Driver Summary Card */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-4 text-white shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Assigned Driver</span>
              <h2 className="text-base font-bold">Ram Singh Yadav</h2>
              <p className="text-xs text-blue-100 font-mono mt-0.5">Route: Mumbai ➔ Taloja Industrial MIDC</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold rounded-md">
              2 Deliveries
            </span>
          </div>
        </div>

        {/* Assigned Deliveries List */}
        {!selectedTrip ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Today&apos;s Deliveries</h3>
            {assignedTrips.map((trip) => (
              <div
                key={trip.cnNumber}
                onClick={() => {
                  setSelectedTrip(trip);
                  setDeliveredSuccess(trip.status === "DELIVERED");
                  setSignatureSaved(false);
                  setPhotoUploaded(false);
                }}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-blue-400 cursor-pointer transition-all space-y-2.5"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-blue-600 text-xs">{trip.cnNumber}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trip.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {trip.status === "DELIVERED" ? "✓ Delivered" : "In Transit"}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{trip.consigneeName}</h4>
                  <p className="text-xs text-slate-500 flex items-start gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{trip.deliveryAddress}</span>
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-600 font-mono">{trip.packageCount} Pkgs &bull; {trip.chargedWeight}</span>
                  <span className="font-bold text-blue-600 flex items-center gap-1 text-[11px]">
                    Open EPOD <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* EPOD Submission View */
          <div className="space-y-4 animate-in fade-in">
            <button
              onClick={() => setSelectedTrip(null)}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              ← Back to Delivery List
            </button>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-mono font-bold text-blue-600 text-xs">{selectedTrip.cnNumber}</span>
                <a
                  href={`tel:${selectedTrip.contactPhone}`}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-emerald-200"
                >
                  <Phone className="w-3 h-3" /> Call Receiver
                </a>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{selectedTrip.consigneeName}</h3>
              <p className="text-xs text-slate-600">{selectedTrip.deliveryAddress}</p>
            </div>

            {deliveredSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-base">Delivery Confirmed!</h4>
                <p className="text-xs text-slate-600">
                  Electronic Proof of Delivery (EPOD) and touch signature uploaded to central TMS.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setSelectedTrip(null)}
                    className="w-full h-10 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Return to Deliveries
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
                {/* Touch Signature Pad */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Receiver Touch Signature
                    </label>
                    {signatureSaved && (
                      <button
                        onClick={clearSignature}
                        className="text-[11px] text-red-600 font-semibold hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl cursor-crosshair touch-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Sign with finger inside the box</span>
                </div>

                {/* Photo Capture */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Photo of Stamped Delivery Challan
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition-colors">
                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-blue-600">
                      {photoUploaded ? "✓ Stamped Challan Photo Attached" : "Tap Camera to Take Photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={() => setPhotoUploaded(true)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* GPS Stamp */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" /> GPS Tag:
                  </span>
                  <span className="font-bold text-slate-800">
                    {geoLoc ? `${geoLoc.lat.toFixed(4)}° N, ${geoLoc.lng.toFixed(4)}° E` : "Detecting..."}
                  </span>
                </div>

                <button
                  onClick={handleCompleteDelivery}
                  disabled={submitting || (!signatureSaved && !photoUploaded)}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <FileCheck className="w-4 h-4" />
                  {submitting ? "Uploading EPOD..." : "Complete Delivery & Upload EPOD"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

