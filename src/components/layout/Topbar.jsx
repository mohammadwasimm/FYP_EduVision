import React from "react";
import { FiSearch, FiBell } from "react-icons/fi";

export function Topbar({ title = "Dashboard" }) {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
          <FiSearch className="text-slate-400 w-4 h-4" />
          <input
            className="w-64 bg-transparent outline-none text-sm placeholder:text-slate-400 text-slate-700"
            placeholder="Search..."
          />
        </div> */}

        <button
          type="button"
          className="relative h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
          aria-label="Notifications"
        >
          <FiBell className="text-slate-600 w-5 h-5" />
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-rose-500 text-white text-[11px] flex items-center justify-center">
            3
          </span>
        </button>

        <div className="flex items-center gap-3 pl-1">
          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
            AD
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-slate-900">Admin User</p>
            <p className="text-[11px] text-slate-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}

