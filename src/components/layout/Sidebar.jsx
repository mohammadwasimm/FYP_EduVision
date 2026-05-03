import { useState } from "react";
import {
  FiGrid,
  FiUsers,
  FiFileText,
  FiMonitor,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiUserPlus,
  FiChevronDown,
  FiExternalLink,
} from "react-icons/fi";
import { PiGraduationCapFill } from "react-icons/pi";

const nav = [
  { key: "dashboard",       label: "Dashboard",      icon: FiGrid      },
  { key: "students",        label: "Students",        icon: FiUsers     },
  {
    // dropdownOnly = clicking the parent only expands/collapses, never navigates
    key: "papers",
    label: "Paper",
    icon: FiFileText,
    dropdownOnly: true,
    children: [
      { key: "create-paper",    label: "Create Paper"    },
      { key: "generated-paper", label: "Generated Paper" },
    ],
  },
  { key: "live-monitoring", label: "Live Monitoring", icon: FiMonitor   },
  { key: "reports",         label: "Reports",         icon: FiBarChart2 },
  { key: "settings",        label: "Settings",        icon: FiSettings  },
  // Opens in a new tab — students use this page separately from the admin panel
  {
    key: "student-enroll",
    label: "Student Enroll",
    icon: FiUserPlus,
    openInNewTab: true,
    href: "/student-enroll",
  },
];

export function Sidebar({ activeKey, onNavigate }) {
  // Track which dropdown-only parents are manually expanded.
  // Auto-expand whichever group contains the activeKey on first render.
  const initialOpen = () => {
    const set = new Set();
    nav.forEach(item => {
      if (item.dropdownOnly && Array.isArray(item.children)) {
        if (item.children.some(c => c.key === activeKey)) set.add(item.key);
      }
    });
    return set;
  };
  const [openGroups, setOpenGroups] = useState(initialOpen);

  const toggleGroup = (key) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-[var(--color-dark)] text-[var(--color-white)] border-r border-slate-800">
      {/* Logo */}
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
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;

          // For dropdownOnly parents: active = any child is active
          // For regular items: active = key matches
          const childActive = hasChildren
            ? item.children.some(c => c.key === activeKey)
            : false;
          const isActive = item.dropdownOnly ? childActive : (item.key === activeKey || childActive);

          // Whether the sub-menu is visible
          const isOpen = hasChildren && (openGroups.has(item.key) || childActive);

          return (
            <div key={item.key} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  if (item.openInNewTab && item.href) {
                    window.open(item.href, '_blank', 'noopener,noreferrer');
                    return;
                  }
                  if (item.dropdownOnly) {
                    toggleGroup(item.key);
                    return;
                  }
                  onNavigate(item.key);
                }}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[14px] font-medium transition",
                  isActive
                    ? "bg-white/90 text-[var(--color-primary)] shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span className="h-5 w-5 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${isActive ? "text-[var(--color-primary)]" : "text-slate-300"}`} />
                </span>
                <span className="text-left flex-1">{item.label}</span>

                {item.openInNewTab ? (
                  <FiExternalLink className="h-3.5 w-3.5 text-slate-400" />
                ) : hasChildren ? (
                  <FiChevronDown
                    className={[
                      "h-4 w-4 transition-transform duration-200",
                      isOpen ? "rotate-180" : "",
                      isActive ? "text-[var(--color-primary)]" : "text-slate-300",
                    ].join(" ")}
                  />
                ) : null}
              </button>

              {/* Sub-menu */}
              {hasChildren && isOpen ? (
                <div className="ml-8 space-y-0.5">
                  {item.children.map((child) => {
                    const isChildActive = child.key === activeKey;
                    return (
                      <button
                        key={child.key}
                        type="button"
                        onClick={() => onNavigate(child.key)}
                        className={[
                          "w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-medium transition",
                          isChildActive
                            ? "bg-white/80 text-[var(--color-primary)]"
                            : "text-slate-400 hover:text-white hover:bg-white/10",
                        ].join(" ")}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto px-4 py-4">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold text-[var(--color-danger)] hover:bg-slate-900 transition"
          onClick={() => onNavigate("logout")}
        >
          <span className="h-5 w-5 flex items-center justify-center">
            <FiLogOut className="text-[var(--color-danger)] w-5 h-5" />
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
}
