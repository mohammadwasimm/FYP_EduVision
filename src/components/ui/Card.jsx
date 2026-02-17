import React from "react";

export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`rounded-[14px]  bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

