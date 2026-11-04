import React from "react";

interface MobileActionFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileActionFooter({ children, className = "" }: MobileActionFooterProps) {
  return (
    <div
      className={`sm:hidden fixed bottom-8 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center gap-2 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

