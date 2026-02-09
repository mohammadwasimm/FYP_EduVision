import React from "react";
import { Input as AntInput } from "antd";

export function Input({ className = "", label, error, ...props }) {
    return (
        <div className="space-y-1 w-full">
            {label && <label className="text-xs font-medium text-slate-700">{label}</label>}
            <AntInput
                className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 hover:border-blue-400 ${className}`}
                {...props}
            />
            {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
        </div>
    );
}
