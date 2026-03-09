import React from "react";
import { Input as AntInput } from "antd";

export function Input({ className = "", label, error, ...props }) {
    const isStringLabel = typeof label === "string";
    const hasRequiredMark = isStringLabel && label.includes("*");
    const baseLabel = isStringLabel ? label.replace("*", "").trim() : label;

    return (
        <div className="space-y-1 w-full">
            {label && (
              <label className="text-[14px] font-medium text-[var(--color-text)]">
                <span>{baseLabel}</span>
                {hasRequiredMark && (
                  <span className="ml-0.5 text-[var(--color-danger)]">*</span>
                )}
              </label>
            )}
            <AntInput
                className={`w-full h-[47px] rounded-lg border border-slate-200 px-3 text-sm outline-none text-[var(--color-text)] ${className}`}
                {...props}
            />
            {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
        </div>
    );
}
