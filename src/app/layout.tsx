import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atteka Logistics ERP - WebCoreVision Replica",
  description: "Enterprise Logistics Management System - Greenfield Replica",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-slate-800 bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
