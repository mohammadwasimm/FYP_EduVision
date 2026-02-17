import React from "react";
import { Select } from "antd";

export function Dropdown({ label, className = "", options = [], ...props }) {
  return (
    <div className="space-y-1 w-full mb-[15px]">
      {label && (
        <label className="text-[14px] font-medium text-[#2b3674]">{label}</label>
      )}
      <Select
        className={`w-full custom-dropdown ${className}`}
        options={options}
        {...props}
      />
    </div>
  );
}

