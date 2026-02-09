import React from "react";
import { Search } from "../ui/Search";
import { Button } from "../ui/Button";

export function SearchWithFilters({
  searchValue,
  onSearchChange,
  filters = [],
  activeFilter,
  onFilterChange,
}) {
  return (
    <div className="flex items-center gap-2">
      <div>
        <Search
          placeholder="Search by name or roll number..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.key}
            type={activeFilter === filter.key ? "primary" : "default"}
            className={`text-xs font-medium h-[40px] px-4 rounded-[8px] pointer-events-auto ${
              activeFilter === filter.key
                ? "bg-[#1a1f40] text-white border-[#1a1f40] [&:hover]:!bg-[#1a1f40] [&:hover]:!border-[#1a1f40] [&:hover]:!text-white [&:focus]:!bg-[#1a1f40] [&:focus]:!border-[#1a1f40] [&:focus]:!text-white [&:active]:!bg-[#1a1f40] [&:active]:!border-[#1a1f40] [&:active]:!text-white"
                : "bg-white text-slate-600 border border-slate-200 [&:hover]:!bg-white [&:hover]:!border-slate-200 [&:hover]:!text-slate-600 [&:focus]:!bg-white [&:focus]:!border-slate-200 [&:focus]:!text-slate-600 [&:active]:!bg-white [&:active]:!border-slate-200 [&:active]:!text-slate-600"
            }`}
            style={{ transition: 'none' }}
            onClick={() => onFilterChange(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
