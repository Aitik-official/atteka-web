"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, ShieldCheck, Lock, User, RefreshCw } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("AL002");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState("7X9B");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotView, setIsForgotView] = useState(false);
  const [forgotUserId, setForgotUserId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const refreshCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!userId.trim()) {
      setError("Please Enter the Employee Code");
      return;
    }
    if (!password) {
      setError("Please Enter the Password");
      return;
    }

    if (showCaptcha && captchaInput.toUpperCase() !== captchaCode) {
      setError("Invalid Captcha code. Please try again.");
      refreshCaptcha();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userId.trim().toUpperCase(),
          password,
          captcha: captchaInput
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= 2) {
          setShowCaptcha(true);
        }
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const handleGetOtp = () => {
    if (!forgotUserId) {
      setError("Please enter the User Id");
      return;
    }
    setOtpSent(true);
    setSuccessMsg("Access code sent to registered mobile/email (Simulated OTP: 1234)");
    setOtpCode("1234");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode === "1234") {
      setSuccessMsg("Verification successful! Temporary password reset to demo123.");
      setTimeout(() => {
        setIsForgotView(false);
        setPassword("demo123");
        setUserId(forgotUserId.toUpperCase());
      }, 1500);
    } else {
      setError("Invalid Access Code");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.75)), url('https://img.freepik.com/premium-photo/logistic-network-distribution-background-logistic-transport-concept_250469-9178.jpg?size=626&ext=jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-[430px] bg-white rounded-lg shadow-2xl p-8 border border-slate-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-2">
            <Image
              src="/images/atteka_logo-removebg-preview.png"
              alt="Ateka Logistics"
              width={75}
              height={55}
              className="object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Atteka Logistics ERP</h1>
          <p className="text-xs text-slate-500 mt-1">WebCoreVision Transport Management System</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-md">
            {successMsg}
          </div>
        )}

        {!isForgotView ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                User Id / Employee Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={10}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.toUpperCase())}
                  placeholder="e.g. AL002"
                  className="w-full h-11 pl-10 pr-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium uppercase"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-11 pl-10 pr-10 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {showCaptcha && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Verification Captcha</span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-200 text-blue-700 font-mono font-bold text-sm tracking-wider rounded select-none">
                      {captchaCode}
                    </span>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="p-1 text-slate-500 hover:text-blue-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  placeholder="Enter captcha"
                  className="w-full h-9 px-3 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#0171d3] hover:bg-[#0160b2] text-white font-medium rounded-md shadow transition-colors flex items-center justify-center text-sm disabled:opacity-60"
            >
              {loading ? "Authenticating..." : "Login"}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span className="text-[11px] text-slate-400">Demo User: AL002</span>
              <button
                type="button"
                onClick={() => {
                  setIsForgotView(true);
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Password Recovery / Access Code</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Enter User Id</label>
              <input
                type="text"
                value={forgotUserId}
                onChange={(e) => setForgotUserId(e.target.value.toUpperCase())}
                placeholder="User ID"
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md uppercase"
                required
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter Access Code"
                className="flex-1 h-10 px-3 text-sm border border-slate-300 rounded-md"
              />
              <button
                type="button"
                onClick={handleGetOtp}
                className="px-3 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md font-medium text-slate-700 whitespace-nowrap"
              >
                Get Access Code
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-[#0171d3] hover:bg-[#0160b2] text-white font-medium rounded-md text-sm"
            >
              Verify & Reset
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotView(false);
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            WebCoreVision TMS &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

