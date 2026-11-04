import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atteka Logistics ERP - WebCoreVision Replica",
  description: "Enterprise Logistics Management System - Greenfield Replica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-800 bg-slate-50">{children}</body>
    </html>
  );
}

