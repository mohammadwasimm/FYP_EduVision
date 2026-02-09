import React from "react";

export function Badge({ children, tone = "default", className = "" }) {
  const tones = {
    default:
      "bg-background px-3 py-1 text-[11px] font-medium text-[#1a1f40]",
    success:
      "px-3 py-1 text-[11px] font-medium bg-success/15 text-[#1a1f40]",
    warning:
      "px-3 py-1 text-[11px] font-medium bg-warning/15 text-[#1a1f40]",
    danger:
      "px-3 py-1 text-[11px] font-medium bg-danger/15 text-[#1a1f40]",
    info:
      "px-3 py-1 text-[11px] font-medium bg-accent/15 text-[#1a1f40]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${tones[tone] || tones.default} ${className}`}
    >
      {children}
    </span>
  );
}

