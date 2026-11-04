import React from "react";
import Link from "next/link";
import { ArrowRight, Info, BarChart2 } from "lucide-react";

interface WcvActionCardProps {
  title: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  icon?: any;
}

export function WcvActionCard({
  title,
  description,
  href,
  onClick,
  icon: Icon = BarChart2
}: WcvActionCardProps) {
  const content = (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
    >
      {/* Top Header Bar with light blue tint */}
      <div className="bg-[#f0f6ff] px-3.5 py-2.5 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-slate-800 tracking-tight">{title}</span>
        </div>
        <div className="w-4 h-4 rounded-full border border-blue-200 text-blue-500 flex items-center justify-center text-[10px] font-serif font-bold">
          <Info className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Middle Body */}
      <div className="p-4">
        <p className="text-xs font-medium text-slate-700">{description || title}</p>
      </div>

      {/* Bottom Action Footer */}
      <div className="px-4 pb-3 pt-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-blue-800 group-hover:translate-x-0.5 transition-all">
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}

export function WcvRibbonHeader({ title }: { title: string }) {
  return (
    <div className="border-b-2 border-blue-600 pb-1 mb-4 flex items-center gap-2">
      <span className="text-blue-700 font-bold text-sm sm:text-base flex items-center gap-1.5 tracking-tight">
        <span className="text-blue-600 font-black">➡</span>
        <span>{title}</span>
      </span>
    </div>
  );
}
