import React from "react";
import {
  FiGrid,
  FiUsers,
  FiFileText,
  FiMonitor,
  FiBarChart2,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { PiGraduationCapFill } from "react-icons/pi";

const nav = [
  { key: "dashboard", label: "Dashboard", icon: FiGrid },
  { key: "students", label: "Students", icon: FiUsers },
  { key: "create-paper", label: "Create Paper", icon: FiFileText },
  { key: "live-monitoring", label: "Live Monitoring", icon: FiMonitor },
  { key: "reports", label: "Reports", icon: FiBarChart2 },
  { key: "settings", label: "Settings", icon: FiSettings },
];

export function Sidebar({ activeKey, onNavigate }) {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-[#1a1f40] text-white border-r border-slate-800">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex items-center justify-center">
          <PiGraduationCapFill className="text-white w-6 h-6" />
        </div>
        <div className="leading-tight">
          <p className="text-[18px] font-semibold">EduVision</p>
          <p className="text-[13px] text-slate-400">AI Monitor</p>
        </div>
      </div>

      <nav className="px-3 py-2 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition ",
                isActive
                  ? "bg-white/90 text-[#1a1f40] shadow-sm"
                  : "text-slate-300 hover:bg-[#1a1f40] hover:text-white",
              ].join(" ")}
            >
              <span className="h-5 w-5 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${isActive ? "text-[#1a1f40]" : "text-slate-300"}`} />
              </span>
              <span className="text-left flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-4 py-4">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold text-rose-300 hover:bg-slate-900 transition"
          onClick={() => onNavigate("logout")}
        >
          <span className="h-5 w-5 flex items-center justify-center">
            <FiLogOut className="text-rose-400 w-5 h-5" />
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
}

