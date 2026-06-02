import React from "react";
import { Button as AntButton } from "antd";

export function Button({
  children,
  className = "",
  type = "default",
  mode = "default",
  ...props
}) {
  const isPrimary = type === "primary";

  const modeClass =
    mode === "outline-primary"
      ? "btn-outline-4318ff"
      : "";

  return (
    <AntButton
      type={type === "link" ? "link" : isPrimary ? "primary" : "default"}
      className={`h-[45px] px-6 text-sm font-medium rounded-[9px] flex items-center justify-center ${modeClass} ${className}`}
      {...props}
    >
      {children}
    </AntButton>
  );
}
