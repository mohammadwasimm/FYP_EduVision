import React from "react";
import { Select } from "antd";

export function Dropdown({ label, className = "", options = [], ...props }) {
  return (
    <div className="space-y-1 w-full mb-[15px]">
      {label && (
        <label className="text-xs font-medium text-slate-700">{label}</label>
      )}
      <Select
        className={`w-full custom-dropdown ${className}`}
        options={options}
        {...props}
      />
    </div>
  );
}

