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
            className={`text-xs font-medium h-[40px] w-24 px-4 rounded-[6px] pointer-events-auto ${
              activeFilter === filter.key
                ? "bg-[#4318ff] text-white border-[#4318ff] [&:hover]:!bg-[#4318ff] [&:hover]:!border-[#4318ff] [&:hover]:!text-white [&:focus]:!bg-[#4318ff] [&:focus]:!border-[#4318ff] [&:focus]:!text-white [&:active]:!bg-[#4318ff] [&:active]:!border-[#4318ff] [&:active]:!text-white"
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
