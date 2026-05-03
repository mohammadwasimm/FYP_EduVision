import React from "react";
import { Table } from "antd";

/**
 * Common table wrapper on top of antd Table
 * - adds consistent styling via .custom-table
 * - supports simple props similar to the example you shared
 */
export function DataTable({
  columns,
  dataSource,
  data, // optional alias
  containerClass = "",
  showBorders = true,
  loading = false,
  isSkeleton = false,
  numRows, // reserved for future skeleton usage
  className = "",
  pagination = false,
  ...rest
}) {
  const finalData = dataSource || data || [];

  return (
    <div className={`w-full ${containerClass}`}>
      <Table
        columns={columns}
        dataSource={finalData}
        pagination={pagination || false}
        rowKey={(row) => row.id || row.key || row.examName}
        className={`custom-table ${showBorders ? "with-borders" : "no-borders"} ${className}`}
        scroll={{ x: "max-content" }}
        loading={loading && !isSkeleton}
        {...rest}
      />
    </div>
  );
}


