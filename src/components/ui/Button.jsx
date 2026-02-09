import React from "react";
import { Button as AntButton } from "antd";

export function Button({ children, className = "", type = "default", ...props }) {
    // Map our custom types or styles if needed
    const isPrimary = type === "primary";

    return (
        <AntButton
            type={type === "link" ? "link" : isPrimary ? "primary" : "default"}
            className={`h-[45px] px-6 text-sm font-medium rounded-[9px] flex items-center justify-center ${className}`}
            {...props}
        >
            {children}
        </AntButton>
    );
}
