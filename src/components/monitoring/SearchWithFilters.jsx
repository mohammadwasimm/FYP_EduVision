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
                ? "bg-[var(--color-primary)] text-[var(--color-white)] border-[var(--color-primary)] [&:hover]:!bg-[var(--color-primary)] [&:hover]:!border-[var(--color-primary)] [&:hover]:!text-[var(--color-white)] [&:focus]:!bg-[var(--color-primary)] [&:focus]:!border-[var(--color-primary)] [&:focus]:!text-[var(--color-white)] [&:active]:!bg-[var(--color-primary)] [&:active]:!border-[var(--color-primary)] [&:active]:!text-[var(--color-white)]"
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
