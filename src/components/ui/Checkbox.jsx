import React from "react";
import { Checkbox as AntCheckbox } from "antd";

export function Checkbox({ 
  children, 
  label, 
  className = "", 
  error = false,
  errorText = "",
  ...props 
}) {
  return (
    <div className={`commonCheckbox ${error ? "errorCheckbox" : ""} ${className}`}>
      <AntCheckbox {...props}>
        {label && <span className="checkboxLabel">{label}</span>}
        {children}
      </AntCheckbox>
      {error && errorText && (
        <div className="errorText">{errorText}</div>
      )}
    </div>
  );
}
