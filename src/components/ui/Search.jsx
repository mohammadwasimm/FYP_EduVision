import React from "react";
import { Input } from "antd";
import { FiSearch } from "react-icons/fi";

export function Search({ className = "", placeholder = "Search...", ...props }) {
    return (
        <div className={`relative ${className}`}>
            <Input
                prefix={<FiSearch className="text-slate-400 mr-2 h-5 w-4" />}
                placeholder={placeholder}
                className="w-[448px] h-[50px] rounded-[9px] border border-slate-200 bg-[#F9FAFB] pl-5 pr-4 py-3 text-sm outline-none placeholder:text-slate-400 [&:hover]:border-slate-200 [&:hover]:bg-[#F9FAFB]"
                style={{ 
                    transition: 'none',
                    boxShadow: 'none'
                }}
                {...props}
            />
        </div>
    );
}
